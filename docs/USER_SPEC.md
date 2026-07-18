# BenchBid User and UX Specification

## Persona: Saadia, laboratory operations lead

Saadia manages several shared instruments. A centrifuge failure blocks experiments. She has a service report but does not know whether each provider's quote includes calibration, travel, or a useful warranty.

## User story

> I want to describe the repair once, have providers quote the same scope, and understand the total operational trade-off so I can restore the instrument without approving a misleading lowball offer.

## Information architecture

1. Scope
2. Call Room
3. Deal Room
4. Award Memo

## Screen specifications

### Scope

- Instrument identity and fault summary.
- Voice-intake control and document upload.
- Evidence-backed extracted fields.
- Missing-information questions.
- Negotiation boundaries.
- Confirm-and-lock action.

### Call Room

- Three provider cards.
- Live status, elapsed time, waveform indicator, and latest transcript line.
- Structured fields appearing as captured.
- Explicit outcome badge: quote, callback, decline, or incomplete.
- AI-disclosure indicator.

### Deal Room

- Comparable line-item matrix.
- Scope-match and exclusions.
- Headline versus effective-cost scenario.
- Unresolved questions.
- Negotiation authorization and target selection.
- Concession Ledger.

### Award Memo

- Recommended provider or abstention.
- Cash and downtime assumptions.
- Why it won.
- Risks and missing information.
- Audio/transcript evidence.
- Export and human approval controls.

## UX principles

- Show the consequence before the mechanism.
- Use a table for comparable terms, a timeline for concessions, and prose for recommendation.
- Never hide unknown fields behind a score.
- Keep the agent's speech concise; vendors should not wait through narration.
- Always show who is speaking, who the agent represents, and what authority it has.
- Use motion only for live status and material state changes.

## Accessibility

- Keyboard-complete navigation.
- Visible focus.
- Text labels in addition to color.
- Live-region announcements for call completion and concessions.
- Transcript alternative for all audio.
- Pause/stop controls for animations and playback.
