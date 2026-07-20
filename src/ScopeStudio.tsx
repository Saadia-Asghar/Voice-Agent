import { useMemo, useState } from "react";
import { AlertTriangle, Check, FileUp, LockKeyhole, Mic, RotateCcw } from "lucide-react";
import { VoiceIntake } from "./VoiceIntake";
import { useAuth } from "./Auth";
import {
  applyConflictResolutions,
  confirmScopePrint,
  defaultScopeDraft,
  extractScopeFromFile,
  judgeReadyScopeDraft,
  persistScopePrint,
  type ConfirmedScopePrint,
  type ConflictChoice,
  type ExtractSource,
  type ScopeDraft,
} from "./caseModel";

type Props = {
  confirmedScope: ConfirmedScopePrint | null;
  onConfirm: (scope: ConfirmedScopePrint) => void;
  onReset: () => void;
  onOpenCalls: () => void;
  judgeMode?: boolean;
};

export function ScopeStudio({ confirmedScope, onConfirm, onReset, onOpenCalls, judgeMode = false }: Props) {
  const { session } = useAuth();
  const [draft, setDraft] = useState<ScopeDraft>(defaultScopeDraft);
  const [locking, setLocking] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractSource, setExtractSource] = useState<ExtractSource | null>(null);
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
    setError(null);
    setExtracting(true);
    void (async () => {
      try {
        const result = await extractScopeFromFile(file, draft, session?.access_token);
        setDraft(result.draft);
        setExtractSource(result.source);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Document extraction failed.");
      } finally {
        setExtracting(false);
      }
    })();
  };

  const lockScope = async () => {
    setError(null);
    setLocking(true);
    try {
      const scope = await confirmScopePrint(draft);
      onConfirm(scope);
      void persistScopePrint(scope, session?.access_token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not lock ScopePrint.");
    } finally {
      setLocking(false);
    }
  };

  return <main className="workflow-screen scope-screen">
    <header className="workflow-heading">
      <span className="module-kicker">Step 1 · Repair Brief</span>
      <h1>Describe the broken equipment once — every vendor gets the same job.</h1>
      <p>Talk to the voice agent, upload your service report, then lock the brief. All three vendors will quote the exact same repair — no more repeating yourself on the phone.</p>
      {judgeMode && <p className="judge-inline-tip">Just want to see the demo? Click <strong>Load demo repair case</strong> in the checklist on the right — no mic or upload needed.</p>}
    </header>
    <div className="scope-main">
      <section className="workflow-panel">
        <div className="section-title"><div><span className="eyebrow">Step 1a · Talk to the agent</span><h2>Describe the fault by voice.</h2></div><Mic /></div>
        <VoiceIntake
          onStarted={() => update({ voiceInterviewTouched: true })}
          onDraftPatch={(patch) => setDraft((current) => ({ ...current, ...patch, voiceInterviewTouched: true }))}
        />
      </section>
      <section className="workflow-panel">
        <div className="section-title"><div><span className="eyebrow">Step 1b · Upload a document</span><h2>Add a service report or old quote.</h2></div><FileUp /></div>
        <label className="upload-zone">
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" disabled={extracting} onChange={(event) => onUpload(event.target.files?.[0])} />
          <FileUp />
          <strong>{extracting ? "Reading document…" : draft.documentName ?? "Drop repair report here (PDF, photo, or text)"}</strong>
          <small>
            {extractSource === "model"
              ? "Repair details read from your file into the brief"
              : extractSource === "local-parse"
                ? "Repair details read from document text — check below"
                : draft.documentName
                  ? "Demo file attached — review fields before locking"
                  : "Upload the breakdown report — not a vendor list. Vendor search happens in Step 2."}
          </small>
        </label>
      </section>
      <section className="workflow-panel">
        <div className="section-title"><div><span className="eyebrow">Repair brief — review &amp; edit</span><h2>Check the details before locking.</h2></div><span className="attention"><AlertTriangle size={15} /> {conflictsResolved ? "Conflicts resolved" : "2 items to resolve"}</span></div>
        <div className="scope-form">
          <label>Equipment type<input value={resolved.instrumentCategory} onChange={(event) => update({ instrumentCategory: event.target.value })} /></label>
          <label>Manufacturer<input value={resolved.manufacturer} onChange={(event) => update({ manufacturer: event.target.value })} /></label>
          <label>Model<input value={resolved.model} onChange={(event) => update({ model: event.target.value })} /></label>
          <label>Serial number<input value={resolved.serialNumber} onChange={(event) => update({ serialNumber: event.target.value })} placeholder="Optional / unknown" /></label>
          <label className="wide">What's wrong (symptoms)<textarea value={resolved.symptoms} onChange={(event) => update({ symptoms: event.target.value })} /></label>
          <label>Error code<input value={resolved.errorCodes} onChange={(event) => update({ errorCodes: event.target.value })} /></label>
          <label>Location<input value={resolved.site} onChange={(event) => update({ site: event.target.value })} /></label>
          <label>Needed by<input type="date" value={resolved.deadline} onChange={(event) => update({ deadline: event.target.value })} /></label>
          <label>Calibration needed<input value={resolved.calibrationRequired ? "Yes" : "No"} readOnly /></label>
          <label>Response within<input value={`${resolved.responseHoursRequired} hours`} readOnly /></label>
          <label>Who approves the work<input value={resolved.approvalAuthority} onChange={(event) => update({ approvalAuthority: event.target.value })} /></label>
          <label className="wide">What the vendor must deliver<textarea value={resolved.deliverables} onChange={(event) => update({ deliverables: event.target.value })} /></label>
          <label className="wide">Site access rules<textarea value={resolved.constraints} onChange={(event) => update({ constraints: event.target.value })} /></label>
        </div>
        <div className="evidence-legend"><span><b>V</b> From voice</span><span><b>D</b> From document</span><span><b>M</b> Entered manually</span></div>
      </section>
    </div>
    <aside className="scope-rail">
      <section className="workflow-panel conflict-panel">
        <span className="eyebrow">Voice said one thing, document said another</span>
        <Conflict title="How fast do you need a response?" voice="18 hours" document="24 hours" value={draft.responseChoice} onChange={(responseChoice) => update({ responseChoice })} />
        <Conflict title="Is calibration needed?" voice="Yes" document="No" value={draft.calibrationChoice} onChange={(calibrationChoice) => update({ calibrationChoice })} />
      </section>
      <section className="workflow-panel checklist">
        <span className="eyebrow">Ready to call vendors?</span>
        <CheckRow ok={completeness === 9} label={`${completeness} of 9 required fields filled in`} />
        <CheckRow ok={conflictsResolved || Boolean(confirmedScope)} label={confirmedScope || conflictsResolved ? "Conflicts resolved" : "Pick a winner for each conflict above"} />
        <CheckRow ok={hasDocument || Boolean(confirmedScope)} label={confirmedScope ? `Brief locked · ${confirmedScope.shortId}` : hasDocument ? `Document: ${draft.documentName}` : "Attach a document (or use the demo case)"} />
        <CheckRow ok={draft.voiceInterviewTouched || Boolean(draft.symptoms.trim()) || Boolean(confirmedScope)} label={confirmedScope ? "Ready to call vendors" : draft.voiceInterviewTouched ? "Voice interview done" : "Start the voice interview or fill symptoms manually"} />
        <CheckRow ok label="Approver identified" />
        {!confirmedScope && !draft.voiceInterviewTouched && <button type="button" className="text-button" onClick={() => update({ voiceInterviewTouched: true })}>Skip voice — use typed symptoms only</button>}
        {!confirmedScope && (
          <button
            type="button"
            className={judgeMode ? "primary-button" : "secondary-button"}
            disabled={locking}
            onClick={() => {
              setDraft(judgeReadyScopeDraft());
              setError(null);
              setLocking(true);
              void confirmScopePrint(judgeReadyScopeDraft())
                .then((scope) => {
                  onConfirm(scope);
                  onOpenCalls();
                })
                .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not lock the repair brief."))
                .finally(() => setLocking(false));
            }}
          >
            <LockKeyhole size={16} /> {locking ? "Loading…" : "Load demo repair case"}
          </button>
        )}
        <div className="scope-version"><span>Brief version</span><strong>{confirmedScope?.specification.version ?? 3}</strong></div>
        {confirmedScope ? (
          <button className="primary-button" onClick={onOpenCalls}>Next: Call vendors →</button>
        ) : (
          <button className="primary-button" disabled={!canLock || locking} onClick={() => void lockScope()}>
            <LockKeyhole size={16} /> {locking ? "Locking brief…" : "Lock repair brief & call vendors"}
          </button>
        )}
        {error && <p className="warning" role="alert">{error}</p>}
        {confirmedScope && <button className="secondary-button" onClick={onOpenCalls}>Go to vendor calls →</button>}
        <div className="scope-hash">
          <LockKeyhole />
          <div>
            <span>Brief ID</span>
            <strong>{confirmedScope?.shortId ?? "Not locked yet"}</strong>
            {confirmedScope && <small className="hash-detail">{confirmedScope.canonicalHash.slice(0, 22)}…</small>}
          </div>
        </div>
        {confirmedScope && <button className="text-button" onClick={() => { setDraft(defaultScopeDraft()); onReset(); }}><RotateCcw size={14} /> Start a new repair brief</button>}
      </section>
    </aside>
  </main>;
}

function Conflict({ title, voice, document, value, onChange }: { title: string; voice: string; document: string; value: ConflictChoice; onChange: (value: ConflictChoice) => void }) {
  return <div className="conflict"><strong><AlertTriangle size={15} /> {title}</strong><small>Voice said: {voice} · Document said: {document}</small><div><button className={value === "voice" ? "selected" : ""} onClick={() => onChange("voice")}>Use voice answer</button><button className={value === "document" ? "selected" : ""} onClick={() => onChange("document")}>Use document answer</button></div></div>;
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return <div className={ok ? "check-row complete" : "check-row"}><span>{ok ? <Check size={14} /> : <AlertTriangle size={14} />}</span>{label}</div>;
}
