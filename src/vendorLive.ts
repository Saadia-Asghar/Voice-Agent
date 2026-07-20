import { providerCallList, type ProviderLane } from "./caseModel";

export type LiveVendor = {
  name: string;
  phone: string;
  phoneE164: string | null;
  source: string;
  rating: string;
  discovery: string;
  url: string | null;
  style: string;
  negotiationType: string;
  dialable: boolean;
};

export type VendorSearchResponse = {
  ok: boolean;
  searchMode?: string;
  query?: string;
  region?: string;
  error?: string;
  vendors?: {
    display_name: string;
    phone: string | null;
    phone_e164: string | null;
    source: string;
    rating: string | null;
    notes: string | null;
    url: string | null;
  }[];
};

const SOURCE_LABEL: Record<string, string> = {
  tavily_web_search: "Live web search",
  approved_list: "Approved list",
  google_maps: "Google Maps",
  yelp: "Yelp",
  demo_seed: "Demo seed",
};

export function sourceLabel(source: string) {
  return SOURCE_LABEL[source] ?? source;
}

export function fixtureVendors(): LiveVendor[] {
  return providerCallList.map((item) => toLiveVendorFromFixture(item));
}

export function toLiveVendorFromFixture(item: ProviderLane): LiveVendor {
  const digits = item.phone.replace(/\D/g, "");
  const phoneE164 = digits.length === 11 && digits.startsWith("1")
    ? `+${digits}`
    : digits.length === 10
      ? `+1${digits}`
      : null;
  const dialable = Boolean(phoneE164 && !/^\+1\d{3}555\d{4}$/.test(phoneE164));
  return {
    name: item.name,
    phone: item.phone,
    phoneE164,
    source: "demo_seed",
    rating: item.rating,
    discovery: item.discovery,
    url: null,
    style: item.style,
    negotiationType: item.negotiationType,
    dialable,
  };
}

export function mapSearchVendors(response: VendorSearchResponse): LiveVendor[] {
  return (response.vendors ?? []).map((row, index) => {
    const styles = ["Live search match", "Independent repair", "Regional field"] as const;
    const negotiation = ["Live outbound", "Quote hunter", "Direct dial"] as const;
    return {
      name: row.display_name,
      phone: row.phone ?? row.phone_e164 ?? "No phone found",
      phoneE164: row.phone_e164,
      source: row.source,
      rating: row.rating ?? "—",
      discovery: row.notes ?? `${sourceLabel(row.source)} · live discovery`,
      url: row.url,
      style: styles[index % styles.length],
      negotiationType: negotiation[index % negotiation.length],
      dialable: Boolean(row.phone_e164 && !/^\+1\d{3}555\d{4}$/.test(row.phone_e164)),
    };
  });
}

export async function searchVendorsLive(input: {
  site?: string;
  region?: string;
  category?: string;
  model?: string;
}): Promise<{ vendors: LiveVendor[]; searchMode: string; query: string; error?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
  if (!supabaseUrl || !publishableKey) {
    return { vendors: fixtureVendors(), searchMode: "local_fixtures", query: "offline", error: "Supabase not configured — showing demo vendors." };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/vendor-search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publishableKey}`,
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site: input.site ?? "City Labs",
        region: input.region ?? "Charlotte MSA",
        category: input.category ?? "laboratory equipment repair",
        model: input.model,
      }),
    });
    const body = await response.json() as VendorSearchResponse;
    if (!response.ok || !body.vendors?.length) {
      return {
        vendors: fixtureVendors(),
        searchMode: body.searchMode ?? "fallback_fixtures",
        query: body.query ?? "",
        error: body.error ?? "Live search returned no vendors — showing demo list.",
      };
    }
    return {
      vendors: mapSearchVendors(body).slice(0, 5),
      searchMode: body.searchMode ?? "live",
      query: body.query ?? "",
    };
  } catch (reason) {
    return {
      vendors: fixtureVendors(),
      searchMode: "network_fallback",
      query: "",
      error: reason instanceof Error ? reason.message : "Search failed — showing demo vendors.",
    };
  }
}

export async function dialVendorOutbound(input: {
  toNumber: string;
  vendorName: string;
  scopeHash: string;
  scopeShortId: string;
  negotiationStyle?: string;
  accessToken?: string | null;
}): Promise<{ ok: boolean; error?: string; callId?: string; callSid?: string | null; provider?: string; message?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
  if (!supabaseUrl || !publishableKey) return { ok: false, error: "Supabase not configured." };

  const response = await fetch(`${supabaseUrl}/functions/v1/outbound-call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken ?? publishableKey}`,
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      toNumber: input.toNumber,
      vendorName: input.vendorName,
      scopeHash: input.scopeHash,
      scopeShortId: input.scopeShortId,
      negotiationStyle: input.negotiationStyle,
    }),
  });
  const body = await response.json().catch(() => ({})) as {
    ok?: boolean;
    error?: string;
    callId?: string;
    callSid?: string | null;
    provider?: string;
    message?: string;
  };
  if (!response.ok) return { ok: false, error: body.error ?? `Dial failed (${response.status})`, callId: body.callId };
  return {
    ok: true,
    callId: body.callId,
    callSid: body.callSid,
    provider: body.provider,
    message: body.message,
  };
}
