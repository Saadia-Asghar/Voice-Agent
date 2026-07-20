import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Activity, AudioWaveform, Check, ChevronRight, CircleAlert, FileText, LockKeyhole, Mic, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { SCOPE_PRINT_SHORT, buildChallengeProof, concessions, confirmScopePrint, judgeReadyScopeDraft, persistScopePrint, quotes, type ConfirmedScopePrint, verticalPain } from "./caseModel";
import { currency, isSuspiciouslyLowQuote, knownCashTotal, rankQuotes } from "./domain";
import { Home } from "./Home";
import { DemoGuide } from "./DemoGuide";
import { labEquipmentRepair } from "./verticalConfig";
import { AuthControl, LoginDialog } from "./Auth";
import "./styles.css";

const ScopeStudio = lazy(() => import("./ScopeStudio").then((module) => ({ default: module.ScopeStudio })));
const CallRoom = lazy(() => import("./CallRoom").then((module) => ({ default: module.CallRoom })));
const AwardMemo = lazy(() => import("./AwardMemo").then((module) => ({ default: module.AwardMemo })));

const steps = [
  { id: "Scope", label: "Repair brief" },
  { id: "Call room", label: "Call vendors" },
  { id: "Deal room", label: "Compare quotes" },
  { id: "Award memo", label: "Award memo" },
] as const;
type Step = (typeof steps)[number]["id"];
type Screen = "Home" | Step;

const SESSION_KEY = "benchdial-workflow-v1";

type SavedSession = {
  active: Screen;
  downtime: number;
  confirmedScope: ConfirmedScopePrint | null;
  recordedLanes: number[];
  liveLeverageVerified: boolean;
  judgeMode: boolean;
};

