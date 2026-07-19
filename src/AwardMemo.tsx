import { CheckCircle2, Download, FileAudio, FileText, ShieldCheck, TriangleAlert } from "lucide-react";
import { currency, rankQuotes } from "./domain";
import { quotes } from "./fixtures";

export function AwardMemo({ downtime }: { downtime: number }) {
  const ranked = rankQuotes(quotes, { downtimeCostPerHour: downtime, requiredExcludedServices: { loaner: 700, warranty: 300, "callout fee": 400 } });
  const recommendation = ranked.find((entry) => entry.effective !== null);

  return <main className="workflow-screen memo-screen">
    <section className="memo-hero">
      <div><span className="eyebrow">Decision record / ScopePrint BB-7F3A-1042</span><h1>A decision a human can defend.</h1><p>Recommend {recommendation?.quote.provider}: the fastest complete recovery with calibration, loaner coverage, and the strongest warranty—subject to human approval.</p></div>
      <div className="memo-actions"><span className="provenance fixture">DEMO EVIDENCE</span><button className="secondary-button" onClick={() => window.print()}><Download size={16} /> Export / print</button></div>
    </section>

    <div className="memo-grid">
      <section className="workflow-panel memo-rationale"><span className="eyebrow">Why this wins</span><h2>The operationally cheapest complete offer.</h2><div className="memo-number"><span>Downtime-adjusted cost</span><strong>{currency(recommendation?.effective ?? null)}</strong><small>Using ${downtime}/hour downtime</small></div><ul><li><CheckCircle2 /> 100% confirmed-scope match</li><li><CheckCircle2 /> Calibration and performance verification included</li><li><CheckCircle2 /> 18-hour response and 180-day warranty</li><li><ShieldCheck /> No invented bid or acceptance authority used</li></ul></section>
      <section className="workflow-panel"><span className="eyebrow">Human approval boundary</span><h2>Review before award.</h2><p>BenchBid recommends; it cannot purchase, accept a quote, or bind City Labs.</p><label className="approval-check"><input type="checkbox" /> I reviewed the assumptions and evidence.</label><button className="primary-button" disabled>Authorize next step</button><small className="human-note"><TriangleAlert size={14} /> Demo mode intentionally prevents a binding action.</small></section>
    </div>

    <section className="workflow-panel"><div className="section-title"><div><span className="eyebrow">Ranked offers</span><h2>Every outcome remains visible.</h2></div></div><div className="memo-ranking">{ranked.map((entry, index) => <article key={entry.quote.provider}><span className="rank-number">{index + 1}</span><div><strong>{entry.quote.provider}</strong><small>{entry.quote.status} / {entry.quote.scopeMatch}% scope</small></div><strong>{currency(entry.effective)}</strong><small>{entry.quote.unknowns.length ? `${entry.quote.unknowns.length} unresolved` : "Complete"}</small></article>)}</div></section>

    <section className="workflow-panel"><span className="eyebrow">Evidence receipts</span><h2>Recommendation claims trace to the calls.</h2><div className="evidence-receipts">{quotes.map((quote) => <article key={quote.provider}><FileAudio /><div><strong>{quote.provider}</strong><blockquote>“{quote.evidence[0]?.quote ?? "No transcript evidence."}”</blockquote><small><FileText size={13} /> Transcript at {quote.evidence[0]?.at ?? "—"} / simulated fixture</small></div></article>)}</div></section>
  </main>;
}
