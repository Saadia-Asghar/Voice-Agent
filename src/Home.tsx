import {
  ArrowRight,
  AudioWaveform,
  Check,
  CircleAlert,
  FileCheck2,
  LockKeyhole,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { challengeModules, SCOPE_PRINT_SHORT, verticalPain } from "./caseModel";

type WorkflowStep = "Scope" | "Call room" | "Deal room" | "Award memo";

const providers = [
  { name: "OEM Precision", total: "$3,950", warranty: "180d", eta: "18h", outcome: "QUOTE", bars: [8,14,9,22,16,30,13,24,18,34,21,15,28,12,20,9] },
  { name: "RapidBench", total: "$3,900", warranty: "90d", eta: "36h", outcome: "NEGOTIATED", bars: [12,21,8,27,17,12,31,20,10,24,16,28,13,22,9,14] },
  { name: "MetroLab Field", total: "Decline", warranty: "—", eta: "—", outcome: "DECLINE", bars: [7,12,18,9,23,13,8,19,26,11,17,8,21,14,9,12] },
] as const;

const proof = [
  ["Estimator loop", "Voice + doc → ScopePrint", "complete"],
  ["Call-list provenance", "Places / Yelp / OSM shown", "complete"],
  ["3 negotiation styles", "Live evidence still due", "pending"],
  ["Structured outcomes", "Quote · decline · leverage", "complete"],
  ["Leverage causation", "Live concession still due", "pending"],
  ["Honesty firewall", "Server-tested", "complete"],
  ["Closer report", "Ranked + red-flag rule", "complete"],
] as const;

export function Home({ onOpen }: { onOpen: (step: WorkflowStep) => void }) {
  return <main className="home-screen visual-home" id="home">
    <section className="visual-hero">
      <div className="visual-hero-copy">
        <p className="home-challenge-line">The Negotiator · ElevenLabs × Hack-Nation</p>
        <h1>Call, compare, and haggle — never overpay on a phone-priced repair.</h1>
        <p>{verticalPain.market}: one confirmed brief, three live-style negotiations, one evidence-backed award.</p>
        <button className="visual-primary" onClick={() => onOpen("Scope")}>Start the Estimator <ArrowRight /></button>
        <small><ShieldCheck /> Simulated fixtures stay labeled until signed live evidence exists.</small>
      </div>

      <div className="decision-canvas" aria-label="Estimator scope flows into Caller negotiations and Closer award">
        <section className="canvas-scope">
          <header><span>01</span> ESTIMATOR</header>
          <div className="scope-visual-card">
            <div className="scope-locked"><Check /> Scope locked</div>
            <div className="instrument-visual" aria-hidden="true"><span /><span /><span /><span /></div>
            <strong>SpinPro X2</strong>
            <small>Centrifuge · Error E17</small>
            <dl><div><dt>Work</dt><dd>Drive module</dd></div><div><dt>Calibration</dt><dd>Required</dd></div><div><dt>Location</dt><dd>On-site</dd></div></dl>
            <div className="scope-id"><LockKeyhole /> {SCOPE_PRINT_SHORT}</div>
          </div>
        </section>

        <div className="canvas-connector" aria-hidden="true"><i /><i /><i /></div>

        <section className="canvas-calls">
          <header><span>02</span> CALLER</header>
          {providers.map((provider) => <article key={provider.name}>
            <div className="call-name"><i>{provider.name.slice(0, 2).toUpperCase()}</i><strong>{provider.name}</strong><em><span /> {provider.outcome}</em></div>
            <div className="waveform" aria-hidden="true">{provider.bars.map((height, bar) => <i key={bar} style={{ height }} />)}</div>
            <dl><div><dt>Total</dt><dd>{provider.total}</dd></div><div><dt>Warranty</dt><dd>{provider.warranty}</dd></div><div><dt>ETA</dt><dd>{provider.eta}</dd></div></dl>
          </article>)}
        </section>

        <div className="canvas-arrow" aria-hidden="true"><ArrowRight /></div>

        <section className="canvas-award">
          <header><span>03</span> CLOSER</header>
          <div className="award-visual-card">
            <span className="award-trophy"><Trophy /></span>
            <small>RECOMMENDATION</small>
            <h2>OEM Precision</h2>
            <ul><li><Check /> Fastest recovery</li><li><Check /> Complete scope</li><li><Check /> Strongest warranty</li></ul>
            <div><small>EFFECTIVE COST</small><strong>$5,750</strong></div>
            <button onClick={() => onOpen("Award memo")}>View memo <ArrowRight /></button>
          </div>
        </section>
      </div>
    </section>

    <section className="visual-journey" id="how-it-works">
      <h2>The challenge loop — Estimator, Caller, Closer</h2>
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
      <p><ShieldCheck /> BenchDial recommends. A human decides. <Phone size={14} /> Live Caller evidence still required for submission.</p>
    </section>
  </main>;
}
