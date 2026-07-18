# BenchBid

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

## Documentation

- `docs/PRD.md`
- `docs/TRD.md`
- `docs/USER_SPEC.md`
- `docs/REQUIREMENTS_TRACEABILITY.md`
- `plans/benchbid-construction-blueprint.md`
- `ELEVENLABS_WINNING_STRATEGY.md`

## Safety

The golden demo uses consenting simulated counterparties. BenchBid cannot purchase, accept, or bind a service contract. Do not commit API keys or Hack-Nation redemption links.
