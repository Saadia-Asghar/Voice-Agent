# Lovable prompt for BenchDial

Paste this as one prompt. Connect Lovable to the existing GitHub repository and instruct it to modify the current React/Vite application rather than generating a new project.

```text
You are extending an existing React + Vite + TypeScript application called BenchDial. Do not replace its architecture, package manager, domain model, colors, or typography. Inspect the repository first. Preserve src/domain.ts, src/contracts.ts, the Supabase directory, the existing laboratory-procurement design, and all working tests.

Product: BenchDial is an evidence-backed voice procurement negotiator for laboratory equipment repair. It is not a generic chatbot. Users create one confirmed ScopePrint, run three consenting live ElevenLabs provider conversations, normalize itemized quotes, negotiate using only verified leverage, and review an evidence-linked award memo.

Create production-quality responsive screens for:
1. Scope Studio: voice-interview card, document upload card, extracted-field comparison, visible conflicts, unknown fields, confirmation checkbox, version number, and canonical ScopePrint hash. Calls must remain disabled until scope status is confirmed.
2. Call Room: exactly three provider cards with distinct styles (tough OEM, hidden-fee independent, stonewalling regional provider), LIVE/RECORDED LIVE RUN/SIMULATED FIXTURE provenance labels, real connection states, transcript stream, structured outcome, disclosure status, and safe retry.
3. Deal Room: preserve the existing normalized quote table, downtime slider, unknown-as-unknown behavior, scope-match score, concession flight recorder, transcript citations, and recommendation abstention when offers are incomparable.
4. Award Memo: recommendation, assumptions, itemized costs, operational terms, unresolved risks, cited evidence, and a mandatory human approval boundary. Never add an accept, buy, book, pay, or sign action.

UX requirements: excellent keyboard navigation, WCAG-visible focus, proper modal focus trapping, Escape-to-close, microphone-denied state, document-extraction failure, scope-conflict state, agent unavailable, disconnected call, post-call analysis pending, incomplete quote, and all-quotes-incomparable state. Preserve completed work during retries.

Use the existing CSS design language: near-black green background, restrained lime accent, serif editorial headings, compact procurement typography, thin green borders, data-dense tables, and no generic purple AI gradients. Keep mobile usable. Do not insert fake charts, fake recordings, fake live statuses, canned testimonials, or invented backend results.

Data must come through typed adapters. Fixture data must always be labeled SIMULATED FIXTURE. Do not put ElevenLabs, OpenAI, or Supabase service-role secrets in client code. Use VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, and the public ElevenLabs agent IDs only. Run tests and production build before finishing. Return a concise list of changed files and any backend contracts you need; do not silently invent an API.
```
