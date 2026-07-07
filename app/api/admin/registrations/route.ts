import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
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
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ payment_status: "verified" })
      .eq("id", body.id);
    if (updateError) throw updateError;
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

  return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
}
