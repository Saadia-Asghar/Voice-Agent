import { useMemo, useState } from "react";
import { AlertTriangle, Check, FileUp, LockKeyhole, Mic, RotateCcw } from "lucide-react";
import { VoiceIntake } from "./VoiceIntake";

type ConflictChoice = "voice" | "document" | null;

export function ScopeStudio({ onOpenCalls }: { onOpenCalls: () => void }) {
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [responseChoice, setResponseChoice] = useState<ConflictChoice>(null);
  const [calibrationChoice, setCalibrationChoice] = useState<ConflictChoice>(null);
  const [confirmed, setConfirmed] = useState(false);
  const conflictsResolved = responseChoice !== null && calibrationChoice !== null;
  const completeness = documentName ? 9 : 8;
  const canLock = conflictsResolved && completeness === 9;
  const hash = useMemo(() => confirmed ? "BB-7F3A-1042" : "Not generated", [confirmed]);

  return <main className="workflow-screen scope-screen">
    <div className="scope-main">
      <section className="workflow-panel"><div className="section-title"><div><span className="eyebrow">Voice interview</span><h2>Describe the failure once.</h2></div><Mic /></div><VoiceIntake /></section>
      <section className="workflow-panel"><div className="section-title"><div><span className="eyebrow">Document intake</span><h2>Add one service report or quote.</h2></div><FileUp /></div><label className="upload-zone"><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setDocumentName(event.target.files?.[0]?.name ?? null)} /><FileUp /><strong>{documentName ?? "Drop PDF or photo here"}</strong><small>{documentName ? "Ready for server-side extraction" : "PDF, JPG or PNG / maximum 25 MB"}</small></label></section>
      <section className="workflow-panel"><div className="section-title"><div><span className="eyebrow">Service scope editor</span><h2>One schema for voice and documents.</h2></div><span className="attention"><AlertTriangle size={15} /> {conflictsResolved ? "No conflicts" : "2 conflicts"}</span></div>
        <div className="scope-form">
          <label>Instrument category<input value="Centrifuge" readOnly /></label><label>Manufacturer<input value="Beckman Coulter" readOnly /></label><label>Model<input value="SpinPro X2" readOnly /></label><label>Serial number<input placeholder="Optional / unknown" /></label>
          <label className="wide">Symptoms<textarea defaultValue="Unit stops during acceleration and displays Error E17. Will not complete a run." /></label><label>Error codes<input value="E17" readOnly /></label><label>Site / location<input defaultValue="City Labs / Main Building / 5th floor" /></label>
          <label>Required by<input type="date" defaultValue="2026-07-21" /></label><label>Calibration required<input value={calibrationChoice === "document" ? "No" : "Yes"} readOnly /></label><label>Response target<input value={responseChoice === "document" ? "24 hours" : "18 hours"} readOnly /></label><label>Approval authority<input defaultValue="Lab manager" /></label>
          <label className="wide">Deliverables<textarea defaultValue="On-site labor, parts, calibration certificate, full performance verification" /></label><label className="wide">Constraints<textarea defaultValue="Business-hours access. Notify security 30 minutes before arrival." /></label>
        </div>
        <div className="evidence-legend"><span><b>V</b> Voice capture</span><span><b>D</b> Document</span><span><b>M</b> Manual confirmation</span></div>
      </section>
    </div>
    <aside className="scope-rail">
      <section className="workflow-panel conflict-panel"><span className="eyebrow">Voice vs document conflicts</span><Conflict title="Response time target" voice="18h" document="24h" value={responseChoice} onChange={setResponseChoice} /><Conflict title="Calibration required" voice="Yes" document="No" value={calibrationChoice} onChange={setCalibrationChoice} /></section>
      <section className="workflow-panel checklist"><span className="eyebrow">Confirmation checklist</span><CheckRow ok={completeness === 9} label={`Required fields completed / ${completeness} of 9`} /><CheckRow ok={conflictsResolved} label={conflictsResolved ? "Conflicts resolved" : "2 conflicts unresolved"} /><CheckRow ok={Boolean(documentName)} label={documentName ? "Document evidence attached" : "Document evidence required"} /><CheckRow ok label="Approval authority identified" /><div className="scope-version"><span>Scope version</span><strong>3</strong></div><button className="primary-button" disabled={!canLock || confirmed} onClick={() => setConfirmed(true)}><LockKeyhole size={16} /> {confirmed ? "Scope locked" : "Lock confirmed scope"}</button>{confirmed && <button className="secondary-button" onClick={onOpenCalls}>Open Call Room</button>}<div className="scope-hash"><LockKeyhole /><div><span>ScopePrint</span><strong>{hash}</strong></div></div>{confirmed && <button className="text-button" onClick={() => setConfirmed(false)}><RotateCcw size={14} /> Create a new version</button>}</section>
    </aside>
  </main>;
}

function Conflict({ title, voice, document, value, onChange }: { title: string; voice: string; document: string; value: ConflictChoice; onChange: (value: ConflictChoice) => void }) {
  return <div className="conflict"><strong><AlertTriangle size={15} /> {title}</strong><small>Voice: {voice} / Document: {document}</small><div><button className={value === "voice" ? "selected" : ""} onClick={() => onChange("voice")}>Use voice</button><button className={value === "document" ? "selected" : ""} onClick={() => onChange("document")}>Use document</button></div></div>;
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) { return <div className={ok ? "check-row complete" : "check-row"}><span>{ok ? <Check size={14} /> : <AlertTriangle size={14} />}</span>{label}</div>; }
