import {
  ArrowRight,
  AudioWaveform,
  Check,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  LockKeyhole,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

type WorkflowStep = "Scope" | "Call room" | "Deal room" | "Award memo";

const providers = [
  { name: "OEM Precision", total: "$3,950", warranty: "180d", eta: "18h", bars: [8,14,9,22,16,30,13,24,18,34,21,15,28,12,20,9] },
  { name: "RapidBench", total: "$2,950", warranty: "90d", eta: "42h", bars: [12,21,8,27,17,12,31,20,10,24,16,28,13,22,9,14] },
  { name: "MetroLab Field", total: "Callback", warranty: "—", eta: "Tue", bars: [7,12,18,9,23,13,8,19,26,11,17,8,21,14,9,12] },
] as const;

const proof = [
  ["Scope", "UI ready", "pending"],
  ["Call binding", "Pending", "pending"],
  ["3 live styles", "Evidence due", "pending"],
  ["Outcomes", "Schema tested", "pending"],
  ["Causation", "Evidence due", "pending"],
  ["Honesty", "Tested", "complete"],
  ["Award", "Demo ready", "pending"],
] as const;

const flow = [
  { icon: FileText, number: "01", label: "Brief" },
  { icon: LockKeyhole, number: "02", label: "Lock" },
  { icon: AudioWaveform, number: "03", label: "Call" },
  { icon: Check, number: "04", label: "Decide" },
] as const;

export function Home({ onOpen }: { onOpen: (step: WorkflowStep) => void }) {
  return <main className="home-screen visual-home" id="home">
    <section className="visual-hero">
      <div className="visual-hero-copy">
        <h1>One repair brief.<br />Three comparable calls.</h1>
        <p>AI voice procurement for lab repair.</p>
        <button className="visual-primary" onClick={() => onOpen("Scope")}>Run the demo <ArrowRight /></button>
        <small><ShieldCheck /> Simulated until signed live evidence exists.</small>
      </div>

      <div className="decision-canvas" aria-label="A locked lab repair scope flows into three provider calls and one award recommendation">
        <section className="canvas-scope">
          <header><span>1</span> VERIFIED SCOPE</header>
          <div className="scope-visual-card">
            <div className="scope-locked"><Check /> Scope locked</div>
            <div className="instrument-visual" aria-hidden="true"><span /><span /><span /><span /></div>
            <strong>SpinPro X2</strong>
            <small>Centrifuge · Error E17</small>
            <dl><div><dt>Work</dt><dd>Drive module</dd></div><div><dt>Calibration</dt><dd>Required</dd></div><div><dt>Location</dt><dd>On-site</dd></div></dl>
            <div className="scope-id"><LockKeyhole /> BB-7F3A-1042</div>
          </div>
        </section>

        <div className="canvas-connector" aria-hidden="true"><i /><i /><i /></div>

        <section className="canvas-calls">
          <header><span>2</span> PROVIDER CALLS</header>
          {providers.map((provider, index) => <article key={provider.name}>
            <div className="call-name"><i>{provider.name.slice(0, 2).toUpperCase()}</i><strong>{provider.name}</strong><em><span /> {index < 2 ? "COMPLETE" : "CALLBACK"}</em></div>
            <div className="waveform" aria-hidden="true">{provider.bars.map((height, bar) => <i key={bar} style={{ height }} />)}</div>
            <dl><div><dt>Total</dt><dd>{provider.total}</dd></div><div><dt>Warranty</dt><dd>{provider.warranty}</dd></div><div><dt>ETA</dt><dd>{provider.eta}</dd></div></dl>
          </article>)}
        </section>

        <div className="canvas-arrow" aria-hidden="true"><ArrowRight /></div>

        <section className="canvas-award">
          <header><span>3</span> AWARD</header>
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
      <h2>From failure to award</h2>
      <div className="journey-line">
        {flow.map(({ icon: Icon, number, label }) => <div key={label}><b>{number}</b><span><Icon /></span><strong>{label}</strong></div>)}
      </div>
      <div className="case-strip" aria-label="Saadia's guided repair case">
        <div className="case-person"><span>SA</span><strong>Saadia</strong></div>
        <div><small>INSTRUMENT</small><strong>SpinPro X2</strong></div>
        <ArrowRight />
        <div><small>FAILURE</small><strong>Error E17</strong></div>
        <ArrowRight />
        <div><small>DOWNTIME</small><span className="downtime-bars"><i /><i /><i /><i /><i /></span></div>
        <ArrowRight />
        <div><small>OUTCOME</small><strong>Human award</strong></div>
      </div>
    </section>

    <section className="visual-proof" id="challenge-proof">
      <div className="proof-matrix">
        <header><span>CHALLENGE PROOF</span><h2>Built honestly.</h2></header>
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
      <p><ShieldCheck /> BenchQuote recommends. A human decides.</p>
    </section>
  </main>;
}
