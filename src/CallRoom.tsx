import { useMemo, useState } from "react";
import { useConversationControls, useConversationStatus } from "@elevenlabs/react";
import { Check, Phone, PhoneOff, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "./Auth";
import { SCOPE_PRINT_SHORT, providerCallList, type ConfirmedScopePrint } from "./caseModel";
import { CallMechanicsBanner } from "./HowItWorksPanel";
import { VendorDiscovery } from "./VendorDiscovery";
import type { ServiceQuote, MoneyComponent, CallStatus } from "./domain";
import { currency } from "./domain";
import { dialVendorOutbound, fixtureVendors, sourceLabel, type LiveVendor } from "./vendorLive";

type EvidenceSession = { callId: string; proof: string };

const emptyQuote = (name: string, providerType = "Live search"): ServiceQuote => ({
  provider: name,
  providerType,
  status: "incomplete",
  packageTotal: null,
  callout: { amount: null, inclusion: "unknown" },
  calibration: { amount: null, inclusion: "unknown" },
  parts: { amount: null, inclusion: "unknown" },
  responseHours: null,
  turnaroundHours: null,
  warrantyDays: null,
  loanerIncluded: null,
  scopeMatch: 0,
  unknowns: ["awaiting live outbound or browser call"],
  evidence: [],
});

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
  },
): ServiceQuote => {
  if (outcome !== "quote") {
    return {
      ...emptyQuote(providerName, providerType),
      status: outcome,
      unknowns: outcome === "callback" ? ["pricing terms"] : outcome === "declined" ? ["declined quote"] : ["quote"],
      evidence: liveData.evidence?.map((ev: any) => ({
        id: ev.id,
        at: `Turn ${ev.turn_index}`,
        quote: ev.excerpt,
      })) ?? [],
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
      quote: ev.excerpt,
    })) ?? [],
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
  const [dialingLanes, setDialingLanes] = useState<number[]>([]);
  const [outboundNotes, setOutboundNotes] = useState<Record<number, string>>({});
  const [sessions, setSessions] = useState<Record<number, EvidenceSession>>({});
  const [liveError, setLiveError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<LiveVendor[]>(() => fixtureVendors());
  const [searchMeta, setSearchMeta] = useState({ searchMode: "fixtures", query: "" });
  const { session: authSession } = useAuth();
  const scopeLabel = confirmedScope?.shortId ?? SCOPE_PRINT_SHORT;
  const scopeReady = Boolean(confirmedScope);
  const selectedVendor = vendors[selected] ?? vendors[0];
  const fixtureMatch = useMemo(
    () => providerCallList.find((item) => item.name === selectedVendor?.name),
    [selectedVendor?.name],
  );

  const apiConfig = () => ({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    publishableKey: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined,
    buyerAgentId: import.meta.env.VITE_ELEVENLABS_BUYER_AGENT_ID as string | undefined,
  });

  const applyVendors = (next: LiveVendor[], meta: { searchMode: string; query: string; error?: string }) => {
    setVendors(next.slice(0, 5));
    setSearchMeta({ searchMode: meta.searchMode, query: meta.query });
    setSelected(0);
    setLiveError(meta.error ?? null);
    setCustomQuotes((current) => next.slice(0, 5).map((vendor, index) => {
      const existing = current.find((quote) => quote.provider === vendor.name);
      if (existing) return existing;
      const fixture = providerCallList.find((item) => item.name === vendor.name);
      if (fixture) {
        const fixtureQuote = current[providerCallList.findIndex((item) => item.name === vendor.name)];
        if (fixtureQuote) return fixtureQuote;
      }
      return emptyQuote(vendor.name, sourceLabel(vendor.source));
    }));
  };

  const startLiveCall = async (index: number) => {
    setLiveError(null);
    if (!authSession && !judgeMode && onRequestSignIn) {
      onRequestSignIn();
      return;
    }
    const { supabaseUrl, publishableKey, buyerAgentId } = apiConfig();
    if (!scopeReady) return setLiveError("Lock the repair brief first (Step 1) so every vendor hears the same job.");
    if (!supabaseUrl || !publishableKey || !buyerAgentId) return setLiveError("Live browser calls are not available. Try Dial vendor if Twilio is configured.");
    const vendor = vendors[index];
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authSession?.access_token ?? publishableKey}`,
          apikey: publishableKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "bootstrap",
          agentId: buyerAgentId,
          provider: vendor.name,
          scopeHash: confirmedScope!.canonicalHash,
          scopeShortId: confirmedScope!.shortId,
          specification: confirmedScope!.specification,
          scopeJson: confirmedScope!.scopeJson,
        }),
      });
      if (!response.ok) throw new Error("Could not start the live browser call.");
      const { token, signedUrl, callId, sessionProof } = await response.json() as { token?: string; signedUrl?: string; callId: string; sessionProof: string };
      setSessions((current) => ({ ...current, [index]: { callId, proof: sessionProof } }));
      setLiveLane(index);
      const sessionBase = {
        userId: crypto.randomUUID(),
        dynamicVariables: {
          scope_print: confirmedScope!.shortId,
          scope_hash: confirmedScope!.canonicalHash,
          scope_json: confirmedScope!.scopeJson,
          provider_name: vendor.name,
          negotiation_style: vendor.negotiationType,
          vertical: "laboratory_equipment_repair",
          call_id: callId,
          customer_name: confirmedScope!.confirmedBy || "Saadia Asghar",
          negotiation_authority: confirmedScope!.specification.approvalAuthority || "Lab Operations Lead",
          provider_id: vendor.name,
        },
        onConnect: ({ conversationId }: { conversationId: string }) => {
          void fetch(`${supabaseUrl}/functions/v1/elevenlabs-token`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authSession?.access_token ?? publishableKey}`, apikey: publishableKey, "Content-Type": "application/json" },
            body: JSON.stringify({ action: "attach", callId, proof: sessionProof, conversationId }),
          });
        },
        onError: (msg: string) => setLiveError(String(msg)),
      };
      if (signedUrl) startSession({ ...sessionBase, signedUrl, connectionType: "websocket" as const });
      else if (token) startSession({ ...sessionBase, conversationToken: token, connectionType: "webrtc" as const });
      else throw new Error("Live session credentials were empty.");
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

  const dialOutbound = async (index: number) => {
    setLiveError(null);
    const vendor = vendors[index];
    if (!scopeReady) return setLiveError("Lock the repair brief first before dialing a vendor.");
    if (!vendor.phoneE164 || !vendor.dialable) {
      return setLiveError(`${vendor.name} has no real phone number yet. Run live search again or pick a dialable shop.`);
    }
    setDialingLanes((lanes) => [...new Set([...lanes, index])]);
    try {
      const result = await dialVendorOutbound({
        toNumber: vendor.phoneE164,
        vendorName: vendor.name,
        scopeHash: confirmedScope!.canonicalHash,
        scopeShortId: confirmedScope!.shortId,
        negotiationStyle: vendor.negotiationType,
        accessToken: authSession?.access_token,
      });
      if (!result.ok) throw new Error(result.error ?? "Outbound dial failed.");
      setOutboundNotes((notes) => ({
        ...notes,
        [index]: `${result.provider === "elevenlabs_twilio" ? "ElevenLabs+Twilio" : "Twilio"} dial started${result.callSid ? ` · ${result.callSid}` : ""}. ${result.message ?? ""}`.trim(),
      }));
      setCustomQuotes((current) => {
        const copy = [...current];
        copy[index] = {
          ...emptyQuote(vendor.name, sourceLabel(vendor.source)),
          status: "callback",
          unknowns: ["outbound call in progress — waiting for vendor response"],
          evidence: [{ id: `outbound-${Date.now()}`, at: "now", quote: `Dialed ${vendor.phoneE164}. ${result.message ?? "Call started."}` }],
        };
        return copy;
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Outbound dial failed.";
      // Soft fail — never block the demo path
      setLiveError(`${message} · Demo still works: Preview sample or Compare quotes →`);
    } finally {
      setDialingLanes((lanes) => lanes.filter((lane) => lane !== index));
    }
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
      };
      if (!response.ok) throw new Error("Could not verify the signed call evidence.");
      if (!data.verified) throw new Error("Still saving the call recording. Wait a moment and click Confirm call again.");
      setPendingLanes((lanes) => lanes.filter((lane) => lane !== index));
      setRecordedLanes((lanes) => [...new Set([...lanes, index])]);
      const vendor = vendors[index];
      setCustomQuotes((current) => {
        const copy = [...current];
        copy[index] = mapLiveCallToServiceQuote(vendor.name, sourceLabel(vendor.source), data.outcome ?? "incomplete", data);
        return copy;
      });
      if (data.concessions?.length) {
        setCustomConcessions((current) => [
          ...current,
          ...data.concessions!.map((c) => ({
            at: new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            label: `${vendors[index].name} concession`,
            detail: `Field '${c.field_name}' changed from ${JSON.stringify(c.before_value)} to ${JSON.stringify(c.after_value)}.`,
          })),
        ]);
        onLiveLeverage?.();
      }
    } catch (reason) {
      setLiveError(reason instanceof Error ? reason.message : "Evidence verification failed.");
    }
  };

  return <main className="workflow-screen call-screen">
    <header className="workflow-heading">
      <span className="module-kicker">Step 2 · Call Vendors</span>
      <h1>Search real shops. Dial them. Same repair brief every time.</h1>
      <p>
        Live search finds nearby shops. <strong>Preview sample call</strong> is free and always works for demos.
        <strong> Dial vendor</strong> is optional (trial-capped) — if it fails, keep going with samples.
      </p>
      {judgeMode && <p className="judge-inline-tip">Client / judges: use <strong>Preview sample call</strong> → <strong>Compare quotes</strong>. Skip Dial vendor unless you want a live phone test.</p>}
    </header>

    <section className="scope-banner">
      <ShieldCheck />
      <div><span className="eyebrow">Same repair brief for every vendor</span><strong>{scopeLabel}</strong></div>
      <p>{scopeReady ? "Every vendor call uses this exact repair brief — no one quotes a different job." : "Go to Step 1 and lock a repair brief first. Sample calls still work for the demo."}</p>
      <Check />
    </section>

    {judgeMode && (
      <section className="demo-case-banner" role="status">
        <strong>Pinned demo path:</strong> SpinPro X2 · Error E17 · City Labs.
        Sample quotes stay available. Live search + outbound dial need Tavily/Twilio secrets on Supabase.
      </section>
    )}

    <CallMechanicsBanner />

    {onOpenCloser && (
      <section className="judge-call-actions" aria-label="Continue to comparison">
        <button type="button" className="primary-button" onClick={onOpenCloser}>Compare quotes →</button>
        <small>Compare works with sample quotes now. Dial or live-call when you want real evidence.</small>
      </section>
    )}

    <VendorDiscovery
      site={confirmedScope?.specification.site?.split("/")[0]?.trim() ?? "City Labs"}
      model={confirmedScope?.specification.model}
      onVendors={applyVendors}
    />

    <section className="live-call-notice">
      <ShieldCheck />
      <div>
        <strong>Outbound phone + browser voice</strong>
        <p>
          Search mode: <b>{searchMeta.searchMode}</b>
          {searchMeta.query ? ` · “${searchMeta.query}”` : ""}.
          {" "}Dial vendor = real PSTN call. Start live call = browser mic + AI (role-play or connected agent).
        </p>
      </div>
      {liveError && <span role="alert">{liveError}</span>}
    </section>

    <div className="call-layout">
      <section className="call-lanes">
        <div className="call-header"><span>Vendor</span><span>Status</span><span>Call transcript</span><span>Quoted terms</span><span>Result</span></div>

        {vendors.map((item, index) => {
          const quote = customQuotes[index] ?? emptyQuote(item.name);
          const tone = quote.status === "quote" ? "good" : quote.status === "callback" ? "warn" : quote.status === "incomplete" ? "warn" : "bad";
          const outcomeLabel = quote.status === "quote" ? "GOT A QUOTE" : quote.status === "callback" ? "CALLING / CALLBACK" : quote.status === "incomplete" ? "PENDING" : "DECLINED";
          const fields = getQuoteFields(quote);
          const fixture = providerCallList.find((lane) => lane.name === item.name);
          const transcriptLines = quote.evidence?.length
            ? quote.evidence.map((ev) => `Live: “${ev.quote}”`)
            : fixture?.transcript ?? [`No transcript yet — dial ${item.phone} or start a live browser call.`];
          const dialing = dialingLanes.includes(index);

          return (
            <article className={selected === index ? "call-lane selected-lane" : "call-lane"} key={`${item.name}-${item.phoneE164 ?? index}`} onClick={() => setSelected(index)}>
              <div>
                <h2>{item.name}</h2>
                <p>{item.style} · {item.phone}</p>
                {liveLane === index && liveStatus === "connected"
                  ? <span className="provenance live">ON CALL</span>
                  : dialing
                    ? <span className="provenance live">DIALING…</span>
                    : outboundNotes[index]
                      ? <span className="provenance recorded">OUTBOUND STARTED</span>
                      : recordedLanes.includes(index)
                        ? <span className="provenance recorded">RECORDED LIVE RUN</span>
                        : pendingLanes.includes(index)
                          ? <span className="provenance fixture">AWAITING WEBHOOK</span>
                          : fixture
                            ? <span className="provenance fixture">SIMULATED FIXTURE</span>
                            : <span className="provenance live">LIVE SEARCH</span>}
              </div>
              <div className="connection">
                <span className={(running === index || liveLane === index || dialing) ? "connected" : ""}>
                  {dialing ? "Dialing…" : liveLane === index ? "On call…" : running === index ? "Playing sample" : item.dialable ? "Dialable" : "Ready"}
                </span>
                <strong>{item.dialable ? "PSTN" : "—"}</strong>
                <button
                  className="primary-button"
                  disabled={dialing || liveLane !== null || !scopeReady}
                  onClick={(event) => { event.stopPropagation(); void dialOutbound(index); }}
                >
                  <Phone size={14} /> Dial vendor
                </button>
                {liveLane === index
                  ? <button className="fixture-control" onClick={(event) => { event.stopPropagation(); void stopLiveCall(); }}><PhoneOff size={14} /> End browser call</button>
                  : pendingLanes.includes(index)
                    ? <button className="fixture-control" onClick={(event) => { event.stopPropagation(); void verifyEvidence(index); }}><ShieldCheck size={14} /> Confirm call</button>
                    : <button className="fixture-control" disabled={liveLane !== null || liveStatus === "connecting"} onClick={(event) => { event.stopPropagation(); void startLiveCall(index); }}><Phone size={14} /> Browser live call</button>}
                {fixture && (
                  running === index
                    ? <button className="fixture-control" onClick={(event) => { event.stopPropagation(); setRunning(null); }}><PhoneOff size={14} /> Stop sample</button>
                    : <button className="fixture-control" disabled={liveLane !== null} onClick={(event) => { event.stopPropagation(); setRunning(index); }}><RotateCcw size={13} /> Preview sample</button>
                )}
              </div>
              <div className="transcript-preview"><div className={`wave ${tone}`} />{transcriptLines.map((line) => <p key={line}>{line}</p>)}</div>
              <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <div className={`structured-outcome ${tone}`}>
                <strong>{outcomeLabel}</strong>
                <small>{outboundNotes[index] ?? `${sourceLabel(item.source)} · ${item.negotiationType}`}</small>
              </div>
            </article>
          );
        })}
      </section>
      <aside className="workflow-panel evidence-inspector">
        <span className="eyebrow">Selected vendor</span>
        <h2>{selectedVendor?.name}</h2>
        <blockquote>“{
          customQuotes[selected]?.evidence?.length
            ? customQuotes[selected].evidence[customQuotes[selected].evidence.length - 1].quote
            : fixtureMatch?.transcript[fixtureMatch.transcript.length - 1]
              ?? `Ready to dial ${selectedVendor?.phone ?? "this vendor"}.`
        }”</blockquote>
        <div><span>Phone</span><strong>{selectedVendor?.phone ?? "—"}</strong></div>
        <div><span>Dialable</span><strong>{selectedVendor?.dialable ? "Yes — real number" : "No — search for a shop with a phone"}</strong></div>
        <div><span>Source</span><strong>{selectedVendor ? sourceLabel(selectedVendor.source) : "—"}</strong></div>
        <div><span>Call type</span><strong>{
          outboundNotes[selected] ? "Outbound PSTN dial"
            : recordedLanes.includes(selected) ? "Recorded live run — webhook verified"
              : pendingLanes.includes(selected) ? "Awaiting signed webhook…"
                : fixtureMatch ? "Simulated fixture (demo)" : "Live search result"
        }</strong></div>
        <p>
          {selectedVendor?.dialable
            ? "Click Dial vendor to place a real outbound call via ElevenLabs+Twilio (preferred) or Twilio TwiML."
            : "This shop has no real phone yet. Click Search again, or use Preview sample / Browser live call for the demo."}
        </p>
      </aside>
    </div>
  </main>;
}
