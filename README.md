# BenchBid

> Build authority: [ElevenLabs challenge source of truth](docs/ELEVENLABS_CHALLENGE_SOURCE_OF_TRUTH.md). Every implementation and demo decision must pass its seven submission gates.

BenchBid is a voice procurement agent for laboratory-equipment service. It converts voice and document intake into a confirmed service scope, collects comparable provider quotes, negotiates verified concessions, and produces an evidence-linked award memo.

## Current state

The repository contains the challenge traceability documents, product and technical specifications, construction blueprint, deterministic quote economics, fixtures for three negotiation styles, and the first responsive Deal Room interface.

## Run locally

```bash
pnpm install
pnpm dev
```

## Verify

```bash
pnpm test
pnpm build
```

## Live ElevenLabs intake

1. Create the Estimator agent from `elevenlabs/intake-agent.md`.
2. Create a Supabase project and run `supabase db push`.
3. Add `ELEVENLABS_API_KEY` and `ELEVENLABS_INTAKE_AGENT_ID` as Supabase function secrets.
4. Deploy with `supabase functions deploy elevenlabs-token` and `supabase functions deploy elevenlabs-webhook --no-verify-jwt`.
5. Copy `.env.example` to `.env.local` and fill the public `VITE_` values.
6. Open Scope and start the live interview. The ElevenLabs API key remains server-side.

The live slice uses ElevenLabs WebRTC conversation tokens. The webhook function verifies the current `ElevenLabs-Signature` HMAC contract, rejects stale signatures, records events idempotently, and persists transcripts/analysis server-side. Configure its public URL as an ElevenLabs post-call webhook and keep `ELEVENLABS_WEBHOOK_SECRET` in Supabase secrets. Fixture sessions never count as live challenge evidence.

## Lovable

Connect Lovable to this repository and paste [the guarded BenchBid prompt](docs/LOVABLE_PROMPT.md). Review its Git changes before merging. It must not replace the domain contracts or fabricate live states.

## Documentation

- `docs/PRD.md`
- `docs/TRD.md`
- `docs/USER_SPEC.md`
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `docs/LOVABLE_PROMPT.md`
- `plans/benchbid-construction-blueprint.md`
- `ELEVENLABS_WINNING_STRATEGY.md`

## Safety

The golden demo uses consenting simulated counterparties. BenchBid cannot purchase, accept, or bind a service contract. Do not commit API keys or Hack-Nation redemption links.
