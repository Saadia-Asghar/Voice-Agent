# Database setup — everything verified & protected

Use this when you **add data to Supabase** and need to confirm **RLS, payloads, mapping, and SQL** all work before judges try live calls.

**Project ref (yours):** `gnzxgxvzflkystgrcfbz`  
**Dashboard:** https://supabase.com/dashboard/project/gnzxgxvzflkystgrcfbz

---

## What each piece means (plain English)

| Term | What it is in BenchDial |
|------|-------------------------|
| **RLS** (Row Level Security) | Browser users **cannot** read/write evidence tables directly. Only Edge Functions with the **service role** can. |
| **API auth** | `elevenlabs-token` checks JWT or anon key. `call-tools` needs `BENCHBID_TOOL_SECRET`. Webhook needs HMAC signature. |
| **Payload validation** | Every agent tool body is checked with **Zod** before anything hits Postgres (`call-tools`, `guardrails.ts`). |
| **Quality checks** | SQL `CHECK` constraints (e.g. `scope_match` 0–100, non-negative hours). Guardrails block fake leverage and bad numbers. |
| **Mapping** | Live call results map JSON → `quotes`, `transcript_evidence`, `concessions`, `audit_events`. UI reads via `status` action. |
| **SQL files** | `supabase/migrations/*.sql` — run these in order. |

---

## Step 1 — Apply SQL migrations

In Supabase Dashboard → **SQL Editor**, run each file **in order**:

1. `supabase/migrations/202607190001_benchbid_core.sql` — tables, enums, indexes, **RLS on all 8 tables**, revoke anon access  
2. `supabase/migrations/202607200001_seed_demo_providers.sql` — OEM Precision, RapidBench, MetroLab Field  
3. `supabase/migrations/202607200002_approved_vendors.sql` — approved vendor list for discovery UI  

Or with CLI (after `npx supabase login`):

```powershell
cd D:\hp2\Documents\hacknation
npx supabase link --project-ref gnzxgxvzflkystgrcfbz
npx supabase db push
npm run deploy:supabase
npm run verify:stack
```

### Verify RLS (run in SQL Editor)

```sql
-- Should return 8 rows, all rls_enabled = true
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'service_scopes','providers','calls','webhook_events',
    'quotes','transcript_evidence','concessions','audit_events'
  );

-- Should return 3 demo providers
select display_name, negotiation_style, is_consented_demo_counterparty
from public.providers
order by display_name;
```

---

## Step 2 — Edge Function secrets

Supabase Dashboard → **Project Settings → Edge Functions → Secrets** (or CLI `supabase secrets set`):

| Secret | Used by |
|--------|---------|
| `ELEVENLABS_API_KEY` | Token minting |
| `ELEVENLABS_BUYER_AGENT_ID` | Live Call Room |
| `ELEVENLABS_INTAKE_AGENT_ID` | Scope Studio voice |
| `ELEVENLABS_WEBHOOK_SECRET` | Webhook HMAC verify |
| `ELEVENLABS_AGENT_PHONE_NUMBER_ID` | Outbound PSTN via ElevenLabs↔Twilio (from ElevenLabs Phone Numbers tab) |
| `TAVILY_API_KEY` | Live vendor web search (optional — keyless fallback exists) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | Twilio REST outbound fallback |
| `BENCHBID_TOOL_SECRET` | `call-tools` (long random string) |
| `SUPABASE_URL` | Auto-injected |
| `SUPABASE_ANON_KEY` | Auto-injected |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected |
| `OPENAI_API_KEY` | `extract-scope` (optional) |

Add to `.env.local` for the front end:

```
VITE_SUPABASE_URL=https://gnzxgxvzflkystgrcfbz.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_ELEVENLABS_BUYER_AGENT_ID=<buyer agent id>
VITE_ELEVENLABS_INTAKE_AGENT_ID=<intake agent id>
```

---

## Step 3 — Deploy Edge Functions

```powershell
cd D:\hp2\Documents\hacknation
npm run deploy:supabase
```

Or deploy individually:

