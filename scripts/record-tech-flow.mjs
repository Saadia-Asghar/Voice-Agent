/**
 * Tech video with FULL FLOW (not stuck on home) + voice + subtitles.
 * Uses Demo-style sequential navigation (reliable clicks).
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "submission-videos");
const TMP = join(OUT, "_tech_flow");
const require = createRequire(join(OUT, "package", "index.js"));
const { chromium } = require(join(OUT, "package", "index.js"));

const BASE = process.env.DEMO_URL ?? "https://hacknation-lemon.vercel.app";
const VOICE = join(OUT, "tech-voice.wav");
const MP4 = join(OUT, "BenchDial-Tech.mp4");

mkdirSync(TMP, { recursive: true });
const executablePath = [
  `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
].find((p) => existsSync(p));
if (!executablePath) throw new Error("Chrome not found");
if (!existsSync(VOICE)) throw new Error("Missing tech-voice.wav");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHAPTERS = [
  { t: 0, badge: "TECH · ARCHITECTURE", line: "React · TypeScript · Vite · ElevenLabs · Supabase" },
  { t: 6, badge: "AUTH GATE", line: "Unlock only for billable live — simulated walkthrough stays public" },
  { t: 12, badge: "01 ESTIMATOR", line: "Voice + document → same JSON ScopePrint → lock" },
  { t: 22, badge: "02 CALLER", line: "3 styles · scope_json · HMAC webhook → RECORDED LIVE RUN" },
  { t: 32, badge: "03 CLOSER", line: "Honesty Firewall · check_leverage · 30% red-flag" },
  { t: 40, badge: "AWARD", line: "Transcript receipts — human still approves" },
];

function writeAss(path) {
  const fmt = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return `0:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };
  const lines = [
    "[Script Info]", "Title: Tech", "ScriptType: v4.00+", "PlayResX: 1440", "PlayResY: 900", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Caption,Segoe UI,34,&H00FFFFFF,&H000000FF,&H00101010,&HAA000000,-1,0,0,0,100,100,0,0,3,0,0,2,36,36,44,1",
    "Style: Badge,Segoe UI,26,&H00FFFFFF,&H000000FF,&H00F35C2C,&H00000000,-1,0,0,0,100,100,0,0,3,0,0,7,24,24,24,1",
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  for (let i = 0; i < CHAPTERS.length; i++) {
    const start = CHAPTERS[i].t;
    const end = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].t : 50;
    lines.push(`Dialogue: 0,${fmt(start)},${fmt(end)},Badge,,0,0,0,,${CHAPTERS[i].badge}`);
    lines.push(`Dialogue: 0,${fmt(start)},${fmt(end)},Caption,,0,0,0,,${CHAPTERS[i].line}`);
  }
  writeFileSync(path, lines.join("\n"));
}

async function injectUI(page) {
  await page.evaluate(() => {
    if (document.getElementById("demo-cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    cursor.style.cssText = "position:fixed;z-index:999999;pointer-events:none;width:24px;height:24px;left:0;top:0;filter:drop-shadow(1px 1px 2px rgba(0,0,0,.4));transition:left .07s linear,top .07s linear;";
    document.body.appendChild(cursor);
    document.addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
  });
}

async function click(page, selector, wait = 800) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 8000 }).catch(() => null);
  if (!(await el.isVisible().catch(() => false))) {
    console.warn("missing", selector);
    return false;
  }
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    await sleep(150);
  }
  await el.click({ timeout: 5000 });
  await sleep(wait);
  return true;
}

async function closeAuth(page) {
  const closed = await click(page, 'button[aria-label="Close authentication"]', 400);
  if (!closed) {
    await page.keyboard.press("Escape");
    await sleep(400);
  }
  // click backdrop if dialog still open
  const dlg = page.locator('[role="dialog"]');
  if (await dlg.isVisible().catch(() => false)) {
    await page.mouse.click(20, 20);
    await sleep(300);
  }
}

async function prepareScope(page) {
  const input = page.locator('input[type="file"]').first();
  await input.waitFor({ state: "attached", timeout: 8000 }).catch(() => null);
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
    await sleep(280);
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

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector('button:has-text("Start the Estimator"), button:has-text("Start Estimator")', { timeout: 20000 });
  await injectUI(page);
  await sleep(2500);

  // Auth gate — show then CLOSE so navigation works
  await click(page, 'button:has-text("Unlock live calls")', 1200);
  await injectUI(page);
  await page.locator('input[type="email"]').first().click().catch(() => {});
  await sleep(500);
  await page.locator('input[type="password"]').first().click().catch(() => {});
  await sleep(800);
  await closeAuth(page);
  await sleep(500);

  // Estimator full flow
  await click(page, 'button:has-text("Start the Estimator"), button:has-text("Start Estimator")', 1400);
  await injectUI(page);
  await page.waitForSelector('button:has-text("Lock confirmed scope"), input[type="file"]', { timeout: 15000 });
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
  await sleep(700);
  await prepareScope(page);
  await injectUI(page);
  await sleep(1000);

  // Caller
  const opened = await click(page, 'button:has-text("Open Call Room")', 1400);
  if (!opened) await click(page, 'button:has-text("02 Caller")', 1400);
  await injectUI(page);
  await page.waitForSelector('text=Three negotiation styles', { timeout: 12000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo({ top: 160, behavior: "smooth" }));
  await sleep(1000);
  await page.evaluate(() => window.scrollTo({ top: 480, behavior: "smooth" }));
  await sleep(1400);

  // Closer
  await click(page, 'button:has-text("03 Closer")', 1400);
  await injectUI(page);
  await page.waitForSelector('text=Gather. Compare', { timeout: 12000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
  await sleep(1000);
  await page.evaluate(() => window.scrollTo({ top: 560, behavior: "smooth" }));
  await sleep(1400);

  // Award
  await click(page, 'button:has-text("Award")', 1400);
  await injectUI(page);
  await page.waitForSelector('text=ranked deal, text=Award', { timeout: 12000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo({ top: 60, behavior: "smooth" }));
  await sleep(2200);

  await context.close();
  await browser.close();
  return newestWebm(dir);
}

const assPath = join(OUT, "tech-flow.ass");
writeAss(assPath);
console.log("Recording FULL FLOW tech walkthrough…");
const webm = await record();
const silent = join(TMP, "silent.mp4");
const withSubs = join(TMP, "subs.mp4");

let r = spawnSync("ffmpeg", [
  "-y", "-i", webm,
  "-vf", "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-t", "58", silent,
], { encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr.slice(-900));

r = spawnSync("ffmpeg", [
  "-y", "-i", silent, "-vf", "ass=tech-flow.ass",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", withSubs,
], { cwd: OUT, encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr.slice(-900));

r = spawnSync("ffmpeg", [
  "-y", "-i", withSubs, "-i", VOICE,
  "-filter_complex", "[1:a]atempo=1.05[a]",
  "-map", "0:v:0", "-map", "[a]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
  "-shortest", "-t", "59", "-movflags", "+faststart", MP4,
], { encoding: "utf8" });
if (r.status !== 0) {
  // fallback without atempo
  r = spawnSync("ffmpeg", [
    "-y", "-i", withSubs, "-i", VOICE,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
    "-shortest", "-t", "59", "-movflags", "+faststart", MP4,
  ], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr.slice(-900));
}

console.log("Wrote", MP4);
