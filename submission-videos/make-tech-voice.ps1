# Tech voice — ARCHITECTURE / STACK only (how it is built)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = 2
$synth.Volume = 100
$out = "D:\hp2\Documents\hacknation\submission-videos\tech-voice.wav"
if (Test-Path $out) { Remove-Item $out -Force }
$synth.SetOutputToWaveFile($out)
$synth.Speak(@"
This is the BenchDial technical walkthrough — architecture and implementation for The Negotiator.
Front end: React, TypeScript, and Vite, modeled as Estimator, Caller, Closer, and Award.
Voice: ElevenLabs Agents over WebRTC. The Estimator interview and Buyer closer share one ScopePrint JSON contract.
Backend: Supabase Auth, Edge Functions for conversation tokens and HMAC post-call webhooks, and Postgres for scopes, calls, transcripts, and audit events.
Honesty is enforced outside the model. check leverage must verify a competing term before the agent may speak it. Deterministic TypeScript ranks downtime-adjusted cost and flags quotes thirty percent below the peer median.
Provenance is explicit: simulated fixtures never become Recorded Live Run. Only a signed webhook with a non-empty transcript can.
Unlock in the header gates billable Buyer lanes. Estimator demo intake can stay public.
That is the stack: voice in, structured evidence out — not a chatbot skin on a form.
"@)
$synth.Dispose()
Write-Host "TECH voice:"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $out