```powershell
npx supabase functions deploy elevenlabs-token --project-ref gnzxgxvzflkystgrcfbz
npx supabase functions deploy elevenlabs-webhook --project-ref gnzxgxvzflkystgrcfbz --no-verify-jwt
npx supabase functions deploy call-tools --project-ref gnzxgxvzflkystgrcfbz --no-verify-jwt
npx supabase functions deploy extract-scope --project-ref gnzxgxvzflkystgrcfbz
npx supabase functions deploy persist-scope --project-ref gnzxgxvzflkystgrcfbz
npx supabase functions deploy health --project-ref gnzxgxvzflkystgrcfbz --no-verify-jwt
npx supabase functions deploy list-vendors --project-ref gnzxgxvzflkystgrcfbz --no-verify-jwt
npx supabase functions deploy vendor-search --project-ref gnzxgxvzflkystgrcfbz --no-verify-jwt
npx supabase functions deploy outbound-call --project-ref gnzxgxvzflkystgrcfbz
npx supabase functions deploy twilio-status --project-ref gnzxgxvzflkystgrcfbz --no-verify-jwt
```

### Outbound dial setup (one-time)

1. In Twilio: buy/verify a voice number → put SID, auth token, and From number in Supabase secrets.
2. Preferred: In ElevenLabs → Phone Numbers → import that Twilio number → copy the phone number ID → set `ELEVENLABS_AGENT_PHONE_NUMBER_ID`.
3. Assign your Buyer agent to that number.
4. In the app: **Search again** → pick a dialable shop → **Dial vendor**.


`--no-verify-jwt` on webhook + call-tools is **intentional** — they use HMAC / shared secret instead of browser JWT.

---

## Step 4 — ElevenLabs webhook URL

In ElevenLabs agent workspace → **Webhooks**:

- URL: `https://gnzxgxvzflkystgrcfbz.supabase.co/functions/v1/elevenlabs-webhook`
- Events: post-call transcription, post-call audio, call initiation failure
- Secret: same value as `ELEVENLABS_WEBHOOK_SECRET`

Wire Buyer agent tools to `call-tools` with header `x-benchbid-tool-secret: <BENCHBID_TOOL_SECRET>`.

---

## Step 5 — Verify payload protection (local tests)

```powershell
pnpm test
```

This runs `guardrails.test.ts` — confirms quote/callback/decline payloads reject bad data.

---

## Step 6 — Verify live path (you try)

1. Open https://hacknation-lemon.vercel.app/?judge=1  
2. **Start live call** on one vendor → allow mic  
3. End call → wait ~30s → **Confirm call**  
4. In Supabase **Table Editor**, check:

| Table | What you should see |
|-------|---------------------|
| `service_scopes` | One row, `confirmation_status = confirmed`, `canonical_hash` like `sha256:...` |
| `calls` | Row with `provenance = LIVE`, then `lifecycle = completed` after webhook |
| `webhook_events` | Row with `dedupe_key` for the conversation |
| `quotes` | Row if agent called `record_outcome` with a quote |
| `transcript_evidence` | Rows if agent recorded evidence |
| `audit_events` | `session_proof_created`, maybe `terminal_outcome_recorded` |

If `calls.lifecycle` stays `initiating` → webhook URL or secret is wrong.  
If **Confirm call** says “Still saving…” → wait for webhook, then retry.

---

## What is protected (summary)

```
Browser (anon/authenticated)
    ↓  only Edge Functions
elevenlabs-token  → validates scope hash, mints token, creates call + proof
elevenlabs-webhook → HMAC verify, idempotent ledger, updates transcript
call-tools        → Zod payload, leverage verify, single terminal outcome
extract-scope     → auth header, returns fields only (no direct DB writes)
    ↓  service role only
PostgreSQL (RLS on, anon revoked)
```

**Nothing sensitive is exposed to the browser.** Quotes, transcripts, and concessions stay server-side until `status` returns verified data after webhook.

---

## Quick checklist (print this)

- [ ] Both SQL migrations applied  
- [ ] 8 tables show RLS enabled  
- [ ] 3 demo providers seeded  
- [ ] All secrets set in Supabase  
- [ ] 4 edge functions deployed  
- [ ] ElevenLabs webhook configured  
- [ ] `pnpm test` passes  
- [ ] One live call → row in `calls` + `webhook_events`  
- [ ] Confirm call → quote/evidence in UI (optional)  

When all checked, judges can try live voice in real time with verified persistence.
