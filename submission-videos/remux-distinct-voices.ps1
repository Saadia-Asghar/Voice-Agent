# Remux Demo + Tech with DISTINCT voice scripts and distinct subtitle tracks.
$ErrorActionPreference = "Stop"
$OUT = "D:\hp2\Documents\hacknation\submission-videos"
Set-Location $OUT

Write-Host "Generating distinct voices..."
powershell -ExecutionPolicy Bypass -File "$OUT\make-demo-voice.ps1"
powershell -ExecutionPolicy Bypass -File "$OUT\make-tech-voice.ps1"

function Get-Duration([string]$path) {
  [double](ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $path)
}

function Remux($srcVideo, $voice, $ass, $dest) {
  $vDur = Get-Duration $srcVideo
  $aDur = Get-Duration $voice
  $pad = [math]::Max(0, [math]::Ceiling($aDur - $vDur + 1))
  $total = [math]::Ceiling($aDur + 0.5)
  Write-Host ("  video={0:n1}s voice={1:n1}s pad={2}s total={3}s" -f $vDur, $aDur, $pad, $total)

  $tmp = Join-Path $OUT ("_tmp_" + [guid]::NewGuid().ToString("N") + ".mp4")
  ffmpeg -y -i $srcVideo -vf "ass=$ass" -c:v libx264 -pix_fmt yuv420p -an $tmp
  if ($LASTEXITCODE -ne 0) { throw "ass burn failed for $dest" }

  $fc = if ($pad -gt 0) { "[0:v]tpad=stop_mode=clone:stop_duration=$pad[v]" } else { "[0:v]null[v]" }
  ffmpeg -y -i $tmp -i $voice -filter_complex $fc -map "[v]" -map "1:a:0" `
    -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -t $total -movflags +faststart $dest
  if ($LASTEXITCODE -ne 0) { throw "mux failed for $dest" }
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  Write-Host "Wrote $dest"
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $dest
}

# Prefer silent/full-flow sources so old captions are not double-burned
$demoSrc = if (Test-Path "$OUT\_demo_scroll\silent.mp4") { "$OUT\_demo_scroll\silent.mp4" }
  elseif (Test-Path "$OUT\_demo_scroll\subs.mp4") { "$OUT\_demo_scroll\subs.mp4" }
  else { "$OUT\BenchDial-Demo.mp4" }

$techSrc = if (Test-Path "$OUT\BenchDial-Tech-OLD-FLOW.mp4") { "$OUT\BenchDial-Tech-OLD-FLOW.mp4" }
  elseif (Test-Path "$OUT\_tech_padded.mp4") { "$OUT\_tech_padded.mp4" }
  else { "$OUT\BenchDial-Tech.mp4" }

Write-Host "Demo source: $demoSrc"
Write-Host "Tech source: $techSrc"

Remux $demoSrc "$OUT\demo-voice.wav" "demo-distinct.ass" "$OUT\BenchDial-Demo.mp4"
Remux $techSrc "$OUT\tech-voice.wav" "tech-distinct.ass" "$OUT\BenchDial-Tech.mp4"

Get-Item "$OUT\BenchDial-Demo.mp4","$OUT\BenchDial-Tech.mp4" | Format-Table Name, @{N='MB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
