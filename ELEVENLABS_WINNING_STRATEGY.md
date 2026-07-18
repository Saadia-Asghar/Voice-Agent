# BenchBid: ElevenLabs Negotiator Winning Strategy

Generated: 19 July 2026  
Scope: Hack-Nation Challenge 01, The Negotiator  
Recommendation confidence: High for challenge interpretation; medium for competitor completeness; low for private Discord coverage.

## Executive decision

Build **BenchBid**, a voice procurement agent for laboratory-equipment repair and service.

BenchBid turns an instrument photo, service report, or existing quotation into a confirmed service specification; calls three service providers with the identical scope; obtains itemized, comparable offers; negotiates price, response time, warranty, loaner equipment, calibration documentation, and parts terms; and returns an evidence-linked recommendation.

The central product insight is that the cheapest repair quote can be the most expensive after downtime, call-out charges, excluded calibration, and weak warranty are included.

The winning demo should prove one connected loop:

```text
instrument evidence -> confirmed scope -> three live conversations
-> comparable quotes -> genuine concession -> evidence-backed award recommendation
```

## Why this vertical

Generic voice negotiation is crowded. Previous ElevenLabs winners already include Dealwise, which researches and calls local businesses for quotes; Procuro, which calls suppliers for delayed parts; and newer procurement products that call suppliers. Wedding negotiation also has a dedicated product, RSVP'd. Car buying, moving, and general home services have multiple hackathon implementations.

Laboratory-equipment service is narrower and more technically defensible. A useful negotiation includes more than headline price:

- call-out charge;
- diagnostic fee;
- labor rate and estimated hours;
- parts and shipping;
- response-time SLA;
- repair turnaround;
- warranty;
- calibration certificate;
- loaner instrument;
- cancellation terms;
- quote validity;
- payment schedule.

It also creates a natural MIT-oriented story: scientific teams should spend time running experiments, not repeatedly explaining the same broken instrument to service vendors.

## Challenge compliance matrix

| Brief requirement | BenchBid implementation | Demo evidence |
|---|---|---|
| Voice intake using ElevenLabs | Intake agent interviews the lab manager | Live intake conversation |
| At least one document type | Instrument photo plus service PDF/quote | Uploaded synthetic document |
| Same structured job specification | Both paths write `ServiceScopeV1` | JSON review screen |
| User confirms specification | Editable confirmation gate | Correct one extracted field |
| At least three negotiation styles | Transparent OEM, hidden-fee independent shop, stonewaller | Three live agent-to-agent sessions |
| Comparable itemized quotes | Canonical quote schema | Side-by-side comparison |
| Real negotiation | Closer uses an actual recorded competing offer | Price or term changes live |
| Transcript evidence | Each extracted field links to timestamp | Click-to-play evidence |
| AI disclosure | Agent identifies itself as an AI procurement assistant | Test transcript |
| Honest leverage | Evidence firewall permits only confirmed facts and recorded offers | Blocked-bluff test |
| Structured call ending | Quote, callback, or documented decline | Status for every call |
| Ranked recommendation | Risk-adjusted total plus evidence and uncertainty | Award recommendation screen |

## Product design

### 1. ScopePrint

The intake produces a versioned, immutable service scope. It contains:

```json
{
  "instrument": {
    "category": "centrifuge",
    "manufacturer": "SyntheticLab",
    "model": "SpinPro X2",
    "serialNumber": "DEMO-1042"
  },
  "symptoms": ["error E17", "rotor does not reach target speed"],
  "location": "Cambridge, MA",
  "requiredBy": "2026-07-24",
  "requiredDeliverables": ["diagnosis", "repair", "calibration certificate"],
  "constraints": {
    "maxCashPrice": 4500,
    "maxResponseHours": 24,
    "minWarrantyDays": 90,
    "agentMayAccept": false
  }
}
```

After confirmation, hash the canonical JSON. Every quote displays its scope-match percentage and exclusions. The hash is not a blockchain feature; it is simply proof that every provider received the same confirmed scope.

### 2. Quote Normalizer

Store offers in a canonical schema:

```ts
type ServiceQuote = {
  providerId: string;
  scopeHash: string;
  diagnosticFee: number | null;
  calloutFee: number | null;
  laborRate: number | null;
  estimatedLaborHours: number | null;
  partsEstimate: number | null;
  shipping: number | null;
  responseHours: number | null;
  turnaroundHours: number | null;
  warrantyDays: number | null;
  calibrationIncluded: boolean | null;
  loanerIncluded: boolean | null;
  quoteValidityDays: number | null;
  exclusions: string[];
  unresolvedQuestions: string[];
  evidence: TranscriptEvidence[];
};
```

Missing information remains missing. The agent must ask for clarification and may not silently invent zero-dollar fees.

### 3. Downtime-adjusted cost

Rank providers on transparent components, not an opaque AI score:

```text
total expected cost = quoted mandatory charges
                    + user-supplied downtime cost per hour * expected downtime
                    + expected cost of required excluded services
```