export default function App() {
  const [active, setActive] = useState<Screen>("Home");
  const [downtime, setDowntime] = useState(100);
  const [drawer, setDrawer] = useState<"evidence" | "memo" | "calls" | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [confirmedScope, setConfirmedScope] = useState<ConfirmedScopePrint | null>(null);
  const [customQuotes, setCustomQuotes] = useState(quotes);
  const [customConcessions, setCustomConcessions] = useState(concessions);
  const [recordedLanes, setRecordedLanes] = useState<number[]>([]);
  const [liveLeverageVerified, setLiveLeverageVerified] = useState(false);
  const [judgeMode, setJudgeMode] = useState(false);
  const [judgeBusy, setJudgeBusy] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [loginReason, setLoginReason] = useState<string | undefined>();

  const ranked = useMemo(
    () => rankQuotes(customQuotes, { downtimeCostPerHour: downtime, requiredExcludedServices: { loaner: 700, warranty: 300, "callout fee": 400 } }),
    [downtime, customQuotes],
  );
  const winner = ranked.find((item) => item.effective !== null);
  const quoteStatuses = customQuotes.reduce(
    (counts, quote) => {
      counts[quote.status] = (counts[quote.status] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );
  const scopeId = confirmedScope?.shortId ?? SCOPE_PRINT_SHORT;
  const cashTotals = customQuotes.map((quote) => knownCashTotal(quote)).filter((total): total is number => total !== null);
  const challengeProof = useMemo(
    () => buildChallengeProof({
      confirmedScope,
      recordedLiveCount: recordedLanes.length,
      liveLeverageVerified,
      judgeMode,
    }),
    [confirmedScope, recordedLanes.length, liveLeverageVerified, judgeMode],
  );

  const openStep = (step: Screen) => {
    setActive(step);
    setDrawer(null);
  };

  const startJudgeDemo = async () => {
    setJudgeBusy(true);
    setJudgeMode(true);
    try {
      const scope = await confirmScopePrint(judgeReadyScopeDraft());
      setConfirmedScope(scope);
      void persistScopePrint(scope);
      setCustomQuotes(quotes);
      setCustomConcessions(concessions);
      setRecordedLanes([]);
      setLiveLeverageVerified(false);
      setDemoDone(false);
      openStep("Call room");
    } finally {
      setJudgeBusy(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("judge") === "1" || params.get("demo") === "1") {
      void startJudgeDemo();
      return;
    }
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedSession;
      if (saved.confirmedScope) setConfirmedScope(saved.confirmedScope);
      if (saved.active && saved.active !== "Home") setActive(saved.active);
      if (typeof saved.downtime === "number") setDowntime(saved.downtime);
      if (Array.isArray(saved.recordedLanes)) setRecordedLanes(saved.recordedLanes);
      if (saved.liveLeverageVerified) setLiveLeverageVerified(true);
      if (saved.judgeMode) setJudgeMode(true);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    // One-shot deep link for judges (?judge=1 · ?demo=1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("judge") === "1" || params.get("demo") === "1") return;
    const payload: SavedSession = {
      active,
      downtime,
      confirmedScope,
      recordedLanes,
      liveLeverageVerified,
      judgeMode,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }, [active, downtime, confirmedScope, recordedLanes, liveLeverageVerified, judgeMode]);

  const workflowHint =
    active === "Scope" ? "Describe the fault by voice or upload a report, then lock the repair brief. Or click Load demo repair case to skip ahead."
      : active === "Call room" ? "Three vendors are ready with sample quotes. Preview a call, or go straight to Compare quotes."
        : active === "Deal room" ? "Drag the downtime slider to see how ranking changes, then open the Award memo."
          : active === "Award memo" ? "Read the recommendation, check the box, and approve when you're ready."
            : null;

  return (
    <div className="app-shell">
      <header className={active === "Home" ? "topbar home-topbar" : "topbar"}>
        <button className="brand brand-button" onClick={() => openStep("Home")} aria-label="BenchDial home"><span className="brand-mark"><AudioWaveform /></span><span>BenchDial</span></button>
        {active === "Home" ? <nav className="home-nav" aria-label="Home navigation"><a href="#how-it-works">How it works</a><a href="#for-whom">Who it’s for</a><a href="#how-to-use">Steps</a><a href="#fixtures">Sample calls</a></nav> : <div className="case-title"><span className="eyebrow">Negotiator vertical · {labEquipmentRepair.label}</span><strong>SpinPro X2 / Error E17</strong></div>}
        <div className="topbar-actions">{active === "Home" ? <button className="home-nav-cta" disabled={judgeBusy} onClick={() => void startJudgeDemo()}>{judgeBusy ? "Starting…" : "Try demo"} <ChevronRight size={16} /></button> : <div className="status-pill"><span className="status-dot" /> {confirmedScope ? "Repair brief locked" : "Demo ready"}</div>}<AuthControl onOpen={() => setLoginOpen(true)} /></div>
      </header>

      <LoginDialog open={loginOpen} onClose={() => { setLoginOpen(false); setLoginReason(undefined); }} reason={loginReason} />

      {active !== "Home" && <nav className="stepper" aria-label="Negotiator workflow">
        {steps.map((step, index) => (
          <button key={step.id} className={active === step.id ? "step active" : "step"} aria-current={active === step.id ? "step" : undefined} onClick={() => openStep(step.id)}>
            <span>{index + 1}</span>{step.label}
          </button>
        ))}
      </nav>}

      {judgeMode && (active === "Call room" || active === "Deal room" || active === "Award memo") && (
        <DemoGuide
          active={active}
          done={demoDone}
          onNext={
            active === "Call room" ? () => openStep("Deal room")
              : active === "Deal room" ? () => openStep("Award memo")
                : undefined
          }
        />
      )}

      {workflowHint && active !== "Home" && !judgeMode && (
        <div className="judge-guide" role="status">
          <ShieldCheck size={15} />
          <p>{workflowHint}</p>
          {active === "Call room" && <button type="button" onClick={() => openStep("Deal room")}>Compare quotes →<ChevronRight size={14} /></button>}
          {active === "Deal room" && <button type="button" onClick={() => openStep("Award memo")}>Open Award memo →<ChevronRight size={14} /></button>}
          {active === "Scope" && confirmedScope && <button type="button" onClick={() => openStep("Call room")}>Go to vendor calls →<ChevronRight size={14} /></button>}
        </div>
      )}

      {active === "Home" ? <Home onOpen={(step) => openStep(step)} onJudgeDemo={() => void startJudgeDemo()} proof={challengeProof} /> : active === "Scope" ? <Suspense fallback={<main className="workflow-loading">Loading repair brief…</main>}><ScopeStudio confirmedScope={confirmedScope} onConfirm={setConfirmedScope} onReset={() => setConfirmedScope(null)} onOpenCalls={() => setActive("Call room")} judgeMode={judgeMode} /></Suspense> : active === "Call room" ? <Suspense fallback={<main className="workflow-loading">Loading vendor calls…</main>}><CallRoom confirmedScope={confirmedScope} customQuotes={customQuotes} setCustomQuotes={setCustomQuotes} setCustomConcessions={setCustomConcessions} recordedLanes={recordedLanes} setRecordedLanes={setRecordedLanes} onLiveLeverage={() => setLiveLeverageVerified(true)} onOpenCloser={() => openStep("Deal room")} judgeMode={judgeMode} onRequestSignIn={() => { setLoginReason("Sign in to run a live voice call and save results to your account. Sample calls work without signing in."); setLoginOpen(true); }} /></Suspense> : active === "Award memo" ? <Suspense fallback={<main className="workflow-loading">Loading award memo…</main>}><AwardMemo downtime={downtime} confirmedScope={confirmedScope} customQuotes={customQuotes} customConcessions={customConcessions} recordedLiveCount={recordedLanes.length} onDemoComplete={judgeMode ? () => setDemoDone(true) : undefined} /></Suspense> : <main id="top">
        <section className="hero-card">
          <div>
            <span className="kicker"><Sparkles size={14} /> Step 3 · Compare Quotes</span>
            <h1>Side-by-side. Same job.<br />Pick the real winner.</h1>
            <p>{verticalPain.spreadClaim} All three vendors quoted the same repair brief. BenchDial has broken down every fee, flagged anything suspicious, and ranked them — so the cheapest number isn't automatically the best deal.</p>
          </div>
          <div className="scope-proof">
            <div className="scope-icon"><LockKeyhole /></div>
            <div><span className="eyebrow">Repair brief locked</span><strong>{scopeId}</strong><small>{confirmedScope ? `Locked by ${confirmedScope.confirmedBy}` : "Load a repair brief in Step 1 first"}</small></div>
            <Check size={20} />
          </div>
        </section>

        <section className="metrics-grid" aria-label="Decision summary">
          <article><span>Vendors called</span><strong>3</strong><small>{quoteStatuses.quote ?? 0} quotes · {quoteStatuses.declined ?? 0} declined · {quoteStatuses.callback ?? 0} calling back</small></article>
          <article><span>Lowest sticker price</span><strong>{currency(cashTotals.length ? Math.min(...cashTotals) : null)}</strong><small>Before counting downtime</small></article>
          <article className="accent-metric"><span>Terms improved</span><strong>$400+</strong><small>Call-out cut + warranty added</small></article>
          <article><span>Cheap-quote warning</span><strong>30%</strong><small>Below others → check what's missing</small></article>
        </section>

        <section className="panel red-flag-panel">
          <div className="panel-heading compact">
            <div><span className="eyebrow">Watch out for this</span><h2>A quote 30% cheaper than the others is a warning, not a win.</h2></div>
            <CircleAlert />
          </div>
          <p>When one vendor is much cheaper, it usually means they left something out — calibration, call-out fee, or warranty. BenchDial flags it so you can ask before deciding.</p>
          <ul className="red-flag-list">
            {customQuotes.map((quote) => {
              const flagged = isSuspiciouslyLowQuote(quote, customQuotes, labEquipmentRepair.suspiciousLowQuoteThreshold);
              return <li key={quote.provider} className={flagged ? "flagged" : ""}><strong>{quote.provider}</strong><span>{currency(knownCashTotal(quote))}</span><em>{flagged ? "Much cheaper — check what's missing" : quote.status === "declined" ? "Declined to quote" : "Looks complete"}</em></li>;
            })}
          </ul>
        </section>

        <section className="panel comparison-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Side-by-side comparison</span><h2>Same repair. Compare what you're actually paying.</h2></div>
            <label className="downtime-control">
              How much does 1 hour of downtime cost you?<strong>${downtime}/hr</strong>
              <input aria-label="Downtime cost per hour" type="range" min="0" max="500" step="50" value={downtime} onChange={(e) => setDowntime(Number(e.target.value))} />
              <small style={{fontSize:"10px", opacity:.7}}>Drag to adjust — a slower vendor gets more expensive when your instrument is idle</small>
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Vendor</th><th>Job match</th><th>Price</th><th>Response</th><th>Warranty</th><th>Total with downtime</th><th>Result</th></tr></thead>
              <tbody>
                {ranked.map(({ quote, effective }, index) => (
                  <tr key={quote.provider} className={index === 0 && effective !== null ? "recommended-row" : ""}>
                    <td><strong>{quote.provider}</strong><small>{quote.providerType}</small></td>
                    <td><span className={quote.scopeMatch === 100 ? "score good" : "score warn"}>{quote.scopeMatch}%</span></td>
                    <td>{currency(knownCashTotal(quote))}</td>
                    <td>{quote.responseHours === null ? "Unknown" : `${quote.responseHours}h`}</td>
                    <td>{quote.warrantyDays === null ? "Unknown" : `${quote.warrantyDays} days`}</td>
                    <td><strong>{currency(effective)}</strong>{isSuspiciouslyLowQuote(quote, customQuotes, labEquipmentRepair.suspiciousLowQuoteThreshold) && <small className="warning"><CircleAlert size={12} /> Much cheaper than others — check what's missing</small>}{quote.unknowns.length > 0 && <small className="warning"><CircleAlert size={12} /> {quote.unknowns.length} items not confirmed</small>}</td>
                    <td><span className={`outcome ${quote.status}`}>{quote.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="content-grid">
          <section className="panel">
            <div className="panel-heading compact"><div><span className="eyebrow">What the agent negotiated</span><h2>Terms that changed during the calls.</h2></div><ShieldCheck /></div>
            <ol className="timeline">
              {customConcessions.map((event, index) => <li key={`${event.at}-${event.label}`}><span className="time">{event.at}</span><span className="timeline-node">{index + 1}</span><div><strong>{event.label}</strong><p>{event.detail}</p></div></li>)}
            </ol>
            <button className="secondary-button" onClick={() => setDrawer("evidence")}><FileText size={16} /> Read call transcripts</button>
          </section>

          <aside className="award-card">
            <span className="kicker"><Activity size={14} /> Recommended vendor</span>
            <h2>{winner?.quote.provider}</h2>
            <p>Best overall deal when you factor in speed, warranty, and what the idle instrument costs you. You still approve before anything is ordered.</p>
            <div className="award-value"><span>Total with downtime</span><strong>{currency(winner?.effective ?? null)}</strong></div>
            <ul className="check-list">
              <li><Check /> {winner?.quote.scopeMatch ?? 0}% scope match</li>
              <li><Check /> {winner?.quote.calibration.inclusion === "included" ? "Calibration included" : `Calibration ${currency(winner?.quote.calibration.amount ?? null)}`}</li>
              <li><Check /> {winner?.quote.loanerIncluded ? "Loaner included" : "No loaner confirmed"}</li>
              <li><Check /> {winner?.quote.warrantyDays == null ? "Warranty unresolved" : `${winner.quote.warrantyDays}-day warranty`}</li>
            </ul>
            <button className="primary-button" onClick={() => openStep("Award memo")}>Open Award Memo <ChevronRight size={17} /></button>
            <small className="human-note"><ShieldCheck size={13} /> You approve the final choice. BenchDial never places an order.</small>
          </aside>
        </div>

        <section className="voice-strip">
          <div><span className="voice-icon"><Mic /></span><div><strong>Every call was a real negotiation — not a script.</strong><p>The agent told each vendor it was AI, only used real terms as leverage, and ended with a quote, a callback, or a documented decline.</p></div></div>
          <button onClick={() => setDrawer("calls")}><Phone size={16} /> Replay call highlights</button>
        </section>
      </main>}

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDrawer(null)}>
          <section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onClick={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close details">Close</button>
            {drawer === "evidence" && <><span className="kicker">Transcript receipts</span><h2 id="drawer-title">Every material term links to the call.</h2>{customQuotes.flatMap((quote) => quote.evidence.map((item) => <blockquote key={item.id}><strong>{quote.provider} / {item.at}</strong><p>“{item.quote}”</p></blockquote>))}</>}
            {drawer === "memo" && <><span className="kicker">Human-reviewed award memo</span><h2 id="drawer-title">Recommend {winner?.quote.provider}</h2><p>The recommendation uses a ${downtime}/hour downtime scenario. Known effective cost is {currency(winner?.effective ?? null)}. The user must review assumptions and authorize any next step.</p><div className="memo-callout"><ShieldCheck /> BenchDial cannot accept, purchase, or bind a service contract.</div></>}
            {drawer === "calls" && <><span className="kicker">Golden-call library</span><h2 id="drawer-title">Three distinct conversation outcomes</h2>{customQuotes.map((quote) => <div className="call-replay" key={quote.provider}><span className={`outcome ${quote.status}`}>{quote.status}</span><div><strong>{quote.provider}</strong><p>{quote.evidence[0]?.quote ?? "No completed transcript evidence."}</p></div></div>)}</>}
          </section>
        </div>
      )}
    </div>
  );
}
