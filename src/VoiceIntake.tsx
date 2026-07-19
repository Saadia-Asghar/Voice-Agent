import { useState } from "react";
import { useConversationControls, useConversationStatus } from "@elevenlabs/react";
import { Mic, PhoneOff, ShieldCheck } from "lucide-react";
import { useAuth } from "./Auth";

export function VoiceIntake() {
  const { startSession, endSession } = useConversationControls();
  const { status, message } = useConversationStatus();
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const start = async () => {
    setError(null);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const agentId = import.meta.env.VITE_ELEVENLABS_INTAKE_AGENT_ID;
    if (!session) {
      setError("Sign in from the header before starting a billable live interview. The simulated workflow remains available.");
      return;
    }
    if (!supabaseUrl || !anonKey || !agentId) {
      setError("Live intake needs the Supabase URL, anon key, and ElevenLabs intake agent ID.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token?agent_id=${encodeURIComponent(agentId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: anonKey },
      });
      if (!response.ok) throw new Error("Could not authorize the voice session.");
      const { token } = (await response.json()) as { token: string };
      await startSession({ conversationToken: token, userId: crypto.randomUUID() });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Voice intake could not start.");
    }
  };

  return <div className="live-intake">
    <div><span className="eyebrow">ElevenLabs vertical slice</span><strong>{status === "connected" ? "Live intake connected" : "Voice intake ready"}</strong><small>{message ?? "Microphone permission is requested only when you start."}</small></div>
    {status === "connected" ? <button className="secondary-button" onClick={() => void endSession()}><PhoneOff size={16} /> End interview</button> : <button className="primary-button" onClick={() => void start()} disabled={status === "connecting"}><Mic size={16} /> {status === "connecting" ? "Connecting…" : "Start live interview"}</button>}
    <small className="human-note"><ShieldCheck size={13} /> LIVE provenance is granted only after a real ElevenLabs conversation ID is returned.</small>
    {error && <p className="warning" role="alert">{error}</p>}
  </div>;
}
