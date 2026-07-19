import { useMemo, useState } from "react";
import { AlertTriangle, Check, FileUp, LockKeyhole, Mic, RotateCcw } from "lucide-react";
import { VoiceIntake } from "./VoiceIntake";
import {
  applyConflictResolutions,
  confirmScopePrint,
  defaultScopeDraft,
  extractScopeFromDocument,
  type ConfirmedScopePrint,
  type ConflictChoice,
  type ScopeDraft,
} from "./caseModel";

type Props = {
  confirmedScope: ConfirmedScopePrint | null;
  onConfirm: (scope: ConfirmedScopePrint) => void;
  onReset: () => void;
  onOpenCalls: () => void;
};

export function ScopeStudio({ confirmedScope, onConfirm, onReset, onOpenCalls }: Props) {
  const [draft, setDraft] = useState<ScopeDraft>(defaultScopeDraft);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolved = useMemo(() => applyConflictResolutions(draft), [draft]);
  const conflictsResolved = draft.responseChoice !== null && draft.calibrationChoice !== null;
  const hasDocument = Boolean(draft.documentName);
  const hasVoiceOrForm = draft.voiceInterviewTouched || Boolean(draft.symptoms.trim());
  const completeness = [resolved.instrumentCategory, resolved.manufacturer, resolved.model, resolved.symptoms, resolved.site, resolved.deadline, resolved.deliverables, resolved.approvalAuthority, hasDocument].filter(Boolean).length;
  const canLock = conflictsResolved && hasDocument && hasVoiceOrForm && completeness === 9 && !confirmedScope;

  const update = (patch: Partial<ScopeDraft>) => setDraft((current) => ({ ...current, ...patch }));

  const onUpload = (file: File | undefined) => {
    if (!file) return;
    setDraft((current) => extractScopeFromDocument(file.name, current));
    setError(null);
  };

  const lockScope = async () => {
    setError(null);
    setLocking(true);
    try {
      const scope = await confirmScopePrint(draft);
      onConfirm(scope);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not lock ScopePrint.");
    } finally {
      setLocking(false);
    }
  };

  return <main className="workflow-screen scope-screen">
    <header className="workflow-heading">
      <span className="module-kicker">01 · The Estimator</span>
      <h1>Build one job spec every provider must quote.</h1>
      <p>Challenge rule: voice interview and document intake write the same structured specification. You confirm it before any call — the direct attack on sight-unseen estimates.</p>
    </header>
    <div className="scope-main">
      <section className="workflow-panel">
        <div className="section-title"><div><span className="eyebrow">Voice interview · ElevenLabs Agents</span><h2>Describe the failure once.</h2></div><Mic /></div>
        <VoiceIntake onStarted={() => update({ voiceInterviewTouched: true })} />
      </section>
      <section className="workflow-panel">
        <div className="section-title"><div><span className="eyebrow">Document intake · same JSON schema</span><h2>Add a service report or prior quote.</h2></div><FileUp /></div>
        <label className="upload-zone">
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => onUpload(event.target.files?.[0])} />
          <FileUp />
          <strong>{draft.documentName ?? "Drop PDF or photo here"}</strong>
          <small>{draft.documentName ? "Extracted into the shared job-spec schema (demo parser)" : "PDF, JPG or PNG — maps to the same fields as voice"}</small>
        </label>
      </section>
      <section className="workflow-panel">
        <div className="section-title"><div><span className="eyebrow">Shared job specification</span><h2>One schema for voice and documents.</h2></div><span className="attention"><AlertTriangle size={15} /> {conflictsResolved ? "Conflicts resolved" : "2 conflicts"}</span></div>
        <div className="scope-form">
          <label>Instrument category<input value={resolved.instrumentCategory} onChange={(event) => update({ instrumentCategory: event.target.value })} /></label>
          <label>Manufacturer<input value={resolved.manufacturer} onChange={(event) => update({ manufacturer: event.target.value })} /></label>
          <label>Model<input value={resolved.model} onChange={(event) => update({ model: event.target.value })} /></label>
          <label>Serial number<input value={resolved.serialNumber} onChange={(event) => update({ serialNumber: event.target.value })} placeholder="Optional / unknown" /></label>
          <label className="wide">Symptoms<textarea value={resolved.symptoms} onChange={(event) => update({ symptoms: event.target.value })} /></label>
          <label>Error codes<input value={resolved.errorCodes} onChange={(event) => update({ errorCodes: event.target.value })} /></label>
          <label>Site / location<input value={resolved.site} onChange={(event) => update({ site: event.target.value })} /></label>
          <label>Required by<input type="date" value={resolved.deadline} onChange={(event) => update({ deadline: event.target.value })} /></label>
          <label>Calibration required<input value={resolved.calibrationRequired ? "Yes" : "No"} readOnly /></label>
          <label>Response target<input value={`${resolved.responseHoursRequired} hours`} readOnly /></label>
          <label>Approval authority<input value={resolved.approvalAuthority} onChange={(event) => update({ approvalAuthority: event.target.value })} /></label>
          <label className="wide">Deliverables<textarea value={resolved.deliverables} onChange={(event) => update({ deliverables: event.target.value })} /></label>
          <label className="wide">Constraints<textarea value={resolved.constraints} onChange={(event) => update({ constraints: event.target.value })} /></label>
        </div>
        <div className="evidence-legend"><span><b>V</b> Voice capture</span><span><b>D</b> Document</span><span><b>M</b> Manual confirmation</span></div>
      </section>
    </div>
    <aside className="scope-rail">
      <section className="workflow-panel conflict-panel">
        <span className="eyebrow">Voice vs document conflicts</span>
        <Conflict title="Response time target" voice="18h" document="24h" value={draft.responseChoice} onChange={(responseChoice) => update({ responseChoice })} />
        <Conflict title="Calibration required" voice="Yes" document="No" value={draft.calibrationChoice} onChange={(calibrationChoice) => update({ calibrationChoice })} />
      </section>
      <section className="workflow-panel checklist">
        <span className="eyebrow">Confirm before any calls</span>
        <CheckRow ok={completeness === 9} label={`Required fields completed / ${completeness} of 9`} />
        <CheckRow ok={conflictsResolved} label={conflictsResolved ? "Conflicts resolved" : "2 conflicts unresolved"} />
        <CheckRow ok={hasDocument} label={hasDocument ? `Document attached: ${draft.documentName}` : "Document evidence required"} />
        <CheckRow ok={draft.voiceInterviewTouched || Boolean(draft.symptoms.trim())} label={draft.voiceInterviewTouched ? "Live ElevenLabs voice interview started" : "Start live interview — Estimator voice is open for demo"} />
        <CheckRow ok label="Approval authority identified" />
        {!draft.voiceInterviewTouched && <button type="button" className="text-button" onClick={() => update({ voiceInterviewTouched: true })}>Mark voice-path fields ready for fixture walkthrough</button>}
        <div className="scope-version"><span>Scope version</span><strong>3</strong></div>
        <button className="primary-button" disabled={!canLock || locking} onClick={() => void lockScope()}>
          <LockKeyhole size={16} /> {confirmedScope ? "Scope locked" : locking ? "Hashing ScopePrint…" : "Lock confirmed scope"}
        </button>
        {error && <p className="warning" role="alert">{error}</p>}
        {confirmedScope && <button className="secondary-button" onClick={onOpenCalls}>Open Call Room · Caller</button>}
        <div className="scope-hash">
          <LockKeyhole />
          <div>
            <span>ScopePrint</span>
            <strong>{confirmedScope?.shortId ?? "Not generated"}</strong>
            {confirmedScope && <small className="hash-detail">{confirmedScope.canonicalHash.slice(0, 22)}…</small>}
          </div>
        </div>
        {confirmedScope && <button className="text-button" onClick={() => { setDraft(defaultScopeDraft()); onReset(); }}><RotateCcw size={14} /> Create a new version</button>}
      </section>
    </aside>
  </main>;
}

function Conflict({ title, voice, document, value, onChange }: { title: string; voice: string; document: string; value: ConflictChoice; onChange: (value: ConflictChoice) => void }) {
  return <div className="conflict"><strong><AlertTriangle size={15} /> {title}</strong><small>Voice: {voice} / Document: {document}</small><div><button className={value === "voice" ? "selected" : ""} onClick={() => onChange("voice")}>Use voice</button><button className={value === "document" ? "selected" : ""} onClick={() => onChange("document")}>Use document</button></div></div>;
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return <div className={ok ? "check-row complete" : "check-row"}><span>{ok ? <Check size={14} /> : <AlertTriangle size={14} />}</span>{label}</div>;
}
