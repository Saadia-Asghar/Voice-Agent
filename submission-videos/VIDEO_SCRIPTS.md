# BenchDial — video scripts (read while you click)

**Live app:** https://hacknation-lemon.vercel.app/?judge=1  
**Format:** H.264 MP4 · max 60 sec each · 1920×1080  
**Case:** SpinPro X2 centrifuge · Error E17 · City Labs  

A blue **“Your 3-minute demo script”** bar at the top tells you what to click. Follow it if you get lost.

---

## Before you record (2 minutes)

1. Open **https://hacknation-lemon.vercel.app/?judge=1** in Chrome.
2. You should land on **Step 2 · Call vendors** (not Home). If not, click **Try demo** on Home.
3. **Do NOT sign in** for the demo video — sample calls work without login.
4. Sign in only if you want to show **live voice** in the tech video.
5. Close extra tabs. Zoom browser to 100%.

### The 4 clicks (memorize this)

| Step | Screen | What you click |
|------|--------|----------------|
| 1 | (auto) | Demo loads repair brief — you skip Step 1 |
| 2 | Call vendors | **Compare quotes →** (blue button, top or middle) |
| 3 | Compare quotes | Drag **downtime slider** → **Open Award memo →** |
| 4 | Award memo | Check box → **Approve** → show “What to do next” |

**Optional:** On Step 2, click **Preview sample call** on RapidBench before Compare quotes.

---

## 1. Demo video (~60 sec) — convince judges it works

**Your story in one line:**  
When equipment breaks, phone quotes are messy. BenchDial locks one repair brief, calls three vendors on the same job, and gives you a memo you can defend.

### Click path + what to say

| Time | What you do on screen | What you say (natural — not word-for-word) |
|------|----------------------|---------------------------------------------|
| 0–5s | Home page → click **Start demo — no login** | “This is BenchDial. Something broke at work — a centrifuge with Error E17. Purchasing wants three quotes by lunch.” |
| 5–12s | Land on **Call vendors**. Point at blue demo bar. | “I didn’t type anything. The demo loads one repair brief — same job for every vendor.” |
| 12–22s | Scroll to **Vendor discovery** (Maps/Yelp animation). Optional: **Preview sample call** on one row. | “BenchDial finds repair shops near your site. In the demo, three vendors are ready with sample calls — labeled SAMPLE CALL so you know they’re not fake live recordings.” |
| 22–32s | Click **Compare quotes →** | “Three outcomes: a quote, a negotiated price, and a decline — all on the same brief.” |
| 32–45s | **Compare quotes** screen — drag downtime slider left/right | “Side by side. I set downtime cost — when the instrument is idle, the ranking changes. The cheapest sticker price isn’t always the win.” |
| 45–55s | **Open Award memo →** → check box → **Approve** | “Award memo: who to call back and why. I approve — BenchDial never buys. Human still decides.” |
| 55–60s | Show “What to do next” | “Forward to purchasing with the brief ID. Three minutes, not an afternoon of phone tag.” |

**Close line:**  
“When the fix is priced by phone, BenchDial calls, compares, and haggles — on one repair brief.”

---

## 2. Tech video (~60 sec) — convince them you built it

**Your story in one line:**  
Phone-priced repairs fail because every vendor hears a different story. We lock one ScopePrint, run voice agents with honesty rules, and rank with evidence.

### Click path + what to say

| Time | What you do | What you say |
|------|-------------|--------------|
| 0–8s | Home → workflow diagram (Repair brief → Call → Compare) | “BenchDial is three modules: Estimator, Caller, Closer. React front end, Supabase backend, ElevenLabs voice.” |
| 8–18s | Click **Build a repair brief** OR show locked brief on demo | “The Estimator locks one ScopePrint — structured JSON. Same spec goes to every provider. No scope drift.” |
| 18–30s | Call room — point at **SAMPLE CALL** vs **Start live call** | “Sample calls are fixtures — labeled. Live calls use ElevenLabs in the browser. Token minted by a Supabase edge function — API keys never hit the client.” |
| 30–40s | Vendor discovery section | “Vendor discovery: Maps, Yelp, approved list. Demo uses a fixed list; production wires live search. Twilio outbound to real numbers is next — not dialed in this web demo yet.” |
| 40–50s | Compare screen — red-flag panel + ranking table | “Honesty Firewall blocks invented leverage. Ranking adds downtime, warranty, call-out fees. Quotes 30% below peers get flagged.” |
| 50–58s | Award memo — provenance badge “Based on sample calls” | “Award memo needs human approval. Webhook verifies live transcripts before they replace fixtures.” |

**Close line:**  
“Comparable scope in, verified evidence through the call, defendable ranking out.”

**Optional B-roll:** Open `supabase/functions/elevenlabs-token/index.ts` in your editor (blur secrets).

---

## 3. Team video (~45 sec) — convince them about YOU

**Face to camera.** Home page optional in background.

### Script (read aloud)

> Hi — I’m Saadia Asghar, Team HN-6590. I built BenchDial solo for The Negotiator challenge with ElevenLabs and Hack-Nation.
>
> The problem: when lab or facility equipment breaks, repair quotes come by phone — and they’re impossible to compare. Vendors hide call-out fees, calibration, and warranty. You waste an afternoon calling around, and the cheapest number isn’t the best deal.
>
> BenchDial fixes that with voice agents. You lock one repair brief, call three providers on the same job, negotiate with real evidence, and get a ranked memo for purchasing.
>
> I built the product end to end — the three agent flows, honesty rules, Supabase backend, and this demo you can try without logging in.
>
> BenchDial recommends. A human still decides. Thanks for watching.

**Length:** ~45–55 seconds at a calm pace.

### Shot list

1. **0–5s** — Smile, name, team ID  
2. **5–18s** — The problem (opaque phone quotes, downtime)  
3. **18–32s** — The fix (brief → calls → compare → memo)  
4. **32–45s** — Solo builder + demo link + “human still decides”  

---

## If you get stuck during recording

| Problem | Fix |
|---------|-----|
| Stuck on Home | Click **Start demo — no login** or open `?judge=1` URL |
| Don’t know what to click | Read the blue **Your 3-minute demo script** bar at top |
| Calls look empty | Click **Compare quotes →** — samples are pre-filled |
| Live call fails | Use **Preview sample call** instead; say “sample for demo” |
| Wrong step | Use stepper tabs: Repair brief · Call vendors · Compare · Award memo |

---

## Honest gaps (say these if judges ask)

- **Vendor search:** Demo shows Maps/Yelp animation; live API not wired — fixed vendor list for hackathon.
- **Twilio:** Real phone dial to vendor numbers — planned, env vars exist, not in UI yet.
- **Upload:** Repair PDFs yes; vendor URL/phone lists — not yet.
- **Sign-in:** Optional for demo; sign in for live voice calls saved to your account.
