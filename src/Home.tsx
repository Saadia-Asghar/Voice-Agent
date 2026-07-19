import {
  ArrowRight,
  AudioWaveform,
  Bot,
  Check,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

type WorkflowStep = "Scope" | "Call room" | "Deal room" | "Award memo";

const workflow = [
  { icon: Mic, number: "01", title: "Brief the repair once", text: "Combine a voice interview and service documents into one human-confirmed repair specification." },
  { icon: Phone, number: "02", title: "Call on equal terms", text: "Each provider receives the identical locked scope, so travel, parts, calibration, timing, and warranty become comparable." },
  { icon: MessageSquareText, number: "03", title: "Negotiate with receipts", text: "The closer can use only server-verified leverage. Every measurable change links back to the conversation that caused it." },
  { icon: FileCheck2, number: "04", title: "Recommend, never purchase", text: "Cash, downtime, coverage, exclusions, and unknowns become a plain-language award memo for human approval." },
] as const;

const challengeProof = [
  ["Voice interview UI and document attachment", "UI READY · EXTRACTION PENDING", "pending"],
  ["Canonical repair scope reused across calls", "CONTRACT TESTED · LIVE BINDING PENDING", "pending"],
  ["Three distinct negotiation styles", "FIXTURES READY · LIVE EVIDENCE REQUIRED", "pending"],
  ["Itemized quote, callback, or decline", "SCHEMA TESTED · AGENT TOOLS PENDING", "pending"],
  ["Leverage-caused measurable concession", "FIXTURE PROOF · LIVE EVIDENCE REQUIRED", "pending"],
  ["AI disclosure and no-bluff guardrails", "ACTIVE + TESTED", "complete"],
  ["Ranked, evidence-linked recommendation", "DEMO READY · LIVE PIPELINE PENDING", "pending"],
] as const;

const callRows = [
  { name: "OEM Precision", detail: "Complete package", total: "$3,950", eta: "18h", warranty: "180d", state: "QUOTE" },
  { name: "RapidBench", detail: "Travel fee uncovered", total: "$2,950", eta: "42h", warranty: "90d", state: "QUOTE" },
  { name: "MetroLab Field", detail: "Specialist callback", total: "—", eta: "Tue", warranty: "—", state: "CALLBACK" },
] as const;

export function Home({ onOpen }: { onOpen: (step: WorkflowStep) => void }) {
  return <main className="home-screen" id="home">
    <section className="home-hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="home-copy">
        <span className="hero-audience"><AudioWaveform size={15} /> AI voice procurement for lab operations</span>
        <h1>Comparable lab repair quotes.<br /><em>One voice brief.</em></h1>
        <p>BenchQuote helps laboratory operations teams turn one verified repair scope into consistent provider calls, truthful negotiation, and a decision they can defend.</p>
        <div className="home-actions">
          <button className="home-primary" onClick={() => onOpen("Scope")}><Mic size={17} /> Run Saadia&apos;s demo</button>
          <a className="home-secondary" href="#how-it-works">See how it works <ArrowRight size={16} /></a>
        </div>
        <small><ShieldCheck size={14} /> Simulated demo until signed live transcripts exist. BenchQuote cannot purchase or bind a contract.</small>
      </div>

      <div className="product-preview" aria-label="Simulated BenchQuote provider comparison preview">
        <div className="preview-topline">
          <div><span className="preview-logo"><AudioWaveform /></span><strong>Repair event · SpinPro X2</strong></div>
          <span className="demo-chip">SIMULATED DEMO</span>
        </div>
        <div className="preview-scope">
          <span><LockKeyhole /></span>
          <div><small>SCOPE VERIFIED</small><strong>Drive module E17 · calibration required</strong></div>
          <em>BB-7F3A-1042</em>
        </div>
        <div className="preview-table">
          <div className="preview-table-head"><span>Provider call</span><span>Total</span><span>ETA</span><span>Warranty</span><span>Outcome</span></div>
          {callRows.map((row, index) => <div className={index === 0 ? "preview-row selected" : "preview-row"} key={row.name}>
            <span className="provider-cell"><i>{index + 1}</i><span><strong>{row.name}</strong><small>{row.detail}</small></span><AudioWaveform /></span>
            <strong>{row.total}</strong><span>{row.eta}</span><span>{row.warranty}</span><em>{row.state}</em>
          </div>)}
        </div>
        <div className="preview-award">
          <span className="award-icon"><Sparkles /></span>
          <div><small>RECOMMENDED AFTER DOWNTIME</small><strong>OEM Precision</strong><p>Complete scope · fastest recovery · strongest warranty</p></div>
          <button onClick={() => onOpen("Award memo")}>View memo <ArrowRight size={15} /></button>
        </div>
        <div className="floating-call"><span className="live-dot" /><div><small>VOICE LANE 02</small><strong>Negotiating travel fee</strong></div><AudioWaveform /></div>
      </div>

      <div className="hero-outcomes" aria-label="BenchQuote outcomes">
        <div><FileText /><span><strong>One scope</strong><small>Confirmed before calling</small></span></div>
        <div><Phone /><span><strong>Three comparable calls</strong><small>Same requirements every time</small></span></div>
        <div><ShieldCheck /><span><strong>One defensible decision</strong><small>Evidence stays attached</small></span></div>
      </div>
    </section>

    <section className="problem-split" aria-labelledby="problem-title">
      <div><span className="split-number">01</span><div><h2 id="problem-title">Lab repair quotes are not really comparable.</h2><p>Travel, diagnostics, parts, calibration, warranty, and response time hide behind one headline price—usually scattered across phone calls and notes.</p></div></div>
      <div><span className="split-number">02</span><div><h2>BenchQuote makes the assumptions visible.</h2><p>It holds the scope constant, preserves unknowns, and shows which call supports every price, concession, and recommendation.</p></div></div>
    </section>

    <section className="home-section" id="how-it-works">
      <div className="home-section-heading"><span>THE CONNECTED WORKFLOW</span><h2>From broken instrument to reviewable award.</h2><p>Not four polished fragments: the same confirmed scope, call records, commercial terms, and transcript evidence move through the whole product.</p></div>
      <div className="workflow-rail">{workflow.map(({ icon: Icon, number, title, text }) => <article key={number}><div><b>{number}</b><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="demo-band">
      <div className="demo-person"><span className="demo-avatar">SA</span><div><span>GUIDED DEMO USER</span><h2>Saadia Asghar</h2><p>Lab Operations Lead · City Labs</p></div></div>
      <dl><div><dt>Equipment</dt><dd>SpinPro X2 centrifuge</dd></div><div><dt>Failure</dt><dd>Error E17 / drive module</dd></div><div><dt>Decision pressure</dt><dd>Every hour affects experiments</dd></div><div><dt>Required outcome</dt><dd>Comparable offers + calibration proof</dd></div></dl>
      <div className="demo-next"><p>Lock one repair brief, inspect three consented demo lanes, verify a concession, and review the ranked award memo.</p><button className="home-primary" onClick={() => onOpen("Deal room")}>Resume the case <ArrowRight size={17} /></button><small>SIMULATED FIXTURES · NOT LIVE CALL EVIDENCE</small></div>
    </section>

    <section className="home-two-column" id="challenge-proof">
      <div className="proof-ledger"><div className="home-section-heading"><span>HONEST CHALLENGE PROOF</span><h2>Seven gates. Status shown as it is.</h2></div><ol>{challengeProof.map(([label, status, state], index) => <li key={label}><b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span><strong className={state}>{state === "complete" ? <Check /> : <CircleAlert />}{status}</strong></li>)}</ol></div>
      <aside className="agent-readiness">
        <div className="home-section-heading"><span>WHY IT IS MORE THAN A WRAPPER</span><h2>Voice changes the decision state.</h2></div>
        <div className="agent-list"><div><Bot /><span><strong>Bounded agents</strong><small>Estimator, buyer, and provider personas</small></span><em>PROMPTS TESTED</em></div><div><LockKeyhole /><span><strong>Honesty firewall</strong><small>No invented bids or hidden authority</small></span><em>GUARDRAILS ACTIVE</em></div><div><Clock3 /><span><strong>Downtime economics</strong><small>Ranks recovery cost, not sticker price</small></span><em>DOMAIN LOGIC TESTED</em></div></div>
        <p><ShieldCheck /> Commercial numbers, terminal outcomes, and leverage are validated outside the language model. Human approval remains the final boundary.</p>
      </aside>
    </section>

    <section className="home-final">
      <div><Sparkles /><h2>Stop comparing prices.<br />Compare recoveries.</h2><p>Built for laboratory managers, research operations, and procurement reviewers under downtime pressure.</p></div>
      <button className="home-primary" onClick={() => onOpen("Scope")}>Build the repair brief <ArrowRight size={17} /></button>
      <span><UserRound size={15} /> BenchQuote recommends. A human reviews and decides.</span>
    </section>
  </main>;
}
