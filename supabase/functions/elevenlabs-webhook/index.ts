import { createClient } from "npm:@supabase/supabase-js@2";

type ElevenLabsEvent = {
  type: "post_call_transcription" | "post_call_audio" | "call_initiation_failure" | string;
  event_timestamp: number;
  data: {
    conversation_id?: string;
    transcript?: unknown;
    analysis?: unknown;
    has_audio?: boolean;
    failure_reason?: string;
  };
};

const encoder = new TextEncoder();

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function verifySignature(rawBody: string, signature: string, secret: string) {
  const fields = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  const timestamp = Number(fields.t);
  const suppliedDigest = fields.v0;
  if (!timestamp || !suppliedDigest || Math.abs(Date.now() / 1000 - timestamp) > 30 * 60) return false;

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`)));
  return safeEqual(digest, suppliedDigest);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405 });

  const secret = Deno.env.get("ELEVENLABS_WEBHOOK_SECRET");
  const signature = request.headers.get("elevenlabs-signature");
  if (!secret || !signature) return Response.json({ error: "Webhook authentication unavailable." }, { status: 401 });

  const rawBody = await request.text();
  if (!(await verifySignature(rawBody, signature, secret))) return Response.json({ error: "Invalid webhook signature." }, { status: 401 });

  let event: ElevenLabsEvent;
  try {
    event = JSON.parse(rawBody) as ElevenLabsEvent;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const conversationId = event.data?.conversation_id;
  if (!event.type || !event.event_timestamp || !conversationId) return Response.json({ error: "Incomplete event." }, { status: 400 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return Response.json({ error: "Persistence unavailable." }, { status: 500 });
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const dedupeKey = `${event.type}:${conversationId}:${event.event_timestamp}`;

  const { error: ledgerError } = await supabase.from("webhook_events").upsert({
    dedupe_key: dedupeKey,
    event_type: event.type,
    conversation_id: conversationId,
    event_timestamp: event.event_timestamp,
    payload: event,
  }, { onConflict: "dedupe_key", ignoreDuplicates: true });
  if (ledgerError) return Response.json({ error: "Could not record event." }, { status: 500 });

  const patch: Record<string, unknown> = event.type === "call_initiation_failure"
    ? { lifecycle: "failed", outcome: "failed", analysis: { failure_reason: event.data.failure_reason } }
    : event.type === "post_call_transcription"
      ? { lifecycle: "completed", provenance: "RECORDED_LIVE_RUN", transcript: event.data.transcript ?? [], analysis: event.data.analysis ?? {}, has_audio: event.data.has_audio ?? false, ended_at: new Date(event.event_timestamp * 1000).toISOString() }
      : { has_audio: true };
  const { error: callError } = await supabase.from("calls").update(patch).eq("conversation_id", conversationId);
  if (callError) return Response.json({ error: "Could not update call." }, { status: 500 });

  return Response.json({ received: true });
});
