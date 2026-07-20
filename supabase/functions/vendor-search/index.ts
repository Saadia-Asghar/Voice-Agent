const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

type VendorHit = {
  display_name: string;
  phone: string | null;
  phone_e164: string | null;
  source: string;
  site_region: string;
  rating: string | null;
  notes: string | null;
  url: string | null;
  score: number;
};

const PHONE_RE = /(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/g;

function toE164(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

function extractPhone(text: string): string | null {
  const matches = text.match(PHONE_RE) ?? [];
  for (const match of matches) {
    const e164 = toE164(match);
    if (!e164) continue;
    // Skip obvious demo / fake 555 exchange numbers
    if (/^\+1\d{3}555\d{4}$/.test(e164)) continue;
    return e164;
  }
  return null;
}

function formatDisplayPhone(e164: string | null): string | null {
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return e164;
}

async function searchTavily(query: string, apiKey: string | undefined): Promise<VendorHit[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  else headers["X-Tavily-Access-Mode"] = "keyless";

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 8,
      include_answer: false,
    }),
  });
  if (!response.ok) throw new Error(`Tavily search failed (${response.status})`);
  const body = await response.json() as {
    results?: { title?: string; url?: string; content?: string; score?: number }[];
  };

  const hits: VendorHit[] = [];
  for (const result of body.results ?? []) {
    const blob = `${result.title ?? ""} ${result.content ?? ""} ${result.url ?? ""}`;
    const phoneE164 = extractPhone(blob);
    const name = (result.title ?? "Repair shop").replace(/\s*[|\-–].*$/, "").trim().slice(0, 80);
    if (!name) continue;
    hits.push({
      display_name: name,
      phone: formatDisplayPhone(phoneE164),
      phone_e164: phoneE164,
      source: "tavily_web_search",
      site_region: "live_search",
      rating: null,
      notes: (result.content ?? "").slice(0, 220),
      url: result.url ?? null,
      score: typeof result.score === "number" ? result.score : 0,
    });
  }
  return hits;
}

async function loadApproved(db: any, region: string): Promise<VendorHit[]> {
  const { data } = await db
    .from("approved_vendors")
    .select("display_name,phone,source,site_region,rating,notes")
    .eq("active", true)
    .limit(10);
  return (data ?? []).map((row: any) => {
    const e164 = toE164(row.phone);
    return {
      display_name: row.display_name as string,
      phone: row.phone as string | null,
      phone_e164: e164,
      source: (row.source as string) || "approved_list",
      site_region: (row.site_region as string) || region,
      rating: row.rating as string | null,
      notes: row.notes as string | null,
      url: null,
      score: 1,
    } satisfies VendorHit;
  });
}

function dedupe(vendors: VendorHit[]): VendorHit[] {
  const seen = new Set<string>();
  const out: VendorHit[] = [];
  for (const vendor of vendors) {
    const key = `${vendor.display_name.toLowerCase()}|${vendor.phone_e164 ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(vendor);
  }
  return out;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST" && request.method !== "GET") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const tavilyKey = request.headers.get("x-tavily-key") || Deno.env.get("TAVILY_API_KEY");

  let query = "laboratory equipment repair near Charlotte NC phone number";
  let region = "Charlotte MSA";
  let category = "laboratory equipment repair";
  let site = "City Labs";

  if (request.method === "POST") {
    const input = await request.json().catch(() => null) as {
      query?: string;
      region?: string;
      category?: string;
      site?: string;
      model?: string;
    } | null;
    region = input?.region?.trim() || region;
    category = input?.category?.trim() || category;
    site = input?.site?.trim() || site;
    const model = input?.model?.trim();
    query = input?.query?.trim()
      || `${category}${model ? ` ${model}` : ""} phone number near ${region}`;
  } else {
    const params = new URL(request.url).searchParams;
    region = params.get("region")?.trim() || region;
    category = params.get("category")?.trim() || category;
    query = params.get("query")?.trim() || `${category} phone number near ${region}`;
  }

  let approved: VendorHit[] = [];
  if (url && serviceKey) {
    try {
      const { createClient } = await import("npm:@supabase/supabase-js@2");
      const db = createClient(url, serviceKey, { auth: { persistSession: false } });
      approved = await loadApproved(db, region);
    } catch {
      approved = [];
    }
  }

  let live: VendorHit[] = [];
  let searchMode: "tavily_keyed" | "tavily_keyless" | "approved_only" | "error" = "approved_only";
  let searchError: string | null = null;
  try {
    live = await searchTavily(query, tavilyKey || undefined);
    searchMode = tavilyKey ? "tavily_keyed" : "tavily_keyless";
  } catch (reason) {
    searchError = reason instanceof Error ? reason.message : "Search failed";
    searchMode = approved.length ? "approved_only" : "error";
  }

  // Prefer results with real phones, then approved list, then remaining search hits
  const withPhone = live.filter((item) => item.phone_e164);
  const withoutPhone = live.filter((item) => !item.phone_e164);
  const merged = dedupe([...withPhone, ...approved, ...withoutPhone]).slice(0, 5);

  if (!merged.length) {
    return Response.json({
      ok: false,
      searchMode,
      error: searchError ?? "No vendors found. Add TAVILY_API_KEY or seed approved_vendors.",
      query,
      region,
      site,
      vendors: [],
    }, { status: 404, headers: corsHeaders });
  }

  return Response.json({
    ok: true,
    searchMode,
    query,
    region,
    site,
    searchedAt: new Date().toISOString(),
    vendors: merged,
  }, { headers: corsHeaders });
});
