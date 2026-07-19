import { useState } from "react";
import { useConversationControls, useConversationStatus } from "@elevenlabs/react";
import { Bot, Check, Phone, PhoneOff, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "./Auth";

const providers = [
  { name: "OEM Precision", style: "Tough OEM", outcome: "ITEMIZED QUOTE", tone: "good", fields: [["Package total", "$3,100"],["Callout", "$350"],["Parts", "$500"],["Calibration", "Included"],["Response", "18h"],["Warranty", "180 days"]], transcript: ["You: I’m ScopeDial, an AI calling for City Labs.", "Lisa: Are you a robot?", "You: Yes. I’m an AI agent representing the customer.", "Lisa: Calibration is included with a six-month warranty."] },
  { name: "RapidBench", style: "Hidden-fee independent", outcome: "CALLBACK COMMITMENT", tone: "warn", fields: [["Package total", "$2,450"],["Callout", "$450"],["Parts", "$400"],["Calibration", "+$600"],["Response", "36h"],["Loaner", "Unknown"]], transcript: ["You: Please itemize every mandatory fee.", "Dave: Calibration is separate.", "You: What is the complete additional amount?", "Dave: Six hundred. I’ll confirm parts ETA by 5 PM."] },
  { name: "MetroLab Field", style: "Stonewalling regional", outcome: "DOCUMENTED DECLINE", tone: "bad", fields: [["Package total", "Unknown"],["Callout", "Unknown"],["Parts", "Unknown"],["Calibration", "$250"],["Response", "24h"],["Warranty", "Unknown"]], transcript: ["You: Can you provide an itemized quote?", "Tom: We don’t quote that model by phone.", "You: Can you make a callback commitment?", "Tom: No. We’re going to pass."] },
];

type EvidenceSession = { callId: string; proof: string };

export function CallRoom() {
  const { startSession, endSession } = useConversationControls();
  const { status: liveStatus } = useConversationStatus();
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState<number | null>(null);
  const [liveLane, setLiveLane] = useState<number | null>(null);
  const [recordedLanes, setRecordedLanes] = useState<number[]>([]);
  const [pendingLanes, setPendingLanes] = useState<number[]>([]);
  const [sessions, setSessions] = useState<Record<number, EvidenceSession>>({});
  const [liveError, setLiveError] = useState<string | null>(null);
  const { session: authSession } = useAuth();
  const provider = providers[selected];

  const apiConfig = () => ({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
    buyerAgentId: import.meta.env.VITE_ELEVENLABS_BUYER_AGENT_ID as string | undefined,
  });

  const startLiveCall = async (index: number) => {
    setLiveError(null);
    const { supabaseUrl, anonKey, buyerAgentId } = apiConfig();
    if (!authSession) return setLiveError("Sign in from the header before starting a billable live call. Fixture lanes remain available.");
    if (!supabaseUrl || !anonKey || !buyerAgentId) return setLiveError("Live Buyer/Closer configuration is unavailable.");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token?agent_id=${encodeURIComponent(buyerAgentId)}&provider=${encodeURIComponent(providers[index].name)}`, { headers: { Authorization: `Bearer ${authSession.access_token}`, apikey: anonKey } });
      if (!response.ok) throw new Error("Could not authorize the live Buyer/Closer session.");
      const { token, callId, sessionProof } = await response.json() as { token: string; callId: string; sessionProof: string };
      setSessions((current) => ({ ...current, [index]: { callId, proof: sessionProof } }));
      setLiveLane(index);
      await startSession({
        conversationToken: token,
        userId: crypto.randomUUID(),
        onConnect: ({ conversationId }) => {
          void fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authSession.access_token}`, apikey: anonKey, "Content-Type": "application/json" },
            body: JSON.stringify({ action: "attach", callId, proof: sessionProof, conversationId }),
          });
        },
      });
    } catch (reason) {
      setLiveLane(null);
      setLiveError(reason instanceof Error ? reason.message : "Live call could not start.");
    }
  };

  const stopLiveCall = async () => {
    const completedLane = liveLane;
    await endSession();
    if (completedLane !== null) setPendingLanes((lanes) => [...new Set([...lanes, completedLane])]);
    setLiveLane(null);
  };

  const verifyEvidence = async (index: number) => {
    const session = sessions[index];
    const { supabaseUrl, anonKey } = apiConfig();
    if (!session || !supabaseUrl || !anonKey || !authSession) return;
    setLiveError(null);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authSession.access_token}`, apikey: anonKey, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", callId: session.callId, proof: session.proof }),
      });
      const status = await response.json() as { verified?: boolean };
      if (!response.ok) throw new Error("Could not verify the signed call evidence.");
      if (!status.verified) throw new Error("The post-call transcript is still processing. Try Verify evidence again shortly.");
      setPendingLanes((lanes) => lanes.filter((lane) => lane !== index));
      setRecordedLanes((lanes) => [...new Set([...lanes, index])]);
    } catch (reason) {
      setLiveError(reason instanceof Error ? reason.message : "Evidence verification failed.");
    }
  };

  return <main className="workflow-screen call-screen">
    <header className="workflow-heading"><h1>Three providers. One locked scope. No hidden assumptions.</h1><p>Every conversation starts from the same ScopePrint and ends in structured, auditable evidence.</p></header>
    <section className="scope-banner"><ShieldCheck /><div><span className="eyebrow">ScopePrint verified</span><strong>BB-7F3A-1042</strong></div><p>Every provider receives the identical confirmed version.</p><Check /></section>
    <section className="live-call-notice"><ShieldCheck /><div><strong>Live challenge mode</strong><p>A run becomes RECORDED LIVE RUN only after the signed ElevenLabs webhook stores a non-empty transcript. End the session, wait briefly, then verify its evidence.</p></div>{liveError && <span role="alert">{liveError}</span>}</section>
    <div className="call-layout"><section className="call-lanes"><div className="call-header"><span>Provider & provenance</span><span>Connection</span><span>Call & transcript</span><span>Structured fields</span><span>Outcome</span></div>{providers.map((item, index) => <article className={selected === index ? "call-lane selected-lane" : "call-lane"} key={item.name} onClick={() => setSelected(index)}>
      <div><h2>{item.name}</h2><p>{item.style}</p>{liveLane === index && liveStatus === "connected" ? <span className="provenance live">LIVE</span> : recordedLanes.includes(index) ? <span className="provenance recorded">RECORDED LIVE RUN</span> : pendingLanes.includes(index) ? <span className="provenance fixture">AWAITING SIGNED WEBHOOK</span> : <span className="provenance fixture">SIMULATED FIXTURE</span>}</div>
      <div className="connection"><span className={(running === index || liveLane === index) ? "connected" : ""}>{liveLane === index ? `Live ${liveStatus}` : running === index ? "Fixture connected" : "Ready"}</span><strong>{running === index || liveLane === index ? "00m 18s" : "—"}</strong>{liveLane === index ? <button onClick={(event) => { event.stopPropagation(); void stopLiveCall(); }}><PhoneOff size={14} /> End live</button> : pendingLanes.includes(index) ? <button onClick={(event) => { event.stopPropagation(); void verifyEvidence(index); }}><ShieldCheck size={14} /> Verify evidence</button> : <button disabled={liveLane !== null || liveStatus === "connecting"} onClick={(event) => { event.stopPropagation(); void startLiveCall(index); }}><Phone size={14} /> Start live call</button>}{running === index ? <button className="fixture-control" onClick={(event) => { event.stopPropagation(); setRunning(null); }}><PhoneOff size={14} /> End fixture</button> : <button className="fixture-control" disabled={liveLane !== null} onClick={(event) => { event.stopPropagation(); setRunning(index); }}><RotateCcw size={13} /> Run fixture</button>}</div>
      <div className="transcript-preview"><div className={`wave ${item.tone}`} />{item.transcript.map(line => <p key={line}>{line}</p>)}</div>
      <dl>{item.fields.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className={`structured-outcome ${item.tone}`}><strong>{item.outcome}</strong><small>Transcript {item.tone === "warn" ? "pending" : "complete"}</small></div>
    </article>)}</section>
    <aside className="workflow-panel evidence-inspector"><span className="eyebrow">Evidence inspector</span><h2>{provider.name}</h2><blockquote>“{provider.transcript[provider.transcript.length - 1]}”</blockquote><div><span>Supports</span><strong>{provider.fields[3][0]}: {provider.fields[3][1]}</strong></div><div><span>Source</span><strong>{recordedLanes.includes(selected) ? "Webhook-verified live run" : pendingLanes.includes(selected) ? "Awaiting signed webhook" : "Simulated fixture transcript"}</strong></div><div><span>Honesty check</span><strong><Bot size={15} /> AI disclosure present</strong></div><p>{recordedLanes.includes(selected) ? "A signed ElevenLabs webhook persisted a non-empty transcript for this run." : "Fixture or unverified evidence does not satisfy the challenge’s live-call criterion."}</p></aside></div>
  </main>;
}
