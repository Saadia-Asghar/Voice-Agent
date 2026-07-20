import { useState } from "react";
import { useConversationControls, useConversationStatus } from "@elevenlabs/react";
import { Bot, Check, MapPin, Phone, PhoneOff, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "./Auth";
import { SCOPE_PRINT_SHORT, providerCallList, type ConfirmedScopePrint } from "./caseModel";
import { CallMechanicsBanner } from "./HowItWorksPanel";
import { VendorDiscovery } from "./VendorDiscovery";
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
  recordedLanes,
  setRecordedLanes,
  onLiveLeverage,
  onOpenCloser,
  onRequestSignIn,
  judgeMode = false,
}: { 
  confirmedScope: ConfirmedScopePrint | null;
  customQuotes: ServiceQuote[];
  setCustomQuotes: React.Dispatch<React.SetStateAction<ServiceQuote[]>>;
  setCustomConcessions: React.Dispatch<React.SetStateAction<any[]>>;
  recordedLanes: number[];
  setRecordedLanes: React.Dispatch<React.SetStateAction<number[]>>;
  onLiveLeverage?: () => void;
  onOpenCloser?: () => void;
  onRequestSignIn?: () => void;
  judgeMode?: boolean;
}) {
  const { startSession, endSession } = useConversationControls();
  const { status: liveStatus } = useConversationStatus();
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState<number | null>(null);
  const [liveLane, setLiveLane] = useState<number | null>(null);
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
    if (!authSession && onRequestSignIn) {
      onRequestSignIn();
      return;
    }
    const { supabaseUrl, publishableKey, buyerAgentId } = apiConfig();
    if (!scopeReady) return setLiveError("Lock the repair brief first (Step 1) so every vendor hears the same job.");
    if (!supabaseUrl || !publishableKey || !buyerAgentId) return setLiveError("Live calls are not available right now. Try a sample call instead.");
    const authHeader = authSession?.access_token ?? publishableKey;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authHeader}`,
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "bootstrap",
          agentId: buyerAgentId,
          provider: providerCallList[index].name,
          scopeHash: confirmedScope!.canonicalHash,
          scopeShortId: confirmedScope!.shortId,
          specification: confirmedScope!.specification,
          scopeJson: confirmedScope!.scopeJson,
        }),
      });
      if (!response.ok) throw new Error("Could not start the live call. Try a sample call instead.");
      const { token, signedUrl, callId, sessionProof } = await response.json() as { token?: string; signedUrl?: string; callId: string; sessionProof: string };
      setSessions((current) => ({ ...current, [index]: { callId, proof: sessionProof } }));
      setLiveLane(index);
      const sessionBase = {
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
        onConnect: ({ conversationId }: { conversationId: string }) => {
          void fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authHeader}`, apikey: publishableKey, "Content-Type": "application/json" },
            body: JSON.stringify({ action: "attach", callId, proof: sessionProof, conversationId }),
          });
        },
        onError: (msg: string) => setLiveError(String(msg)),
      };
      if (signedUrl) {
        startSession({ ...sessionBase, signedUrl, connectionType: "websocket" as const });
      } else if (token) {
        startSession({ ...sessionBase, conversationToken: token, connectionType: "webrtc" as const });
      } else {
        throw new Error("Live session credentials were empty.");
      }
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
    if (!session || !supabaseUrl || !publishableKey) return;
    const authHeader = authSession?.access_token ?? publishableKey;
    setLiveError(null);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authHeader}`, apikey: publishableKey, "Content-Type": "application/json" },
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
      if (!data.verified) throw new Error("Still saving the call recording. Wait a moment and click Confirm call again.");
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
        onLiveLeverage?.();
      }
    } catch (reason) {
      setLiveError(reason instanceof Error ? reason.message : "Evidence verification failed.");
    }
  };

  return <main className="workflow-screen call-screen">
    <header className="workflow-heading">
      <span className="module-kicker">Step 2 · Call Vendors</span>
      <h1>BenchDial calls all three vendors with the same repair brief.</h1>
      <p>Every vendor hears exactly the same job — no more repeating yourself. You can listen to a sample call for each vendor, or start a live call with your microphone.</p>
      {judgeMode && <p className="judge-inline-tip">No account needed. Press <strong>Preview sample call</strong> on any vendor to hear the demo, then click <strong>Continue to compare →</strong> to see the results.</p>}
    </header>

    <section className="scope-banner">
      <ShieldCheck />
      <div><span className="eyebrow">Same repair brief for every vendor</span><strong>{scopeLabel}</strong></div>
      <p>{scopeReady ? "Every vendor call uses this exact repair brief — no one quotes a different job." : "Go to Step 1 and lock a repair brief first. Sample calls still work for the demo."}</p>
      <Check />
    </section>

    {judgeMode && (
      <section className="demo-case-banner" role="status">
        <strong>Pinned demo path:</strong> SpinPro X2 centrifuge · Error E17 · City Labs.
        Three vendors are already loaded with sample quotes. Click <strong>Compare quotes →</strong> anytime, or <strong>Preview sample call</strong> first.
      </section>
    )}

    <CallMechanicsBanner />

    {onOpenCloser && (
      <section className="judge-call-actions" aria-label="Continue to comparison">
        <button type="button" className="primary-button" onClick={onOpenCloser}>Compare quotes →</button>
        <small>Sample quotes are already filled in. Preview a call or start a live call if you want — then continue.</small>
      </section>
    )}

    <VendorDiscovery site={confirmedScope?.specification.site?.split("/")[0]?.trim() ?? "City Labs"} />

    <section className="call-list-panel" aria-label="Provider call list provenance">
      <div className="section-title">
        <div><span className="eyebrow">Who gets called</span><h2>These three shops receive your repair brief.</h2></div>
        <MapPin />
      </div>
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
        <strong>{authSession ? "Signed in — live voice enabled" : judgeMode ? "Sample calls: no sign-in needed" : "Live call mode"}</strong>
        <p>{authSession
          ? "Click Start live call, allow your microphone, talk to the buyer agent. End call → wait → Confirm call."
          : judgeMode
            ? "For the video demo, use Preview sample call or skip straight to Compare quotes →. For live voice, sign in (top right) first."
            : "Sign in (top right) to run live voice calls. Sample calls work without an account."}</p>
      </div>
      {liveError && <span role="alert">{liveError}</span>}
    </section>

    <div className="call-layout">
      <section className="call-lanes">
        <div className="call-header"><span>Vendor</span><span>Status</span><span>Call transcript</span><span>Quoted terms</span><span>Result</span></div>

        {providerCallList.map((item, index) => {
          const quote = customQuotes[index];
          const tone = quote.status === "quote" ? "good" : quote.status === "callback" ? "warn" : "bad";
          const outcomeLabel = quote.status === "quote" ? "GOT A QUOTE" : quote.status === "callback" ? "CALLING BACK" : "DECLINED";
          const fields = getQuoteFields(quote);
          const transcriptLines = quote.evidence && quote.evidence.length > 0
            ? quote.evidence.map((ev) => `Live: “${ev.quote}”`)
            : item.transcript;

          return (
            <article className={selected === index ? "call-lane selected-lane" : "call-lane"} key={item.name} onClick={() => setSelected(index)}>
              <div>
                <h2>{item.name}</h2>
                <p>{item.style}</p>
                {liveLane === index && liveStatus === "connected" ? <span className="provenance live">ON CALL</span> : recordedLanes.includes(index) ? <span className="provenance recorded">LIVE — SAVED</span> : pendingLanes.includes(index) ? <span className="provenance fixture">SAVING…</span> : <span className="provenance fixture">SAMPLE CALL</span>}
              </div>
              <div className="connection">
                <span className={(running === index || liveLane === index) ? "connected" : ""}>{liveLane === index ? "On call…" : running === index ? "Playing sample" : "Ready"}</span>
                <strong>{running === index || liveLane === index ? "00m 18s" : "—"}</strong>
                {judgeMode ? (
                  <>
                    {liveLane === index
                      ? <button className="primary-button" onClick={(event) => { event.stopPropagation(); void stopLiveCall(); }}><PhoneOff size={14} /> End call</button>
                      : pendingLanes.includes(index)
                        ? <button className="primary-button" onClick={(event) => { event.stopPropagation(); void verifyEvidence(index); }}><ShieldCheck size={14} /> Confirm call</button>
                        : <button className="primary-button" disabled={liveLane !== null || liveStatus === "connecting"} onClick={(event) => { event.stopPropagation(); void startLiveCall(index); }}><Phone size={14} /> Start live call</button>}
                    {running === index
                      ? <button className="fixture-control" onClick={(event) => { event.stopPropagation(); setRunning(null); }}><PhoneOff size={14} /> Stop sample</button>
                      : <button className="fixture-control" disabled={liveLane !== null} onClick={(event) => { event.stopPropagation(); setRunning(index); }}><RotateCcw size={13} /> Preview sample call</button>}
                  </>
                ) : (
                  <>
                    {liveLane === index ? <button onClick={(event) => { event.stopPropagation(); void stopLiveCall(); }}><PhoneOff size={14} /> End call</button> : pendingLanes.includes(index) ? <button onClick={(event) => { event.stopPropagation(); void verifyEvidence(index); }}><ShieldCheck size={14} /> Confirm call</button> : <button disabled={liveLane !== null || liveStatus === "connecting"} onClick={(event) => { event.stopPropagation(); void startLiveCall(index); }}><Phone size={14} /> Start live call</button>}
                    {running === index ? <button className="fixture-control" onClick={(event) => { event.stopPropagation(); setRunning(null); }}><PhoneOff size={14} /> Stop sample</button> : <button className="fixture-control" disabled={liveLane !== null} onClick={(event) => { event.stopPropagation(); setRunning(index); }}><RotateCcw size={13} /> Preview sample call</button>}
                  </>
                )}
              </div>
              <div className="transcript-preview"><div className={`wave ${tone}`} />{transcriptLines.map((line) => <p key={line}>{line}</p>)}</div>
              <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <div className={`structured-outcome ${tone}`}><strong>{outcomeLabel}</strong><small>{item.conversationPoints.join(" · ")}</small></div>
            </article>
          );
        })}
      </section>
      <aside className="workflow-panel evidence-inspector">
        <span className="eyebrow">What the agent said</span>
        <h2>{provider.name}</h2>
        <blockquote>“{
          customQuotes[selected].evidence && customQuotes[selected].evidence.length > 0
            ? customQuotes[selected].evidence[customQuotes[selected].evidence.length - 1].quote
            : provider.transcript[provider.transcript.length - 1]
        }”</blockquote>

        <div><span>Key term</span><strong>{
          customQuotes[selected].status === "quote"
            ? `${getQuoteFields(customQuotes[selected])[3][0]}: ${getQuoteFields(customQuotes[selected])[3][1]}`
            : `Result: ${customQuotes[selected].status.toUpperCase()}`
        }</strong></div>
        <div><span>Call type</span><strong>{recordedLanes.includes(selected) ? "Your live call \u2014 saved" : pendingLanes.includes(selected) ? "Saving live call\u2026" : "Sample call (demo)"}</strong></div>
        <div><span>Approach</span><strong>{provider.negotiationType}</strong></div>
        <p>{recordedLanes.includes(selected) ? "This is from your actual live call with this vendor." : "This is a pre-written sample to show you how the call goes."}</p>
      </aside>
    </div>
  </main>;
}
