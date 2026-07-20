import { ArrowRight, Bot, FileUp, MapPin, Mic, Phone, User } from "lucide-react";

const stories = [
  {
    name: "John",
    role: "Restaurant facility manager",
    problem: "Walk-in freezer failed before lunch rush. He called two repair shops — one quoted $800 on the phone, the bill came in at $1,400 after trip fee and parts markup.",
    path: "He locked one repair brief in BenchDial, previewed three sample vendor calls on the same job, and saw RapidBench hid the trip fee. He moved the downtime slider — every hour the freezer was down cost him lost prep time.",
    outcome: "He approved OEM Precision on the award memo: higher sticker price, but calibration included and fastest response. He forwarded the memo to his owner with call quotes attached.",
  },
  {
    name: "Alice",
    role: "Lab operations lead",
    problem: "Centrifuge Error E17 stopped morning runs. Purchasing wanted three quotes by noon. She did not have time to repeat the fault story to three vendors.",
    path: "She clicked Start demo — repair brief already loaded for SpinPro X2. She previewed one sample call, compared all three vendors, and dragged downtime cost to $200/hr.",
    outcome: "Ranking flipped toward the faster vendor. She checked the evidence quotes, approved the recommendation, and sent Brief ID BD-7F3A-1042 to purchasing. Total time: about 3 minutes.",
  },
] as const;

export function HowItWorksPanel({ onStartDemo }: { onStartDemo?: () => void }) {
  return (
    <section className="how-it-works-panel" id="how-it-works" aria-label="How BenchDial works">
      <header className="how-it-works-head">
        <p className="home-challenge-line">How it works</p>
        <h2>Who talks to whom — and what you actually do in the app</h2>
        <p className="how-it-works-lede">
          BenchDial is not a vendor marketplace. You do not wait for shops to message you.
          You lock <strong>one repair brief</strong>, then a <strong>voice buyer agent</strong> runs vendor conversations
          so you can compare and approve a memo.
        </p>
      </header>

      <div className="how-flow-grid">
        <article className="how-flow-card">
          <span className="how-flow-step">1</span>
          <User size={18} />
          <strong>You</strong>
          <p>Describe the breakdown (voice or PDF service report). Lock the repair brief. You never repeat the story three times.</p>
        </article>
        <article className="how-flow-arrow" aria-hidden="true"><ArrowRight /></article>
        <article className="how-flow-card">
          <span className="how-flow-step">2</span>
          <MapPin size={18} />
          <strong>Vendors</strong>
          <p>
            BenchDial finds nearby repair shops (web search + your approved list) and pulls phone numbers when available.
            If search fails, the demo sample vendors still load so you can finish the walkthrough.
          </p>
        </article>
        <article className="how-flow-arrow" aria-hidden="true"><ArrowRight /></article>
        <article className="how-flow-card">
          <span className="how-flow-step">3</span>
          <Bot size={18} />
          <strong>Voice buyer agent</strong>
          <p>
            <b>Sample call:</b> instant demo quote (always works).
            <b> Live in browser:</b> talk with your mic.
            <b> Dial vendor:</b> real phone call when connected — otherwise the demo continues.
          </p>
        </article>
        <article className="how-flow-arrow" aria-hidden="true"><ArrowRight /></article>
        <article className="how-flow-card">
          <span className="how-flow-step">4</span>
          <User size={18} />
          <strong>You again</strong>
          <p>Compare quotes, adjust downtime cost, read the award memo, approve. BenchDial recommends — you place the order.</p>
        </article>
      </div>

      <div className="how-upload-box">
        <FileUp size={20} />
        <div>
          <strong>What can you upload today?</strong>
          <p>
            <b>Yes:</b> PDF, photo, or text of the <em>repair</em> (service report, error log) — fills in the repair brief.
            <b> Not yet:</b> a spreadsheet of vendor URLs or phone numbers. Vendors come from search + your approved list, not from a file you upload.
          </p>
        </div>
      </div>

      <div className="storyboard">
        <h3>Real scenarios</h3>
        {stories.map((story) => (
          <article key={story.name} className="story-card">
            <header>
              <strong>{story.name}</strong>
              <span>{story.role}</span>
            </header>
            <dl>
              <div><dt>Problem</dt><dd>{story.problem}</dd></div>
              <div><dt>What she did in BenchDial</dt><dd>{story.path}</dd></div>
              <div><dt>Benefit</dt><dd>{story.outcome}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <div className="how-status-box">
        <Phone size={18} />
        <div>
          <strong>What is working in this demo vs what is next</strong>
          <ul>
            <li><CheckIcon /> Repair brief lock, three vendor lanes, sample calls, compare, award memo — <b>working now</b></li>
            <li><CheckIcon /> Live voice in browser (ElevenLabs) — <b>working</b> with mic</li>
            <li><CheckIcon /> Real-time vendor search (Tavily + approved list) — <b>wired</b>; needs <code>TAVILY_API_KEY</code> for best results (keyless fallback available)</li>
            <li><CheckIcon /> Outbound PSTN dial — <b>wired</b>; needs Twilio secrets and/or <code>ELEVENLABS_AGENT_PHONE_NUMBER_ID</code></li>
          </ul>
        </div>
      </div>

      {onStartDemo && (
        <button type="button" className="visual-primary" onClick={onStartDemo}>
          Start the 3-minute pinned demo <ArrowRight size={16} />
        </button>
      )}
    </section>
  );
}

function CheckIcon() {
  return <span className="how-status-ok" aria-hidden="true">✓</span>;
}

export function CallMechanicsBanner() {
  return (
    <aside className="call-mechanics-banner" aria-label="How vendor calls work">
      <Mic size={16} />
      <div>
        <strong>How calls work in this demo</strong>
        <p>
          <b>Sample call</b> = pre-written quote you can preview instantly.
          <b> Live call</b> = you talk in the browser; the ElevenLabs buyer agent negotiates (AI plays the vendor side for the hackathon demo).
          <b>Dial vendor</b> places a real outbound phone call when Twilio / ElevenLabs phone number ID is configured on Supabase.
          Demo 555 numbers cannot be dialed — run live search for a real phone first.
        </p>
      </div>
    </aside>
  );
}
