# Demo voice — PRODUCT / UX only (what the user sees and does)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Zira Desktop")
$synth.Rate = 2
$synth.Volume = 100
$out = "D:\hp2\Documents\hacknation\submission-videos\demo-voice.wav"
if (Test-Path $out) { Remove-Item $out -Force }
$synth.SetOutputToWaveFile($out)
$synth.Speak(@"
This is the BenchDial product demo — the user experience for The Negotiator.
Watch Saadia’s journey, not the backend.
On the home screen she sees one promise: lock a repair brief, run three provider calls, and get an award she can defend.
She opens the Estimator. Scroll with her as she reviews the shared scope form, drops in a service report, settles voice-versus-document conflicts, and locks ScopePrint before anyone is called.
She moves to the Caller. Scroll the market list and the three lanes — tough OEM, hidden-fee independent, and stonewaller — each ending in a clear outcome: quote, negotiated terms, or decline.
In the Closer, scroll the comparison table, the thirty percent red-flag warning, and the concession ledger that shows what improved mid-call.
She finishes on the Award memo. Scroll the ranking and transcript receipts. BenchDial recommends OEM Precision. Saadia still approves.
That is the U X: gather once, negotiate visibly, decide with evidence.
"@)
$synth.Dispose()
Write-Host "DEMO voice:"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $out