Do not pretend downtime cost is universally known. Ask the user for it or display scenarios such as `$0/hour`, `$100/hour`, and `$500/hour`.

### 4. Concession Ledger

Track every material change:

```text
02:14 initial total: $4,100
02:47 competitor evidence checked: valid
03:02 agent asks for response-time match
03:26 provider improves response: 48h -> 24h
03:55 provider adds 90-day warranty
04:18 final cash total: $3,850
```

Each row opens the exact audio and transcript segment.

### 5. Honesty Firewall

The voice agent can cite only:

- confirmed scope facts;
- offers captured in completed calls;
- approved public benchmarks with source and date;
- boundaries explicitly authorized by the user.

The `check_leverage` tool should block unsupported claims. A visible blocked-bluff event is a positive trust feature, not an embarrassment.

### 6. Secret-floor live proof

To prove the demo is not scripted, each counterparty receives a private configuration unknown to the buyer agent:

```json
{
  "openingPrice": 4100,
  "privateFloor": 3600,
  "canAddWarranty": true,
  "canImproveResponseHours": 24,
  "concessionPolicy": "only after valid competing evidence"
}
```

Randomize one bounded parameter at demo start and reveal it afterward. The buyer must discover the available concession through conversation. This is stronger evidence of agency than two agents reciting a fixed dialogue.

## Recommended interface

Use four screens only:

1. **Scope**: voice/document intake, extracted evidence, confirmation.
2. **Call Room**: three live call cards with waveform, status, transcript, and extracted fields.
3. **Deal Room**: normalized comparison and negotiation controls.
4. **Award Memo**: recommendation, uncertainty, concessions, recordings, and citations.

The visual identity should feel like a laboratory operations console, not a generic purple AI landing page.

## Counterparty personalities

### OEM Precision Services

- expensive;
- complete and transparent;
- fast response;
- strong warranty;
- will improve response time but rarely price.

### RapidBench Independent Repair

- low opening headline price;
- separates call-out, calibration, and shipping fees;
- will remove a fee only when shown a valid comparable offer;
- attempts an upsell.

### MetroLab Field Service

- interrupts;
- initially refuses itemization;
- asks whether the caller is a robot;
- may offer a callback or documented decline.

## ElevenLabs implementation

Create:

- one intake agent;
- one buyer/closer agent;
- three counterparty agents;
- webhook tools for structured data;
- post-call transcription and audio webhooks;
- evaluation criteria and simulation tests.

Required tools:

- `save_scope_field`
- `save_quote_field`
- `record_call_outcome`
- `check_leverage`
- `calculate_effective_cost`
- `record_concession`
- `request_human_approval`
- `end_call`

Use ElevenLabs conversation analysis for structured extraction and success evaluation, but validate all values in the backend. Use post-call webhooks for the final transcript, audio, metadata, and analysis. Webhook signatures must be verified.

## Test suite

Create deterministic tests for:

1. extracts every mandatory fee;
2. does not treat an unknown fee as zero;
3. discloses AI identity;
4. never invents a competing quotation;
5. never exceeds the user's ceiling;
6. does not accept without authorization;
7. handles interruption;
8. handles refusal to quote;
9. records callback commitment;
10. identifies an incomparable scope;
11. detects a 30%-below-market red flag;
12. changes at least one price or material term after valid leverage.

Run key simulations repeatedly and display pass rates in the technical appendix. A small evaluation matrix is a meaningful differentiator because most hackathon voice demos show one lucky call.

## Technology and credits

### ElevenLabs

Use for all voice conversations, agent tools, transcripts, recordings, analysis, testing, and optional batch calls.

### OpenAI

Use vision/structured output to read the instrument photo, synthetic service report, and existing quote. Use it to prepare a negotiation plan from structured data. Do not let it calculate final totals without deterministic validation.

### Tavily

Use for vendor discovery and dated benchmark evidence. Cache results before the demo. Do not depend on live search for the golden path.

### Lovable

Use to scaffold the four-screen web application and Supabase integration. Add the voice/event code deliberately after the basic state model works.

### Emdash

Parallelize isolated tasks: UI, agent configuration, webhook backend, comparison engine, and tests. Give each worker separate file ownership.

### Woz

Use only after the connected loop works to diagnose latency and expensive re-renders.

## Name and domain screening

Recommended working name: **BenchBid**.

Preliminary search found no obvious exact-match AI product named BenchBid. DNS checks on 19 July 2026 found:

- `benchbid.com`: DNS records exist; assume unavailable.
- `benchbid.ai`: no A record.
- `benchbid.app`: no A record.
- `benchbid.dev`: no A record.
- `benchbid.io`: no A record.

No A record does not prove a domain is available; it may be registered without a website. Confirm through an accredited registrar before purchase. A web search is not a trademark clearance.

Suggested submission tagline:

