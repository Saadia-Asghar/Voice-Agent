const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const encoder = new TextEncoder();

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function proofHash(proof: string) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(proof)));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return Response.json({ error: "Persistence unavailable." }, { status: 500, headers: corsHeaders });
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!accessToken) return Response.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(accessToken);
  if (authError || !user) return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });

  if (request.method === "POST") {
    const input = await request.json().catch(() => null) as { action?: string; callId?: string; proof?: string; conversationId?: string } | null;
    if (!input?.callId || !input.proof || !["attach", "status"].includes(input.action ?? "")) return Response.json({ error: "Invalid session request." }, { status: 400, headers: corsHeaders });
    const { data: call } = await db.from("calls").select("id,lifecycle,outcome,has_audio,transcript").eq("id", input.callId).single();
    const { data: proofEvent } = await db.from("audit_events").select("detail").eq("call_id", input.callId).eq("event_type", "session_proof_created").limit(1).maybeSingle();
    const storedHash = (proofEvent?.detail as { hash?: string } | null)?.hash;
    if (!call || !storedHash || storedHash !== await proofHash(input.proof)) return Response.json({ error: "Session proof rejected." }, { status: 403, headers: corsHeaders });
    if (input.action === "attach") {
      if (!input.conversationId || !/^[a-zA-Z0-9_-]{8,160}$/.test(input.conversationId)) return Response.json({ error: "Invalid conversation ID." }, { status: 400, headers: corsHeaders });
      const { error } = await db.from("calls").update({ conversation_id: input.conversationId, lifecycle: "active", started_at: new Date().toISOString() }).eq("id", input.callId);
      return error ? Response.json({ error: "Could not bind the live conversation." }, { status: 500, headers: corsHeaders }) : Response.json({ attached: true }, { headers: corsHeaders });
    }
    const transcriptTurns = Array.isArray(call.transcript) ? call.transcript.length : 0;
    return Response.json({ lifecycle: call.lifecycle, outcome: call.outcome, hasAudio: call.has_audio ?? false, transcriptTurns, verified: call.lifecycle === "completed" && transcriptTurns > 0 }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  }

  if (request.method !== "GET") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) return Response.json({ error: "Server is missing ElevenLabs configuration." }, { status: 500, headers: corsHeaders });
  const requestUrl = new URL(request.url);
  const agentId = requestUrl.searchParams.get("agent_id");
  if (!agentId || !/^agent_[a-zA-Z0-9]+$/.test(agentId)) return Response.json({ error: "Invalid agent_id." }, { status: 400, headers: corsHeaders });

  const allowedAgentIds = [Deno.env.get("ELEVENLABS_INTAKE_AGENT_ID"), Deno.env.get("ELEVENLABS_BUYER_AGENT_ID"), Deno.env.get("ELEVENLABS_VENDOR_OEM_AGENT_ID"), Deno.env.get("ELEVENLABS_VENDOR_INDEPENDENT_AGENT_ID"), Deno.env.get("ELEVENLABS_VENDOR_STONEWALLER_AGENT_ID")].filter(Boolean);
  if (allowedAgentIds.length && !allowedAgentIds.includes(agentId)) return Response.json({ error: "Agent is not allowlisted." }, { status: 403, headers: corsHeaders });

  const upstream = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`, { headers: { "xi-api-key": apiKey } });
  if (!upstream.ok) return Response.json({ error: "ElevenLabs token request failed." }, { status: 502, headers: corsHeaders });
  const body = await upstream.json();
  const providerName = requestUrl.searchParams.get("provider");
  if (!providerName) return Response.json({ token: body.token }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  if (agentId !== Deno.env.get("ELEVENLABS_BUYER_AGENT_ID") || providerName.length > 80) return Response.json({ error: "Live evidence sessions require the Buyer agent and a valid provider." }, { status: 400, headers: corsHeaders });

  const scopeHash = "BB-7F3A-1042";
  const { data: scope, error: scopeError } = await db.from("service_scopes").upsert({ canonical_hash: scopeHash, version: 1, confirmation_status: "confirmed", confirmed_at: new Date().toISOString(), specification: { vertical: "laboratory_equipment_repair", instrument: "SpinPro X2", fault: "Error E17", scope_print: scopeHash } }, { onConflict: "canonical_hash" }).select("id").single();
  if (scopeError || !scope) return Response.json({ error: "Could not create the evidence scope." }, { status: 500, headers: corsHeaders });
  let { data: provider } = await db.from("providers").select("id").eq("display_name", providerName).limit(1).maybeSingle();
  if (!provider) provider = (await db.from("providers").insert({ display_name: providerName, negotiation_style: "consenting_human_roleplay", is_consented_demo_counterparty: true }).select("id").single()).data;
  if (!provider) return Response.json({ error: "Could not create the evidence provider." }, { status: 500, headers: corsHeaders });
  const proof = crypto.randomUUID();
  const { data: call, error: callError } = await db.from("calls").insert({ scope_id: scope.id, scope_hash: scopeHash, provider_id: provider.id, provenance: "LIVE", lifecycle: "initiating" }).select("id").single();
  if (callError || !call) return Response.json({ error: "Could not create the live evidence record." }, { status: 500, headers: corsHeaders });
  const { error: proofError } = await db.from("audit_events").insert({ call_id: call.id, event_type: "session_proof_created", detail: { hash: await proofHash(proof) } });
  if (proofError) return Response.json({ error: "Could not secure the live evidence record." }, { status: 500, headers: corsHeaders });
  return Response.json({ token: body.token, callId: call.id, sessionProof: proof }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
});
