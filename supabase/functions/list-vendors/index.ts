const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "GET") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return Response.json({ error: "Persistence unavailable." }, { status: 500, headers: corsHeaders });

  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const region = new URL(request.url).searchParams.get("region") ?? "Charlotte MSA";

  const { data: approved, error: approvedError } = await db
    .from("approved_vendors")
    .select("display_name,phone,source,site_region,rating,notes")
    .eq("active", true)
    .eq("site_region", region)
    .order("display_name");

  if (!approvedError && approved?.length) {
    return Response.json({ source: "database", region, vendors: approved }, { headers: corsHeaders });
  }

  const { data: providers, error: providerError } = await db
    .from("providers")
    .select("display_name,negotiation_style")
    .eq("is_consented_demo_counterparty", true)
    .order("display_name");

  if (providerError) return Response.json({ error: "Could not load vendors." }, { status: 500, headers: corsHeaders });

  return Response.json({
    source: "providers_fallback",
    region,
    vendors: (providers ?? []).map((row) => ({
      display_name: row.display_name,
      phone: null,
      source: "demo_seed",
      site_region: region,
      rating: null,
      notes: row.negotiation_style,
    })),
  }, { headers: corsHeaders });
});
