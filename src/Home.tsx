import {
  ArrowRight,
  Bot,
  Check,
  CircleAlert,
  FileCheck2,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Mic,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

type WorkflowStep = "Scope" | "Call room" | "Deal room" | "Award memo";

const workflow = [
  { icon: Mic, number: "01", title: "Voice + document intake", text: "Describe the failure once. Upload a service report or quote. Both paths produce the same confirmed ScopePrint." },
  { icon: Phone, number: "02", title: "Same-scope calls", text: "Every provider hears the same locked requirements while the agent extracts fees, exclusions, timing, and warranty." },
  { icon: MessageSquareText, number: "03", title: "Verified negotiation", text: "The closer may use only a competing term the server can prove. Every measurable concession gets a transcript receipt." },
  { icon: FileCheck2, number: "04", title: "Ranked award memo", text: "Cash, downtime, scope coverage, unknowns, and red flags become a plain-language recommendation for human approval." },
] as const;

const challengeProof = [
  ["One voice-and-document specification", "BUILT + TESTED", "complete"],
  ["Verbatim ScopePrint reused across calls", "BUILT + TESTED", "complete"],
  ["Three distinct live negotiation styles", "HUMAN EVIDENCE REQUIRED", "pending"],
  ["Itemized quote, callback, or decline", "BUILT + TESTED", "complete"],
  ["Leverage-caused measurable concession", "HUMAN EVIDENCE REQUIRED", "pending"],
  ["AI disclosure and no-bluff guardrails", "ACTIVE + TESTED", "complete"],
  ["Ranked recommendation with call evidence", "BUILT / LIVE PROOF PENDING", "pending"],
] as const;

const agents = [
  ["Estimator", "Voice intake", "Prompt hardened"],
  ["Buyer / Closer", "Quote + negotiate", "Focus + injection guards active"],
  ["OEM Precision", "Tough complete quote", "Fixture agent ready"],
  ["RapidBench", "Hidden-fee negotiation", "Fixture agent ready"],
  ["MetroLab Field", "Refusal / decline", "Fixture agent ready"],
] as const;

export function Home({ onOpen }: { onOpen: (step: WorkflowStep) => void }) {
  return <main className="home-screen" id="home">
    <section className="home-hero">
      <div className="home-copy">
        <h1>Describe it once.<br />Let the market compete.</h1>
        <p>ScopeDial turns one confirmed repair scope into comparable voice calls, truthful negotiation, and an evidence-backed award memo.</p>
        <div className="home-actions">
          <button className="home-primary" onClick={() => onOpen("Scope")}><Mic size={17} /> Start Saadia&apos;s demo</button>
          <a className="home-secondary" href="#challenge-proof">See the proof <ArrowRight size={16} /></a>
        </div>
        <small><ShieldCheck size={14} /> The demo is simulated until signed live transcripts exist. ScopeDial never purchases or binds a contract.</small>
      </div>

      <div className="workflow-signal" aria-label="ScopeDial demo workflow">
        <div className="signal-label">SIMULATED DEMO</div>
        <div className="signal-track">
          <div><span><LockKeyhole /></span><strong>Scope locked</strong><small>BB-7F3A-1042</small></div>
          <i aria-hidden="true" />
          <div><span><Phone /></span><strong>3 calls</strong><small>Same scope</small></div>
          <i aria-hidden="true" />
          <div><span><MessageSquareText /></span><strong>1 concession</strong><small>Fixture proof</small></div>
          <i aria-hidden="true" />
          <div><span><FileCheck2 /></span><strong>Award memo</strong><small>Human approval</small></div>
        </div>
      </div>
    </section>

    <section className="problem-split" aria-labelledby="problem-title">
      <div>
        <CircleAlert />
        <div><h2 id="problem-title">The problem: the real repair price is trapped in phone calls.</h2><p>Laboratory managers repeat the same failure to multiple providers, then receive headline prices with different assumptions about travel, diagnostics, parts, calibration, warranty, and response time.</p></div>
      </div>
      <div>
        <ShieldCheck />
        <div><h2>The solution: evidence before you decide.</h2><p>ScopeDial makes the job comparable first, negotiates without bluffing, preserves unknowns, and shows exactly which call supports every recommendation.</p></div>
      </div>
    </section>

    <section className="home-section" id="how-it-works">
      <div className="home-section-heading"><span>HOW IT WORKS</span><h2>One connected loop—not four polished fragments.</h2><p>The same confirmed scope, call records, commercial terms, and transcript evidence move through the whole product.</p></div>
      <div className="workflow-rail">
        {workflow.map(({ icon: Icon, number, title, text }) => <article key={number}><div><b>{number}</b><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </section>

    <section className="demo-band">
      <div className="demo-person">
        <span className="demo-avatar">SA</span>
        <div><span>GUIDED DEMO USER</span><h2>Saadia Asghar</h2><p>Lab Operations Lead · City Labs</p></div>
      </div>
      <dl>
        <div><dt>Equipment</dt><dd>SpinPro X2 centrifuge</dd></div>
        <div><dt>Failure</dt><dd>Error E17 / drive module</dd></div>
        <div><dt>Decision pressure</dt><dd>Every hour of downtime affects experiments</dd></div>
        <div><dt>Required outcome</dt><dd>Comparable repair offers with calibration proof</dd></div>
      </dl>
      <div className="demo-next"><p>You will lock one ScopePrint, run three consented demo lanes, inspect a verified concession, and review the ranked award memo.</p><button className="home-primary" onClick={() => onOpen("Deal room")}>Resume Saadia&apos;s demo <ArrowRight size={17} /></button><small>SIMULATED FIXTURES · NOT LIVE CALL EVIDENCE</small></div>
    </section>

    <section className="home-two-column" id="challenge-proof">
      <div className="proof-ledger">
        <div className="home-section-heading"><span>CHALLENGE PROOF</span><h2>Seven gates. No hidden shortcuts.</h2></div>
        <ol>{challengeProof.map(([label, status, state], index) => <li key={label}><b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span><strong className={state}>{state === "complete" ? <Check /> : <CircleAlert />}{status}</strong></li>)}</ol>
      </div>
      <aside className="agent-readiness">
        <div className="home-section-heading"><span>AGENT READINESS</span><h2>Five bounded voices, one evidence policy.</h2></div>
        <div className="agent-list">{agents.map(([name, role, state]) => <div key={name}><Bot /><span><strong>{name}</strong><small>{role}</small></span><em>{state}</em></div>)}</div>
        <p><LockKeyhole /> Prompts remain below the platform&apos;s practical two-thousand-token guidance. Tool calls, terminal outcomes, and commercial numbers are validated outside the model.</p>
      </aside>
    </section>

    <section className="home-final">
      <div><Sparkles /><h2>Turn phone-market chaos into a decision you can defend.</h2><p>Start with the guided centrifuge case, then replace the fixture evidence with three genuine consenting calls.</p></div>
      <button className="home-primary" onClick={() => onOpen("Scope")}>Start from ScopePrint <ArrowRight size={17} /></button>
      <span><UserRound size={15} /> Built for laboratory managers, research operations, and procurement reviewers.</span>
    </section>
  </main>;
}
