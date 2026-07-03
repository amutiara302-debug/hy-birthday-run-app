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
      const path = `payment-proofs/${token}-${sanitizeFilename(proof.name)}`;
      const { error } = await supabase.storage.from("event-uploads").upload(path, proof, {
        contentType: proof.type || "application/octet-stream",
        upsert: false
      });
      if (error) throw error;
      paymentProofUrl = getPublicFileUrl(path);
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

function sanitizeFilename(filename: string) {
  return filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}
