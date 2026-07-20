const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const HASH_RE = /^sha256:[a-f0-9]{64}$/;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return Response.json({ error: "Persistence unavailable." }, { status: 500, headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!accessToken) return Response.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });

  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
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
    scopeHash?: string;
    scopeShortId?: string;
    specification?: Record<string, unknown>;
    scopeJson?: string;
    confirmedBy?: string;
  } | null;

  const scopeHash = input?.scopeHash?.trim();
  if (!scopeHash || !HASH_RE.test(scopeHash)) {
    return Response.json({ error: "Locked ScopePrint hash required." }, { status: 400, headers: corsHeaders });
  }
  if (!input?.specification || typeof input.specification !== "object") {
    return Response.json({ error: "Confirmed scope specification required." }, { status: 400, headers: corsHeaders });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const specification = {
    ...input.specification,
    scope_print: input.scopeShortId ?? null,
    canonicalHash: scopeHash,
    scopeJson: typeof input.scopeJson === "string" ? input.scopeJson : null,
    confirmedBy: input.confirmedBy ?? null,
  };

  const { data: scope, error } = await db.from("service_scopes").upsert({
    canonical_hash: scopeHash,
    version: Number(input.specification.version) > 0 ? Number(input.specification.version) : 1,
    confirmation_status: "confirmed",
    confirmed_at: new Date().toISOString(),
    specification,
  }, { onConflict: "canonical_hash" }).select("id,canonical_hash,confirmed_at").single();

  if (error || !scope) {
    return Response.json({ error: "Could not persist the locked ScopePrint." }, { status: 500, headers: corsHeaders });
  }

  return Response.json({
    scopeId: scope.id,
    canonicalHash: scope.canonical_hash,
    confirmedAt: scope.confirmed_at,
  }, { headers: corsHeaders });
});
