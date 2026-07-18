import { useState } from "react";
import { Bot, Check, Phone, PhoneOff, RotateCcw, ShieldCheck } from "lucide-react";

const providers = [
  { name: "OEM Precision", style: "Tough OEM", outcome: "ITEMIZED QUOTE", tone: "good", fields: [["Package total", "$3,100"],["Callout", "$350"],["Parts", "$500"],["Calibration", "Included"],["Response", "18h"],["Warranty", "180 days"]], transcript: ["You: I’m BenchBid, an AI calling for City Labs.", "Lisa: Are you a robot?", "You: Yes. I’m an AI agent representing the customer.", "Lisa: Calibration is included with a six-month warranty."] },
  { name: "RapidBench", style: "Hidden-fee independent", outcome: "CALLBACK COMMITMENT", tone: "warn", fields: [["Package total", "$2,450"],["Callout", "$450"],["Parts", "$400"],["Calibration", "+$600"],["Response", "36h"],["Loaner", "Unknown"]], transcript: ["You: Please itemize every mandatory fee.", "Dave: Calibration is separate.", "You: What is the complete additional amount?", "Dave: Six hundred. I’ll confirm parts ETA by 5 PM."] },
  { name: "MetroLab Field", style: "Stonewalling regional", outcome: "DOCUMENTED DECLINE", tone: "bad", fields: [["Package total", "Unknown"],["Callout", "Unknown"],["Parts", "Unknown"],["Calibration", "$250"],["Response", "24h"],["Warranty", "Unknown"]], transcript: ["You: Can you provide an itemized quote?", "Tom: We don’t quote that model by phone.", "You: Can you make a callback commitment?", "Tom: No. We’re going to pass."] },
];

export function CallRoom() {
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState<number | null>(null);
  const provider = providers[selected];
  return <main className="workflow-screen call-screen">
    <section className="scope-banner"><ShieldCheck /><div><span className="eyebrow">ScopePrint verified</span><strong>BB-7F3A-1042</strong></div><p>Every provider receives the identical confirmed version.</p><Check /></section>
    <div className="call-layout"><section className="call-lanes"><div className="call-header"><span>Provider & provenance</span><span>Connection</span><span>Call & transcript</span><span>Structured fields</span><span>Outcome</span></div>{providers.map((item, index) => <article className={selected === index ? "call-lane selected-lane" : "call-lane"} key={item.name} onClick={() => setSelected(index)}>
      <div><h2>{item.name}</h2><p>{item.style}</p><span className="provenance fixture">SIMULATED FIXTURE</span></div>
      <div className="connection"><span className={running === index ? "connected" : ""}>{running === index ? "Connected" : "Ready"}</span><strong>{running === index ? "00m 18s" : "—"}</strong>{running === index ? <button onClick={(event) => { event.stopPropagation(); setRunning(null); }}><PhoneOff size={14} /> End</button> : <button onClick={(event) => { event.stopPropagation(); setRunning(index); }}><Phone size={14} /> Run fixture</button>}<button className="retry"><RotateCcw size={13} /> Safe retry</button></div>
      <div className="transcript-preview"><div className={`wave ${item.tone}`} />{item.transcript.map(line => <p key={line}>{line}</p>)}</div>
      <dl>{item.fields.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className={`structured-outcome ${item.tone}`}><strong>{item.outcome}</strong><small>Transcript {item.tone === "warn" ? "pending" : "complete"}</small></div>
    </article>)}</section>
    <aside className="workflow-panel evidence-inspector"><span className="eyebrow">Evidence inspector</span><h2>{provider.name}</h2><blockquote>“{provider.transcript[provider.transcript.length - 1]}”</blockquote><div><span>Supports</span><strong>{provider.fields[3][0]}: {provider.fields[3][1]}</strong></div><div><span>Source</span><strong>Simulated fixture transcript</strong></div><div><span>Honesty check</span><strong><Bot size={15} /> AI disclosure present</strong></div><p>Fixture evidence demonstrates the interface only. It does not satisfy the challenge’s live-call criterion.</p></aside></div>
  </main>;
}
