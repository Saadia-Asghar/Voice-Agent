const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-twilio-signature",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return Response.json({ error: "Persistence unavailable." }, { status: 500, headers: corsHeaders });

  const form = await request.formData();
  const callSid = String(form.get("CallSid") ?? "");
  const callStatus = String(form.get("CallStatus") ?? "");
  const to = String(form.get("To") ?? "");
  const from = String(form.get("From") ?? "");
  if (!callSid) return Response.json({ received: true }, { headers: corsHeaders });

  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const lifecycle = callStatus === "completed"
    ? "completed"
    : callStatus === "failed" || callStatus === "busy" || callStatus === "no-answer" || callStatus === "canceled"
      ? "failed"
      : "active";

  // Best-effort match latest initiating/active call for this destination
  const { data: calls } = await db
    .from("calls")
    .select("id")
    .in("lifecycle", ["initiating", "active"])
    .order("created_at", { ascending: false })
    .limit(5);

  const callId = calls?.[0]?.id;
  if (callId) {
    await db.from("calls").update({
      lifecycle,
      ended_at: lifecycle === "completed" || lifecycle === "failed" ? new Date().toISOString() : null,
      analysis: { twilio_status: callStatus, to, from, call_sid: callSid },
    }).eq("id", callId);

    await db.from("audit_events").insert({
      call_id: callId,
      event_type: "twilio_status",
      detail: { call_sid: callSid, call_status: callStatus, to, from },
    });
  }

  return Response.json({ received: true }, { headers: corsHeaders });
});
