import { lazy, Suspense, useMemo, useState } from "react";
import { Activity, Aperture, Check, ChevronRight, CircleAlert, FileText, LockKeyhole, Mic, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { concessions, quotes } from "./fixtures";
import { currency, isSuspiciouslyLowQuote, knownCashTotal, rankQuotes } from "./domain";
import { Home } from "./Home";
import { labEquipmentRepair } from "./verticalConfig";
import { AuthControl, LoginDialog } from "./Auth";
import "./styles.css";

const ScopeStudio = lazy(() => import("./ScopeStudio").then((module) => ({ default: module.ScopeStudio })));
const CallRoom = lazy(() => import("./CallRoom").then((module) => ({ default: module.CallRoom })));
const AwardMemo = lazy(() => import("./AwardMemo").then((module) => ({ default: module.AwardMemo })));

const steps = ["Scope", "Call room", "Deal room", "Award memo"] as const;
type Step = (typeof steps)[number];
type Screen = "Home" | Step;

export default function App() {
  const [active, setActive] = useState<Screen>("Home");
  const [downtime, setDowntime] = useState(100);
  const [drawer, setDrawer] = useState<"evidence" | "memo" | "calls" | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const ranked = useMemo(
    () => rankQuotes(quotes, { downtimeCostPerHour: downtime, requiredExcludedServices: { loaner: 700, warranty: 300, "callout fee": 400 } }),
    [downtime],
  );
  const winner = ranked.find((item) => item.effective !== null);

  const openStep = (step: Screen) => {
    setActive(step);
    setDrawer(null);
  };

  return (
    <div className="app-shell">
      <header className={active === "Home" ? "topbar home-topbar" : "topbar"}>
        <button className="brand brand-button" onClick={() => openStep("Home")} aria-label="ScopeDial home"><span className="brand-mark"><Aperture /></span><span>ScopeDial</span></button>
        {active === "Home" ? <nav className="home-nav" aria-label="Home navigation"><a href="#how-it-works">How it works</a><a href="#challenge-proof">Challenge proof</a></nav> : <div className="case-title"><span className="eyebrow">Guided service event</span><strong>SpinPro X2 / Error E17</strong></div>}
        <div className="topbar-actions">{active === "Home" ? <button className="home-nav-cta" onClick={() => openStep("Scope")}>Start guided demo <ChevronRight size={16} /></button> : <div className="status-pill"><span className="status-dot" /> Evidence-ready demo</div>}<AuthControl onOpen={() => setLoginOpen(true)} /></div>
      </header>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      {active !== "Home" && <nav className="stepper" aria-label="Procurement workflow">
        {steps.map((step, index) => (
          <button key={step} className={active === step ? "step active" : "step"} aria-current={active === step ? "step" : undefined} onClick={() => openStep(step)}>
            <span>{index + 1}</span>{step}
          </button>
        ))}
      </nav>}

      {active === "Home" ? <Home onOpen={(step) => openStep(step)} /> : active === "Scope" ? <Suspense fallback={<main className="workflow-loading">Loading Scope Studio…</main>}><ScopeStudio onOpenCalls={() => setActive("Call room")} /></Suspense> : active === "Call room" ? <Suspense fallback={<main className="workflow-loading">Loading Call Room…</main>}><CallRoom /></Suspense> : active === "Award memo" ? <Suspense fallback={<main className="workflow-loading">Loading Award Memo…</main>}><AwardMemo downtime={downtime} /></Suspense> : <main id="top">
        <section className="hero-card">
          <div>
            <span className="kicker"><Sparkles size={14} /> Decision-ready comparison</span>
            <h1>The lowest quote is not<br />the lowest-cost repair.</h1>
            <p>Three providers heard the same locked scope. ScopeDial found the exclusions, priced the downtime, and negotiated the terms that actually determine when the lab gets back online.</p>
          </div>
          <div className="scope-proof">
            <div className="scope-icon"><LockKeyhole /></div>
            <div><span className="eyebrow">ScopePrint verified</span><strong>BB-7F3A-1042</strong><small>Confirmed by Saadia / 4:32 PM</small></div>
            <Check size={20} />
          </div>
        </section>

        <section className="metrics-grid" aria-label="Decision summary">
          <article><span>Providers contacted</span><strong>3</strong><small>2 quotes / 1 callback</small></article>
          <article><span>Best cash total</span><strong>{currency(Math.min(...quotes.map((q) => knownCashTotal(q) ?? Infinity)))}</strong><small>Before downtime</small></article>
          <article className="accent-metric"><span>Value negotiated</span><strong>$1,400</strong><small>Fees, warranty and response</small></article>
          <article><span>Time to decision</span><strong>12m 48s</strong><small>From confirmed scope</small></article>
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
                  <tr key={quote.provider} className={index === 0 ? "recommended-row" : ""}>
                    <td><strong>{quote.provider}</strong><small>{quote.providerType}</small></td>
                    <td><span className={quote.scopeMatch === 100 ? "score good" : "score warn"}>{quote.scopeMatch}%</span></td>
                    <td>{currency(knownCashTotal(quote))}</td>
                    <td>{quote.responseHours === null ? "Unknown" : `${quote.responseHours}h`}</td>
                    <td>{quote.warrantyDays === null ? "Unknown" : `${quote.warrantyDays} days`}</td>
                    <td><strong>{currency(effective)}</strong>{isSuspiciouslyLowQuote(quote, quotes, labEquipmentRepair.suspiciousLowQuoteThreshold) && <small className="warning"><CircleAlert size={12} /> 30% below peer median — verify</small>}{quote.unknowns.length > 0 && <small className="warning"><CircleAlert size={12} /> {quote.unknowns.length} unresolved</small>}</td>
                    <td><span className={`outcome ${quote.status}`}>{quote.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="content-grid">
          <section className="panel">
            <div className="panel-heading compact"><div><span className="eyebrow">Negotiation flight recorder</span><h2>Every concession has a receipt.</h2></div><ShieldCheck /></div>
            <ol className="timeline">
              {concessions.map((event, index) => <li key={event.at}><span className="time">{event.at}</span><span className="timeline-node">{index + 1}</span><div><strong>{event.label}</strong><p>{event.detail}</p></div></li>)}
            </ol>
            <button className="secondary-button" onClick={() => setDrawer("evidence")}><FileText size={16} /> Open transcript evidence</button>
          </section>

          <aside className="award-card">
            <span className="kicker"><Activity size={14} /> Current recommendation</span>
            <h2>{winner?.quote.provider}</h2>
            <p>Best downtime-adjusted outcome at the selected scenario, based on the visible cost, scope and operational assumptions.</p>
            <div className="award-value"><span>Effective cost</span><strong>{currency(winner?.effective ?? null)}</strong></div>
            <ul className="check-list">
              <li><Check /> {winner?.quote.scopeMatch ?? 0}% scope match</li>
              <li><Check /> {winner?.quote.calibration.inclusion === "included" ? "Calibration included" : `Calibration ${currency(winner?.quote.calibration.amount ?? null)}`}</li>
              <li><Check /> {winner?.quote.loanerIncluded ? "Loaner included" : "No loaner confirmed"}</li>
              <li><Check /> {winner?.quote.warrantyDays == null ? "Warranty unresolved" : `${winner.quote.warrantyDays}-day warranty`}</li>
            </ul>
            <button className="primary-button" onClick={() => setDrawer("memo")}>Review award memo <ChevronRight size={17} /></button>
            <small className="human-note"><ShieldCheck size={13} /> Human approval required. ScopeDial cannot purchase or bind a contract.</small>
          </aside>
        </div>

        <section className="voice-strip">
          <div><span className="voice-icon"><Mic /></span><div><strong>Voice is connected to action.</strong><p>Calls write structured terms, validate leverage, and update this decision in real time.</p></div></div>
          <button onClick={() => setDrawer("calls")}><Phone size={16} /> Replay golden calls</button>
        </section>
      </main>}

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDrawer(null)}>
          <section className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onClick={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close details">Close</button>
            {drawer === "evidence" && <><span className="kicker">Transcript receipts</span><h2 id="drawer-title">Every material term links to the call.</h2>{quotes.flatMap((quote) => quote.evidence.map((item) => <blockquote key={item.id}><strong>{quote.provider} / {item.at}</strong><p>“{item.quote}”</p></blockquote>))}</>}
            {drawer === "memo" && <><span className="kicker">Human-reviewed award memo</span><h2 id="drawer-title">Recommend {winner?.quote.provider}</h2><p>The recommendation uses a ${downtime}/hour downtime scenario. Known effective cost is {currency(winner?.effective ?? null)}. The user must review assumptions and authorize any next step.</p><div className="memo-callout"><ShieldCheck /> ScopeDial cannot accept, purchase, or bind a service contract.</div></>}
            {drawer === "calls" && <><span className="kicker">Golden-call library</span><h2 id="drawer-title">Three distinct conversation outcomes</h2>{quotes.map((quote) => <div className="call-replay" key={quote.provider}><span className={`outcome ${quote.status}`}>{quote.status}</span><div><strong>{quote.provider}</strong><p>{quote.evidence[0]?.quote ?? "No completed transcript evidence."}</p></div><button disabled aria-label={`Audio for ${quote.provider} is not connected yet`}>Audio adapter pending</button></div>)}</>}
          </section>
        </div>
      )}
    </div>
  );
}
