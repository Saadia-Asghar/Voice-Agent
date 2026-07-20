import {
  ArrowRight,
  AudioWaveform,
  Check,
  CircleAlert,
  CircleDollarSign,
  Clock,
  FileCheck2,
  LockKeyhole,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { challengeModules, SCOPE_PRINT_SHORT, type ProofRow } from "./caseModel";
import { HowItWorksPanel } from "./HowItWorksPanel";

type WorkflowStep = "Scope" | "Call room" | "Deal room" | "Award memo";

const providers = [
  { name: "OEM Precision", total: "$3,950", warranty: "180d", eta: "18h", outcome: "QUOTE", bars: [8,14,9,22,16,30,13,24,18,34,21,15,28,12,20,9] },
  { name: "RapidBench", total: "$3,900", warranty: "90d", eta: "36h", outcome: "NEGOTIATED", bars: [12,21,8,27,17,12,31,20,10,24,16,28,13,22,9,14] },
  { name: "MetroLab Field", total: "Decline", warranty: "—", eta: "—", outcome: "DECLINE", bars: [7,12,18,9,23,13,8,19,26,11,17,8,21,14,9,12] },
] as const;

export function Home({ onOpen, onJudgeDemo, proof }: { onOpen: (step: WorkflowStep) => void; onJudgeDemo: () => void; proof: ProofRow[] }) {
  return <main className="home-screen visual-home" id="home">
    <section className="judge-strip" aria-label="Judges — try live">
      <strong>Judges — try it live in real time (no login)</strong>
      <ol>
        <li><b>Start demo</b> — brief + three vendors load instantly</li>
        <li><b>Preview sample call</b> or <b>Start live call</b> with your mic</li>
        <li>Drag downtime slider → <b>Approve</b> the award memo yourself</li>
      </ol>
      <button type="button" onClick={onJudgeDemo}>Open live demo <ArrowRight size={14} /></button>
    </section>

    <section className="visual-hero">
      <div className="visual-hero-copy">
        <p className="home-challenge-line">The Negotiator · ElevenLabs × Hack-Nation</p>
        <h1>Something broke at work. Get three repair quotes — without an afternoon of phone calls.</h1>
        <p>For facility managers, lab ops, and anyone who fixes equipment by phone: lock one repair brief, let a voice agent call three vendors on the same job, compare fairly, and approve a memo you can forward to purchasing.</p>
        <div className="hero-cta-row">
          <button className="visual-primary" onClick={onJudgeDemo}>Start demo — no login <ArrowRight /></button>
          <button type="button" className="visual-secondary" onClick={() => onOpen("Scope")}>Build a repair brief</button>
        </div>
        <small><ShieldCheck /> Judges can click through the full flow live — sample calls, ranking slider, and approval — in about 3 minutes. No account.</small>
      </div>

      <div className="decision-canvas" aria-label="Repair brief flows into vendor calls and award recommendation">
        <section className="canvas-scope">
          <header><span>01</span> REPAIR BRIEF</header>
          <div className="scope-visual-card">
            <div className="scope-locked"><Check /> Brief locked</div>
            <div className="instrument-visual" aria-hidden="true"><span /><span /><span /><span /></div>
            <strong>SpinPro X2</strong>
            <small>Centrifuge · Error E17</small>
            <dl><div><dt>Work</dt><dd>Drive module</dd></div><div><dt>Calibration</dt><dd>Required</dd></div><div><dt>Location</dt><dd>On-site</dd></div></dl>
            <div className="scope-id"><LockKeyhole /> {SCOPE_PRINT_SHORT}</div>
          </div>
        </section>

        <div className="canvas-connector" aria-hidden="true"><i /><i /><i /></div>

        <section className="canvas-calls">
          <header><span>02</span> CALL VENDORS</header>
          {providers.map((provider) => <article key={provider.name}>
            <div className="call-name"><i>{provider.name.slice(0, 2).toUpperCase()}</i><strong>{provider.name}</strong><em><span /> {provider.outcome}</em></div>
            <div className="waveform" aria-hidden="true">{provider.bars.map((height, bar) => <i key={bar} style={{ height }} />)}</div>
            <dl><div><dt>Total</dt><dd>{provider.total}</dd></div><div><dt>Warranty</dt><dd>{provider.warranty}</dd></div><div><dt>ETA</dt><dd>{provider.eta}</dd></div></dl>
          </article>)}
        </section>

        <div className="canvas-arrow" aria-hidden="true"><ArrowRight /></div>

        <section className="canvas-award">
          <header><span>03</span> COMPARE</header>
          <div className="award-visual-card">
            <span className="award-trophy"><Trophy /></span>
            <small>RECOMMENDED</small>
            <h2>OEM Precision</h2>
            <ul><li><Check /> Fastest repair</li><li><Check /> Full job covered</li><li><Check /> Best warranty</li></ul>
            <div><small>TOTAL WITH DOWNTIME</small><strong>$5,750</strong></div>
            <button onClick={() => onOpen("Award memo")}>View memo <ArrowRight /></button>
          </div>
        </section>
      </div>
    </section>

    <HowItWorksPanel onStartDemo={onJudgeDemo} />

    <section className="life-scenario" id="when-to-use" aria-label="When BenchDial helps in daily lab life">
      <div className="life-scenario-copy">
        <p className="home-challenge-line">A Tuesday that happens every month</p>
        <h2>The centrifuge dies at 9:10 a.m. Purchasing wants three quotes by lunch.</h2>
        <p>
          Saadia runs City Labs operations. Experiments stall while she repeats the same fault story to OEM, an independent shop, and a regional tech —
          each with different call-out fees, calibration rules, and warranty language. The cheapest number often excludes the work that gets the bench back online.
        </p>
      </div>
      <ol className="life-scenario-steps">
        <li>
          <strong>When the instrument fails</strong>
          <span>Describe the fault by voice or upload your service report. Lock one repair brief so every vendor quotes the same job.</span>
        </li>
        <li>
          <strong>When vendors only price by phone</strong>
          <span>BenchDial calls three shops with the same brief — you get a quote, a negotiated price, or a documented decline.</span>
        </li>
        <li>
          <strong>When the cheap bid looks too good</strong>
          <span>Compare side-by-side, adjust for downtime cost, and get a ranked memo you can show purchasing.</span>
        </li>
      </ol>
      <div className="life-scenario-why">
        <ShieldCheck />
        <div>
          <strong>Why this problem is real</strong>
          <p>Phone-priced repairs hide assumptions. Labs lose money twice — downtime while calling, and incomplete coverage after awarding the lowest headline price. BenchDial makes the pain comparable before anyone commits.</p>
        </div>
        <button type="button" className="visual-primary" onClick={onJudgeDemo}>See it on this case <ArrowRight /></button>
      </div>
    </section>

    <section className="audience-value" id="for-whom" aria-label="Who BenchDial is for and what it does">
      <div className="audience-value-copy">
        <p className="home-challenge-line">Who it’s for</p>
        <h2>Built for people who restore shared instruments — not for shopping carts.</h2>
        <p>
          Lab ops leads, facility managers, research coordinators, and student lab supervisors who get stuck on phone quotes when a centrifuge, freezer, or analyzer fails.
          If you have to call three shops before lunch and defend the choice to purchasing, this is for you.
        </p>
      </div>
      <ul className="value-pills" aria-label="What BenchDial helps you do">
        <li>
          <Clock />
          <div>
            <strong>Saves afternoon phone-tag</strong>
            <span>One brief → three comparable vendor conversations instead of repeating the fault story by hand.</span>
          </div>
        </li>
        <li>
          <CircleDollarSign />
          <div>
            <strong>Stops “cheap” incomplete quotes</strong>
            <span>Surfaces call-out, calibration, warranty, and downtime so the lowest sticker isn’t an automatic win.</span>
          </div>
        </li>
        <li>
          <FileCheck2 />
          <div>
            <strong>Gives you a defendable memo</strong>
            <span>Ranked recommendation with transcript receipts — you still approve; BenchDial never buys.</span>
          </div>
        </li>
      </ul>
    </section>

    <section className="how-to-use" id="how-to-use" aria-label="How to use BenchDial">
      <div className="how-to-use-copy">
        <p className="home-challenge-line">How to use</p>
        <h2>Four clicks. Same case every time.</h2>
      </div>
      <ol className="how-to-steps">
        <li>
          <strong>Step 1 · Repair brief</strong>
          <span>Describe the fault by voice or upload a report. Lock the brief so every vendor gets the same job.</span>
        </li>
        <li>
          <strong>Step 2 · Call vendors</strong>
          <span>BenchDial calls three shops on that same job — listen to samples or try a live call.</span>
        </li>
        <li>
          <strong>Step 3 · Compare quotes</strong>
          <span>See every fee side-by-side. Move the downtime slider to see how ranking changes.</span>
        </li>
        <li>
          <strong>Step 4 · Award memo</strong>
          <span>Read the recommendation, check the evidence, and approve when you're ready.</span>
        </li>
      </ol>
      <div className="fixture-explain" id="fixtures">
        <Sparkles />
        <div>
          <strong>What are sample calls?</strong>
          <p>
            For the demo, three vendor calls are already filled in — a quote, a negotiated price, and a decline.
            They are labeled <b>SIMULATED FIXTURE</b> so you know they are not recorded live runs.
            Click <b>Preview sample call</b> to hear one, or <b>Start live call</b> for a real voice session (allow mic).
          </p>
        </div>
      </div>
      <button type="button" className="visual-primary" onClick={onJudgeDemo}>Start demo with sample calls <ArrowRight /></button>
    </section>

    <section className="visual-journey" id="workflow-modules">
      <h2>Four steps from breakdown to decision</h2>
      <div className="challenge-module-grid">
        {challengeModules.map((module) => (
          <button key={module.id} className="challenge-module-card" onClick={() => onOpen(module.screen)}>
            <b>{module.id}</b>
            <strong>{module.title}</strong>
            <span>{module.blurb}</span>
            <em>Open <ArrowRight size={14} /></em>
          </button>
        ))}
      </div>
      <div className="case-strip" aria-label="Saadia's guided repair case">
        <div className="case-person"><span>SA</span><strong>Saadia</strong></div>
        <div><small>VERTICAL</small><strong>Lab repair</strong></div>
        <ArrowRight />
        <div><small>FAILURE</small><strong>Error E17</strong></div>
        <ArrowRight />
        <div><small>PAIN</small><strong>Opaque quotes</strong></div>
        <ArrowRight />
        <div><small>OUTCOME</small><strong>Human award</strong></div>
      </div>
    </section>

    <section className="visual-proof" id="challenge-proof">
      <div className="proof-matrix">
        <header><span>CHALLENGE PROOF</span><h2>Built to the brief.</h2></header>
        {proof.map(([label, status, state]) => <div key={label}><span>{state === "complete" ? <Check /> : <CircleAlert />}<strong>{label}</strong></span><i className={state} /><em>{status}</em></div>)}
      </div>

      <div className="evidence-orbit" aria-label="Evidence chain from scope to calls, concession and award">
        <div className="orbit-ring" aria-hidden="true" />
        <div className="orbit-center"><ShieldCheck /><strong>Evidence<br />chain</strong></div>
        <div className="orbit-node orbit-scope"><FileCheck2 /><span>Scope</span></div>
        <div className="orbit-node orbit-calls"><AudioWaveform /><span>Calls</span></div>
        <div className="orbit-node orbit-award"><Trophy /><span>Award</span></div>
        <div className="orbit-node orbit-proof"><Sparkles /><span>Concession</span></div>
      </div>

      <button className="proof-cta" onClick={() => onOpen("Scope")}><Mic /> Build the repair brief <ArrowRight /></button>
      <p><ShieldCheck /> BenchDial recommends. You decide. <Phone size={14} /> Every quote is backed by a call transcript.</p>
    </section>
  </main>;
}
