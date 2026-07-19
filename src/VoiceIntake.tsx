import { useState } from "react";
import { useConversationControls, useConversationStatus } from "@elevenlabs/react";
import { Mic, PhoneOff, ShieldCheck } from "lucide-react";
import { useAuth } from "./Auth";

export function VoiceIntake({ onStarted }: { onStarted?: () => void }) {
  const { startSession, endSession } = useConversationControls();
  const { status, message } = useConversationStatus();
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const start = async () => {
    setError(null);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
    const agentId = import.meta.env.VITE_ELEVENLABS_INTAKE_AGENT_ID;
    if (!supabaseUrl || !publishableKey || !agentId) {
      setError("Live intake needs the Supabase URL, publishable key, and ElevenLabs intake agent ID.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Demo: Estimator voice stays open without sign-in (anon JWT). Buyer Call Room still needs a real session.
      const headers: Record<string, string> = {
        apikey: publishableKey,
        Authorization: `Bearer ${session?.access_token ?? publishableKey}`,
      };
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-token?agent_id=${encodeURIComponent(agentId)}`, { headers });
      if (!response.ok) throw new Error("Could not authorize the voice session.");
      const { token } = (await response.json()) as { token: string };
      onStarted?.();
      await startSession({ conversationToken: token, userId: crypto.randomUUID() });
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
    <small className="human-note"><ShieldCheck size={13} /> Estimator voice is open for the demo. Provider Call Room live lanes still require Unlock live calls.</small>
    {error && <p className="warning" role="alert">{error}</p>}
  </div>;
}
