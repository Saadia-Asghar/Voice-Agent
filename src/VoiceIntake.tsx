import { useEffect, useRef, useState } from "react";
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

function friendlyVoiceError(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("signal connection") || text.includes("websocket")) {
    return "Voice link blocked. Try Load demo repair case on the right, or upload a document instead.";
  }
  return raw;
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
  const sawConnecting = useRef(false);

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

  useEffect(() => {
    if (status === "connecting") sawConnecting.current = true;
    if (status === "connected") {
      setError(null);
      sawConnecting.current = false;
    }
    if (status === "disconnected" && sawConnecting.current && message) {
      setError(friendlyVoiceError(message));
      sawConnecting.current = false;
    }
  }, [status, message]);

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
      try {
        await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch (micErr) {
        if (micErr instanceof DOMException && micErr.name === "NotAllowedError") {
          throw new Error("Microphone permission denied by browser. Please click the lock icon in your address bar and allow Microphone access, or use the Simulate Voice button below.");
        }
      }
      const headers: Record<string, string> = {
        apikey: publishableKey,
        Authorization: `Bearer ${session?.access_token ?? publishableKey}`,
      };
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token?agent_id=${encodeURIComponent(agentId)}`, { headers });
      if (!response.ok) throw new Error("Could not authorize the voice session.");
      const body = (await response.json()) as { token?: string; signedUrl?: string };
      onStarted?.();
      // Prefer WebSocket signed URL — LiveKit WebRTC often fails behind firewalls/VPNs.
      if (body.signedUrl) {
        startSession({
          signedUrl: body.signedUrl,
          connectionType: "websocket",
          userId: crypto.randomUUID(),
          onError: (msg) => setError(friendlyVoiceError(String(msg))),
        });
        return;
      }
      if (body.token) {
        startSession({
          conversationToken: body.token,
          connectionType: "webrtc",
          userId: crypto.randomUUID(),
          onError: (msg) => setError(friendlyVoiceError(String(msg))),
        });
        return;
      }
      throw new Error("Voice session credentials were empty.");
    } catch (reason) {
      setError(reason instanceof Error ? friendlyVoiceError(reason.message) : "Voice intake could not start.");
    }
  };

  return <div className="live-intake">
    <div>
      <span className="eyebrow">Talk to the voice agent</span>
      <strong>{status === "connected" ? "Listening — describe the fault" : "Ready to start"}</strong>
      <small>{message ?? (session ? "Signed in — your account is active." : "No account needed — just click Start and allow your microphone.")}</small>
    </div>
    {status === "connected"
      ? <button className="secondary-button" onClick={() => void endSession()}><PhoneOff size={16} /> End conversation</button>
      : <button className="primary-button" onClick={() => void start()} disabled={status === "connecting"}><Mic size={16} /> {status === "connecting" ? "Connecting…" : "Start voice interview"}</button>}
    <small className="human-note"><ShieldCheck size={13} /> Mic not working? Click <strong>Load demo repair case</strong> in the checklist on the right to skip ahead.</small>
    {lastToolNote && <p className="human-note" role="status">{lastToolNote}</p>}
    {error && <p className="warning" role="alert">{error}</p>}
  </div>;
}
