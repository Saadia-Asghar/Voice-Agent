const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const checks: Record<string, boolean | string> = {
    supabase_url: Boolean(url),
    service_role: Boolean(serviceKey),
    elevenlabs_api_key: Boolean(Deno.env.get("ELEVENLABS_API_KEY")),
    buyer_agent_id: Boolean(Deno.env.get("ELEVENLABS_BUYER_AGENT_ID")),
    intake_agent_id: Boolean(Deno.env.get("ELEVENLABS_INTAKE_AGENT_ID")),
    webhook_secret: Boolean(Deno.env.get("ELEVENLABS_WEBHOOK_SECRET")),
    tool_secret: Boolean(Deno.env.get("BENCHBID_TOOL_SECRET")),
    openai_key: Boolean(Deno.env.get("OPENAI_API_KEY")),
    tavily_key: Boolean(Deno.env.get("TAVILY_API_KEY")),
    elevenlabs_phone_number_id: Boolean(Deno.env.get("ELEVENLABS_AGENT_PHONE_NUMBER_ID")),
    twilio_sid: Boolean(Deno.env.get("TWILIO_ACCOUNT_SID")),
    twilio_token: Boolean(Deno.env.get("TWILIO_API_KEY_SECRET") || Deno.env.get("TWILIO_AUTH_TOKEN")),
    twilio_from: Boolean(Deno.env.get("TWILIO_PHONE_NUMBER")),
  };

  let database = false;
  let tables = 0;
  if (url && serviceKey) {
    try {
      const { createClient } = await import("npm:@supabase/supabase-js@2");
      const db = createClient(url, serviceKey, { auth: { persistSession: false } });
      const { count, error } = await db.from("providers").select("*", { count: "exact", head: true });
      database = !error;
      tables = count ?? 0;
    } catch {
      database = false;
    }
  }

  const outboundReady = Boolean(
    (checks.elevenlabs_api_key && checks.buyer_agent_id && checks.elevenlabs_phone_number_id)
    || (checks.twilio_sid && checks.twilio_token && checks.twilio_from),
  );
  const ready = database && checks.elevenlabs_api_key && checks.buyer_agent_id;
  return Response.json({
    ok: ready,
    service: "benchdial",
    database,
    demo_providers: tables,
    vendor_search_ready: true, // always — keyless Tavily or fixtures
    outbound_ready: outboundReady,
    demo_fallback: true,
    checks,
    timestamp: new Date().toISOString(),
  }, { status: 200, headers: corsHeaders }); // always 200 so verify/UI can read status
});
