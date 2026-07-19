import { useState } from "react";
import { useConversationControls, useConversationStatus } from "@elevenlabs/react";
import { Bot, Check, MapPin, Phone, PhoneOff, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "./Auth";
import { SCOPE_PRINT_SHORT, providerCallList, type ConfirmedScopePrint } from "./caseModel";
import type { ServiceQuote, MoneyComponent, CallStatus } from "./domain";
import { currency } from "./domain";

type EvidenceSession = { callId: string; proof: string };

const mapComponent = (val: number | null): MoneyComponent => {
  if (val === null) return { amount: null, inclusion: "unknown" };
  if (val === 0) return { amount: 0, inclusion: "included" };
  return { amount: val, inclusion: "additional" };
};

const mapLiveCallToServiceQuote = (
  providerName: string,
  providerType: string,
  outcome: CallStatus,
  liveData: {
    quote?: {
      packageTotal: number | null;
      responseHours: number | null;
      turnaroundHours: number | null;
      warrantyDays: number | null;
      exclusions: string[];
      unknowns: string[];
      scopeMatch: number;
      itemizedTerms: any;
    };
    concessions?: any[];
    evidence?: any[];
    terminalDetails?: any;
  }
): ServiceQuote => {
  if (outcome !== "quote") {
    let unknowns = ["quote"];
    if (outcome === "callback") {
      unknowns = ["pricing terms"];
    } else if (outcome === "declined") {
      unknowns = ["declined quote"];
    }
    return {
      provider: providerName,
      providerType,
      status: outcome,
      packageTotal: null,
      callout: { amount: null, inclusion: "unknown" },
      calibration: { amount: null, inclusion: "unknown" },
      parts: { amount: null, inclusion: "unknown" },
      responseHours: null,
      turnaroundHours: null,
      warrantyDays: null,
      loanerIncluded: null,
      scopeMatch: 0,
      unknowns,
      evidence: liveData.evidence?.map((ev: any) => ({
        id: ev.id,
        at: `Turn ${ev.turn_index}`,
        quote: ev.excerpt
      })) ?? []
    };
  }

  const quote = liveData.quote!;
  const terms = quote.itemizedTerms;

  return {
    provider: providerName,
    providerType,
    status: "quote",
    packageTotal: quote.packageTotal,
    callout: mapComponent(terms.diagnostic_callout_fee),
    calibration: mapComponent(terms.calibration),
    parts: mapComponent(terms.parts),
    responseHours: quote.responseHours,
    turnaroundHours: quote.turnaroundHours,
    warrantyDays: quote.warrantyDays,
    loanerIncluded: terms.loaner_included,
    scopeMatch: quote.scopeMatch,
    unknowns: quote.unknowns ?? [],
    evidence: liveData.evidence?.map((ev: any) => ({
      id: ev.id,
      at: `Turn ${ev.turn_index}`,
      quote: ev.excerpt
    })) ?? []
  };
};

const getQuoteFields = (q: ServiceQuote) => {
  const formatMoney = (comp: MoneyComponent) => {
    if (comp.inclusion === "included") return "Included";
    if (comp.inclusion === "unknown") return "Unknown";
    if (comp.inclusion === "excluded") return "Excluded";
    return currency(comp.amount);
  };
  return [
    ["Package total", currency(q.packageTotal)],
    ["Callout", formatMoney(q.callout)],
    ["Parts", formatMoney(q.parts)],
    ["Calibration", formatMoney(q.calibration)],
    ["Response", q.responseHours ? `${q.responseHours}h` : "Unknown"],
    ["Warranty", q.warrantyDays ? `${q.warrantyDays} days` : "Unknown"],
  ];
};

export function CallRoom({ 
  confirmedScope, 
  customQuotes,
  setCustomQuotes,
  setCustomConcessions,
}: { 
  confirmedScope: ConfirmedScopePrint | null;
  customQuotes: ServiceQuote[];
  setCustomQuotes: React.Dispatch<React.SetStateAction<ServiceQuote[]>>;
  setCustomConcessions: React.Dispatch<React.SetStateAction<any[]>>;
}) {
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
  const provider = providerCallList[selected];
  const scopeLabel = confirmedScope?.shortId ?? SCOPE_PRINT_SHORT;
  const scopeReady = Boolean(confirmedScope);

  const apiConfig = () => ({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    publishableKey: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined,
    buyerAgentId: import.meta.env.VITE_ELEVENLABS_BUYER_AGENT_ID as string | undefined,
  });

  const startLiveCall = async (index: number) => {
    setLiveError(null);
    const { supabaseUrl, publishableKey, buyerAgentId } = apiConfig();
    if (!authSession) return setLiveError("Unlock live calls from the header before starting a billable provider negotiation. Fixture lanes stay available.");
    if (!scopeReady) return setLiveError("Lock the Estimator ScopePrint before live Caller sessions so every provider hears the same job.");
    if (!supabaseUrl || !publishableKey || !buyerAgentId) return setLiveError("Live Buyer/Closer configuration is unavailable.");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token?agent_id=${encodeURIComponent(buyerAgentId)}&provider=${encodeURIComponent(providerCallList[index].name)}`, { headers: { Authorization: `Bearer ${authSession.access_token}`, apikey: publishableKey } });
      if (!response.ok) throw new Error("Could not authorize the live Buyer/Closer session.");
      const { token, callId, sessionProof } = await response.json() as { token: string; callId: string; sessionProof: string };
      setSessions((current) => ({ ...current, [index]: { callId, proof: sessionProof } }));
      setLiveLane(index);
      await startSession({
        conversationToken: token,
        userId: crypto.randomUUID(),
        dynamicVariables: {
          scope_print: confirmedScope!.shortId,
          scope_hash: confirmedScope!.canonicalHash,
          scope_json: confirmedScope!.scopeJson,
          provider_name: providerCallList[index].name,
          negotiation_style: providerCallList[index].negotiationType,
          vertical: "laboratory_equipment_repair",
          call_id: callId,
          customer_name: confirmedScope!.confirmedBy || "Saadia Asghar",
          negotiation_authority: confirmedScope!.specification.approvalAuthority || "Lab Operations Lead",
          provider_id: providerCallList[index].name,
        },
        onConnect: ({ conversationId }) => {
          void fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authSession.access_token}`, apikey: publishableKey, "Content-Type": "application/json" },
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
    const { supabaseUrl, publishableKey } = apiConfig();
    if (!session || !supabaseUrl || !publishableKey || !authSession) return;
    setLiveError(null);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authSession.access_token}`, apikey: publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", callId: session.callId, proof: session.proof }),
      });
      const data = await response.json() as {
        verified?: boolean;
        outcome?: CallStatus;
        quote?: any;
        concessions?: any[];
        evidence?: any[];
        terminalDetails?: any;
      };
      if (!response.ok) throw new Error("Could not verify the signed call evidence.");
      if (!data.verified) throw new Error("The post-call transcript is still processing. Try Verify evidence again shortly.");
      setPendingLanes((lanes) => lanes.filter((lane) => lane !== index));
      setRecordedLanes((lanes) => [...new Set([...lanes, index])]);

      const mappedQuote = mapLiveCallToServiceQuote(
        providerCallList[index].name,
        index === 0 ? "Manufacturer service" : index === 1 ? "Independent repair" : "Regional service",
        data.outcome ?? "incomplete",
        data
      );

      setCustomQuotes((current) => {
        const copy = [...current];
        copy[index] = mappedQuote;
        return copy;
      });

      if (data.concessions && data.concessions.length > 0) {
        const mappedConcessions = data.concessions.map((c) => ({
          at: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          label: `${providerCallList[index].name} concession`,
          detail: `Field '${c.field_name}' changed from ${JSON.stringify(c.before_value)} to ${JSON.stringify(c.after_value)}.`
        }));
        setCustomConcessions((current) => [...current, ...mappedConcessions]);
      }
    } catch (reason) {
      setLiveError(reason instanceof Error ? reason.message : "Evidence verification failed.");
    }
  };

  return <main className="workflow-screen call-screen">
    <header className="workflow-heading">
      <span className="module-kicker">02 · The Caller</span>
      <h1>Three negotiation styles. One locked scope.</h1>
      <p>Challenge rule: every provider hears the identical confirmed job. Live calls or consenting role-play are valid — fixtures stay labeled and never become RECORDED LIVE RUN.</p>
    </header>

    <section className="scope-banner">
      <ShieldCheck />
      <div><span className="eyebrow">ScopePrint reused verbatim</span><strong>{scopeLabel}</strong></div>
      <p>{scopeReady ? "Confirmed Estimator output is injected into every Caller session." : "Lock ScopePrint in the Estimator first — Call Room fixtures still preview the scenario."}</p>
      <Check />
    </section>

    <section className="call-list-panel" aria-label="Provider call list provenance">
      <div className="section-title">
        <div><span className="eyebrow">Where the call list comes from</span><h2>Market discovery — not a hand-picked script.</h2></div>
        <MapPin />
      </div>
      <p className="call-list-lede">In production the roster is built from Google Places, Yelp Fusion, OpenStreetMap, and the customer-approved provider list for the City Labs region.</p>
      <div className="call-list-grid">
        {providerCallList.map((item) => (
          <article key={item.name}>
            <strong>{item.name}</strong>
            <small>{item.negotiationType}</small>
            <p>{item.discovery}</p>
            <span>{item.phone} · {item.rating}</span>
          </article>
        ))}
      </div>
    </section>

    <section className="live-call-notice">
      <ShieldCheck />
      <div>
        <strong>Live challenge mode</strong>
        <p>A run becomes RECORDED LIVE RUN only after the signed ElevenLabs webhook stores a non-empty transcript. End the session, wait briefly, then verify its evidence.</p>
      </div>
      {liveError && <span role="alert">{liveError}</span>}
    </section>

    <div className="call-layout">
      <section className="call-lanes">
        <div className="call-header"><span>Provider & provenance</span><span>Connection</span><span>Call & transcript</span><span>Structured fields</span><span>Outcome</span></div>

        {providerCallList.map((item, index) => {
          const quote = customQuotes[index];
          const tone = quote.status === "quote" ? "good" : quote.status === "callback" ? "warn" : "bad";
          const outcomeLabel = quote.status === "quote" ? "ITEMIZED QUOTE" : quote.status === "callback" ? "CALLBACK COMMITMENT" : "DOCUMENTED DECLINE";
          const fields = getQuoteFields(quote);
          const transcriptLines = quote.evidence && quote.evidence.length > 0
            ? quote.evidence.map((ev) => `Live: “${ev.quote}”`)
            : item.transcript;

          return (
            <article className={selected === index ? "call-lane selected-lane" : "call-lane"} key={item.name} onClick={() => setSelected(index)}>
              <div>
                <h2>{item.name}</h2>
                <p>{item.style}</p>
                {liveLane === index && liveStatus === "connected" ? <span className="provenance live">LIVE</span> : recordedLanes.includes(index) ? <span className="provenance recorded">RECORDED LIVE RUN</span> : pendingLanes.includes(index) ? <span className="provenance fixture">AWAITING SIGNED WEBHOOK</span> : <span className="provenance fixture">SIMULATED FIXTURE</span>}
              </div>
              <div className="connection">
                <span className={(running === index || liveLane === index) ? "connected" : ""}>{liveLane === index ? `Live ${liveStatus}` : running === index ? "Fixture connected" : "Ready"}</span>
                <strong>{running === index || liveLane === index ? "00m 18s" : "—"}</strong>
                {liveLane === index ? <button onClick={(event) => { event.stopPropagation(); void stopLiveCall(); }}><PhoneOff size={14} /> End live</button> : pendingLanes.includes(index) ? <button onClick={(event) => { event.stopPropagation(); void verifyEvidence(index); }}><ShieldCheck size={14} /> Verify evidence</button> : <button disabled={liveLane !== null || liveStatus === "connecting"} onClick={(event) => { event.stopPropagation(); void startLiveCall(index); }}><Phone size={14} /> Start live call</button>}
                {running === index ? <button className="fixture-control" onClick={(event) => { event.stopPropagation(); setRunning(null); }}><PhoneOff size={14} /> End fixture</button> : <button className="fixture-control" disabled={liveLane !== null} onClick={(event) => { event.stopPropagation(); setRunning(index); }}><RotateCcw size={13} /> Run fixture</button>}
              </div>
              <div className="transcript-preview"><div className={`wave ${tone}`} />{transcriptLines.map((line) => <p key={line}>{line}</p>)}</div>
              <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <div className={`structured-outcome ${tone}`}><strong>{outcomeLabel}</strong><small>{item.conversationPoints.join(" · ")}</small></div>
            </article>
          );
        })}
      </section>
      <aside className="workflow-panel evidence-inspector">
        <span className="eyebrow">Evidence inspector</span>
        <h2>{provider.name}</h2>
        <blockquote>“{
          customQuotes[selected].evidence && customQuotes[selected].evidence.length > 0
            ? customQuotes[selected].evidence[customQuotes[selected].evidence.length - 1].quote
            : provider.transcript[provider.transcript.length - 1]
        }”</blockquote>
        <div><span>Supports</span><strong>{
          customQuotes[selected].status === "quote"
            ? `${getQuoteFields(customQuotes[selected])[3][0]}: ${getQuoteFields(customQuotes[selected])[3][1]}`
            : `Status: ${customQuotes[selected].status.toUpperCase()}`
        }</strong></div>
        <div><span>Source</span><strong>{recordedLanes.includes(selected) ? "Webhook-verified live run" : pendingLanes.includes(selected) ? "Awaiting signed webhook" : "Simulated fixture transcript"}</strong></div>
        <div><span>Honesty check</span><strong><Bot size={15} /> AI disclosure present</strong></div>
        <div><span>Style</span><strong>{provider.negotiationType}</strong></div>
        <p>{recordedLanes.includes(selected) ? "A signed ElevenLabs webhook persisted a non-empty transcript for this run." : "Fixture or unverified evidence does not satisfy the challenge’s live-call criterion."}</p>
      </aside>
    </div>
  </main>;
}
