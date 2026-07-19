const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const encoder = new TextEncoder();
const HASH_RE = /^sha256:[a-f0-9]{64}$/;

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function proofHash(proof: string) {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(proof)));
}

async function mintConversationToken(apiKey: string, agentId: string) {
  const upstream = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!upstream.ok) return null;
  const body = await upstream.json();
  return typeof body.token === "string" ? body.token : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return Response.json({ error: "Persistence unavailable." }, { status: 500, headers: corsHeaders });
  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const requestUrl = new URL(request.url);
  const intakeAgentId = Deno.env.get("ELEVENLABS_INTAKE_AGENT_ID");
  const requestedAgentId = requestUrl.searchParams.get("agent_id");
  const providerNameEarly = requestUrl.searchParams.get("provider");
  // Demo: Estimator/intake token stays open without a buyer login. Any provider= live Buyer lane still requires auth.
  const openDemoIntake = request.method === "GET" && !providerNameEarly && (!intakeAgentId || requestedAgentId === intakeAgentId);

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!openDemoIntake) {
    if (!accessToken) return Response.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });
    const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(accessToken);
    if (authError || !user) return Response.json({ error: "Invalid or expired session." }, { status: 401, headers: corsHeaders });
  }

  if (request.method === "POST") {
    const input = await request.json().catch(() => null) as {
      action?: string;
      callId?: string;
      proof?: string;
      conversationId?: string;
      agentId?: string;
      provider?: string;
      scopeHash?: string;
      scopeShortId?: string;
      specification?: Record<string, unknown>;
      scopeJson?: string;
    } | null;

    if (input?.action === "bootstrap") {
      const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
      const buyerAgentId = Deno.env.get("ELEVENLABS_BUYER_AGENT_ID");
      const agentId = input.agentId;
      const providerName = input.provider?.trim();
      const scopeHash = input.scopeHash?.trim();
      if (!apiKey) return Response.json({ error: "Server is missing ElevenLabs configuration." }, { status: 500, headers: corsHeaders });
      if (!agentId || !/^agent_[a-zA-Z0-9]+$/.test(agentId) || agentId !== buyerAgentId) {
        return Response.json({ error: "Live evidence sessions require the Buyer agent." }, { status: 400, headers: corsHeaders });
      }
      if (!providerName || providerName.length > 80) return Response.json({ error: "Invalid provider." }, { status: 400, headers: corsHeaders });
      if (!scopeHash || !HASH_RE.test(scopeHash)) return Response.json({ error: "Locked ScopePrint hash required." }, { status: 400, headers: corsHeaders });
      if (!input.specification || typeof input.specification !== "object") {
        return Response.json({ error: "Confirmed scope specification required." }, { status: 400, headers: corsHeaders });
      }

      const token = await mintConversationToken(apiKey, agentId);
      if (!token) return Response.json({ error: "ElevenLabs token request failed." }, { status: 502, headers: corsHeaders });

      const specification = {
        ...input.specification,
        scope_print: input.scopeShortId ?? null,
        canonicalHash: scopeHash,
        scopeJson: typeof input.scopeJson === "string" ? input.scopeJson : null,
      };
      const { data: scope, error: scopeError } = await db.from("service_scopes").upsert({
        canonical_hash: scopeHash,
        version: Number(input.specification.version) > 0 ? Number(input.specification.version) : 1,
        confirmation_status: "confirmed",
        confirmed_at: new Date().toISOString(),
        specification,
      }, { onConflict: "canonical_hash" }).select("id").single();
      if (scopeError || !scope) return Response.json({ error: "Could not persist the locked ScopePrint." }, { status: 500, headers: corsHeaders });

      let { data: provider } = await db.from("providers").select("id").eq("display_name", providerName).limit(1).maybeSingle();
      if (!provider) {
        provider = (await db.from("providers").insert({
          display_name: providerName,
          negotiation_style: "consenting_human_roleplay",
          is_consented_demo_counterparty: true,
        }).select("id").single()).data;
      }
      if (!provider) return Response.json({ error: "Could not create the evidence provider." }, { status: 500, headers: corsHeaders });

      const proof = crypto.randomUUID();
      const { data: call, error: callError } = await db.from("calls").insert({
        scope_id: scope.id,
        scope_hash: scopeHash,
        provider_id: provider.id,
        provenance: "LIVE",
        lifecycle: "initiating",
      }).select("id").single();
      if (callError || !call) return Response.json({ error: "Could not create the live evidence record." }, { status: 500, headers: corsHeaders });
      const { error: proofError } = await db.from("audit_events").insert({
        call_id: call.id,
        event_type: "session_proof_created",
        detail: { hash: await proofHash(proof) },
      });
      if (proofError) return Response.json({ error: "Could not secure the live evidence record." }, { status: 500, headers: corsHeaders });
      return Response.json({ token, callId: call.id, sessionProof: proof }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
    }

    if (!input?.callId || !input.proof || !["attach", "status"].includes(input.action ?? "")) {
      return Response.json({ error: "Invalid session request." }, { status: 400, headers: corsHeaders });
    }
    const { data: call } = await db.from("calls").select("id,lifecycle,outcome,has_audio,transcript").eq("id", input.callId).single();
    const { data: proofEvent } = await db.from("audit_events").select("detail").eq("call_id", input.callId).eq("event_type", "session_proof_created").limit(1).maybeSingle();
    const storedHash = (proofEvent?.detail as { hash?: string } | null)?.hash;
    if (!call || !storedHash || storedHash !== await proofHash(input.proof)) {
      return Response.json({ error: "Session proof rejected." }, { status: 403, headers: corsHeaders });
    }
    if (input.action === "attach") {
      if (!input.conversationId || !/^[a-zA-Z0-9_-]{8,160}$/.test(input.conversationId)) {
        return Response.json({ error: "Invalid conversation ID." }, { status: 400, headers: corsHeaders });
      }
      const { error } = await db.from("calls").update({
        conversation_id: input.conversationId,
        lifecycle: "active",
        started_at: new Date().toISOString(),
      }).eq("id", input.callId);
      return error
        ? Response.json({ error: "Could not bind the live conversation." }, { status: 500, headers: corsHeaders })
        : Response.json({ attached: true }, { headers: corsHeaders });
    }
    const transcriptTurns = Array.isArray(call.transcript) ? call.transcript.length : 0;
    const verified = call.lifecycle === "completed" && transcriptTurns > 0;

    let quoteData = null;
    let concessionsData = [] as unknown[];
    let evidenceData = [] as unknown[];
    let terminalDetails = null;

    if (verified) {
      const { data: quote } = await db.from("quotes").select("*").eq("call_id", call.id).maybeSingle();
      if (quote) {
        quoteData = {
          packageTotal: quote.package_total,
          responseHours: quote.response_hours,
          turnaroundHours: quote.turnaround_hours,
          warrantyDays: quote.warranty_days,
          exclusions: quote.exclusions,
          unknowns: quote.unknowns,
          scopeMatch: quote.scope_match ?? Math.max(0, 100 - (quote.unknowns?.length ?? 0) * 14),
          itemizedTerms: quote.itemized_terms,
        };
      }

      const { data: concessions } = await db.from("concessions").select("*").eq("call_id", call.id);
      if (concessions) concessionsData = concessions;

      const { data: evidence } = await db.from("transcript_evidence").select("*").eq("call_id", call.id);
      if (evidence) evidenceData = evidence;

      const { data: terminalEvent } = await db.from("audit_events").select("detail").eq("call_id", call.id).eq("event_type", "terminal_outcome_recorded").maybeSingle();
      if (terminalEvent) terminalDetails = terminalEvent.detail;
    }

    return Response.json({
      lifecycle: call.lifecycle,
      outcome: call.outcome,
      hasAudio: call.has_audio ?? false,
      transcriptTurns,
      verified,
      quote: quoteData,
      concessions: concessionsData,
      evidence: evidenceData,
      terminalDetails,
    }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
  }

  if (request.method !== "GET") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) return Response.json({ error: "Server is missing ElevenLabs configuration." }, { status: 500, headers: corsHeaders });
  const agentId = requestedAgentId;
  if (!agentId || !/^agent_[a-zA-Z0-9]+$/.test(agentId)) return Response.json({ error: "Invalid agent_id." }, { status: 400, headers: corsHeaders });

  const allowedAgentIds = [
    intakeAgentId,
    Deno.env.get("ELEVENLABS_BUYER_AGENT_ID"),
    Deno.env.get("ELEVENLABS_VENDOR_OEM_AGENT_ID"),
    Deno.env.get("ELEVENLABS_VENDOR_INDEPENDENT_AGENT_ID"),
    Deno.env.get("ELEVENLABS_VENDOR_STONEWALLER_AGENT_ID"),
  ].filter(Boolean);
  if (allowedAgentIds.length && !allowedAgentIds.includes(agentId)) {
    return Response.json({ error: "Agent is not allowlisted." }, { status: 403, headers: corsHeaders });
  }

  // Live Buyer evidence must bootstrap with the locked client ScopePrint via POST.
  if (providerNameEarly) {
    return Response.json({ error: "Use POST bootstrap with the locked ScopePrint for live Call Room sessions." }, { status: 400, headers: corsHeaders });
  }

  const token = await mintConversationToken(apiKey, agentId);
  if (!token) return Response.json({ error: "ElevenLabs token request failed." }, { status: 502, headers: corsHeaders });
  return Response.json({ token, demoOpenIntake: openDemoIntake || undefined }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
});
