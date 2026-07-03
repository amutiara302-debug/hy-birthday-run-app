import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { finisherEmail, sendEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";

type RunWithRegistration = {
  id: string;
  registration_id: string;
  registrations: {
    full_name: string;
    email: string;
  } | null;
};

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Password admin salah." }, { status: 401 });
  }

  const body = await request.json();
  if (body.action !== "approve") {
    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: submission, error } = await supabase
    .from("run_submissions")
    .select("id, registration_id, registrations(full_name,email)")
    .eq("id", body.id)
    .single<RunWithRegistration>();
  if (error || !submission) {
    return NextResponse.json({ error: "Bukti lari tidak ditemukan." }, { status: 404 });
  }

  await supabase.from("run_submissions").update({ status: "approved" }).eq("id", body.id);
  await supabase.from("registrations").update({ run_status: "approved" }).eq("id", submission.registration_id);

  if (submission.registrations) {
    await sendEmail({
      to: submission.registrations.email,
      subject: "Finisher Confirmed - HY Birthday Run",
      html: finisherEmail(submission.registrations.full_name)
    });
  }

  return NextResponse.json({ ok: true });
}
