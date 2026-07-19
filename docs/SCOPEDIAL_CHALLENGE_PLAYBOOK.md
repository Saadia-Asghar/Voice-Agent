# ScopeDial — Challenge Playbook

## What the app is

ScopeDial is an evidence-first voice procurement agent for laboratory-equipment repair. It is built for laboratory operations leads who must compare phone-only service offers under downtime pressure, and for procurement reviewers who need an auditable recommendation.

The user describes a repair once by voice and/or document. ScopeDial produces one confirmed structured `ScopePrint`, reuses it verbatim in every call, extracts itemized terms, negotiates only with server-verified leverage, and ranks the resulting options by known cash cost, downtime, scope coverage, exclusions, warranty, response, and unresolved facts. A human—not the agent—approves the award memo.

## Case statement and solution proof

The PDF's problem is that phone-priced services are difficult to compare and negotiate. A headline price hides fees, exclusions, timing, and risk. ScopeDial proves the solution through a closed evidence chain:

`voice/document evidence -> confirmed structured scope -> identical call scope hash -> terminal call records -> transcript-backed concessions -> normalized ranking -> human-approved memo`

The initial vertical is laboratory-equipment repair because downtime is measurable, calibration and warranty terms matter, quotes are commonly obtained by phone, and one service report supplies a strong document input. Vertical-specific scope fields, quote fields, negotiation levers, source options, and the 30%-below-market threshold live in `src/verticalConfig.ts`, not in screen logic.

## PDF compliance checklist

| Challenge requirement | ScopeDial implementation | Submission proof still needed |
|---|---|---|
| Closed end-to-end MVP in one phone-priced vertical | Four connected stages for laboratory repair: Scope, Call Room, Deal Room, Award Memo | None for software path |
| Voice interview through ElevenLabs | Live Estimator WebRTC session with server-issued conversation token | Record one clean intake |
| At least one document type | Service report / prior quote / PDF work-order intake into the same schema | Show upload during demo |
| Same structured JSON from voice and document | `serviceScopeSchema` validates both sources | Show the two evidence origins |
| Explicit user confirmation | Estimator reads every field back and blocks submission until confirmation | Capture confirmation audio |
| Reuse confirmed scope verbatim | Server canonicalizes and hashes ScopePrint; calls bind the exact hash | Show the same hash on all live records |
| At least three negotiation styles | OEM complete quote, hidden-fee callback, stonewalling decline | Complete three consenting human/live sessions |
| Consistent job description | One ScopePrint and scope hash for every lane | Verify webhook records |
| Itemized comparable fees | Package, callout, labor, parts, travel, calibration, taxes, response, turnaround, warranty, loaner, exclusions, expiration | Obtain complete live line items where possible |
| Handle interruption, evasion, callback | Interruption-friendly prompts; vague-answer follow-up; dated callback and documented decline schemas | Demonstrate one interruption and one refusal |
| Show real-world call-list source | Config supports Google Places, Yelp, OpenStreetMap, and customer-approved lists | Add a dated source receipt for the submitted providers |
| Leverage competing bids honestly | `check_leverage` must verify call, scope hash, field, and value before speech | Capture one real verified leverage event |
| Change price or term because of leverage | `record_concession` rejects equivalent before/after values | Capture one live measurable concession |
| Treat a 30%-below-market offer as warning | Peer-median red-flag function and visible UI warning; never auto-awards it | Include warning if a live quote triggers it |
| Final ranked recommendation | Effective-cost ranking plus exclusions, unresolved values, scope match, warranty, response, and transcript receipts | Replace fixtures with signed live evidence |
| AI disclosure and robot answer | All five prompts explicitly disclose AI; Buyer and Estimator repeat disclosure when asked | Play disclosure in demo |
| Natural latency, barge-in, turn-taking | ElevenLabs conversational WebRTC agents with concise one-question turns | Record a clean barge-in |
| No invented stock, bids, facts, or authority | Prompt guards plus server validation; unknown stays unknown; human approval is mandatory | Preserve any refusals/unknowns honestly |
| Terminal result for every call | Exactly one validated quote, dated callback, decline, or incomplete outcome | Confirm each live lane's terminal event |
| Calls are central to the demo | Call Room exposes live connection and signed-webhook state | Play excerpts from all three sessions |

