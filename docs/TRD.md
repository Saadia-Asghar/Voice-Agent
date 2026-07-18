# BenchBid Technical Requirements Document

## Architecture

```text
React application
  -> API layer
     -> scope service
     -> quote normalization service
     -> negotiation policy service
     -> evidence service
  -> provider adapters
     -> ElevenLabs Agents
     -> OpenAI structured extraction
     -> Tavily vendor discovery
  -> persistence
     -> Supabase/Postgres
     -> object storage for permitted demo audio
```

## Initial stack

- React 19, TypeScript, Vite.
- Plain CSS design tokens for the first slice; component library may be introduced later.
- Vitest for domain logic.
- Future API: TypeScript server routes or FastAPI, selected after deployment target is fixed.
- Supabase for persisted scopes, calls, quotes, concessions, and audit events.

## Environment variables

```text
ELEVENLABS_API_KEY
ELEVENLABS_INTAKE_AGENT_ID
ELEVENLABS_BUYER_AGENT_ID
ELEVENLABS_VENDOR_OEM_AGENT_ID
ELEVENLABS_VENDOR_INDEPENDENT_AGENT_ID
ELEVENLABS_VENDOR_STONEWALLER_AGENT_ID
ELEVENLABS_WEBHOOK_SECRET
OPENAI_API_KEY
TAVILY_API_KEY
TWILIO_ACCOUNT_SID          # optional for real telephony
TWILIO_AUTH_TOKEN           # optional for real telephony
TWILIO_PHONE_NUMBER         # optional for real telephony
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

No credential or Hack-Nation redemption link may be committed.

## Core entities

- `ServiceScope`: confirmed instrument and service requirements.
- `Provider`: counterparty identity and permitted contact context.
- `CallSession`: live/completed state and structured outcome.
- `ServiceQuote`: normalized commercial and operational terms.
- `TranscriptEvidence`: exact source for a field or concession.
- `Concession`: before/after material term with evidence.
- `AuditEvent`: confirmation, correction, leverage check, or approval.

## API surface

```text
POST /api/intake/document
POST /api/scopes
PATCH /api/scopes/:id
POST /api/scopes/:id/confirm
POST /api/calls
POST /api/calls/:id/tools/quote-field
POST /api/calls/:id/tools/outcome
POST /api/calls/:id/tools/check-leverage
POST /api/calls/:id/tools/concession
POST /api/webhooks/elevenlabs/post-call
GET  /api/scopes/:id/comparison
GET  /api/scopes/:id/award-memo
```

## Deterministic rules

- Missing numeric values remain `null` and add uncertainty.
- Cash total sums mandatory known charges only and is labeled partial when fields are unknown.
- Effective-cost scenarios add explicit user-provided downtime and excluded required services.
- Scope match compares required deliverables and disclosed exclusions.
- Recommendation logic must expose every weighted input and may abstain when quotes are incomparable.

## Security

- Verify ElevenLabs webhook HMAC/signature according to the current provider contract.
- Validate tool parameters with schemas.
- Rate-limit public call-initiation endpoints.
- Allowlist outbound demo destinations.
- Store minimal audio and delete on request.
- Do not log API keys, full authorization headers, or private counterparty policies.

## Observability

- Correlation ID across scope, call, tool event, and webhook.
- Latency for first response, tool calls, and post-call processing.
- Structured failures: initiation, disconnect, extraction, validation, and incomplete outcome.
- Demo health endpoint and fixture fallback indicator.
