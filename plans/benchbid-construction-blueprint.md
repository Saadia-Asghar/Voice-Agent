# BenchBid Construction Blueprint

## Objective

Ship a reliable Hack-Nation ElevenLabs submission that converts voice/document intake into one confirmed laboratory-service scope, conducts three distinct voice negotiations, normalizes quotes, proves a real concession, and produces an evidence-linked award recommendation.

## Invariants

- Voice is the mechanism of intake and negotiation, not decoration.
- Every vendor receives the same confirmed scope.
- Unknown fees remain unknown; they never default to zero.
- The agent cannot invent competing offers or accept a deal without authority.
- Every extracted quote field and concession links to transcript evidence.
- The golden demo remains runnable with consenting simulated counterparties.

## Dependency graph

```text
1 Product contracts
├── 2 Demo UI and deterministic engine
├── 3 Intake adapters
└── 4 ElevenLabs conversation adapters
    └── 5 Post-call evidence pipeline
        └── 6 Negotiation and evaluation harness
            └── 7 Deployment, video, and finalist pitch
```

## Execution override - prove the vertical slice first

The operational order is: repository verification, ElevenLabs vertical spike, canonical contracts, Supabase foundation, Estimator, Caller/Closer, evidence Deal Room, then deployment and submission. Do not continue UI polish until one real consenting session proves this transport:

- A browser conversation starts and ends with a structured status.
- An authenticated tool call reaches a Supabase Edge Function.
- The post-call webhook is signature-verified and idempotently stored.
- Transcript and audio are retrievable and linked to the call record.
- The browser-to-agent/counterparty topology is documented and reproducible.

The selected architecture is Vite React, Supabase Postgres/Storage/Edge Functions, the ElevenLabs browser conversation SDK, and server-side OpenAI document extraction. Fixtures are development and presentation backups only. Every session displays exactly one provenance label: `LIVE`, `RECORDED LIVE RUN`, or `SIMULATED FIXTURE`. A fixture never satisfies a mandatory live criterion.

Quote totals use explicit inclusion semantics (`included`, `additional`, `excluded`, or `unknown`). A package total is never added to components already included in it. Material unknowns remain unknown and can force the recommender to abstain.

## Step 1 - Product contracts and acceptance matrix

Context: The challenge requires Estimator, Caller, and Closer modules. Create a single canonical schema shared by voice intake, documents, calls, and reporting.

Tasks:

- Write PRD, TRD, user specification, data contracts, and API/key map.
- Define `ServiceScope`, `ServiceQuote`, `TranscriptEvidence`, and `Concession`.
- Map every PDF requirement to an executable acceptance test.

Verification: every mandatory brief requirement appears in `docs/REQUIREMENTS_TRACEABILITY.md` with a demo proof.

Rollback: documentation-only; revert files.

## Step 2 - Demo UI and deterministic engine

Context: Build the complete state transition with fixtures before adding external services.

Tasks:

- Implement Scope, Call Room, Deal Room, and Award Memo screens.
- Implement effective-cost scenarios, scope completeness, quote ranking, and concession timeline.
- Include three distinct counterparty fixtures and explicit incomplete information.

Verification: production build succeeds; domain tests cover totals and ranking.

Rollback: keep documentation and remove application scaffold.

## Step 3 - Intake adapters

Context: The voice interview and document upload must produce the same confirmed service specification.

Tasks:

- Add ElevenLabs intake-agent session.
- Add OpenAI structured extraction for image/PDF evidence.
- Validate both paths with the same Zod schema.
- Add correction and confirmation gate; compute the canonical scope hash server-side.

Verification: voice fixture and document fixture produce schema-valid scope; a correction updates the confirmed scope.

Rollback: retain fixture intake behind a feature flag.

## Step 4 - ElevenLabs conversation adapters

Context: The demo needs three live conversations and structured outcomes.

Tasks:

- Configure buyer agent and three counterparty agents.
- Add tools for quote fields, outcomes, leverage checks, concessions, and ending calls.
- Implement AI disclosure and human-approval boundaries.
- Use consenting simulated counterparties for the golden demo.

Verification: each style reaches quote, callback, or decline; a tool call is received and authenticated.

Rollback: use stored golden-call fixtures while preserving live-call UI.

## Step 5 - Post-call evidence pipeline

Context: The report must cite recordings and transcript evidence.

Tasks:

- Verify webhook signatures.
- Store transcription, audio reference, analysis, and metadata.
- Normalize quote fields without turning missing values into zero.
- Link every material field to audio/transcript timestamps.

Verification: clicking a quote field opens the supporting transcript segment.

Rollback: store transcript fixtures locally for demo continuity.

## Step 6 - Negotiation and evaluation harness

Context: Judges must see price or terms change because of real leverage, plus evidence that behavior is reliable.

Tasks:

- Implement private counterparty floors and bounded concession policies.
- Require `checkLeverage` before citing a competing quote.
- Add repeated ElevenLabs scenario, tool, and simulation tests.
- Report pass rates for disclosure, honesty, itemization, boundaries, and structured outcomes.

Verification: at least one live concession; blocked bluff; no unauthorized acceptance; repeated tests meet the target threshold.

Rollback: disable randomized parameters and use a deterministic validated scenario.

## Step 7 - Deployment and submission

Context: The initial screening and three-minute finalist pitch require different assets.

Tasks:

- Deploy frontend and backend.
- Record a 90-second golden demo and a backup capture.
- Prepare README, architecture, risk note, and test evidence.
- Prepare three-minute finalist pitch: pain, live change, technical proof, venture path.

Verification: incognito run on a second device; no secrets in repository or video; all links work.

Rollback: static hosted demo plus recorded video.

## Plan mutation protocol

- If live voice cannot produce a transcript and tool call within 90 minutes, stop feature work and debug the vertical spike. A fixture may keep the presentation usable but cannot be reported as challenge completion.
- If a feature threatens the golden loop, cut it before reducing evidence quality.
- New work must identify which acceptance criterion it improves; otherwise defer it.

## Final executable gates

- Gate A: the repository boots from README on a fresh machine.
- Gate B: one real session, authenticated tool call, verified webhook, transcript, and audio round trip.
- Gate C: voice and document evidence merge into one confirmed, versioned scope.
- Gate D: three consenting sessions receive the identical scope hash and reach structured outcomes.
- Gate E: every material comparison field is evidenced or visibly unverified.
- Gate F: the Closer obtains one genuine before/after concession using backend-validated leverage.
- Gate G: tests prevent fabricated leverage, unauthorized acceptance, duplicate events, and unknown-as-zero math.
- Gate H: incognito deployment run, backup recording, deletion test, secret scan, and traceability review.

## Anti-patterns

- Generic chatbot or generic “call anyone” positioning.
- Scripted dialogue with predetermined concessions.
- Ranking headline prices without normalizing scope.
- Hiding missing quote fields.
- Calling random businesses without consent.
- More than one vertical during the hackathon.
- Multi-agent diagrams without observable responsibility boundaries.
