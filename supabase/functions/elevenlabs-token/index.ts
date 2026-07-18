const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) return Response.json({ error: "Server is missing ElevenLabs configuration." }, { status: 500, headers: corsHeaders });
  const agentId = new URL(request.url).searchParams.get("agent_id");
  if (!agentId || !/^agent_[a-zA-Z0-9]+$/.test(agentId)) return Response.json({ error: "Invalid agent_id." }, { status: 400, headers: corsHeaders });

  const allowedAgentId = Deno.env.get("ELEVENLABS_INTAKE_AGENT_ID");
  if (allowedAgentId && agentId !== allowedAgentId) return Response.json({ error: "Agent is not allowlisted." }, { status: 403, headers: corsHeaders });

  const upstream = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`, { headers: { "xi-api-key": apiKey } });
  if (!upstream.ok) return Response.json({ error: "ElevenLabs token request failed." }, { status: 502, headers: corsHeaders });
  const body = await upstream.json();
  return Response.json({ token: body.token }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
});
