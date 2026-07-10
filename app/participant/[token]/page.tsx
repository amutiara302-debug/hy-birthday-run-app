import { notFound } from "next/navigation";
import ParticipantPortal from "./ParticipantPortal";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Registration, RunSubmission } from "@/lib/types";

export default async function ParticipantPage({ params }: { params: { token: string } }) {
  const supabase = getSupabaseAdmin();
  const token = params.token.trim().toLowerCase();
  let registration: Registration | null = null;

  if (isFullUuid(token)) {
    const { data: exactRegistration } = await supabase
      .from("registrations")
      .select("*")
      .eq("participant_token", token)
      .maybeSingle<Registration>();

    registration = exactRegistration;
  }

  if (!registration && /^[a-f0-9]{8}$/i.test(token)) {
    const { data: registrations } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    registration = (registrations as Registration[] | null)?.find((item) =>
      item.participant_token.toLowerCase().startsWith(token)
    ) || null;
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

function isFullUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
