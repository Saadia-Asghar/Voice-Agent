/**
 * Real screen recordings for Hack-Nation Demo + Tech (≤60s).
 * Uses local playwright-core tarball + system Chrome.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "submission-videos");
const TMP = join(OUT, "_live");
const require = createRequire(join(OUT, "package", "index.js"));
const { chromium } = require(join(OUT, "package", "index.js"));

const BASE = process.env.DEMO_URL ?? "https://hacknation-lemon.vercel.app";
mkdirSync(TMP, { recursive: true });

const executablePath = [
  process.env.CHROME_PATH,
  `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
].filter(Boolean).find((p) => existsSync(p));

if (!executablePath) throw new Error("Chrome not found");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    if (!document.getElementById("demo-subtitle")) {
      const bar = document.createElement("div");
      bar.id = "demo-subtitle";
      bar.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:999998;padding:14px 24px;text-align:center;background:rgba(8,10,18,.84);color:#fff;font:700 17px/1.35 Segoe UI,system-ui,sans-serif;pointer-events:none;";
      document.body.appendChild(bar);
    }
    if (!document.getElementById("demo-badge")) {
      const badge = document.createElement("div");
      badge.id = "demo-badge";
      badge.style.cssText = "position:fixed;top:14px;left:14px;z-index:999998;padding:8px 12px;border-radius:8px;background:#2c5cf3;color:#fff;font:800 11px/1 Segoe UI,system-ui,sans-serif;letter-spacing:.08em;pointer-events:none;";
      document.body.appendChild(badge);
    }
  });
}

async function sub(page, text) {
  await page.evaluate((t) => {
    const el = document.getElementById("demo-subtitle");
    if (el) el.textContent = t;
  }, text);
}

async function badge(page, text) {
  await page.evaluate((t) => {
    const el = document.getElementById("demo-badge");
    if (el) el.textContent = t;
  }, text);
}

async function click(page, selector, label, wait = 800) {
  const el = page.locator(selector).first();
  if (!(await el.isVisible().catch(() => false))) {
    console.warn("skip", label);
    return false;
  }
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
    await sleep(200);
  }
  await el.click({ timeout: 5000 }).catch((e) => console.warn(label, e.message));
  await sleep(wait);
  return true;
}

function toMp4(webm, mp4) {
  const r = spawnSync("ffmpeg", ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", "-t", "59", mp4], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr?.slice(-1000) || "ffmpeg failed");
  console.log("Wrote", mp4);
}

function newestWebm(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm")).map((f) => join(dir, f));
  if (!files.length) throw new Error("no webm in " + dir);
  return files.sort()[files.length - 1];
}

async function prepareScope(page) {
  const input = page.locator('input[type="file"]').first();
  if (await input.count()) {
    await input.setInputFiles({
      name: "CityLabs-SpinPro-Service-Report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% BenchDial service report\n"),
    });
    await sleep(700);
  }
  const voiceBtns = page.locator('button:has-text("Use voice")');
  const n = await voiceBtns.count();
  for (let i = 0; i < Math.min(n, 2); i++) {
    await voiceBtns.nth(i).click().catch(() => {});
    await sleep(350);
  }
  await click(page, 'button:has-text("Mark voice-path")', "mark voice", 400);
  await click(page, 'button:has-text("Lock confirmed scope")', "lock", 1000);
}

async function record(kind, flow) {
  const dir = join(TMP, kind);
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90000 });
  await sleep(1200);
  await injectUI(page);
  await flow(page);
  await context.close();
  await browser.close();
  const webm = newestWebm(dir);
  const staged = join(TMP, `${kind}.webm`);
  copyFileSync(webm, staged);
  toMp4(staged, join(OUT, `BenchDial-${kind}.mp4`));
}

async function demoFlow(page) {
  await badge(page, "DEMO · UX FLOW");
  await sub(page, "The Negotiator — BenchDial for lab equipment repair");
  await sleep(2000);
  await page.mouse.move(420, 360, { steps: 12 });
  await sleep(700);

  await sub(page, "01 Estimator: voice + document → one confirmed job spec");
  await click(page, 'button:has-text("Start the Estimator"), button:has-text("Start Estimator")', "start", 1400);
  await injectUI(page);
  await sleep(500);

  await sub(page, "Upload service report into the shared ScopePrint schema");
  await page.evaluate(() => window.scrollTo({ top: 220, behavior: "smooth" }));
  await sleep(800);
  await prepareScope(page);
  await injectUI(page);

  await sub(page, "Lock ScopePrint — required before any provider call");
  await sleep(800);

  await sub(page, "02 Caller: three styles, identical scope, market discovery");
  await click(page, 'button:has-text("Open Call Room"), button:has-text("02 Caller")', "caller", 1400);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
  await sleep(1100);
  await page.evaluate(() => window.scrollTo({ top: 480, behavior: "smooth" }));
  await sleep(1300);

  await sub(page, "03 Closer: compare quotes, 30% red-flag, leverage ledger");
  await click(page, 'button:has-text("03 Closer"), button:has-text("Deal room")', "closer", 1400);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: "smooth" }));
  await sleep(1100);
  await page.evaluate(() => window.scrollTo({ top: 560, behavior: "smooth" }));
  await sleep(1300);

  await sub(page, "Award memo — ranked deal with transcript receipts");
  await click(page, 'button:has-text("Award"), button:has-text("Review award memo")', "award", 1400);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 100, behavior: "smooth" }));
  await sleep(1500);

  await sub(page, "BenchDial recommends. A human decides.");
  await sleep(1500);
}

async function techFlow(page) {
  await badge(page, "TECH · ARCHITECTURE");
  await sub(page, "React + TypeScript + Vite · ElevenLabs Agents · Supabase");
  await sleep(1800);

  await sub(page, "Supabase Auth gates billable live voice; walkthrough stays public");
  await click(page, 'button:has-text("Unlock live calls")', "auth", 1200);
  await injectUI(page);
  await sleep(1500);
  await page.keyboard.press("Escape");
  await sleep(400);

  await sub(page, "ElevenLabs Estimator WebRTC — tokens minted server-side");
  await click(page, 'button:has-text("Start the Estimator"), button:has-text("Start Estimator")', "est", 1200);
  await injectUI(page);
  await sleep(900);
  await prepareScope(page);
  await injectUI(page);

  await sub(page, "Caller injects scope_json; HMAC webhook → RECORDED LIVE RUN");
  await click(page, 'button:has-text("Open Call Room"), button:has-text("02 Caller")', "caller", 1300);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 360, behavior: "smooth" }));
  await sleep(1700);

  await sub(page, "Honesty Firewall: check_leverage blocks invented competing bids");
  await click(page, 'button:has-text("03 Closer")', "closer", 1300);
  await injectUI(page);
  await page.evaluate(() => window.scrollTo({ top: 480, behavior: "smooth" }));
  await sleep(1700);

  await sub(page, "Deterministic ranking + 30% red-flag rule outside the LLM");
  await sleep(1700);
}

console.log("Chrome:", executablePath);
console.log("URL:", BASE);
await record("Demo", demoFlow);
await record("Tech", techFlow);
console.log("Done — upload BenchDial-Demo.mp4 and BenchDial-Tech.mp4");
