# BenchDial video package

The Hack-Nation form requires three separate videos, each no longer than 60 seconds, in H.264 MP4. Record at 1920×1080 if possible. Keep the browser zoom at 100%, hide API dashboards and secrets, and never represent a fixture as a real call.

## 1. Demo video — 58 seconds

### 0–7 seconds — Open on the product home

Voiceover: “When a lab instrument fails, the real repair price is trapped in phone calls. BenchDial turns one repair brief into a decision you can defend.”

Show: Home hero, then click **Start the Estimator**.

### 7–18 seconds — Estimator

Voiceover: “Saadia uploads a service report and confirms the same structured ScopePrint through voice intake. Calibration, response time, and access constraints are locked before any provider is called.”

Show: document attachment, conflict resolution, confirmed ScopePrint hash.

### 18–34 seconds — Caller

Voiceover: “BenchDial gives every provider the identical brief. It handles the tough OEM, a lowball quote with hidden fees, and a refusal to quote. Every call ends as an itemized quote, a callback, or a documented decline.”

Show: Call Room; highlight three lanes and provider outcomes. If the live sessions are not recorded yet, say “simulated fixture” on screen.

### 34–47 seconds — Closer

Voiceover: “The Closer can use only a verified competing term. Here, it challenges the call-out fee and earns a better warranty. The before-and-after concession is tied to transcript evidence.”

Show: Deal Room; open the Honesty Firewall and Concession Ledger.

### 47–58 seconds — Award

Voiceover: “The cheapest quote is not always the fastest recovery. BenchDial ranks the evidence, downtime, warranty, and scope coverage—then leaves the final decision to a human. When the bench breaks, BenchDial.”

Show: Award Memo and human-approval boundary.

## 2. Tech video — 58 seconds

### 0–8 seconds

Voiceover: “BenchDial is a three-stage voice negotiation system: Estimator, Caller, and Closer.”

Show: Home workflow.

### 8–21 seconds

Voiceover: “The Estimator accepts voice and documents, reconciles conflicts, and hashes one confirmed ScopePrint. That same JSON specification is reused for every provider.”

Show: Scope Studio then code briefly: `caseModel.ts` / `confirmScopePrint`.

### 21–36 seconds

Voiceover: “Live conversations use ElevenLabs Agents. The browser never receives a provider secret: a Supabase Edge Function validates the signed-in user and mints a short-lived conversation token.”

Show: simple architecture diagram or `elevenlabs-token` code. Do not show secrets.

### 36–48 seconds

Voiceover: “Calls are not marked live because a browser session ended. A signed webhook must persist a non-empty transcript before the UI grants recorded-live provenance.”

Show: webhook / evidence-state code and the Call Room provenance label.

### 48–58 seconds

Voiceover: “The Honesty Firewall rejects invented leverage. Deterministic ranking applies fee coverage, warranty, response, and downtime economics before a human-approved Award Memo.”

Show: `call-tools`, ranking UI, Award Memo.

## 3. Team video — 35–45 seconds

Say: “Hi, I’m Saadia Asghar, the solo builder of BenchDial. I designed the lab-repair vertical, the three agent conversations, the evidence contracts, the interface, and the deployment. The moment I cared about most was making the agent refuse to bluff: if a bid cannot be proven, it cannot be used as leverage. BenchDial is built to make phone-priced repair decisions more comparable, safer, and faster.”

## Submission recording gate

Before recording the final demo, complete three consenting live provider sessions and one live, evidence-backed concession. Otherwise label the walkthrough as a simulated product demonstration and do not claim completion of the live-call criterion.
