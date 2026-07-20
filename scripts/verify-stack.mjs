#!/usr/bin/env node
/**
 * Verify deployed BenchDial stack (app + Supabase edge functions).
 * Usage: node scripts/verify-stack.mjs
 * Optional env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, APP_URL
 */

const APP_URL = process.env.APP_URL ?? "https://hacknation-lemon.vercel.app";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://gnzxgxvzflkystgrcfbz.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const checks = [];

async function check(name, fn) {
  try {
    const result = await fn();
    checks.push({ name, ok: true, detail: result });
    console.log(`✓ ${name}${result ? ` — ${result}` : ""}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({ name, ok: false, detail: message });
    console.log(`✗ ${name} — ${message}`);
  }
}

await check("Production app loads", async () => {
  const response = await fetch(`${APP_URL}/?judge=1`, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes("BenchDial")) throw new Error("Missing BenchDial branding");
  return APP_URL;
});

await check("Health edge function", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/health`);
  const body = await response.json();
  if (!body.service) throw new Error("Invalid health response");
  return body.ok ? "all secrets + DB ready" : `partial — database=${body.database}, providers=${body.demo_providers}`;
});

await check("List vendors", async () => {
  const headers = ANON_KEY ? { apikey: ANON_KEY } : {};
  const response = await fetch(`${SUPABASE_URL}/functions/v1/list-vendors?region=Charlotte%20MSA`, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  return `${body.vendors?.length ?? 0} vendors (${body.source})`;
});

await check("Vendor search (live)", async () => {
  const headers = {
    "Content-Type": "application/json",
    ...(ANON_KEY ? { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } : {}),
  };
  const response = await fetch(`${SUPABASE_URL}/functions/v1/vendor-search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ region: "Charlotte MSA", category: "laboratory equipment repair" }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  return `${body.vendors?.length ?? 0} vendors · mode=${body.searchMode}`;
});

await check("Judge demo deep link", async () => {
  const response = await fetch(`${APP_URL}/?judge=1`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return "judge=1 reachable";
});

const failed = checks.filter((item) => !item.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed > 0 ? 1 : 0);
