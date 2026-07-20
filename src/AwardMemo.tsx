import { useState } from "react";
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
  onDemoComplete,
}: {
  downtime: number;
  confirmedScope: ConfirmedScopePrint | null;
  customQuotes: ServiceQuote[];
  customConcessions: ConcessionEvent[];
  recordedLiveCount: number;
  onDemoComplete?: () => void;
}) {
  const ranked = rankQuotes(customQuotes, { downtimeCostPerHour: downtime, requiredExcludedServices: { loaner: 700, warranty: 300, "callout fee": 400 } });
  const recommendation = ranked.find((entry) => entry.effective !== null);
  const scopeId = confirmedScope?.shortId ?? SCOPE_PRINT_SHORT;
  const provenanceLabel = recordedLiveCount >= 3
    ? "Based on live calls"
    : recordedLiveCount > 0
      ? `${recordedLiveCount} of 3 live calls`
      : "Based on sample calls";
  const provenanceClass = recordedLiveCount > 0 ? "provenance recorded" : "provenance fixture";
  const winner = recommendation?.quote;
  const [reviewed, setReviewed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  return <main className="workflow-screen memo-screen">
    <section className="memo-hero">
      <div>
        <span className="eyebrow">Step 4 · Award memo · Brief {scopeId}</span>
        <h1>Here's who to call back — and why.</h1>
        <p>BenchDial recommends <strong>{winner?.provider ?? "the best complete offer"}</strong> based on price, speed, warranty, and what your downtime costs. Read the reasons below, then approve or ask purchasing to proceed.</p>
      </div>
      <div className="memo-actions"><span className={provenanceClass}>{provenanceLabel}</span><button className="secondary-button" onClick={() => window.print()}><Download size={16} /> Export / print</button></div>
    </section>

    <div className="memo-grid">
      <section className="workflow-panel memo-rationale">
        <span className="eyebrow">Why we recommend them</span>
        <h2>Best deal once you count everything.</h2>
        <div className="memo-number"><span>Total cost including downtime</span><strong>{currency(recommendation?.effective ?? null)}</strong><small>Based on ${downtime}/hour of instrument being idle</small></div>
        <ul>
          <li><CheckCircle2 /> Covers {winner?.scopeMatch ?? 0}% of the repair brief</li>
          <li><CheckCircle2 /> {winner?.calibration.inclusion === "included" ? "Calibration included in the price" : `Calibration costs extra: ${currency(winner?.calibration.amount ?? null)}`}</li>
          <li><CheckCircle2 /> {winner?.responseHours == null ? "Response time not confirmed" : `Responds within ${winner.responseHours} hours`} · {winner?.warrantyDays == null ? "warranty not confirmed" : `${winner.warrantyDays}-day warranty`}</li>
          <li><ShieldCheck /> Only real terms were used — no made-up competing bids</li>
        </ul>
        <div className="concession-summary">
          <span className="eyebrow">What the agent negotiated</span>
          <p>{recordedLiveCount > 0
            ? `${recordedLiveCount} live call${recordedLiveCount === 1 ? "" : "s"} contributed to this memo.`
            : "These are from the sample calls. Run live calls for real negotiated terms."}</p>
          <ol>{customConcessions.map((event) => <li key={`${event.at}-${event.label}`}><strong>{event.label}</strong> — {event.detail}</li>)}</ol>
        </div>
      </section>
      <section className="workflow-panel">
        <span className="eyebrow">Your decision</span>
        <h2>You approve — BenchDial never buys.</h2>
        <p>Review the recommendation below, then check the box to confirm you've read it. You still need to call the vendor and place the order yourself.</p>
        <label className="approval-check">
          <input type="checkbox" checked={reviewed} onChange={(event) => { setReviewed(event.target.checked); setAcknowledged(false); }} />
          I've read the recommendation and the evidence.
        </label>
        <button
          className="primary-button"
          disabled={!reviewed || acknowledged}
          onClick={() => { setAcknowledged(true); onDemoComplete?.(); }}
        >
          {acknowledged ? "✓ Approved — ready to forward to purchasing" : "Approve this recommendation"}
        </button>
        {acknowledged
          ? <><small className="human-note"><CheckCircle2 size={14} /> Logged as reviewed by you. No purchase was made.</small><div className="next-steps-box"><strong>What to do next</strong><ol><li>Call {winner?.provider ?? "the vendor"} to confirm availability and the quoted price.</li><li>Forward this memo to purchasing with Brief ID {scopeId}.</li><li>Attach it to your PO or work order for the record.</li></ol></div></>
          : <small className="human-note"><TriangleAlert size={14} /> Nothing is ordered until you approve and contact the vendor directly.</small>}
      </section>
    </div>

    <section className="workflow-panel">
      <div className="section-title"><div><span className="eyebrow">All three vendors</span><h2>Quote, callback, or declined — every result is here.</h2></div></div>
      <div className="memo-ranking">{ranked.map((entry, index) => <article key={entry.quote.provider}><span className="rank-number">{index + 1}</span><div><strong>{entry.quote.provider}</strong><small>{entry.quote.status} / {entry.quote.scopeMatch}% scope</small></div><strong>{currency(entry.effective)}</strong><small>{entry.quote.unknowns.length ? `${entry.quote.unknowns.length} unresolved` : "Complete"}</small></article>)}</div>
    </section>

    <section className="workflow-panel">
      <span className="eyebrow">What the calls actually said</span>
      <h2>Every recommendation is backed by a real quote from the call.</h2>
      <div className="evidence-receipts">{customQuotes.map((quote) => <article key={quote.provider}><FileAudio /><div><strong>{quote.provider}</strong><blockquote>"{quote.evidence[0]?.quote ?? "No transcript available."}"</blockquote><small><FileText size={13} /> From call at {quote.evidence[0]?.at ?? "\u2014"} \u00b7 Brief {scopeId}{recordedLiveCount > 0 ? " \u00b7 includes live calls" : " \u00b7 sample calls"}</small></div></article>)}</div>
    </section>
  </main>;
}