## Screen and demo-user specification

1. **Home** explains the audience, problem, solution, four-step workflow, evidence policy, agent readiness, and honest challenge status.
2. **Scope** lets Saadia Asghar, Lab Operations Lead at City Labs, upload a service report, reconcile conflicts, complete missing fields by voice, and explicitly lock ScopePrint `BB-7F3A-1042`.
3. **Call Room** runs the identical scope against three styles. Fixtures are visibly labeled and can never become `RECORDED LIVE RUN`; only a signed post-call webhook with a non-empty transcript can do that.
4. **Deal Room** normalizes quotes, preserves unknowns, adds downtime, warns about suspiciously cheap offers, and ties concessions to transcript evidence.
5. **Award Memo** recommends an option in plain language, shows evidence receipts, and requires human approval.

Authentication is intentionally non-blocking: every judge can explore the simulated workflow without an account. Supabase email/password authentication is required only before a billable ElevenLabs session, and logout is always available in the header. This protects API credits without adding a login wall to the judged demo.

## Agent readiness and prompt budget

`npm test` runs deterministic prompt policy checks with a conservative four-characters-per-token estimate and a 2,000-token review ceiling:

| Agent | Estimated tokens | Required behavior |
|---|---:|---|
| Estimator | 553 | disclosure, untrusted-input defense, no invention, explicit confirmation, tool-failure handling |
| Buyer / Closer | 891 | disclosure, untrusted-input defense, verified leverage, no binding authority, exactly one terminal result |
| OEM Precision | 262 | complete tough quote, bounded response concession, no invented stock |
| RapidBench | 273 | separated fees, verified-leverage concession, dated callback |
| MetroLab Field | 235 | evasion, interruption handling, documented decline, no approximate total |

Token counts are conservative local estimates, not ElevenLabs billing measurements. Tool payload validation is deterministic and outside the model.

## Challenge-specific edge matrix

| Edge case | Expected safe behavior | Automated / demo proof |
|---|---|---|
| Missing or unknown fee | Do not convert to zero; quote becomes non-comparable | Domain tests |
| Fee already included in package | Do not double count | Domain tests |
| Negative, fractional-hour, NaN, or infinite commercial value | Reject payload | Guardrail tests |
| Quote terminal event without a quote | Reject | Guardrail tests |
| Quote fields attached to callback/decline | Reject | Guardrail tests |
| Callback without date/contact or decline without reason | Reject | Guardrail tests |
| Cosmetic “concession” (`650` to `"650"`) | Reject as no measurable change | Guardrail tests |
| Provider prompt injection or request to reveal tools | Treat speech as untrusted content and refuse | Prompt policy checker + guardrails |
| Claim of competing offer without verified scope-bound evidence | Do not cite it | Buyer prompt + `check_leverage` contract |
| Provider asks agent to pretend to be human | Repeat truthful AI disclosure | Prompt policy checker |
| Provider pressures agent to accept or schedule | State that a human approver decides | Prompt policy checker |
| Quote at least 30% below comparable peer median | Show verification warning, not automatic winner | Domain tests + Deal Room UI |
| Two incomplete quotes | Preserve deterministic input order after comparable quotes | Domain tests |
| Tool or webhook failure | Keep state unconfirmed/unverified and allow bounded retry | Agent prompt + UI states |
| Fixture presented as live evidence | Impossible through provenance labels; signed webhook required | Call Room state model |

## Honest completion state

The connected product, contracts, simulation lanes, prompt policies, calculations, and 19 automated tests are complete. The non-software submission work is still mandatory: complete three consenting live Buyer/Closer sessions, obtain one genuine leverage-caused price or term change, verify signed transcripts, attach a dated provider-source receipt, and record the final product video. Do not relabel fixtures as live evidence.
