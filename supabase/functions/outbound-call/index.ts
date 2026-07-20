const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const HASH_RE = /^sha256:[a-f0-9]{64}$/;
const E164_RE = /^\+[1-9]\d{7,14}$/;

function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (E164_RE.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function isDemoNumber(e164: string) {
  return /^\+1\d{3}555\d{4}$/.test(e164);
}

async function dialViaElevenLabs(input: {
  apiKey: string;
  agentId: string;
  phoneNumberId: string;
  toNumber: string;
  dynamicVariables: Record<string, string>;
}) {
  const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: {
      "xi-api-key": input.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: input.agentId,
      agent_phone_number_id: input.phoneNumberId,
      to_number: input.toNumber,
      conversation_initiation_client_data: {
        dynamic_variables: input.dynamicVariables,
      },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body?.detail === "string"
      ? body.detail
      : typeof body?.message === "string"
        ? body.message
        : `ElevenLabs outbound failed (${response.status})`;
    throw new Error(detail);
  }
  return {
    provider: "elevenlabs_twilio" as const,
    success: Boolean(body.success ?? true),
    message: String(body.message ?? "Outbound call started"),
    conversationId: body.conversation_id ?? null,
    callSid: body.callSid ?? body.call_sid ?? null,
  };
}

async function dialViaTwilioRest(input: {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  toNumber: string;
  statusCallback: string | null;
  vendorName: string;
  scopeShortId: string;
}) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello, this is BenchDial, an AI buyer agent calling on behalf of a customer about repair brief ${input.scopeShortId}.
    We are requesting an itemized quote for ${input.vendorName}. Please stay on the line.
  </Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">
    If you can quote, please leave your package total, call-out fee, calibration, warranty, and response time after the tone.
  </Say>
  <Record maxLength="120" playBeep="true" />
  <Say voice="Polly.Joanna">Thank you. Goodbye.</Say>
</Response>`;

  const params = new URLSearchParams({
    To: input.toNumber,
    From: input.fromNumber,
    Twiml: twiml,
  });
  if (input.statusCallback) {
    params.set("StatusCallback", input.statusCallback);
    params.set("StatusCallbackEvent", "initiated ringing answered completed");
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${input.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${input.accountSid}:${input.authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.message === "string" ? body.message : `Twilio dial failed (${response.status})`);
  }
  return {
    provider: "twilio_rest" as const,
    success: true,
    message: "Outbound Twilio call started (TwiML quote capture).",
    conversationId: null as string | null,
    callSid: body.sid ?? null,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return Response.json({ error: "Persistence unavailable." }, { status: 500, headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!accessToken) return Response.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });

  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const auth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(accessToken);
  const anonAllowed = accessToken === anonKey || (() => {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1] ?? ""));
      return payload.role === "anon";
    } catch {
      return false;
    }
  })();
  if ((authError || !user) && !anonAllowed) {
    return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
  }

  const input = await request.json().catch(() => null) as {
    toNumber?: string;
    vendorName?: string;
    scopeHash?: string;
    scopeShortId?: string;
    scopeJson?: string;
    negotiationStyle?: string;
  } | null;

  const toNumber = toE164(input?.toNumber ?? "");
  const vendorName = input?.vendorName?.trim() || "Vendor";
  const scopeHash = input?.scopeHash?.trim();
  const scopeShortId = input?.scopeShortId?.trim() || "BD-UNKNOWN";

  if (!toNumber) return Response.json({ error: "Valid E.164 phone number required (e.g. +17045550142)." }, { status: 400, headers: corsHeaders });
  if (isDemoNumber(toNumber)) {
    return Response.json({
      error: "That is a demo 555 number. Search for real vendors first, then dial a real phone number.",
    }, { status: 400, headers: corsHeaders });
  }
  if (!scopeHash || !HASH_RE.test(scopeHash)) {
    return Response.json({ error: "Locked ScopePrint hash required before outbound dial." }, { status: 400, headers: corsHeaders });
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let { data: provider } = await db.from("providers").select("id").eq("display_name", vendorName).limit(1).maybeSingle();
  if (!provider) {
    provider = (await db.from("providers").insert({
      display_name: vendorName,
      negotiation_style: input?.negotiationStyle || "live_outbound",
      is_consented_demo_counterparty: false,
    }).select("id").single()).data;
  }
  if (!provider) return Response.json({ error: "Could not create provider record." }, { status: 500, headers: corsHeaders });

  const { data: scope } = await db.from("service_scopes").select("id").eq("canonical_hash", scopeHash).maybeSingle();
  let scopeId = scope?.id as string | undefined;
  if (!scopeId) {
    const inserted = await db.from("service_scopes").upsert({
      canonical_hash: scopeHash,
      version: 1,
      confirmation_status: "confirmed",
      confirmed_at: new Date().toISOString(),
      specification: { scope_print: scopeShortId, canonicalHash: scopeHash },
    }, { onConflict: "canonical_hash" }).select("id").single();
    scopeId = inserted.data?.id;
  }
  if (!scopeId) return Response.json({ error: "Could not bind scope for outbound call." }, { status: 500, headers: corsHeaders });

  const { data: call, error: callError } = await db.from("calls").insert({
    scope_id: scopeId,
    scope_hash: scopeHash,
    provider_id: provider.id,
    provenance: "LIVE",
    lifecycle: "initiating",
  }).select("id").single();
  if (callError || !call) return Response.json({ error: "Could not create outbound call record." }, { status: 500, headers: corsHeaders });

  const dynamicVariables = {
    scope_print: scopeShortId,
    scope_hash: scopeHash,
    provider_name: vendorName,
    negotiation_style: input?.negotiationStyle || "live_outbound",
    vertical: "laboratory_equipment_repair",
    call_id: call.id,
  };

  const elevenKey = Deno.env.get("ELEVENLABS_API_KEY");
  const buyerAgentId = Deno.env.get("ELEVENLABS_BUYER_AGENT_ID");
  const phoneNumberId = Deno.env.get("ELEVENLABS_AGENT_PHONE_NUMBER_ID");
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

  try {
    let result;
    if (elevenKey && buyerAgentId && phoneNumberId) {
      result = await dialViaElevenLabs({
        apiKey: elevenKey,
        agentId: buyerAgentId,
        phoneNumberId,
        toNumber,
        dynamicVariables,
      });
    } else if (twilioSid && twilioToken && twilioFrom) {
      result = await dialViaTwilioRest({
        accountSid: twilioSid,
        authToken: twilioToken,
        fromNumber: twilioFrom,
        toNumber,
        statusCallback: `${supabaseUrl}/functions/v1/twilio-status`,
        vendorName,
        scopeShortId,
      });
    } else {
      return Response.json({
        error: "Outbound calling is not configured. Set ELEVENLABS_AGENT_PHONE_NUMBER_ID (preferred) or TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER.",
        callId: call.id,
      }, { status: 503, headers: corsHeaders });
    }

    await db.from("calls").update({
      conversation_id: result.conversationId,
      lifecycle: "active",
      started_at: new Date().toISOString(),
    }).eq("id", call.id);

    await db.from("audit_events").insert({
      call_id: call.id,
      event_type: "outbound_dial_started",
      detail: {
        provider: result.provider,
        to_number: toNumber,
        vendor_name: vendorName,
        call_sid: result.callSid,
        conversation_id: result.conversationId,
      },
    });

    return Response.json({
      ok: true,
      callId: call.id,
      ...result,
      toNumber,
      vendorName,
    }, { headers: corsHeaders });
  } catch (reason) {
    await db.from("calls").update({ lifecycle: "failed", outcome: "failed" }).eq("id", call.id);
    return Response.json({
      error: reason instanceof Error ? reason.message : "Outbound dial failed.",
      callId: call.id,
    }, { status: 502, headers: corsHeaders });
  }
});
