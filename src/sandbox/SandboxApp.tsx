import { lazy, Suspense, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  AudioWaveform,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  LockKeyhole,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  SCOPE_PRINT_SHORT,
  concessions,
  confirmScopePrint,
  judgeReadyScopeDraft,
  quotes,
  type ConfirmedScopePrint,
  verticalPain,
} from "../caseModel";
import { currency, knownCashTotal, rankQuotes } from "../domain";
import { SandboxBar, type SandboxStep } from "./SandboxBar";
import { mainAppLink } from "./config";

const CallRoom = lazy(() => import("../CallRoom").then((m) => ({ default: m.CallRoom })));
const AwardMemo = lazy(() => import("../AwardMemo").then((m) => ({ default: m.AwardMemo })));

type Step = "welcome" | "Call room" | "Deal room" | "Award memo";

const steps = [
  { id: "Call room" as const, label: "02 Caller" },
  { id: "Deal room" as const, label: "03 Closer" },
  { id: "Award memo" as const, label: "Award" },
];

async function loadCase() {
  return confirmScopePrint(judgeReadyScopeDraft());
}

export default function SandboxApp() {
  const [active, setActive] = useState<Step>("welcome");
  const [busy, setBusy] = useState(false);
  const [downtime, setDowntime] = useState(100);
  const [drawer, setDrawer] = useState<"evidence" | "calls" | null>(null);
  const [confirmedScope, setConfirmedScope] = useState<ConfirmedScopePrint | null>(null);
  const [customQuotes, setCustomQuotes] = useState(quotes);
  const [customConcessions, setCustomConcessions] = useState(concessions);
  const [recordedLanes, setRecordedLanes] = useState<number[]>([]);

  const ranked = useMemo(
    () => rankQuotes(customQuotes, { downtimeCostPerHour: downtime, requiredExcludedServices: { loaner: 700, warranty: 300, "callout fee": 400 } }),
    [downtime, customQuotes],
  );
  const winner = ranked.find((item) => item.effective !== null);
  const scopeId = confirmedScope?.shortId ?? SCOPE_PRINT_SHORT;

  const startDemo = async () => {
    setBusy(true);
    try {
      const scope = await loadCase();
      setConfirmedScope(scope);
      setCustomQuotes(quotes);
      setCustomConcessions(concessions);
      setRecordedLanes([]);
      setDowntime(100);
      setActive("Call room");
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = () => {
    void startDemo();
  };

  const sandboxStep: SandboxStep =
    active === "welcome" ? "welcome"
      : active === "Call room" ? "call"
        : active === "Deal room" ? "closer"
          : "award";

  return (
    <div className="sandbox-app">
      <header className="sandbox-topbar">
        <div className="sandbox-brand">
          <span className="brand-mark"><AudioWaveform /></span>
          <div>
            <strong>BenchDial Sandbox</strong>
            <small>Demo only · not production</small>
          </div>
        </div>
        <a className="sandbox-app-link" href={mainAppLink()}><ExternalLink size={14} /> Open full app</a>
      </header>

      {active !== "welcome" && (
        <nav className="stepper" aria-label="Sandbox workflow">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={active === step.id ? "step active" : "step"}
              aria-current={active === step.id ? "step" : undefined}
              onClick={() => setActive(step.id)}
            >
              <span>{index + 2}</span>{step.label}
            </button>
          ))}
        </nav>
      )}

      {active === "welcome" ? (
        <main className="sandbox-welcome">
          <p className="home-challenge-line">Guided demo · separate from production</p>
          <h1>SpinPro X2 fails at 9:10 a.m. Purchasing wants three quotes by lunch.</h1>
          <p>
            Walk the Negotiator loop on one safe case: locked ScopePrint, three labeled vendor fixtures,
            Closer ranking, and Award memo. No login. Reset anytime.
          </p>
          <ul className="sandbox-scenario">
            <li><strong>Scenario</strong> Centrifuge Error E17 · City Labs</li>
            <li><strong>You play</strong> Lab ops lead</li>
            <li><strong>Time</strong> ~3 minutes with fixtures</li>
          </ul>
          <div className="sandbox-pitch-card">
            <span className="sandbox-badge">30-second pitch</span>
            <p>
              “BenchDial turns one repair brief into three comparable voice negotiations and a ranked award memo.
              The agent recommends; a human still decides.”
            </p>
          </div>
          <button type="button" className="visual-primary" disabled={busy} onClick={() => void startDemo()}>
            {busy ? "Loading case…" : "Start sandbox walkthrough"} <ArrowRight size={16} />
          </button>
        </main>
      ) : active === "Call room" ? (
        <Suspense fallback={<main className="workflow-loading">Loading Caller…</main>}>
          <CallRoom
            confirmedScope={confirmedScope}
            customQuotes={customQuotes}
            setCustomQuotes={setCustomQuotes}
            setCustomConcessions={setCustomConcessions}
            recordedLanes={recordedLanes}
            setRecordedLanes={setRecordedLanes}
            onLiveLeverage={() => undefined}
            onOpenCloser={() => setActive("Deal room")}
            judgeMode
          />
        </Suspense>
      ) : active === "Award memo" ? (
        <Suspense fallback={<main className="workflow-loading">Loading Award Memo…</main>}>
          <AwardMemo
            downtime={downtime}
            confirmedScope={confirmedScope}
            customQuotes={customQuotes}
            customConcessions={customConcessions}
            recordedLiveCount={recordedLanes.length}
          />
        </Suspense>
      ) : (
        <main id="top" className="workflow-screen">
          <section className="hero-card">
            <div>
              <span className="kicker"><Sparkles size={14} /> 03 · The Closer</span>
              <h1>Gather. Compare.<br />Negotiate. Rank.</h1>
              <p>{verticalPain.spreadClaim} Three providers heard ScopePrint {scopeId}.</p>
            </div>
            <div className="scope-proof">
              <div className="scope-icon"><LockKeyhole /></div>
              <div><span className="eyebrow">ScopePrint verified</span><strong>{scopeId}</strong></div>
              <Check size={20} />
            </div>
          </section>

          <section className="panel comparison-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">Normalized comparison</span><h2>Move downtime — watch ranking change.</h2></div>
              <label className="downtime-control">Downtime cost <strong>${downtime}/hr</strong>
                <input aria-label="Downtime cost per hour" type="range" min="0" max="500" step="50" value={downtime} onChange={(e) => setDowntime(Number(e.target.value))} />
              </label>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Provider</th><th>Cash total</th><th>Effective cost</th><th>Outcome</th></tr></thead>
                <tbody>
                  {ranked.map(({ quote, effective }, index) => (
                    <tr key={quote.provider} className={index === 0 && effective !== null ? "recommended-row" : ""}>
                      <td><strong>{quote.provider}</strong></td>
                      <td>{currency(knownCashTotal(quote))}</td>
                      <td><strong>{currency(effective)}</strong></td>
                      <td><span className={`outcome ${quote.status}`}>{quote.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="content-grid">
            <section className="panel">
              <div className="panel-heading compact"><div><span className="eyebrow">Concession ledger</span><h2>Leverage moved terms.</h2></div><ShieldCheck /></div>
              <ol className="timeline">
                {customConcessions.map((event, index) => (
                  <li key={`${event.at}-${event.label}`}>
                    <span className="time">{event.at}</span>
                    <span className="timeline-node">{index + 1}</span>
                    <div><strong>{event.label}</strong><p>{event.detail}</p></div>
                  </li>
                ))}
              </ol>
              <button type="button" className="secondary-button" onClick={() => setDrawer("evidence")}><FileText size={16} /> Transcript evidence</button>
            </section>
            <aside className="award-card">
              <span className="kicker"><Activity size={14} /> Recommendation</span>
              <h2>{winner?.quote.provider}</h2>
              <div className="award-value"><span>Effective cost</span><strong>{currency(winner?.effective ?? null)}</strong></div>
              <button type="button" className="primary-button" onClick={() => setActive("Award memo")}>Open Award Memo <ChevronRight size={17} /></button>
            </aside>
          </div>

          <section className="voice-strip">
            <div><span className="voice-icon"><Mic /></span><div><strong>Fixture walkthrough</strong><p>Labeled sample calls — not recorded live runs.</p></div></div>
            <button type="button" onClick={() => setDrawer("calls")}><Phone size={16} /> Replay fixtures</button>
          </section>
        </main>
      )}

      {active !== "welcome" && (
        <SandboxBar active={sandboxStep} onReset={resetDemo} onJump={(step) => setActive(step)} />
      )}

      {drawer && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setDrawer(null)}>
          <section className="detail-drawer" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="drawer-close" onClick={() => setDrawer(null)}>Close</button>
            {drawer === "evidence" && customQuotes.flatMap((quote) => quote.evidence.map((item) => (
              <blockquote key={item.id}><strong>{quote.provider}</strong><p>“{item.quote}”</p></blockquote>
            )))}
            {drawer === "calls" && customQuotes.map((quote) => (
              <div className="call-replay" key={quote.provider}><strong>{quote.provider}</strong><p>{quote.evidence[0]?.quote ?? "Fixture transcript"}</p></div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
