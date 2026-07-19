# BenchQuote Product Requirements Document

## Product statement

BenchQuote is an AI voice procurement agent for laboratory-equipment service. It creates a confirmed repair scope from voice and documents, contacts providers with the identical scope, extracts comparable offers, negotiates material terms with verified leverage, and recommends a deal with audio and transcript receipts.

## Target user

Primary: a laboratory manager, research operations lead, or principal investigator responsible for restoring a critical instrument.

Secondary: university procurement or finance reviewer who needs an auditable award rationale.

## Problem

Service providers quote different scopes. A low headline price may exclude travel, diagnostics, parts, calibration, warranty, or timely response. Laboratory staff repeat the same description by phone and cannot reliably compare the results.

## Jobs to be done

- When an instrument fails, help me describe it once and verify the scope.
- Contact several providers without making me repeat the story.
- Reveal omissions and incomparable assumptions.
- Negotiate price and operational terms without bluffing.
- Give me a recommendation I can defend to procurement.

## MVP journey

1. User starts a voice interview or uploads a synthetic service report/quote.
2. BenchQuote creates one structured scope with evidence and uncertainty.
3. User corrects and confirms the scope.
4. BenchQuote conducts three distinct consenting voice conversations.
5. Quote fields populate live; every call ends with quote, callback, or decline.
6. BenchQuote normalizes scope and computes transparent cost scenarios.
7. User authorizes a negotiation boundary.
8. The closer cites only verified offers and obtains a material concession.
9. BenchQuote produces an award memo with recordings and transcript citations.

## Functional requirements

### Estimator

- ElevenLabs voice intake.
- At least one document type.
- Shared scope schema for both paths.
- Source evidence and confidence/unknown state.
- User correction and explicit confirmation.

### Caller

- Three distinct negotiation styles.
- Consistent scope for every provider.
- Interruption, evasion, AI-disclosure, and callback handling.
- Itemized quote extraction during or immediately after the call.
- Structured terminal status.

### Closer

- Verified competing offer as leverage.
- No fabricated facts.
- At least one measurable price or term change.
- Ranked comparison with effective-cost assumptions.
- Full recording, transcript, and evidence links.

## Non-functional requirements

- Golden demo completes in under four minutes.
- UI remains usable if live search is unavailable.
- All currency math is deterministic.
- Private keys remain server-side.
- Webhook signatures are verified.
- Keyboard-visible focus and non-color status labels.
- No purchase acceptance without explicit human authority.

## Success metrics

- 100% calls end with structured status.
- 95%+ required quote-field extraction on the golden evaluation set.
- 100% competing-offer claims backed by recorded evidence.
- 0 unauthorized acceptances.
- At least one verified material concession.
- User can identify why the recommended quote won in under 15 seconds.

## Out of scope

- Real purchasing or payment.
- Unsolicited cold calling in the golden demo.
- Multiple procurement verticals.
- Binding legal or service contracts.
- Automated laboratory or safety diagnosis.
