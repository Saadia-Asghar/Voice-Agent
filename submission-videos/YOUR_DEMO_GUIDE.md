# Saadia — your personal “how to use BenchDial” guide

Read this once. Then open the app and follow the blue bar.

---

## What BenchDial actually is

1. **You** describe what's broken (once).
2. **BenchDial** finds repair vendors and a **voice agent** talks to them using your brief.
3. **You** compare three quotes and approve a memo.

BenchDial does **not** buy anything. You still call the vendor and place the order.

---

## Fastest demo (3 clicks — for your video)

1. Open: **https://hacknation-lemon.vercel.app/?judge=1**
2. You land on **Call vendors**. Click **Compare quotes →** (big blue button).
3. Drag the **downtime slider**. Click **Open Award memo →**.
4. Check **I've read the recommendation**. Click **Approve**.
5. Done. Read **What to do next**.

You never need to sign in for this path.

---

## What each screen means

### Home
Marketing page. Click **Start demo — no login**.

### Step 1 · Repair brief
Where you describe the fault (voice or PDF).  
**For demo:** skip this — `?judge=1` loads the SpinPro X2 case automatically.

### Step 2 · Call vendors
- **Vendor discovery** — animation showing how shops are found (Maps, Yelp, approved list).
- **Three vendor rows** — already have sample quotes.
- **Preview sample call** — plays a demo transcript (use this in videos).
- **Start live call** — needs **Sign in** (top right) + microphone. AI plays vendor side.
- **Compare quotes →** — go to next step (this is the main button).

### Step 3 · Compare quotes
- Table of three vendors side by side.
- **Downtime slider** — “how much does 1 hour of being broken cost?” — drag it; ranking changes.
- **Open Award memo** — go to final step.

### Step 4 · Award memo
- Recommendation (usually OEM Precision in demo).
- Check the box → **Approve**.
- **What to do next** — forward to purchasing.

---

## Sign-in — when you need it

| Action | Sign in needed? |
|--------|-----------------|
| Demo with sample calls | **No** |
| Compare + Award memo | **No** |
| Live voice call | **Yes** — click Sign in top right first |

---

## What you can upload

| Upload | Works? |
|--------|--------|
| PDF / photo of **repair report** | Yes — fills repair brief |
| List of vendor phone numbers / URLs | **Not yet** |

---

## What's real vs demo

| Feature | Status |
|---------|--------|
| Repair brief lock | Working |
| 3 vendor sample calls | Working |
| Compare + downtime ranking | Working |
| Award memo + approve | Working |
| Vendor search animation | Demo preview (live API next) |
| Live voice in browser | Working when signed in + mic |
| Real phone dial (Twilio) | Planned — not in app yet |

---

## Your pitch in plain English

> “Something broke at work. Instead of calling three repair shops and repeating the same story, I lock one repair brief in BenchDial. It calls three vendors on the same job, compares the quotes fairly, and gives me a memo I can send to purchasing. I approve — BenchDial never buys.”

---

## Recording checklist

- [ ] Open `?judge=1` before hitting record
- [ ] Blue demo bar visible at top
- [ ] Click Compare quotes → then slider then memo
- [ ] Say “sample call” if showing Preview sample call
- [ ] Say “human still decides” on Award memo
- [ ] Do not sign in unless showing live voice in tech video
