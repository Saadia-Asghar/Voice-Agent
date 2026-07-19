import { CheckCircle2, Download, FileAudio, FileText, ShieldCheck, TriangleAlert } from "lucide-react";
import { currency, rankQuotes } from "./domain";
import { SCOPE_PRINT_SHORT, type ConcessionEvent, type ConfirmedScopePrint } from "./caseModel";
import type { ServiceQuote } from "./domain";

export function AwardMemo({
  downtime,
  confirmedScope,
  customQuotes,
  customConcessions,
  recordedLiveCount,
}: {
  downtime: number;
  confirmedScope: ConfirmedScopePrint | null;
  customQuotes: ServiceQuote[];
  customConcessions: ConcessionEvent[];
  recordedLiveCount: number;
}) {
  const ranked = rankQuotes(customQuotes, { downtimeCostPerHour: downtime, requiredExcludedServices: { loaner: 700, warranty: 300, "callout fee": 400 } });
  const recommendation = ranked.find((entry) => entry.effective !== null);
  const scopeId = confirmedScope?.shortId ?? SCOPE_PRINT_SHORT;
  const provenanceLabel = recordedLiveCount >= 3
    ? "RECORDED LIVE RUN"
    : recordedLiveCount > 0
      ? `${recordedLiveCount}/3 LIVE RECORDED`
      : "DEMO EVIDENCE";
  const provenanceClass = recordedLiveCount > 0 ? "provenance recorded" : "provenance fixture";
  const winner = recommendation?.quote;

  return <main className="workflow-screen memo-screen">
    <section className="memo-hero">
      <div>
        <span className="eyebrow">Closer output · Decision record / ScopePrint {scopeId}</span>
        <h1>A ranked deal a human can defend.</h1>
        <p>Recommend {winner?.provider ?? "a complete offer"}: downtime-adjusted ranking with transcript receipts — subject to human approval. Citations come from call evidence, not a score alone.</p>
      </div>
      <div className="memo-actions"><span className={provenanceClass}>{provenanceLabel}</span><button className="secondary-button" onClick={() => window.print()}><Download size={16} /> Export / print</button></div>
    </section>

    <div className="memo-grid">
      <section className="workflow-panel memo-rationale">
        <span className="eyebrow">Why this wins</span>
        <h2>The operationally cheapest complete offer.</h2>
        <div className="memo-number"><span>Downtime-adjusted cost</span><strong>{currency(recommendation?.effective ?? null)}</strong><small>Using ${downtime}/hour downtime</small></div>
        <ul>
          <li><CheckCircle2 /> {winner?.scopeMatch ?? 0}% confirmed-scope match</li>
          <li><CheckCircle2 /> {winner?.calibration.inclusion === "included" ? "Calibration included" : `Calibration ${currency(winner?.calibration.amount ?? null)}`}</li>
          <li><CheckCircle2 /> {winner?.responseHours == null ? "Response unresolved" : `${winner.responseHours}-hour response`} · {winner?.warrantyDays == null ? "warranty unresolved" : `${winner.warrantyDays}-day warranty`}</li>
          <li><ShieldCheck /> No invented bid or acceptance authority used</li>
        </ul>
        <div className="concession-summary">
          <span className="eyebrow">Negotiation receipts</span>
          <p>{recordedLiveCount > 0
            ? `${recordedLiveCount} webhook-verified live lane${recordedLiveCount === 1 ? "" : "s"} feed this memo. Concessions below reflect live tool writes when present.`
            : "Fixture walkthrough: terms illustrate leverage causation until live lanes are verified."}</p>
          <ol>{customConcessions.map((event) => <li key={`${event.at}-${event.label}`}><strong>{event.label}</strong> — {event.detail}</li>)}</ol>
        </div>
      </section>
      <section className="workflow-panel">
        <span className="eyebrow">Human approval boundary</span>
        <h2>Review before award.</h2>
        <p>BenchDial recommends; it cannot purchase, accept a quote, or bind City Labs.</p>
        <label className="approval-check"><input type="checkbox" /> I reviewed the assumptions and evidence.</label>
        <button className="primary-button" disabled>Authorize next step</button>
        <small className="human-note"><TriangleAlert size={14} /> Demo mode intentionally prevents a binding action.</small>
      </section>
    </div>

    <section className="workflow-panel">
      <div className="section-title"><div><span className="eyebrow">Ranked offers</span><h2>Every outcome remains visible — quote, callback, or decline.</h2></div></div>
      <div className="memo-ranking">{ranked.map((entry, index) => <article key={entry.quote.provider}><span className="rank-number">{index + 1}</span><div><strong>{entry.quote.provider}</strong><small>{entry.quote.status} / {entry.quote.scopeMatch}% scope</small></div><strong>{currency(entry.effective)}</strong><small>{entry.quote.unknowns.length ? `${entry.quote.unknowns.length} unresolved` : "Complete"}</small></article>)}</div>
    </section>

    <section className="workflow-panel">
      <span className="eyebrow">Evidence receipts</span>
      <h2>Recommendation claims trace to the calls.</h2>
      <div className="evidence-receipts">{customQuotes.map((quote) => <article key={quote.provider}><FileAudio /><div><strong>{quote.provider}</strong><blockquote>“{quote.evidence[0]?.quote ?? "No transcript evidence."}”</blockquote><small><FileText size={13} /> Transcript at {quote.evidence[0]?.at ?? "—"} / {confirmedScope ? `ScopePrint ${scopeId}` : "simulated fixture"}{recordedLiveCount > 0 ? " · live lanes in session" : ""}</small></div></article>)}</div>
    </section>
  </main>;
}
