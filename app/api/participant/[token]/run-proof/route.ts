import { NextRequest, NextResponse } from "next/server";
import { getPublicFileUrl, getSupabaseAdmin } from "@/lib/supabase";
import type { Registration } from "@/lib/types";

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: registration } = await supabase
      .from("registrations")
      .select("*")
      .eq("participant_token", params.token)
      .single<Registration>();

    if (!registration || registration.category !== "Virtual") {
      return NextResponse.json({ error: "Peserta virtual tidak ditemukan." }, { status: 404 });
    }

    const formData = await request.formData();
    const proof = formData.get("run_proof");
    let proofUrl: string | null = null;

    if (proof instanceof File && proof.size > 0) {
      const path = `run-proofs/${registration.id}-${Date.now()}-${sanitizeFilename(proof.name)}`;
      const { error } = await supabase.storage.from("event-uploads").upload(path, proof, {
        contentType: proof.type || "application/octet-stream",
        upsert: false
      });
      if (error) throw error;
      proofUrl = getPublicFileUrl(path);
    }

    const { error } = await supabase.from("run_submissions").insert({
      registration_id: registration.id,
      run_date: value(formData, "run_date"),
      distance: value(formData, "distance"),
      duration_pace: value(formData, "duration_pace"),
      app_name: value(formData, "app_name"),
      activity_link: nullableValue(formData, "activity_link"),
      proof_url: proofUrl,
      notes: nullableValue(formData, "notes"),
      status: "review"
    });
    if (error) throw error;

    await supabase.from("registrations").update({ run_status: "review" }).eq("id", registration.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload bukti lari belum berhasil." }, { status: 500 });
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
