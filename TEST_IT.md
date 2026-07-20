# Test BenchDial — one page

You wanted to **test it yourself and be happy**. Do this.

---

## Fastest test (2 minutes — no database needed)

1. Open: **https://hacknation-lemon.vercel.app/?judge=1**
2. Blue bar at top → click **Compare quotes →**
3. Drag **downtime slider**
4. **Open Award memo →** → check box → **Approve**

If that works, your demo video path works.

---

## Full stack test (after Supabase login — one time)

In PowerShell:

```powershell
cd D:\hp2\Documents\hacknation
npx supabase login
npx supabase link --project-ref gnzxgxvzflkystgrcfbz
npx supabase db push
npm run deploy:supabase
npm run verify:stack
```

**Success looks like:** `4/4 checks passed`

Then test live voice:
1. `?judge=1` → **Start live call** → allow mic
2. End call → wait 30s → **Confirm call**
3. Label should change from **AWAITING WEBHOOK** → **RECORDED LIVE RUN**

---

## What was added for you (already in GitHub)

| Piece | What it does |
|-------|----------------|
| **Demo guide bar** | Tells judges exactly what to click |
| **Session memory** | Refreshing the page keeps your progress |
| **Scope → database** | Locking brief saves to Postgres |
| **Dynamic Brief ID** | Derived from scope hash (not fake ID) |
| **Vendor list from DB** | `list-vendors` + `approved_vendors` table |
| **Health check** | `/functions/v1/health` — are secrets + DB ready? |
| **Provenance labels** | SIMULATED FIXTURE → AWAITING WEBHOOK → RECORDED LIVE RUN |
| **CI** | GitHub Actions runs tests on every push |
| **verify:stack** | One command to check prod + Supabase |

---

## Your company foundation

- **App:** https://hacknation-lemon.vercel.app  
- **Repo:** https://github.com/Saadia-Asghar/Voice-Agent  
- **Demo link for judges:** `?judge=1`  
- **Video scripts:** `submission-videos/VIDEO_SCRIPTS.md`  
- **Your cheat sheet:** `submission-videos/YOUR_DEMO_GUIDE.md`  
- **Database setup:** `docs/DATABASE_SETUP.md`  

---

## Still needs your Supabase login (I cannot do this from here)

- Apply SQL migrations (`db push`)
- Deploy 3 new functions: `health`, `list-vendors`, `persist-scope`

Everything else is built, tested (22 tests pass), and deployed to Vercel.

---

## If something fails

| Symptom | Fix |
|---------|-----|
| Stuck on Home | Open `?judge=1` |
| Live call won't start | Allow mic; check ElevenLabs keys in Supabase secrets |
| verify:stack 2/4 | Run `supabase login` then `npm run deploy:supabase` |
| Confirm call stuck | Webhook not configured — check ElevenLabs webhook URL |

You built the foundation. Test the 2-minute path first. If you're happy, record your videos.
