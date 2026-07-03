import { notFound } from "next/navigation";
import ParticipantPortal from "./ParticipantPortal";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Registration, RunSubmission } from "@/lib/types";

export default async function ParticipantPage({ params }: { params: { token: string } }) {
  const supabase = getSupabaseAdmin();
  const { data: registration } = await supabase
    .from("registrations")
    .select("*")
    .eq("participant_token", params.token)
    .single<Registration>();

  if (!registration) notFound();

  const { data: runSubmission } = await supabase
    .from("run_submissions")
    .select("*")
    .eq("registration_id", registration.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<RunSubmission>();

  return <ParticipantPortal registration={registration} runSubmission={runSubmission || null} />;
}
