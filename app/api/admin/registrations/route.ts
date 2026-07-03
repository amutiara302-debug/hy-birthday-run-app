import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Category, Registration } from "@/lib/types";

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
    const { data: registration, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", body.id)
      .single<Registration>();
    if (error || !registration) {
      return NextResponse.json({ error: "Peserta tidak ditemukan." }, { status: 404 });
    }

    const bibNumber = registration.bib_number || await nextBibNumber(registration.category, supabase);
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ payment_status: "verified", bib_number: bibNumber })
      .eq("id", body.id);
    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, bibNumber });
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

async function nextBibNumber(category: Category, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const prefix = category === "Offline" ? "HY58-O" : "HY58-V";
  const { count, error } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("category", category)
    .not("bib_number", "is", null);
  if (error) throw error;
  return `${prefix}-${String((count || 0) + 1).padStart(3, "0")}`;
}
