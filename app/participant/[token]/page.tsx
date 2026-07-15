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
    registration = await findRegistrationByUuidPrefix(supabase, "participant_token", token);
  }

  if (!registration && /^[a-f0-9]{8}$/i.test(token)) {
    registration = await findRegistrationByUuidPrefix(supabase, "id", token);
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

async function findRegistrationByUuidPrefix(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  column: "participant_token" | "id",
  code: string
) {
  const lower = `${code}-0000-0000-0000-000000000000`;
  const upperPrefix = nextHexPrefix(code);

  let query = supabase
    .from("registrations")
    .select("*")
    .gte(column, lower);

  if (upperPrefix) {
    query = query.lt(column, `${upperPrefix}-0000-0000-0000-000000000000`);
  }

  const { data } = await query.order(column, { ascending: true }).limit(1);
  return (data as Registration[] | null)?.[0] || null;
}

function nextHexPrefix(value: string) {
  const next = Number.parseInt(value, 16) + 1;
  if (!Number.isSafeInteger(next) || next > 0xffffffff) return "";
  return next.toString(16).padStart(8, "0");
}
