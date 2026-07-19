# BenchDial — Negotiator readiness audit

Audit date: 2026-07-19

| Official requirement | Product evidence | Status |
|---|---|---|
| One vertical, closed loop | Laboratory repair: Estimator → Caller → Closer → Award Memo | Ready |
| Voice + one document type into one confirmed JSON specification | Voice intake control, service-report upload, conflict reconciliation, ScopePrint hash | Ready in product; live API configuration must be verified before recording |
| Three distinct negotiation styles | OEM/tough negotiator, hidden-fee independent, stonewalling provider | Product and fixtures ready; three genuine live sessions still required |
| Itemized comparable quotes | Call-out, parts, calibration, response, warranty, loaner/unknown state and terminal outcomes | Ready |
| Live negotiation changes price or terms because of leverage | Honesty Firewall + Concession Ledger + RapidBench demo scenario | Requires one genuine recorded concession |
| Honest AI disclosure and friction handling | Buyer prompt declares AI identity, refusal/callback/decline paths, no-bluff guardrails | Ready in prompt/product; demonstrate it in live recording |
| Ranked report citing evidence | Deterministic ranking, downtime calculation, transcript/evidence-facing Award Memo | Ready; live transcript receipt still required for live proof |

## Verified locally

- 20 automated tests passed.
- TypeScript production build passed.
- All five agent prompts passed the conservative prompt-size check.

## Submission blockers

1. Record three consenting live ElevenLabs conversations across the three provider styles.
2. Record one truthful leverage-caused change in price or terms.
3. Confirm the signed webhook stores the transcript, then capture the `RECORDED LIVE RUN` state.
4. Upload H.264 MP4 Demo, Tech, and Team videos, add a team picture, the live URL, and the required form answers from `SUBMISSION_COPY.md`.

Do not claim a simulated fixture was a real call. That honesty is part of the challenge and a central BenchDial differentiator.
