import { notFound } from "next/navigation";
import ParticipantPortal from "./ParticipantPortal";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Registration, RunSubmission } from "@/lib/types";

export default async function ParticipantPage({ params }: { params: { token: string } }) {
  const supabase = getSupabaseAdmin();
  const token = params.token.trim();
  const { data: exactRegistration } = await supabase
    .from("registrations")
    .select("*")
    .eq("participant_token", token)
    .maybeSingle<Registration>();

  let registration = exactRegistration;

  if (!registration && /^[a-f0-9]{8}$/i.test(token)) {
    const { data: prefixRegistration } = await supabase
      .from("registrations")
      .select("*")
      .ilike("participant_token", `${token}%`)
      .limit(1)
      .maybeSingle<Registration>();

    registration = prefixRegistration;
  }

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
