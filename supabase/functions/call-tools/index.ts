import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4";

const finiteNonnegative = z.number().finite().nonnegative();
const itemizedQuoteSchema = z.object({
  package_total: finiteNonnegative,
  diagnostic_callout_fee: finiteNonnegative.nullable(),
  labor: finiteNonnegative.nullable(),
  parts: finiteNonnegative.nullable(),
  travel: finiteNonnegative.nullable(),
  calibration: finiteNonnegative.nullable(),
  response_hours: z.number().finite().int().nonnegative().nullable(),
  turnaround_hours: z.number().finite().int().nonnegative().nullable(),
  warranty_days: z.number().finite().int().nonnegative().nullable(),
  loaner_included: z.boolean().nullable(),
  taxes: finiteNonnegative.nullable(),
  exclusions: z.array(z.string().min(1)),
  expiration: z.string().datetime().nullable(),
  unknowns: z.array(z.string().min(1)),
  contact_identity: z.string().min(1),
}).strict();

const requestSchema = z.union([
  z.object({ action: z.literal("check_leverage"), callId: z.string().uuid(), field: z.enum(["package_total", "response_hours", "warranty_days"]), claimedValue: finiteNonnegative }).strict(),
  z.object({ action: z.literal("record_outcome"), callId: z.string().uuid(), outcome: z.literal("quote"), quote: itemizedQuoteSchema }).strict(),
  z.object({ action: z.literal("record_outcome"), callId: z.string().uuid(), outcome: z.literal("callback"), committedAt: z.string().datetime(), contact: z.string().min(1) }).strict(),
  z.object({ action: z.literal("record_outcome"), callId: z.string().uuid(), outcome: z.literal("declined"), reason: z.string().min(1) }).strict(),
  z.object({ action: z.literal("record_outcome"), callId: z.string().uuid(), outcome: z.literal("incomplete"), reason: z.string().min(1) }).strict(),
  z.object({ action: z.literal("record_evidence"), callId: z.string().uuid(), fieldName: z.string().min(1).max(80), turnIndex: z.number().int().nonnegative(), excerpt: z.string().min(1).max(1000) }).strict(),
  z.object({ action: z.literal("record_concession"), callId: z.string().uuid(), fieldName: z.string().min(1).max(80), before: z.unknown(), after: z.unknown(), leverageCallId: z.string().uuid(), evidenceId: z.string().uuid() }).strict(),
]);

const canonicalize = (value: unknown): unknown => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed !== "" && Number.isFinite(Number(trimmed))) return Number(trimmed);
    return trimmed.toLocaleLowerCase();
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)]));
  }
  return value;
};

