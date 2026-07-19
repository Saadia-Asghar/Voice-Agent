# ElevenLabs: The Negotiator — Challenge Source of Truth

Source reviewed in full: `1784382172163-01-ElevenLabs-The-Negotiator.docx.pdf` (6 pages).

This file is the product authority for BenchDial. If another plan, feature, or demo choice conflicts with this brief, this file wins.

## Page 1 — Challenge thesis

Build voice agents that call, compare, and haggle in a phone-priced market. The team selects the vertical, but the outcome is constant: gather prices by voice and help the user avoid overpaying.

## Page 2 — Problem and motivation

The reference case is consumer moving. Identical Rock Hill-to-Charlotte moving work produced quotes from $1,158 to $6,506, a 5.6x spread. The consumer would normally need to call five to eight small operators, repeat the same job description, interpret incompatible fee structures, and negotiate.

The three recurring market failures are:

1. Opaque pricing: comparable jobs receive radically different prices.
2. Unreliable estimates: incomplete or sight-unseen estimates are more likely to grow after commitment.
3. No efficient shopping process: fragmented small businesses expose prices one phone call at a time.

The permitted market is broad: B2C or B2B, including moving, medical bills, car buying, contractor bids, freight, equipment rental, or another provably painful phone-priced vertical.

## Page 3 — End-to-end challenge

The submission must be a working MVP that:

1. Gathers real prices by phone.
2. Reports the offers in comparable form.
3. Negotiates the best deal.

The vertical is configurable. Job taxonomy, benchmarks, red-flag rules, and negotiation levers should be configuration rather than hard-coded agent behavior.

### Module 1: The Estimator

The Estimator creates the complete structured job specification that prevents bait estimates.

Mandatory implementation:

- Voice interview built with ElevenLabs Agents.
- At least one document intake type, such as a photo, bill, quote, inventory list, or PDF.
- Both paths write to the same structured schema.
- Conflicts and missing information are resolved before confirmation.
- The user confirms the completed specification.
- The confirmed specification is reused verbatim in every provider call.

Strong submissions provide both voice and document intake; for this challenge, both are explicitly required.

## Page 4 — Caller, Closer, and conversation behavior

### Module 2: The Caller

The Caller may contact:

- Real businesses through Twilio or SIP.
- Humans role-playing different counterparties.
- Built counterparty agents in an agent-to-agent simulation.

Mandatory implementation:

- At least three live calls.
- At least three distinct negotiation styles.
- The identical confirmed specification is described in every call.
- The agent handles interruptions, evasive answers, refusals, and callbacks.
- Every quote is captured as structured comparable data.
- Fees are itemized.
- The demo explains where a real-world call list would come from.

Batch or parallel calling is encouraged, but not stated as mandatory.

### Module 3: The Closer

The Closer uses truthful competing bids, challenges fees, requests price matching or useful extras, and flags suspicious outliers. A quote at least 30% below its valid comparison market is a warning rather than an automatic win.

Mandatory implementation:

- At least one demonstrated negotiation.
- The price or terms measurably change during the call.
- The change occurs because of leverage gathered by the system, not a scripted concession.
- All quotes are ranked.
- The final recommendation cites transcript evidence.
- Recordings, complete transcripts, fee breakdowns, and a plain-language explanation are available.

### Four explicit conversation requirements

1. Representation and disclosure: the agent knows whom it represents, answers “are you a robot?” honestly, and does not lose the interaction unnecessarily.
2. Friction handling: latency, interruption, barge-in, vague answers, and multitasking are handled like a serious buyer.
3. Honesty boundary: competing quotes may be used only when they exist; inventory, bids, job facts, and authority must never be invented.
4. Structured endings: every call ends as an itemized quote, callback commitment, or documented decline—never an unstructured approximate result.

The demo must play calls and explicitly point out these four behaviors.

## Page 5 — Suggested resources

### Voice infrastructure

- ElevenLabs Agents Platform for prompts, tools, knowledge bases, transfers, and human handoff.
- Twilio or SIP for outbound phone calls when using real businesses.
- Batch calling or parallel sessions for scale.
- Agent tools or MCP for structured quote logging, benchmark lookup, and backend writes.

### Market and pricing data

- Google Places, Yelp Fusion, or OpenStreetMap for business discovery and call-list provenance.
- Vertical-specific benchmarks such as FMCSA/moveBuddha, FAIR Health, hospital transparency files, RepairPal, KBB, or published rate cards.
- Vision/OCR for extracting the user's existing documents into the same schema used by voice intake.

### Counterparty and evaluation design

- Real businesses, consenting role-playing humans, built counter-agents, or a valid mix.
- Several negotiation types must be covered.
- Golden calls and evaluation sets should verify fee extraction and the 30%-below-market warning.

## Pages 5–6 — Strong versus weak submissions

### Strong

- A real live negotiation in which gathered leverage causes a measurable change.
- A vertical with provable price spread and comparable, itemized offers.
- A closed loop: intake → calls → negotiation → ranked evidence-backed recommendation.
- Honest handling of AI disclosure, refusals, hang-ups, missing data, and other failure modes.
- Conversation design that produces usable outcomes under friction.

### Weak

- Counter-agents reading a predetermined screenplay.
- A stylish vertical without comparable quotes or demonstrated pain.
- A polished fragment rather than a connected workflow.
- An over-engineered agent architecture with weak call behavior.
- Bluffing about inventory, bids, facts, or authority.

## Page 6 — Seven submission gates

A submission is complete only when every gate passes:

- [ ] One vertical works end to end from intake through recommendation.
- [ ] Voice interview and at least one document type produce one confirmed structured specification reused verbatim across all calls.
- [ ] At least three live calls demonstrate distinct negotiation styles, comparable structured quotes, and itemized fees.
- [ ] At least one price or term changes measurably because of genuinely gathered leverage.
- [ ] AI disclosure, honesty, and friction handling work without invented facts or bids.
- [ ] Every call ends with an itemized quote, callback commitment, or documented decline.
- [ ] The final report ranks every quote, cites recordings and transcripts, and explains the recommendation plainly.

## BenchDial interpretation

BenchDial uses laboratory equipment repair as the chosen B2B vertical. The challenge concepts map as follows:

- Estimator: instrument, fault, location, urgency, calibration, access, and required deliverables.
- Document intake: service report or existing repair quote parsed into the same scope schema.
- Caller: three consenting simulated service providers with distinct behaviors.
- Closer: verified competing service terms used to improve callout price, response time, warranty, calibration, or loaner coverage.
- Red flags: unusually low but incomplete offers, missing calibration, excluded travel/callout, uncertain parts, weak warranty, or non-comparable turnaround.
- Final report: cash cost, downtime-adjusted effective cost, unknowns, concessions, transcript/audio evidence, and a human-approved recommendation.

## Non-negotiable demo provenance

Each call must be labeled `LIVE`, `RECORDED LIVE RUN`, or `SIMULATED FIXTURE`. Only a genuine consenting live session can satisfy the mandatory live-call and live-negotiation gates. Fixtures are development and presentation backups only.
