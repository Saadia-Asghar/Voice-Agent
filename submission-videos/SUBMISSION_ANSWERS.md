# Hack-Nation Event 6 — BenchDial submission answers

Copy-paste into the form. Challenge: **The Negotiator**.

## Yes — in context of the challenge PDF?

**Yes.** BenchDial is a Negotiator MVP for a phone-priced B2B vertical (laboratory equipment repair), matching the brief’s three mandatory modules:

| Challenge module | BenchDial |
|---|---|
| 01 Estimator (voice + document → confirmed job spec) | Scope Studio: ElevenLabs voice + service-report upload → ScopePrint |
| 02 Caller (≥3 styles, itemized quotes) | Call Room: OEM / hidden-fee / stonewaller |
| 03 Closer (negotiate + ranked evidence) | Deal Room + Award: leverage ledger, 30% red-flag, transcript receipts |

Same failures as movers (opaque pricing, unreliable estimates, no way to shop) — applied to lab repair.

---

## Quick fields

**Project Title**  
BenchDial — Voice Agents that Call, Compare, and Haggle for Lab Repair

**Event**  
hack-nation-event-6

**Challenge**  
Challenge 1 _ The Negotiator: Voice Agents that Call, Compare, and Haggle

**Project Team ID**  
HN-6590

**Short Description**  
BenchDial is an ElevenLabs voice negotiator for laboratory equipment repair: one confirmed ScopePrint from voice + documents, three provider calls with distinct negotiation styles, verified leverage (no invented bids), and a ranked award memo with transcript evidence.

**Live Project URL**  
https://hacknation-lemon.vercel.app

**GitHub Repository URL**  
https://github.com/Saadia-Asghar/Voice-Agent

**Technologies/Tags**  
ElevenLabs, React, TypeScript, Vite, Supabase, WebRTC, Voice Agents, Zod

**Additional Tags**  
The Negotiator, procurement, lab equipment, Honesty Firewall, ScopePrint, negotiation

**Your Account ID (team member)**  
2e8b7de8-922e-4c15-8637-e95f3c116edf

---

## 1. Problem & Challenge

Phone-priced markets hide the real cost until someone makes many calls. The same pattern that produces 5.6× quote spreads for movers shows up in lab repair: opaque pricing, incomplete sight-unseen estimates, and no efficient way to shop. When a centrifuge fails, labs pay twice—downtime and incomparable quotes that omit call-out, calibration, warranty, and response. BenchDial closes that gap for laboratory equipment repair under The Negotiator challenge: gather prices by voice, compare them fairly, and negotiate the best defendable deal.

## 2. Target Audience

Lab operations leads and facility managers (persona: Saadia at City Labs) who must restore shared instruments quickly without accepting a misleading lowball. Secondary: procurement and research ops teams that need auditable vendor conversations, not a polished dashboard of incomparable numbers.

## 3. Solution & Core Features

**01 Estimator** — ElevenLabs voice interview + service-report upload → one structured job spec; user confirms ScopePrint before any call.  
**02 Caller** — Same ScopePrint to three styles (tough OEM, hidden-fee independent, stonewaller); itemized outcomes: quote, negotiated quote, or documented decline; call-list provenance (Places / Yelp / OSM).  
**03 Closer** — Competing-bid leverage only after server verification (Honesty Firewall); 30% below-peer-median red flag; concession ledger; downtime-adjusted ranking; award memo with transcript receipts. Human approval required—BenchDial cannot purchase or bind.

## 4. Unique Selling Proposition (USP)

Not a quote form or aggregator scrape. Voice is the mechanism. ScopePrint forces identical job specs across vendors. The Honesty Firewall blocks invented inventory and fake competing bids outside the model. Provenance labels (LIVE / RECORDED LIVE RUN / SIMULATED FIXTURE) keep the demo honest. Ranking uses downtime-adjusted cost so the lowest headline is not automatically the win.

## 5. Implementation & Technology

React + TypeScript + Vite UI (Estimator → Caller → Closer → Award). ElevenLabs Agents for intake and Buyer/Closer WebRTC sessions. Supabase Auth gates billable live mode; Edge Functions mint conversation tokens and verify HMAC post-call webhooks; Postgres stores scopes, calls, transcripts, and audit events. Zod contracts + deterministic ranking/red-flag logic in TypeScript. Fixtures are labeled backups; live evidence requires signed webhook transcripts.

## 6. Results & Impact

End-to-end Negotiator MVP for a real phone-priced vertical: locked ScopePrint, three negotiation styles, structured endings, verified-leverage negotiation path, 30% red-flag rule, and an evidence-backed human award. Judges can walk the simulated flow without login; live ElevenLabs minutes unlock after sign-in. Impact: faster, fairer recovery decisions with receipts—not hope after two friendly phone quotes.

## Most fun moment

When the Honesty Firewall refused a bluff mid-demo—the agent wanted to cite a competing bid that wasn’t verified, the tool returned verified: false, and the call stayed honest. Watching a “failed” bluff become the trust feature was the best hackathon moment.

## Additional Information (optional)

Challenge mapping: Estimator (voice + document → confirmed JSON ScopePrint) → Caller (≥3 styles, itemized outcomes, discovery provenance) → Closer (leverage-caused term change path, ranked recommendation with transcripts). Vertical: laboratory equipment repair (B2B). Demo: https://hacknation-lemon.vercel.app · Repo: https://github.com/Saadia-Asghar/Voice-Agent

## Videos to upload

- Demo: `submission-videos/BenchDial-Demo.mp4`
- Tech: `submission-videos/BenchDial-Tech.mp4`
- Team: you still film yourself (~60s)