> BenchBid calls laboratory service providers, makes every quote comparable, and negotiates the cost of downtime—not just the sticker price.

## Competition map

### Direct hackathon precedents

- Dealwise: local-business quote and availability calls.
- Procuro: supplier calls for delayed parts.
- Haggle: generic service-provider negotiation.
- QuoteMate AI: instant telephone quotes and negotiation.
- CarMommy: car-dealership negotiation.
- FlipKit: resale-buyer discovery and voice negotiation.
- BillSenseAI: invoice discrepancy detection and vendor calls.

### Commercial adjacency

- Outlast AI: calls suppliers and tracks procurement operations.
- RFQmatch: supplier discovery, negotiation, and quote comparison.
- Sauna: quote chasing and supplier comparison.
- Quotel: quote fairness and negotiation analysis.
- Suppliers.ai: structured sourcing and comparable supplier offers.
- RSVP'd: wedding-vendor negotiation.

BenchBid must therefore win through vertical depth, evidence, real concessions, evaluation, and a connected workflow—not by claiming that voice calls themselves are novel.

## What past ElevenLabs winners teach

The 2025 global winner, GibberLink, had a ten-second visual/audio idea that judges and social media immediately understood: two AI agents recognized one another and switched communication modes. Other winners combined voice with action and a defined domain: physical therapy with vision, game-development assets, supplier sourcing, driving safety, airspace safety, compliant debt collection, and website guidance.

Recurring patterns:

- voice is essential to the mechanism, not decoration;
- the demo produces a visible state change;
- the user and pain are immediately clear;
- the system does something after understanding speech;
- the concept can be explained in one sentence;
- the best projects have a memorable demo moment.

BenchBid's memorable moment is the live reveal that the cheapest headline quote becomes the worst offer after downtime and exclusions, followed by a valid concession that changes the recommendation.

## MIT-style judging interpretation

MIT-affiliated public hackathons repeatedly emphasize working prototypes, worthwhile tasks, repeat use, usefulness, creativity, easy setup, design, and presentation. For this challenge, translate those ideas into five gates:

1. **Works**: three live conversations and a measurable concession.
2. **Worth doing**: scientific downtime and service procurement are expensive operational problems.
3. **Would reuse**: confirmed scope and quote evidence become reusable procurement records.
4. **Novel**: multi-issue service negotiation with secret-floor proof and evaluation.
5. **Clear**: one instrument, three providers, one award decision.

## Safety and legal constraints

For the competition demo, use consenting counterparty agents or consenting humans. Do not cold-call random real businesses merely to make the demo look authentic.

If real calls are used later:

- disclose that the caller is an AI assistant;
- identify the customer represented;
- obtain appropriate consent;
- comply with call-recording laws in every relevant jurisdiction;
- comply with TCPA, FTC, state, and international rules;
- avoid spoofing or cloned celebrity/employee voices;
- never bind the user to a purchase without explicit authority.

This report is product guidance, not legal advice.

## Build order

### Gate 1: first 90 minutes

Prove:

- one ElevenLabs conversation works;
- one tool call reaches the backend;
- a completed transcript arrives;
- audio can be replayed.

If this gate fails, fix it before building UI.

### Gate 2: core loop

- implement schemas;
- create synthetic instrument evidence;
- create three counterparties;
- save structured quotes;
- calculate transparent totals;
- run one closer negotiation.

### Gate 3: differentiation

- ScopePrint hash and exclusions;
- Concession Ledger;
- Honesty Firewall;
- secret-floor reveal;
- repeated evaluation tests.

### Gate 4: presentation

- deploy;
- record a backup demo;
- create a 90-second video;
- prepare a three-minute finalist pitch;
- keep all API credentials and redemption links out of screenshots and source control.

## Pitch outline

### Opening

> A $2,000 repair quote can cost a laboratory $20,000 when response time, calibration, and downtime are excluded.

### Demo

Show the confirmed scope, three live calls, hidden fee discovery, genuine concession, and changed recommendation.

### Technical proof

Show the evidence timeline, honesty block, and repeat-test pass rate.

### Close

> BenchBid turns every service call into comparable evidence and every concession into an auditable decision.

## Research limitations

- The current private Hack-Nation Discord was not accessible. No claims about private participant ideas or mentor instructions are made.
- LinkedIn results are public posts and are not a representative sample of all winners.
- Competitor search is broad but cannot prove that no similar private or unindexed product exists.
- Domain and trademark checks are preliminary only.

## Key sources

- Hack-Nation challenge brief supplied by the participant.
- ElevenLabs, "Announcing the winners of the ElevenLabs Worldwide Hackathon."
- ElevenLabs documentation: Conversation Analysis, Agent Testing, Batch Calling, Webhook Tools, and Post-call Webhooks.
- MIT CSAIL Agentic AI Hackathon judging criteria.
- FTC Telemarketing Sales Rule guidance and AI-enabled calling enforcement material.
- Public competitor and hackathon project pages cited in the accompanying response.
