# Add these 3 keys (demo works without them)

Paste into **Supabase → Project → Edge Functions → Secrets**  
Project: https://supabase.com/dashboard/project/gnzxgxvzflkystgrcfbz/settings/functions

Then run:

```powershell
cd D:\hp2\Documents\hacknation
npx supabase login
npm run deploy:supabase
```

---

## The only 3 accounts you need

### 1) Tavily — live vendor search
1. Open: https://app.tavily.com/home  
2. Create account → copy API key  
3. Secret name: `TAVILY_API_KEY`  
**Fallback if missing:** demo still shows OEM Precision / RapidBench / MetroLab Field.

### 2) Twilio — real phone dial
1. Open: https://console.twilio.com/  
2. Create account → get Account SID + Auth Token  
3. Buy or verify a voice number  
4. Secrets:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER` (E.164 like `+17045551212`)  
**Fallback if missing:** Dial vendor fails softly; Preview sample + Compare quotes still work.

### 3) ElevenLabs phone number ID — best outbound voice
1. Open: https://elevenlabs.io/app/agents/phone-numbers  
2. Import the same Twilio number  
3. Assign your Buyer agent  
4. Copy the phone number ID  
5. Secret name: `ELEVENLABS_AGENT_PHONE_NUMBER_ID`  
**Fallback if missing:** Twilio TwiML dial still works if Twilio secrets are set; browser live call still works with existing ElevenLabs agent + API key.

---

## Also keep these (you may already have them in Supabase)

| Secret | Purpose |
|--------|---------|
| `ELEVENLABS_API_KEY` | Voice tokens + outbound |
| `ELEVENLABS_BUYER_AGENT_ID` | Buyer agent |
| `ELEVENLABS_WEBHOOK_SECRET` | Save live transcripts |
| `BENCHBID_TOOL_SECRET` | Agent tool auth |

---

## Demo never blocks

| Feature fails | What still works |
|---------------|------------------|
| Vendor search | Sample 3 vendors |
| Dial vendor | Preview sample + Browser live call |
| Persist to DB | Local demo ranking + award memo |
| Health endpoint | App UI still loads |

Always use: https://hacknation-lemon.vercel.app/?judge=1
