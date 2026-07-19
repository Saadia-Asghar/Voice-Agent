/**
 * Demo UX video: voice + subtitles + scroll through each screen.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "submission-videos");
const TMP = join(OUT, "_demo_scroll");
const require = createRequire(join(OUT, "package", "index.js"));
const { chromium } = require(join(OUT, "package", "index.js"));

const BASE = process.env.DEMO_URL ?? "https://hacknation-lemon.vercel.app";
const VOICE = join(OUT, "demo-voice.wav");
const MP4 = join(OUT, "BenchDial-Demo.mp4");
const ASS = join(OUT, "demo-scroll.ass");

mkdirSync(TMP, { recursive: true });

const executablePath = [
  `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
].find((p) => existsSync(p));
if (!executablePath) throw new Error("Chrome not found");
if (!existsSync(VOICE)) throw new Error("Missing demo-voice.wav — run make-demo-voice.ps1");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHAPTERS = [
  { t: 0, badge: "DEMO · UX", line: "One repair brief · three comparable calls · one human award" },
  { t: 7, badge: "01 ESTIMATOR", line: "Scroll the scope form · upload · resolve conflicts · lock" },
  { t: 20, badge: "02 CALLER", line: "Scroll discovery + three negotiation lanes + outcomes" },
  { t: 32, badge: "03 CLOSER", line: "Scroll comparison · red-flag rule · concession ledger" },
  { t: 42, badge: "AWARD", line: "Scroll ranked deal + transcript receipts" },
];

function writeAss() {
  const fmt = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return `0:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };
  const lines = [
    "[Script Info]", "Title: Demo UX", "ScriptType: v4.00+", "PlayResX: 1440", "PlayResY: 900", "",
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
  writeFileSync(ASS, lines.join("\n"));
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

async function smoothScroll(page, targets, pause = 700) {
  for (const top of targets) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), top);
    await sleep(pause);
  }
}

async function click(page, selector, wait = 800) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 10000 }).catch(() => null);
  if (!(await el.isVisible().catch(() => false))) {
    console.warn("missing", selector);
    return false;
  }
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    await sleep(140);
  }
  await el.click({ timeout: 5000 });
  await sleep(wait);
  return true;
}

async function prepareScope(page) {
  await smoothScroll(page, [120, 360, 620], 650);
  const input = page.locator('input[type="file"]').first();
  if (await input.count()) {
    await input.setInputFiles({
      name: "CityLabs-SpinPro-Service-Report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% BenchDial service report\n"),
    });
    await sleep(500);
  }
  await smoothScroll(page, [200, 0], 500);
  const voiceBtns = page.locator('button:has-text("Use voice")');
  const n = await voiceBtns.count();
  for (let i = 0; i < Math.min(n, 2); i++) {
    await voiceBtns.nth(i).click().catch(() => {});
    await sleep(280);
  }
  await click(page, 'button:has-text("Mark voice-path")', 300);
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

  // Home — scroll hero, modules, proof
  await page.mouse.move(520, 300, { steps: 8 });
  await sleep(900);
  await smoothScroll(page, [420, 900, 1400, 0], 800);

  // Estimator
  await click(page, 'button:has-text("Start the Estimator"), button:has-text("Start Estimator")', 1300);
  await injectUI(page);
  await page.waitForSelector('input[type="file"], button:has-text("Lock confirmed scope")', { timeout: 15000 });
  await prepareScope(page);
  await injectUI(page);
  await smoothScroll(page, [400, 700, 0], 600);

  // Caller — scroll discovery + lanes
  const opened = await click(page, 'button:has-text("Open Call Room")', 1300);
  if (!opened) await click(page, 'button:has-text("02 Caller")', 1300);
  await injectUI(page);
  await page.waitForSelector('text=Three negotiation styles, text=Where the call list', { timeout: 12000 }).catch(() => {});
  await smoothScroll(page, [180, 420, 780, 1100, 200], 750);

  // Closer — scroll metrics, table, ledger
  await click(page, 'button:has-text("03 Closer")', 1300);
  await injectUI(page);
  await page.waitForSelector('text=Gather. Compare, text=red-flag', { timeout: 12000 }).catch(() => {});
  await smoothScroll(page, [160, 420, 780, 1180, 200], 750);

  // Award — scroll memo sections
  await click(page, 'button:has-text("Award")', 1300);
  await injectUI(page);
  await page.waitForSelector('text=ranked deal, text=Why this wins, text=Evidence', { timeout: 12000 }).catch(() => {});
  await smoothScroll(page, [120, 480, 900, 1200, 80], 750);
  await sleep(1200);

  await context.close();
  await browser.close();
  return newestWebm(dir);
}

writeAss();
console.log("Recording Demo UX with scroll + voice…");
const webm = await record();
const silent = join(TMP, "silent.mp4");
const withSubs = join(TMP, "subs.mp4");

let r = spawnSync("ffmpeg", [
  "-y", "-i", webm,
  "-vf", "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-t", "55", silent,
], { encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr.slice(-900));

r = spawnSync("ffmpeg", [
  "-y", "-i", silent, "-vf", "ass=demo-scroll.ass",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", withSubs,
], { cwd: OUT, encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr.slice(-900));

// If video shorter than voice, pad last frame; then mux voice
r = spawnSync("ffmpeg", [
  "-y",
  "-i", withSubs,
  "-i", VOICE,
  "-filter_complex", "[0:v]tpad=stop_mode=clone:stop_duration=8[v]",
  "-map", "[v]", "-map", "1:a:0",
  "-c:v", "libx264", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k",
  "-shortest", "-t", "59",
  "-movflags", "+faststart",
  MP4,
], { encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr.slice(-900));

console.log("Wrote", MP4);
