import { CheckCircle2, Download, FileAudio, FileText, ShieldCheck, TriangleAlert } from "lucide-react";
import { currency, rankQuotes } from "./domain";
import { SCOPE_PRINT_SHORT, concessions, type ConfirmedScopePrint } from "./caseModel";
import type { ServiceQuote } from "./domain";

export function AwardMemo({ downtime, confirmedScope, customQuotes }: { downtime: number; confirmedScope: ConfirmedScopePrint | null; customQuotes: ServiceQuote[] }) {
  const ranked = rankQuotes(customQuotes, { downtimeCostPerHour: downtime, requiredExcludedServices: { loaner: 700, warranty: 300, "callout fee": 400 } });
  const recommendation = ranked.find((entry) => entry.effective !== null);
  const scopeId = confirmedScope?.shortId ?? SCOPE_PRINT_SHORT;

  return <main className="workflow-screen memo-screen">
    <section className="memo-hero">
      <div>
        <span className="eyebrow">Closer output · Decision record / ScopePrint {scopeId}</span>
        <h1>A ranked deal a human can defend.</h1>
        <p>Recommend {recommendation?.quote.provider}: fastest complete recovery with calibration, loaner coverage, and the strongest warranty — subject to human approval. Citations come from call transcripts, not a score alone.</p>
      </div>
      <div className="memo-actions"><span className="provenance fixture">DEMO EVIDENCE</span><button className="secondary-button" onClick={() => window.print()}><Download size={16} /> Export / print</button></div>
    </section>

    <div className="memo-grid">
      <section className="workflow-panel memo-rationale">
        <span className="eyebrow">Why this wins</span>
        <h2>The operationally cheapest complete offer.</h2>
        <div className="memo-number"><span>Downtime-adjusted cost</span><strong>{currency(recommendation?.effective ?? null)}</strong><small>Using ${downtime}/hour downtime</small></div>
        <ul>
          <li><CheckCircle2 /> 100% confirmed-scope match</li>
          <li><CheckCircle2 /> Calibration and performance verification included</li>
          <li><CheckCircle2 /> 18-hour response and 180-day warranty</li>
          <li><ShieldCheck /> No invented bid or acceptance authority used</li>
        </ul>
        <div className="concession-summary">
          <span className="eyebrow">Negotiation receipts</span>
          <p>RapidBench terms moved mid-call after verified OEM leverage: call-out $650→$450, response 48h→36h, warranty added.</p>
          <ol>{concessions.map((event) => <li key={event.at}><strong>{event.label}</strong> — {event.detail}</li>)}</ol>
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
      <div className="evidence-receipts">{customQuotes.map((quote) => <article key={quote.provider}><FileAudio /><div><strong>{quote.provider}</strong><blockquote>“{quote.evidence[0]?.quote ?? "No transcript evidence."}”</blockquote><small><FileText size={13} /> Transcript at {quote.evidence[0]?.at ?? "—"} / {confirmedScope ? `ScopePrint ${scopeId}` : "simulated fixture"}</small></div></article>)}</div>
    </section>
  </main>;
}
