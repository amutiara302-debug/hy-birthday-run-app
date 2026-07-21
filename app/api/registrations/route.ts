import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { defaultSettings } from "@/lib/config";
import { registrationEmail, sendEmail } from "@/lib/email";
import { getSupabaseAdmin, getPublicFileUrl } from "@/lib/supabase";
import type { Category } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const category = String(formData.get("category")) as Category;
    if (category !== "Offline" && category !== "Virtual") {
      return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
    }

    const requiredFields = [
      "full_name",
      "email",
      "phone",
      "birth_date",
      "ktp_number",
      "blood_type",
      "gender",
      "domicile_city",
      "shirt_size",
      "address",
      "village",
      "district",
      "city_regency",
      "province",
      "postal_code"
    ];
    if (category === "Offline") {
      requiredFields.push("emergency_name", "emergency_phone", "emergency_relation");
    } else {
      requiredFields.push("running_app_account");
    }

    const missingField = requiredFields.find((field) => !value(formData, field));
    if (missingField || !formData.get("truth_consent") || !formData.get("address_consent") || !formData.get("health_consent")) {
      return NextResponse.json({ error: "Mohon lengkapi semua data wajib sebelum submit." }, { status: 400 });
    }

    if (!isValidEmail(value(formData, "email"))) {
      return NextResponse.json({ error: "Format email harus benar dan menggunakan @." }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(value(formData, "phone"));
    const normalizedEmergencyPhone = normalizePhone(value(formData, "emergency_phone"));
    const normalizedKtpNumber = normalizeDigits(value(formData, "ktp_number"));
    const birthDate = parseBirthDate(value(formData, "birth_date"));

    if (!isValidPhone(normalizedPhone) || (category === "Offline" && !isValidPhone(normalizedEmergencyPhone))) {
      return NextResponse.json({ error: "Nomor telepon harus diawali 0 dan berisi angka 10-12 digit." }, { status: 400 });
    }

    if (!birthDate) {
      return NextResponse.json({ error: "Tanggal lahir harus menggunakan format dd/mm/yyyy." }, { status: 400 });
    }

    if (!/^\d{16}$/.test(normalizedKtpNumber)) {
      return NextResponse.json({ error: "No KTP harus berisi 16 digit angka." }, { status: 400 });
    }

    if (!/^\d{5}$/.test(value(formData, "postal_code"))) {
      return NextResponse.json({ error: "Kode pos harus 5 digit angka." }, { status: 400 });
    }

    const now = Date.now();
    if (now < Date.parse(defaultSettings.registrationOpensAt) || now > Date.parse(defaultSettings.registrationClosesAt)) {
      return NextResponse.json({ error: "Periode pendaftaran belum dibuka atau sudah ditutup." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingRegistration, error: duplicateError } = await supabase
      .from("registrations")
      .select("id")
      .eq("phone", normalizedPhone)
      .neq("payment_status", "rejected")
      .maybeSingle();

    if (duplicateError) throw duplicateError;
    if (existingRegistration) {
      return NextResponse.json({
        error: "Nomor telepon ini sudah pernah digunakan untuk pendaftaran. Satu nomor telepon hanya bisa untuk satu peserta."
      }, { status: 400 });
    }

    const quota = category === "Offline" ? defaultSettings.offlineQuota : defaultSettings.virtualQuota;
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("category", category)
      .neq("payment_status", "rejected");

    if ((count || 0) >= quota) {
      return NextResponse.json({ error: "Kuota penuh." }, { status: 400 });
    }

    const token = randomUUID();
    const proof = formData.get("payment_proof");
    let paymentProofUrl: string | null = null;

    if (proof instanceof File && proof.size > 0) {
      if (!isAllowedProofFile(proof)) {
        return NextResponse.json({ error: "Bukti pembayaran hanya boleh berupa file JPG, PNG, atau PDF." }, { status: 400 });
      }

      const path = `payment-proofs/${token}-${sanitizeFilename(proof.name)}`;
      const { error } = await supabase.storage.from("event-uploads").upload(path, proof, {
        contentType: proof.type || "application/octet-stream",
        upsert: false
      });
      if (error) throw error;
      paymentProofUrl = getPublicFileUrl(path);
    } else {
      return NextResponse.json({ error: "Bukti pembayaran wajib diupload." }, { status: 400 });
    }

    const payload = {
      participant_token: token,
      category,
      full_name: value(formData, "full_name"),
      email: value(formData, "email"),
      phone: normalizedPhone,
      birth_date: birthDate,
      ktp_number: normalizedKtpNumber,
      blood_type: value(formData, "blood_type"),
      gender: value(formData, "gender"),
      domicile_city: value(formData, "domicile_city"),
      emergency_name: nullableValue(formData, "emergency_name"),
      emergency_phone: category === "Offline" ? normalizedEmergencyPhone : null,
      emergency_relation: nullableValue(formData, "emergency_relation"),
      running_app_account: nullableValue(formData, "running_app_account"),
      shirt_size: value(formData, "shirt_size"),
      address: value(formData, "address"),
      village: value(formData, "village"),
      district: value(formData, "district"),
      city_regency: value(formData, "city_regency"),
      province: value(formData, "province"),
      postal_code: value(formData, "postal_code"),
      address_notes: nullableValue(formData, "address_notes"),
      payment_proof_url: paymentProofUrl,
      payment_status: "pending",
      shipping_status: "not_shipped",
      run_status: category === "Virtual" ? "not_uploaded" : "approved"
    };

    const { data, error } = await supabase.from("registrations").insert(payload).select("id").single();
    if (error) {
      if (isDuplicatePhoneError(error)) {
        return NextResponse.json({
          error: "Nomor telepon ini sudah pernah digunakan untuk pendaftaran. Satu nomor telepon hanya bisa untuk satu peserta."
        }, { status: 400 });
      }
      throw error;
    }

    const participantCode = token.slice(0, 8).toUpperCase();
    const participantUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/participant/${participantCode}`;
    const emailResult = await sendEmail({
      to: payload.email,
      subject: "Pendaftaran HY Birthday Run diterima",
      html: registrationEmail(payload.full_name, participantUrl, participantCode)
    });

    return NextResponse.json({
      id: data.id,
      participantCode,
      participantUrl,
      emailWarning: emailResult.ok ? null : emailResult.error || "Pendaftaran tersimpan, tetapi email gagal dikirim."
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan saat menyimpan pendaftaran." }, { status: 500 });
  }
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function nullableValue(formData: FormData, key: string) {
  const current = value(formData, key);
  return current || null;
}

function isValidPhone(phone: string) {
  return /^0\d{9,11}$/.test(phone);
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function parseBirthDate(dateText: string) {
  const match = dateText.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return "";
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAllowedProofFile(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
  const filename = file.name.toLowerCase();
  const hasAllowedExtension = allowedExtensions.some((extension) => filename.endsWith(extension));
  return hasAllowedExtension && (!file.type || allowedTypes.includes(file.type));
}

function isDuplicatePhoneError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const current = error as { code?: string; message?: string; details?: string };
  const text = `${current.message || ""} ${current.details || ""}`.toLowerCase();
  return current.code === "23505" && text.includes("registrations_phone_unique_idx");
}

function sanitizeFilename(filename: string) {
  return filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}
