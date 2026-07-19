/**
 * Tech video: screen recording + voiceover + burned subtitles.
 * Shows Unlock dialog (no password), then full feature walkthrough.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, copyFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "submission-videos");
const TMP = join(OUT, "_tech_live");
const require = createRequire(join(OUT, "package", "index.js"));
const { chromium } = require(join(OUT, "package", "index.js"));

const BASE = process.env.DEMO_URL ?? "https://hacknation-lemon.vercel.app";
const VOICE = join(OUT, "tech-voice.wav");
const MP4 = join(OUT, "BenchDial-Tech.mp4");
const ASS = join(OUT, "tech-live.ass");

mkdirSync(TMP, { recursive: true });

const executablePath = [
  `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
].find((p) => existsSync(p));
if (!executablePath) throw new Error("Chrome not found");
if (!existsSync(VOICE)) throw new Error("Missing tech-voice.wav — run make-tech-voice.ps1 first");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Timed chapters ~ matching narration (~55-58s when spoken at Rate 1)
const CHAPTERS = [
  { t: 0, badge: "TECH · ARCHITECTURE", line: "React · TypeScript · Vite · ElevenLabs · Supabase" },
  { t: 6, badge: "AUTH GATE", line: "Unlock only for billable live calls — simulated walkthrough stays public" },
  { t: 14, badge: "01 ESTIMATOR", line: "Voice + document → same JSON ScopePrint → lock before any call" },
  { t: 24, badge: "02 CALLER", line: "3 styles · scope_json injection · HMAC webhook → RECORDED LIVE RUN" },
  { t: 36, badge: "03 CLOSER", line: "Honesty Firewall · check_leverage · 30% red-flag · ranked cost" },
  { t: 46, badge: "AWARD", line: "Transcript receipts — BenchDial recommends, human approves" },
];

function writeAss() {
  const lines = [
    "[Script Info]",
    "Title: BenchDial Tech",
    "ScriptType: v4.00+",
    "PlayResX: 1440",
    "PlayResY: 900",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Caption,Segoe UI,34,&H00FFFFFF,&H000000FF,&H00101010,&HAA000000,-1,0,0,0,100,100,0,0,3,0,0,2,36,36,44,1",
    "Style: Badge,Segoe UI,26,&H00FFFFFF,&H000000FF,&H00F35C2C,&H00000000,-1,0,0,0,100,100,0,0,3,0,0,7,24,24,24,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const fmt = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };
  for (let i = 0; i < CHAPTERS.length; i++) {
    const start = CHAPTERS[i].t;
    const end = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].t : 58;
    lines.push(`Dialogue: 0,${fmt(start)},${fmt(end)},Badge,,0,0,0,,${CHAPTERS[i].badge}`);
    lines.push(`Dialogue: 0,${fmt(start)},${fmt(end)},Caption,,0,0,0,,${CHAPTERS[i].line}`);
  }
  writeFileSync(ASS, lines.join("\n"));
}

async function injectUI(page) {
  await page.evaluate(() => {
    if (!document.getElementById("demo-cursor")) {
      const cursor = document.createElement("div");
      cursor.id = "demo-cursor";
      cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
      cursor.style.cssText = "position:fixed;z-index:999999;pointer-events:none;width:24px;height:24px;left:0;top:0;filter:drop-shadow(1px 1px 2px rgba(0,0,0,.4));transition:left .07s linear,top .07s linear;";
      document.body.appendChild(cursor);
      document.addEventListener("mousemove", (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });
    }
  });
}

async function click(page, selector, wait = 700) {
  const el = page.locator(selector).first();
  if (!(await el.isVisible().catch(() => false))) return false;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
    await sleep(180);
  }
  await el.click({ timeout: 4000 }).catch(() => {});
  await sleep(wait);
  return true;
}

async function prepareScope(page) {
  const input = page.locator('input[type="file"]').first();
  if (await input.count()) {
    await input.setInputFiles({
      name: "CityLabs-SpinPro-Service-Report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% BenchDial service report\n"),
    });
    await sleep(600);
  }
  const voiceBtns = page.locator('button:has-text("Use voice")');
  const n = await voiceBtns.count();
  for (let i = 0; i < Math.min(n, 2); i++) {
    await voiceBtns.nth(i).click().catch(() => {});
    await sleep(300);
  }
  await click(page, 'button:has-text("Mark voice-path")', 350);
  await click(page, 'button:has-text("Lock confirmed scope")', 900);
}

function newestWebm(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm")).map((f) => join(dir, f));
  if (!files.length) throw new Error("no webm");
  return files.sort()[files.length - 1];
}

async function record() {
  const dir = join(TMP, "take");
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--disable-dev-shm-usage"] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const started = Date.now();
  const elapsed = () => (Date.now() - started) / 1000;
  const waitUntil = async (sec) => {
    const remain = sec * 1000 - (Date.now() - started);
    if (remain > 0) await sleep(remain);
  };

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
  await sleep(800);
  await injectUI(page);

  // 0–6s: home / stack
  await page.mouse.move(500, 340, { steps: 10 });
  await waitUntil(6);

  // 6–14s: unlock dialog (no password — explore stays public)
  await click(page, 'button:has-text("Unlock live calls")', 800);
  await injectUI(page);
  await page.locator('input[type="email"]').first().click().catch(() => {});
  await sleep(350);
  await page.locator('input[type="password"]').first().click().catch(() => {});
  await sleep(600);
  await waitUntil(13.2);
  await page.keyboard.press("Escape");
  await sleep(400);

  // 14–24s: Estimator
  await click(page, 'button:has-text("Start the Estimator"), button:has-text("Start Estimator")', 1000);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 160, behavior: "smooth" }));
  await sleep(500);
  await prepareScope(page);
  await injectUI(page);
  await waitUntil(24);

  // 24–36s: Caller
  await click(page, 'button:has-text("Open Call Room"), button:has-text("02 Caller")', 1000);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 160, behavior: "smooth" }));
  await sleep(700);
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: "smooth" }));
  await sleep(800);
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: "smooth" }));
  await waitUntil(36);

  // 36–46s: Closer
  await click(page, 'button:has-text("03 Closer")', 1000);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
  await sleep(700);
  await page.evaluate(() => window.scrollTo({ top: 520, behavior: "smooth" }));
  await waitUntil(46);

  // 46–56s: Award
  await click(page, 'button:has-text("Award"), button:has-text("Review award memo")', 1000);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 80, behavior: "smooth" }));
  await waitUntil(55.5);

  console.log(`Recorded ${elapsed().toFixed(1)}s of UI`);
  await context.close();
  await browser.close();
  return newestWebm(dir);
}

writeAss();
console.log("Recording Tech walkthrough…");
const webm = await record();
const silent = join(TMP, "tech-silent.mp4");
const withSubs = join(TMP, "tech-subs.mp4");

let r = spawnSync("ffmpeg", [
  "-y", "-i", webm,
  "-vf", "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-t", "58", silent,
], { encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr.slice(-800));

// Burn subtitles (run from OUT so ass path is simple)
r = spawnSync("ffmpeg", [
  "-y", "-i", silent,
  "-vf", `ass=${ASS.replace(/\\/g, "/").replace(":", "\\:")}`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", withSubs,
], { cwd: OUT, encoding: "utf8" });
if (r.status !== 0) {
  // fallback relative
  r = spawnSync("ffmpeg", [
    "-y", "-i", withSubs !== silent ? silent : webm,
    "-vf", "ass=tech-live.ass",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", withSubs,
  ], { cwd: OUT, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr.slice(-800));
}

r = spawnSync("ffmpeg", [
  "-y",
  "-i", withSubs,
  "-i", VOICE,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "copy",
  "-c:a", "aac", "-b:a", "160k",
  "-shortest",
  "-t", "59",
  "-movflags", "+faststart",
  MP4,
], { encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr.slice(-800));

console.log("Wrote", MP4);
