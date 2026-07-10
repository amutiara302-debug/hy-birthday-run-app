import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { paymentVerifiedEmail, registrationEmail, sendEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Password admin salah." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: runSubmissions, error: runError } = await supabase
    .from("run_submissions")
    .select("*, registrations(full_name,email)")
    .order("created_at", { ascending: false });
  if (runError) throw runError;

  return NextResponse.json({ registrations, runSubmissions });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Password admin salah." }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (body.action === "verify_payment") {
    const { data: registration, error: updateError } = await supabase
      .from("registrations")
      .update({ payment_status: "verified" })
      .eq("id", body.id)
      .select("full_name,email,participant_token")
      .single();
    if (updateError) throw updateError;
    if (!registration) {
      return NextResponse.json({ error: "Peserta tidak ditemukan." }, { status: 404 });
    }

    const participantCode = registration.participant_token.slice(0, 8).toUpperCase();
    const participantUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/participant/${participantCode}`;
    const emailResult = await sendEmail({
      to: registration.email,
      subject: "Pembayaran HY Birthday Run 58 telah diverifikasi",
      html: paymentVerifiedEmail(registration.full_name, participantUrl, participantCode)
    });

    if (!emailResult.ok) {
      return NextResponse.json({
        ok: true,
        emailWarning: emailResult.error || "Pembayaran sudah verified, tetapi email gagal dikirim."
      });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject_payment") {
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ payment_status: "rejected" })
      .eq("id", body.id);
    if (updateError) throw updateError;
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save_tracking") {
    const { error } = await supabase
      .from("registrations")
      .update({ tracking_number: body.tracking_number, shipping_status: "shipped" })
      .eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resend_registration_email") {
    const { data: registration, error } = await supabase
      .from("registrations")
      .select("full_name,email,participant_token")
      .eq("id", body.id)
      .single();
    if (error) throw error;
    if (!registration) {
      return NextResponse.json({ error: "Peserta tidak ditemukan." }, { status: 404 });
    }

    const participantCode = registration.participant_token.slice(0, 8).toUpperCase();
    const participantUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/participant/${participantCode}`;
    const emailResult = await sendEmail({
      to: registration.email,
      subject: "Pendaftaran HY Birthday Run diterima",
      html: registrationEmail(registration.full_name, participantUrl, participantCode)
    });

    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error || "Email gagal dikirim." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
}
