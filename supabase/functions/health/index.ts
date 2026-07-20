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

  const ready = database && checks.elevenlabs_api_key && checks.buyer_agent_id && checks.webhook_secret && checks.tool_secret;
  return Response.json({
    ok: ready,
    service: "benchdial",
    database,
    demo_providers: tables,
    checks,
    timestamp: new Date().toISOString(),
  }, { status: ready ? 200 : 503, headers: corsHeaders });
});
