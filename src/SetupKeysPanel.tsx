import { useEffect, useState } from "react";
import { Check, CircleAlert, ExternalLink, KeyRound, Phone, Search, ShieldCheck } from "lucide-react";

type HealthPayload = {
  ok?: boolean;
  database?: boolean;
  outbound_ready?: boolean;
  vendor_search_ready?: boolean;
  checks?: Record<string, boolean | string>;
};

const ACCOUNTS = [
  {
    id: "tavily",
    title: "1 · Tavily (vendor search)",
    why: "Finds real repair shops on the web and extracts phone numbers.",
    fallback: "If missing: demo still uses the 3 SpinPro sample vendors. Search shows fixtures.",
    signup: "https://app.tavily.com/home",
    secret: "TAVILY_API_KEY",
    checkKey: "tavily_key",
  },
  {
    id: "twilio",
    title: "2 · Twilio (phone dial)",
    why: "Gives BenchDial a real From number to call vendors.",
    fallback: "If missing: Dial vendor is disabled; Preview sample + Compare quotes still work.",
    signup: "https://console.twilio.com/",
    secret: "TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER",
    checkKey: "twilio_sid",
  },
  {
    id: "elevenlabs",
    title: "3 · ElevenLabs phone ID (best outbound)",
    why: "Import your Twilio number into ElevenLabs, then paste the phone number ID. Buyer agent talks on the call.",
    fallback: "If missing: Twilio TwiML fallback can still dial; browser live call still works with ELEVENLABS_API_KEY.",
    signup: "https://elevenlabs.io/app/agents/phone-numbers",
    secret: "ELEVENLABS_AGENT_PHONE_NUMBER_ID",
    checkKey: "elevenlabs_phone_number_id",
  },
] as const;

export function SetupKeysPanel() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBrowserInputs, setShowBrowserInputs] = useState(false);

  const [tavilyKey, setTavilyKey] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("benchdial_tavily_key") ?? "" : ""));
  const [twilioSid, setTwilioSid] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("benchdial_twilio_sid") ?? "" : ""));
  const [twilioToken, setTwilioToken] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("benchdial_twilio_token") ?? "" : ""));
  const [twilioFrom, setTwilioFrom] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("benchdial_twilio_from") ?? "" : ""));
  const [phoneId, setPhoneId] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("benchdial_phone_id") ?? "" : ""));
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const checkHealth = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/health`);
      const body = await response.json().catch(() => null) as HealthPayload | null;
      setHealth(body);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkHealth();
  }, []);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    if (tavilyKey.trim()) localStorage.setItem("benchdial_tavily_key", tavilyKey.trim());
    else localStorage.removeItem("benchdial_tavily_key");

    if (twilioSid.trim()) localStorage.setItem("benchdial_twilio_sid", twilioSid.trim());
    else localStorage.removeItem("benchdial_twilio_sid");

    if (twilioToken.trim()) localStorage.setItem("benchdial_twilio_token", twilioToken.trim());
    else localStorage.removeItem("benchdial_twilio_token");

    if (twilioFrom.trim()) localStorage.setItem("benchdial_twilio_from", twilioFrom.trim());
    else localStorage.removeItem("benchdial_twilio_from");

    if (phoneId.trim()) localStorage.setItem("benchdial_phone_id", phoneId.trim());
    else localStorage.removeItem("benchdial_phone_id");

    setSaveStatus("Keys saved to browser session! Outbound dialing and live search will use these keys.");
    void checkHealth();
  };

  const checks = health?.checks ?? {};

  return (
    <section className="setup-keys-panel" id="connect-keys" aria-label="Connect the three accounts">
      <header>
        <KeyRound size={18} />
        <div>
          <p className="home-challenge-line">Connect 3 accounts (you paste keys once)</p>
          <h2>Demo always works. Live search + dial turn on when keys are added.</h2>
          <p>
            Paste your keys into <strong>Supabase Secrets</strong> or directly into the <strong>In-Browser Key Editor</strong> below.
          </p>
        </div>
      </header>

      <div className="setup-keys-grid">
        {ACCOUNTS.map((account) => {
          const hasLocal = account.id === "tavily" ? Boolean(tavilyKey.trim()) : account.id === "twilio" ? Boolean(twilioSid.trim() && twilioToken.trim() && twilioFrom.trim()) : Boolean(phoneId.trim());
          const ready = Boolean(checks[account.checkKey]) || hasLocal;
          return (
            <article key={account.id} className={ready ? "setup-key-card ready" : "setup-key-card"}>
              <div className="setup-key-status">
                {loading ? <span>Checking…</span> : ready ? <><Check size={14} /> Connected {hasLocal && "(Browser)"}</> : <><CircleAlert size={14} /> Needs key</>}
              </div>
              <strong>{account.title}</strong>
              <p>{account.why}</p>
              <small><ShieldCheck size={12} /> Fallback: {account.fallback}</small>
              <code>{account.secret}</code>
              <a href={account.signup} target="_blank" rel="noreferrer" className="setup-key-link">
                Open account <ExternalLink size={14} />
              </a>
            </article>
          );
        })}
      </div>

      <div style={{ marginTop: "16px", padding: "16px", background: "var(--card-bg, #f8fafc)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <button
          type="button"
          onClick={() => setShowBrowserInputs((prev) => !prev)}
          style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <KeyRound size={16} />
          {showBrowserInputs ? "Hide In-Browser Key Form" : "Paste optional API keys directly in app browser →"}
        </button>

        {showBrowserInputs && (
          <form onSubmit={handleSaveKeys} style={{ marginTop: "14px", display: "grid", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Tavily API Key (Live web search)</label>
              <input
                type="password"
                placeholder="tvly-..."
                value={tavilyKey}
                onChange={(e) => setTavilyKey(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Twilio Account SID</label>
                <input
                  type="text"
                  placeholder="AC..."
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Twilio Auth Token / Secret</label>
                <input
                  type="password"
                  placeholder="Auth token or secret"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Twilio From Phone Number</label>
                <input
                  type="text"
                  placeholder="+17045551212"
                  value={twilioFrom}
                  onChange={(e) => setTwilioFrom(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>ElevenLabs Phone Number ID (Optional)</label>
              <input
                type="text"
                placeholder="phn_..."
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", background: "#18191d", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
                Save keys in browser
              </button>
              {saveStatus && <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: 500 }}>{saveStatus}</span>}
            </div>
          </form>
        )}
      </div>

      <div className="setup-keys-foot">
        <div>
          <Search size={16} />
          <span>Vendor search fallback = 3 demo shops</span>
        </div>
        <div>
          <Phone size={16} />
          <span>Dial fallback = Preview sample / Browser live call</span>
        </div>
        <a
          className="setup-key-link"
          href="https://supabase.com/dashboard/project/gnzxgxvzflkystgrcfbz/settings/functions"
          target="_blank"
          rel="noreferrer"
        >
          Open Supabase secrets <ExternalLink size={14} />
        </a>
        <a
          className="setup-key-link"
          href="https://hacknation-lemon.vercel.app/?judge=1"
          target="_blank"
          rel="noreferrer"
        >
          Keep demo moving <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
