import { useRef, useState } from "react";
import { useConversationClientTool, useConversationControls, useConversationStatus } from "@elevenlabs/react";
import { Mic, PhoneOff, ShieldCheck } from "lucide-react";
import { useAuth } from "./Auth";
import { patchDraftFromVoiceScope, type ScopeDraft } from "./caseModel";

type Props = {
  onStarted?: () => void;
  onDraftPatch?: (patch: Partial<ScopeDraft>) => void;
};

const emptyDraft = (): ScopeDraft => ({
  instrumentCategory: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  symptoms: "",
  errorCodes: "",
  site: "",
  deadline: "",
  calibrationRequired: true,
  responseHoursRequired: 18,
  deliverables: "",
  constraints: "",
  approvalAuthority: "",
  documentName: null,
  responseChoice: null,
  calibrationChoice: null,
  voiceInterviewTouched: true,
});

function nonEmptyPatch(next: ScopeDraft): Partial<ScopeDraft> {
  const patch: Partial<ScopeDraft> = { voiceInterviewTouched: true };
  (Object.keys(next) as (keyof ScopeDraft)[]).forEach((key) => {
    if (key === "voiceInterviewTouched") return;
    const value = next[key];
    if (typeof value === "string" && value.trim()) (patch as Record<string, unknown>)[key] = value;
    if (typeof value === "boolean" || typeof value === "number") (patch as Record<string, unknown>)[key] = value;
  });
  return patch;
}

export function VoiceIntake({ onStarted, onDraftPatch }: Props) {
  const { startSession, endSession } = useConversationControls();
  const { status, message } = useConversationStatus();
  const [error, setError] = useState<string | null>(null);
  const [lastToolNote, setLastToolNote] = useState<string | null>(null);
  const { session } = useAuth();
  const draftSink = useRef(onDraftPatch);
  draftSink.current = onDraftPatch;
  const startedSink = useRef(onStarted);
  startedSink.current = onStarted;

  useConversationClientTool("update_scope_draft", (params) => {
    draftSink.current?.(nonEmptyPatch(patchDraftFromVoiceScope(params as Record<string, unknown>, emptyDraft())));
    setLastToolNote("Scope draft updated from voice.");
    return "Draft fields updated in BenchDial Estimator.";
  });

  useConversationClientTool("submit_confirmed_scope", (params) => {
    const base = emptyDraft();
    base.instrumentCategory = "Centrifuge";
    base.deadline = new Date().toISOString().slice(0, 10);
    base.deliverables = "On-site labor, parts, calibration certificate";
    draftSink.current?.(patchDraftFromVoiceScope(params as Record<string, unknown>, base));
    startedSink.current?.();
    setLastToolNote("Voice scope written into ScopePrint draft — review conflicts, then lock.");
    return "Scope fields saved to the Estimator draft. Ask the human to resolve conflicts and lock ScopePrint. Do not invent a hash.";
  });

  const start = async () => {
    setError(null);
    setLastToolNote(null);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
    const agentId = import.meta.env.VITE_ELEVENLABS_INTAKE_AGENT_ID;
    if (!supabaseUrl || !publishableKey || !agentId) {
      setError("Live intake needs the Supabase URL, publishable key, and ElevenLabs intake agent ID.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const headers: Record<string, string> = {
        apikey: publishableKey,
        Authorization: `Bearer ${session?.access_token ?? publishableKey}`,
      };
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token?agent_id=${encodeURIComponent(agentId)}`, { headers });
      if (!response.ok) throw new Error("Could not authorize the voice session.");
      const { token } = (await response.json()) as { token: string };
      onStarted?.();
      startSession({ conversationToken: token, userId: crypto.randomUUID() });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Voice intake could not start.");
    }
  };

  return <div className="live-intake">
    <div>
      <span className="eyebrow">ElevenLabs Estimator agent</span>
      <strong>{status === "connected" ? "Live intake connected" : "Voice intake ready"}</strong>
      <small>{message ?? (session ? "Signed in — live intake uses your buyer seat." : "Demo mode: Estimator voice is open without sign-in.")}</small>
    </div>
    {status === "connected"
      ? <button className="secondary-button" onClick={() => void endSession()}><PhoneOff size={16} /> End interview</button>
      : <button className="primary-button" onClick={() => void start()} disabled={status === "connecting"}><Mic size={16} /> {status === "connecting" ? "Connecting…" : "Start live interview"}</button>}
    <small className="human-note"><ShieldCheck size={13} /> When the agent calls submit_confirmed_scope, fields write into the ScopePrint form. Unlock is still required for live Call Room lanes.</small>
    {lastToolNote && <p className="human-note" role="status">{lastToolNote}</p>}
    {error && <p className="warning" role="alert">{error}</p>}
  </div>;
}
