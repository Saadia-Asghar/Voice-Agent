import { lazy, Suspense, useMemo, useState } from "react";
import { Activity, AudioWaveform, Check, ChevronRight, CircleAlert, FileText, LockKeyhole, Mic, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { SCOPE_PRINT_SHORT, buildChallengeProof, concessions, quotes, type ConfirmedScopePrint, verticalPain } from "./caseModel";
import { currency, isSuspiciouslyLowQuote, knownCashTotal, rankQuotes } from "./domain";
import { Home } from "./Home";
import { labEquipmentRepair } from "./verticalConfig";
import { AuthControl, LoginDialog } from "./Auth";
import "./styles.css";

const ScopeStudio = lazy(() => import("./ScopeStudio").then((module) => ({ default: module.ScopeStudio })));
const CallRoom = lazy(() => import("./CallRoom").then((module) => ({ default: module.CallRoom })));
const AwardMemo = lazy(() => import("./AwardMemo").then((module) => ({ default: module.AwardMemo })));

const steps = [
  { id: "Scope", label: "01 Estimator" },
  { id: "Call room", label: "02 Caller" },
  { id: "Deal room", label: "03 Closer" },
  { id: "Award memo", label: "Award" },
] as const;
type Step = (typeof steps)[number]["id"];
type Screen = "Home" | Step;

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
    }),
    [confirmedScope, recordedLanes.length, liveLeverageVerified],
  );

  const openStep = (step: Screen) => {
    setActive(step);
    setDrawer(null);
  };

  return (
    <div className="app-shell">
      <header className={active === "Home" ? "topbar home-topbar" : "topbar"}>
        <button className="brand brand-button" onClick={() => openStep("Home")} aria-label="BenchDial home"><span className="brand-mark"><AudioWaveform /></span><span>BenchDial</span></button>
        {active === "Home" ? <nav className="home-nav" aria-label="Home navigation"><a href="#how-it-works">How it works</a><a href="#what-benchdial-does">What it does</a></nav> : <div className="case-title"><span className="eyebrow">Negotiator vertical · {labEquipmentRepair.label}</span><strong>SpinPro X2 / Error E17</strong></div>}
        <div className="topbar-actions">{active === "Home" ? <button className="home-nav-cta" onClick={() => openStep("Scope")}>Start Estimator <ChevronRight size={16} /></button> : <div className="status-pill"><span className="status-dot" /> {confirmedScope ? "ScopePrint locked" : "Evidence-ready demo"}</div>}<AuthControl onOpen={() => setLoginOpen(true)} /></div>
      </header>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      {active !== "Home" && <nav className="stepper" aria-label="Negotiator workflow">
        {steps.map((step, index) => (
          <button key={step.id} className={active === step.id ? "step active" : "step"} aria-current={active === step.id ? "step" : undefined} onClick={() => openStep(step.id)}>
            <span>{index + 1}</span>{step.label}
          </button>
        ))}
      </nav>}

      {active === "Home" ? <Home onOpen={(step) => openStep(step)} proof={challengeProof} /> : active === "Scope" ? <Suspense fallback={<main className="workflow-loading">Loading Estimator…</main>}><ScopeStudio confirmedScope={confirmedScope} onConfirm={setConfirmedScope} onReset={() => setConfirmedScope(null)} onOpenCalls={() => setActive("Call room")} /></Suspense> : active === "Call room" ? <Suspense fallback={<main className="workflow-loading">Loading Caller…</main>}><CallRoom confirmedScope={confirmedScope} customQuotes={customQuotes} setCustomQuotes={setCustomQuotes} setCustomConcessions={setCustomConcessions} recordedLanes={recordedLanes} setRecordedLanes={setRecordedLanes} onLiveLeverage={() => setLiveLeverageVerified(true)} /></Suspense> : active === "Award memo" ? <Suspense fallback={<main className="workflow-loading">Loading Award Memo…</main>}><AwardMemo downtime={downtime} confirmedScope={confirmedScope} customQuotes={customQuotes} customConcessions={customConcessions} recordedLiveCount={recordedLanes.length} /></Suspense> : <main id="top">
        <section className="hero-card">
          <div>
            <span className="kicker"><Sparkles size={14} /> 03 · The Closer</span>
            <h1>Gather. Compare.<br />Negotiate. Rank.</h1>
            <p>{verticalPain.spreadClaim} Three providers heard ScopePrint {scopeId}. BenchDial itemized fees, applied the {verticalPain.redFlagRule}, and ranked the deal with transcript receipts.</p>
          </div>
          <div className="scope-proof">
            <div className="scope-icon"><LockKeyhole /></div>
            <div><span className="eyebrow">ScopePrint verified</span><strong>{scopeId}</strong><small>{confirmedScope ? `Confirmed by ${confirmedScope.confirmedBy}` : "Demo scope — lock in Estimator for live reuse"}</small></div>
            <Check size={20} />
          </div>
        </section>

        <section className="metrics-grid" aria-label="Decision summary">
          <article><span>Providers contacted</span><strong>3</strong><small>{quoteStatuses.quote ?? 0} quotes / {quoteStatuses.declined ?? 0} decline / {quoteStatuses.callback ?? 0} callback</small></article>
          <article><span>Best cash total</span><strong>{currency(cashTotals.length ? Math.min(...cashTotals) : null)}</strong><small>Before downtime</small></article>
          <article className="accent-metric"><span>Value negotiated</span><strong>$400+</strong><small>Call-out cut + warranty added</small></article>
          <article><span>Red-flag rule</span><strong>30%</strong><small>Below peer median → warn</small></article>
        </section>

        <section className="panel red-flag-panel">
          <div className="panel-heading compact">
            <div><span className="eyebrow">Challenge red-flag rule</span><h2>Anything 30%+ below peer median is a warning — not a win.</h2></div>
            <CircleAlert />
          </div>
          <p>BenchDial never auto-awards a suspiciously low quote. The Closer surfaces the outlier for human review before ranking recommends a deal.</p>
          <ul className="red-flag-list">
            {customQuotes.map((quote) => {
              const flagged = isSuspiciouslyLowQuote(quote, customQuotes, labEquipmentRepair.suspiciousLowQuoteThreshold);
              return <li key={quote.provider} className={flagged ? "flagged" : ""}><strong>{quote.provider}</strong><span>{currency(knownCashTotal(quote))}</span><em>{flagged ? "Flagged — verify completeness" : quote.status === "declined" ? "Documented decline" : "Within peer band"}</em></li>;
            })}
          </ul>
        </section>

        <section className="panel comparison-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Normalized comparison</span><h2>Same instrument. Same scope. Real trade-offs.</h2></div>
            <label className="downtime-control">Downtime cost <strong>${downtime}/hr</strong><input aria-label="Downtime cost per hour" type="range" min="0" max="500" step="50" value={downtime} onChange={(e) => setDowntime(Number(e.target.value))} /></label>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Provider</th><th>Scope</th><th>Cash total</th><th>Response</th><th>Warranty</th><th>Effective cost</th><th>Outcome</th></tr></thead>
              <tbody>
                {ranked.map(({ quote, effective }, index) => (
                  <tr key={quote.provider} className={index === 0 && effective !== null ? "recommended-row" : ""}>
                    <td><strong>{quote.provider}</strong><small>{quote.providerType}</small></td>
                    <td><span className={quote.scopeMatch === 100 ? "score good" : "score warn"}>{quote.scopeMatch}%</span></td>
                    <td>{currency(knownCashTotal(quote))}</td>
                    <td>{quote.responseHours === null ? "Unknown" : `${quote.responseHours}h`}</td>
                    <td>{quote.warrantyDays === null ? "Unknown" : `${quote.warrantyDays} days`}</td>
                    <td><strong>{currency(effective)}</strong>{isSuspiciouslyLowQuote(quote, customQuotes, labEquipmentRepair.suspiciousLowQuoteThreshold) && <small className="warning"><CircleAlert size={12} /> 30% below peer median — verify</small>}{quote.unknowns.length > 0 && <small className="warning"><CircleAlert size={12} /> {quote.unknowns.length} unresolved</small>}</td>
                    <td><span className={`outcome ${quote.status}`}>{quote.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="content-grid">
          <section className="panel">
            <div className="panel-heading compact"><div><span className="eyebrow">Concession ledger</span><h2>Price and terms moved because of leverage.</h2></div><ShieldCheck /></div>
            <ol className="timeline">
              {customConcessions.map((event, index) => <li key={`${event.at}-${event.label}`}><span className="time">{event.at}</span><span className="timeline-node">{index + 1}</span><div><strong>{event.label}</strong><p>{event.detail}</p></div></li>)}
            </ol>
            <button className="secondary-button" onClick={() => setDrawer("evidence")}><FileText size={16} /> Open transcript evidence</button>
          </section>

          <aside className="award-card">
            <span className="kicker"><Activity size={14} /> Current recommendation</span>
            <h2>{winner?.quote.provider}</h2>
            <p>Best downtime-adjusted complete offer at the selected scenario — plain-language Closer output with human approval required.</p>
            <div className="award-value"><span>Effective cost</span><strong>{currency(winner?.effective ?? null)}</strong></div>
            <ul className="check-list">
              <li><Check /> {winner?.quote.scopeMatch ?? 0}% scope match</li>
              <li><Check /> {winner?.quote.calibration.inclusion === "included" ? "Calibration included" : `Calibration ${currency(winner?.quote.calibration.amount ?? null)}`}</li>
              <li><Check /> {winner?.quote.loanerIncluded ? "Loaner included" : "No loaner confirmed"}</li>
              <li><Check /> {winner?.quote.warrantyDays == null ? "Warranty unresolved" : `${winner.quote.warrantyDays}-day warranty`}</li>
            </ul>
            <button className="primary-button" onClick={() => setDrawer("memo")}>Review award memo <ChevronRight size={17} /></button>
            <small className="human-note"><ShieldCheck size={13} /> Human approval required. BenchDial cannot purchase or bind a contract.</small>
          </aside>
        </div>

        <section className="voice-strip">
          <div><span className="voice-icon"><Mic /></span><div><strong>Voice is the mechanism — not a chatbot skin.</strong><p>Calls disclose AI identity, refuse invented bids, and end in quote, callback, or decline.</p></div></div>
          <button onClick={() => setDrawer("calls")}><Phone size={16} /> Replay golden calls</button>
        </section>
      </main>}

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDrawer(null)}>
          <section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onClick={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close details">Close</button>
            {drawer === "evidence" && <><span className="kicker">Transcript receipts</span><h2 id="drawer-title">Every material term links to the call.</h2>{customQuotes.flatMap((quote) => quote.evidence.map((item) => <blockquote key={item.id}><strong>{quote.provider} / {item.at}</strong><p>“{item.quote}”</p></blockquote>))}</>}
            {drawer === "memo" && <><span className="kicker">Human-reviewed award memo</span><h2 id="drawer-title">Recommend {winner?.quote.provider}</h2><p>The recommendation uses a ${downtime}/hour downtime scenario. Known effective cost is {currency(winner?.effective ?? null)}. The user must review assumptions and authorize any next step.</p><div className="memo-callout"><ShieldCheck /> BenchDial cannot accept, purchase, or bind a service contract.</div></>}
            {drawer === "calls" && <><span className="kicker">Golden-call library</span><h2 id="drawer-title">Three distinct conversation outcomes</h2>{customQuotes.map((quote) => <div className="call-replay" key={quote.provider}><span className={`outcome ${quote.status}`}>{quote.status}</span><div><strong>{quote.provider}</strong><p>{quote.evidence[0]?.quote ?? "No completed transcript evidence."}</p></div><button disabled aria-label={`Audio for ${quote.provider} is not connected yet`}>Play transcript clip</button></div>)}</>}
          </section>
        </div>
      )}
    </div>
  );
}
