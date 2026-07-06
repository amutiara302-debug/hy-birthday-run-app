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

    if (!isValidPhone(value(formData, "phone")) || (category === "Offline" && !isValidPhone(value(formData, "emergency_phone")))) {
      return NextResponse.json({ error: "Nomor telepon harus diawali 0 dan berisi angka 10-12 digit." }, { status: 400 });
    }

    if (!/^\d{5}$/.test(value(formData, "postal_code"))) {
      return NextResponse.json({ error: "Kode pos harus 5 digit angka." }, { status: 400 });
    }

    const now = Date.now();
    if (now < Date.parse(defaultSettings.registrationOpensAt) || now > Date.parse(defaultSettings.registrationClosesAt)) {
      return NextResponse.json({ error: "Periode pendaftaran belum dibuka atau sudah ditutup." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const quota = category === "Offline" ? defaultSettings.offlineQuota : defaultSettings.virtualQuota;
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("category", category);

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
      phone: value(formData, "phone"),
      birth_date: value(formData, "birth_date"),
      gender: value(formData, "gender"),
      domicile_city: value(formData, "domicile_city"),
      emergency_name: nullableValue(formData, "emergency_name"),
      emergency_phone: nullableValue(formData, "emergency_phone"),
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
    if (error) throw error;

    const participantUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/participant/${token}`;
    await sendEmail({
      to: payload.email,
      subject: "Pendaftaran HY Birthday Run diterima",
      html: registrationEmail(payload.full_name, participantUrl)
    });

    return NextResponse.json({ id: data.id, participantUrl });
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

function sanitizeFilename(filename: string) {
  return filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}
