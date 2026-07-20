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

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/health`);
        const body = await response.json().catch(() => null) as HealthPayload | null;
        setHealth(body);
      } catch {
        setHealth(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const checks = health?.checks ?? {};

  return (
    <section className="setup-keys-panel" id="connect-keys" aria-label="Connect the three accounts">
      <header>
        <KeyRound size={18} />
        <div>
          <p className="home-challenge-line">Connect 3 accounts (you paste keys once)</p>
          <h2>Demo always works. Live search + dial turn on when keys are added.</h2>
          <p>
            Open each account, copy the key, paste it into <strong>Supabase → Edge Functions → Secrets</strong>,
            then run <code>npm run deploy:supabase</code>. Until then, sample calls and Compare quotes keep the demo moving.
          </p>
        </div>
      </header>

      <div className="setup-keys-grid">
        {ACCOUNTS.map((account) => {
          const ready = Boolean(checks[account.checkKey]);
          return (
            <article key={account.id} className={ready ? "setup-key-card ready" : "setup-key-card"}>
              <div className="setup-key-status">
                {loading ? <span>Checking…</span> : ready ? <><Check size={14} /> Connected</> : <><CircleAlert size={14} /> Needs key</>}
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