const isMeasurableChange = (before: unknown, after: unknown) =>
  JSON.stringify(canonicalize(before)) !== JSON.stringify(canonicalize(after));

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405 });
  const internalSecret = Deno.env.get("BENCHBID_TOOL_SECRET");
  if (!internalSecret || request.headers.get("x-benchbid-tool-secret") !== internalSecret) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid tool payload.", issues: parsed.error.issues }, { status: 400 });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return Response.json({ error: "Persistence unavailable." }, { status: 500 });
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const input = parsed.data;

  if (input.action === "check_leverage") {
    const { data: current } = await db.from("calls").select("scope_hash").eq("id", input.callId).single();
    if (!current) return Response.json({ verified: false, reason: "Current call was not found." }, { status: 404 });
    const { data: alternatives } = await db.from("calls").select("id").eq("scope_hash", current.scope_hash).neq("id", input.callId).eq("outcome", "quote");
    const alternativeIds = alternatives?.map((call) => call.id) ?? [];
    const { data: candidateQuotes } = alternativeIds.length
      ? await db.from("quotes").select("call_id,package_total,response_hours,warranty_days").in("call_id", alternativeIds)
      : { data: [] };
    const verified = candidateQuotes?.find((quote) => quote[input.field] === input.claimedValue);
    const detail = { field: input.field, claimed_value: input.claimedValue, source_call_id: verified?.call_id ?? null };
    await db.from("audit_events").insert({ call_id: input.callId, event_type: verified ? "leverage_verified" : "leverage_blocked", detail });
    return Response.json(verified ? { verified: true, sourceCallId: verified.call_id, field: input.field, value: input.claimedValue } : { verified: false, reason: "No completed competing quote supports that exact claim." });
  }

  if (input.action === "record_evidence") {
    const { data, error } = await db.from("transcript_evidence").upsert({ call_id: input.callId, field_name: input.fieldName, turn_index: input.turnIndex, excerpt: input.excerpt }, { onConflict: "call_id,field_name,turn_index" }).select().single();
    return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json(data);
  }

  if (input.action === "record_concession") {
    if (!isMeasurableChange(input.before, input.after)) return Response.json({ error: "Concession rejected: before and after values are equivalent." }, { status: 409 });
    const { data: leverage } = await db.from("audit_events").select("id").eq("call_id", input.callId).eq("event_type", "leverage_verified").contains("detail", { source_call_id: input.leverageCallId }).limit(1);
    if (!leverage?.length) return Response.json({ error: "Concession rejected: leverage was not verified." }, { status: 409 });
    const { data: evidence } = await db.from("transcript_evidence").select("id").eq("id", input.evidenceId).eq("call_id", input.callId).maybeSingle();
    if (!evidence) return Response.json({ error: "Concession rejected: transcript evidence does not belong to this call." }, { status: 409 });
    const { error } = await db.from("concessions").insert({ call_id: input.callId, field_name: input.fieldName, before_value: input.before, after_value: input.after, leverage_call_id: input.leverageCallId, evidence_id: input.evidenceId });
    return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json({ recorded: true });
  }

  const { data: currentCall } = await db.from("calls").select("outcome,lifecycle").eq("id", input.callId).maybeSingle();
  if (!currentCall) return Response.json({ error: "Call was not found." }, { status: 404 });
  if (currentCall.outcome || currentCall.lifecycle === "completed") return Response.json({ error: "Terminal outcome already recorded." }, { status: 409 });
  if (input.outcome === "quote") {
    const { error: quoteError } = await db.from("quotes").upsert({
      call_id: input.callId,
      package_total: input.quote.package_total,
      response_hours: input.quote.response_hours,
      turnaround_hours: input.quote.turnaround_hours,
      warranty_days: input.quote.warranty_days,
      exclusions: input.quote.exclusions,
      unknowns: input.quote.unknowns,
      itemized_terms: input.quote,
      updated_at: new Date().toISOString(),
    }, { onConflict: "call_id" });
    if (quoteError) return Response.json({ error: quoteError.message }, { status: 500 });
  }
  const { data: completedCall, error: callError } = await db.from("calls")
    .update({ outcome: input.outcome, lifecycle: "completed", ended_at: new Date().toISOString() })
    .eq("id", input.callId)
    .is("outcome", null)
    .neq("lifecycle", "completed")
    .select("id")
    .maybeSingle();
  if (callError) return Response.json({ error: callError.message }, { status: 500 });
  if (!completedCall) return Response.json({ error: "Terminal outcome already recorded." }, { status: 409 });
  const terminalDetail = input.outcome === "callback"
    ? { outcome: input.outcome, committed_at: input.committedAt, contact: input.contact }
    : input.outcome === "declined" || input.outcome === "incomplete"
      ? { outcome: input.outcome, reason: input.reason }
      : { outcome: input.outcome, package_total: input.quote.package_total };
  const { error: auditError } = await db.from("audit_events").insert({
    call_id: input.callId,
    event_type: "terminal_outcome_recorded",
    detail: terminalDetail,
  });
  if (auditError) return Response.json({ error: auditError.message }, { status: 500 });
  return Response.json({ recorded: true, outcome: input.outcome });
});
