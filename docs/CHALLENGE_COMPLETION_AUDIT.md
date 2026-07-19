# ElevenLabs Negotiator Challenge Completion Audit

## Implemented and deployed

| Challenge gate | Production evidence |
|---|---|
| One vertical end to end | Laboratory repair: Scope Studio → Call Room → Deal Room → Award Memo |
| Voice and document intake share one specification | Live ElevenLabs Estimator, PDF/image upload, conflict resolution, confirmation gate, ScopePrint hash |
| Three distinct call styles | Three live Buyer/Closer lanes plus OEM, hidden-fee, and stonewalling counterparty configurations |
| Measurable leverage-caused change | Honesty Firewall, exact competing-term verification, and Concession Ledger |
| AI disclosure and no bluffing | Agent prompts, visible disclosure evidence, server-side leverage rejection, no purchase authority |
| Structured endings | Quote, callback commitment, decline, incomplete outcome enum and persistence |
| Ranked evidence-backed recommendation | Deterministic effective-cost ranking, transcript receipts, printable human-reviewed Award Memo |

## Live infrastructure proof

- Supabase project: `MIT hackathon / BenchBid`
- Database migration applied with RLS and server-only evidence tables.
- Deployed Edge Functions: `elevenlabs-token`, `elevenlabs-webhook`, `call-tools`.
- Five ElevenLabs agents: Estimator, Buyer/Closer, OEM, RapidBench, MetroLab Field.
- Workspace HMAC post-call webhook enabled for transcript and call-initiation-failure events.
- Vercel production embeds the correct Supabase URL, anon key, Estimator ID, and Buyer ID.
- Estimator conversation-token request returns HTTP 200.
- Call Room exposes three live controls and retains explicitly labeled fixture fallbacks.
- Each live session receives a server-created evidence record and one-time proof. The browser binds the ElevenLabs conversation ID on connection; `RECORDED LIVE RUN` appears only after the signed post-call webhook stores a non-empty transcript.
- The live Buyer agent now has the hardened `# Guardrails` prompt plus active ElevenLabs Focus and Prompt Injection protections. Deterministic adversarial contract tests pass three consecutive runs.

## Evidence still requiring a human voice

Software configuration cannot manufacture the challenge's mandatory live evidence. Before submission, a consenting human must complete three Buyer/Closer sessions in the three provider lanes, speaking as each counterparty style. At least one session must respond to truthful verified leverage with a measurable change. The webhook will then persist the genuine conversation IDs and transcripts, allowing the UI to label those lanes `RECORDED LIVE RUN`.

Never mark a fixture as live and never submit generated fixture transcripts as the three mandatory calls.

## Current deployment handoff

The repository contains stricter `call-tools` validation for complete itemized quotes, dated callback commitments, documented declines, finite commercial numbers, single terminal outcomes, measurable concessions, and same-call transcript evidence. Deploy this function after authenticating the Supabase CLI:

```powershell
npx supabase login
npx supabase functions deploy call-tools --project-ref gnzxgxvzflkystgrcfbz --no-verify-jwt
```

`--no-verify-jwt` is intentional for this internal ElevenLabs webhook tool because it authenticates with `BENCHBID_TOOL_SECRET` instead of a browser JWT.
