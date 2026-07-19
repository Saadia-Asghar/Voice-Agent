# Lovable prompt: BenchBid visual redesign

Paste this into Lovable after connecting the `Saadia-Asghar/Voice-Agent` repository.

```text
Redesign the existing BenchBid React + TypeScript application across all four functional screens: Scope Studio, Call Room, Deal Room, and Award Memo. Do not rebuild the app, remove functionality, change domain calculations, fabricate live call state, or replace working ElevenLabs/Supabase integrations.

VISUAL DIRECTION
Use a premium AI voice SaaS aesthetic inspired by this reference only at the level of visual language:
https://dribbble.com/shots/27143388-AI-Voice-Agents-SaaS-Modern-Call-Automation-Landing-Page

Do not copy V-3 branding, wording, navigation, logos, or marketing sections. Translate these characteristics into BenchBid’s product UI:
- true-white canvas and surfaces
- near-black charcoal typography
- soft blue, periwinkle, and pale pink pixel-mosaic gradients used only around live voice, selected recommendation, and evidence moments
- thin neutral borders, restrained shadows, 18–24px radii
- compact black primary buttons and quiet white secondary buttons
- generous whitespace and precise modern sans-serif typography
- 14–16px UI chrome, 16–18px body copy, 42–58px workflow headings
- minimal pills; statuses only where they communicate provenance or call outcome

DESIGN TOKENS
Background #FFFFFF; secondary canvas #F7F8FC; text #17181D; muted #6D7180; border #E7E8EF; accent #4F6EF7; soft blue #DDE8FF; periwinkle #B8BBDD; pink #F1DDF4; success #159A5B; warning #D58A17; danger #D94941. Use Manrope or Inter. Shadows must be soft and low-opacity.

APP SHELL
Keep BenchBid branding, case “SpinPro X2 / Error E17”, and the four steps Scope, Call room, Deal room, Award memo. Use a quiet white header with a black radial/aperture brand mark. Active step uses a filled blue or black numbered circle. Keep the layout responsive and keyboard accessible.

SCREEN 1 — SCOPE STUDIO
Headline: “Build one scope every provider must quote.” Keep the real voice interview, document upload, shared service-scope editor, conflict resolution, confirmation checklist, ScopePrint hash, and lock/open-call actions. Give the voice area a soft pixel-mosaic waveform field. Never fake a connected voice state.

SCREEN 2 — CALL ROOM
Headline: “Three providers. One locked scope. No hidden assumptions.” Keep the three provider lanes, real Start live call / End live / Verify evidence controls, fixture controls, structured terms, outcomes, and evidence inspector. Preserve the exact provenance states LIVE, AWAITING SIGNED WEBHOOK, RECORDED LIVE RUN, and SIMULATED FIXTURE. A lane may show RECORDED LIVE RUN only after the existing signed-webhook verification logic succeeds.

SCREEN 3 — DEAL ROOM
Headline: “The lowest quote is not the lowest-cost repair.” Preserve the metrics, normalized comparison table, downtime slider, negotiation flight recorder, transcript drawers, current recommendation, and human approval boundary. Use the pixel gradient behind only the recommended row and concession timeline.

SCREEN 4 — AWARD MEMO
Headline: “A decision a human can defend.” Preserve ranked offers, effective-cost logic, evidence receipts, print/export action, review checkbox, and non-binding boundary. It should feel like a premium audit memo, not a generic dashboard.

NON-NEGOTIABLE ENGINEERING GUARDS
- Do not change src/domain.ts, src/contracts.ts, tests, Supabase functions, environment variables, agent IDs, or API calls.
- Do not remove lazy loading or merge all screens into App.tsx.
- Keep all controls functional and all visible evidence provenance honest.
- Do not use raster screenshots as UI.
- Do not add fake metrics, fake charts, pricing sections, testimonials, generic landing-page content, dark mode, glassmorphism, neon glow, bento grids, or decorative filler.
- Maintain desktop, tablet, and mobile layouts; tables may scroll horizontally on small screens.
- Respect prefers-reduced-motion and visible focus states.

Before finishing, run the existing tests and production build. Summarize only the visual/component files changed and explicitly confirm that live-call, webhook verification, evidence labeling, and deterministic ranking behavior were preserved.
```
