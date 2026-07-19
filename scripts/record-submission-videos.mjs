/**
 * Records Hack-Nation Demo + Tech videos (≤60s each) as H.264 MP4.
 * Usage: node scripts/record-submission-videos.mjs
 */
import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, existsSync, copyFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.DEMO_URL ?? "https://hacknation-lemon.vercel.app";
const OUT = join(process.cwd(), "submission-videos");
const TMP = join(OUT, "_tmp");

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function injectChrome(page) {
  await page.evaluate(() => {
    if (!document.getElementById("demo-cursor")) {
      const cursor = document.createElement("div");
      cursor.id = "demo-cursor";
      cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
      cursor.style.cssText = "position:fixed;z-index:999999;pointer-events:none;width:24px;height:24px;filter:drop-shadow(1px 1px 2px rgba(0,0,0,.35));left:0;top:0;transition:left .08s,top .08s;";
      document.body.appendChild(cursor);
      document.addEventListener("mousemove", (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });
    }
    if (!document.getElementById("demo-subtitle")) {
      const bar = document.createElement("div");
      bar.id = "demo-subtitle";
      bar.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:999998;text-align:center;padding:14px 28px;background:rgba(10,12,20,.82);color:#fff;font:700 18px/1.35 system-ui,sans-serif;letter-spacing:-.01em;pointer-events:none;";
      bar.textContent = "";
      document.body.appendChild(bar);
    }
    if (!document.getElementById("demo-badge")) {
      const badge = document.createElement("div");
      badge.id = "demo-badge";
      badge.style.cssText = "position:fixed;top:16px;left:16px;z-index:999998;padding:8px 12px;border-radius:8px;background:#2c5cf3;color:#fff;font:800 12px/1 system-ui,sans-serif;letter-spacing:.08em;pointer-events:none;";
      badge.textContent = "BENCHDIAL";
      document.body.appendChild(badge);
    }
  });
}

async function setSubtitle(page, text) {
  await page.evaluate((t) => {
    const bar = document.getElementById("demo-subtitle");
    if (bar) bar.textContent = t;
  }, text);
}

async function setBadge(page, text) {
  await page.evaluate((t) => {
    const badge = document.getElementById("demo-badge");
    if (badge) badge.textContent = t;
  }, text);
}

async function moveAndClick(page, locator, label, post = 700) {
  const el = typeof locator === "string" ? page.locator(locator).first() : locator;
  if (!(await el.isVisible().catch(() => false))) {
    console.warn(`skip click: ${label}`);
    return false;
  }
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(200);
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
    await sleep(250);
  }
  await el.click();
  await sleep(post);
  return true;
}

function convertToMp4(webmPath, mp4Path) {
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", webmPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", "-t", "59", mp4Path],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.error(result.stderr);
    throw new Error(`ffmpeg failed for ${mp4Path}`);
  }
  console.log(`Wrote ${mp4Path}`);
}

function newestWebm(dir) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => join(dir, f));
  if (!files.length) throw new Error(`No webm in ${dir}`);
  return files.sort((a, b) => a.localeCompare(b)).at(-1);
}

async function record(kind, run) {
  const videoDir = join(TMP, kind);
  mkdirSync(videoDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 90000 });
  await injectChrome(page);
  await run(page);
  await context.close();
  await browser.close();
  const webm = newestWebm(videoDir);
  const staged = join(TMP, `${kind}.webm`);
  copyFileSync(webm, staged);
  convertToMp4(staged, join(OUT, `BenchDial-${kind}.mp4`));
}

async function demoFlow(page) {
  await setBadge(page, "DEMO · PRODUCT FLOW");
  await setSubtitle(page, "BenchDial — call, compare, and haggle for lab repair");
  await sleep(2200);

  await setSubtitle(page, "01 Estimator: one confirmed job spec from voice + documents");
  await moveAndClick(page, 'button:has-text("Start Estimator"), button:has-text("Start the Estimator"), button:has-text("Run the demo")', "Start Estimator", 1200);
  await injectChrome(page);
  await sleep(800);

  await setSubtitle(page, "Upload a service report into the shared ScopePrint schema");
  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "smooth" }));
  await sleep(1200);

  // Create a tiny PDF-like file for upload via file input
  const input = page.locator('input[type="file"]').first();
  if (await input.count()) {
    await input.setInputFiles({
      name: "CityLabs-SpinPro-Service-Report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 BenchDial demo service report\n"),
    });
    await sleep(1000);
  }

  await setSubtitle(page, "Resolve voice vs document conflicts, then lock ScopePrint");
  await moveAndClick(page, 'button:has-text("Use voice")', "Use voice response", 400);
  await moveAndClick(page, 'button:has-text("Use voice")', "Use voice calibration", 400);
  await moveAndClick(page, 'button:has-text("Mark voice-path")', "Mark voice path", 500);
  await moveAndClick(page, 'button:has-text("Lock confirmed scope")', "Lock scope", 1400);

  await setSubtitle(page, "02 Caller: same ScopePrint across three negotiation styles");
  await moveAndClick(page, 'button:has-text("Open Call Room"), button:has-text("02 Caller"), button:has-text("Call room")', "Open Call Room", 1400);
  await injectChrome(page);
  await sleep(900);

  await setSubtitle(page, "Call list provenance — Places, Yelp, OSM — not a hand-picked script");
  await page.evaluate(() => window.scrollTo({ top: 220, behavior: "smooth" }));
  await sleep(1600);

  await setSubtitle(page, "OEM · hidden-fee · stonewaller — quote, negotiated terms, or decline");
  await page.evaluate(() => window.scrollTo({ top: 520, behavior: "smooth" }));
  await sleep(1800);

  await setSubtitle(page, "03 Closer: compare, red-flag rule, and leverage receipts");
  await moveAndClick(page, 'button:has-text("03 Closer"), button:has-text("Deal room")', "Deal room", 1400);
  await injectChrome(page);
  await sleep(1000);

  await setSubtitle(page, "30% below peer median is a warning — not a win");
  await page.evaluate(() => window.scrollTo({ top: 280, behavior: "smooth" }));
  await sleep(1600);

  await setSubtitle(page, "Concession ledger: terms moved because of verified leverage");
  await page.evaluate(() => window.scrollTo({ top: 620, behavior: "smooth" }));
  await sleep(1600);

  await setSubtitle(page, "Award memo with transcript evidence — human still decides");
  await moveAndClick(page, 'button:has-text("Award"), button:has-text("Review award memo")', "Award", 1400);
  await injectChrome(page);
  await page.evaluate(() => window.scrollTo({ top: 120, behavior: "smooth" }));
  await sleep(2000);

  await setSubtitle(page, "BenchDial recommends. A human awards.");
  await sleep(1800);
}

async function techFlow(page) {
  await setBadge(page, "TECH · ARCHITECTURE");
  await setSubtitle(page, "Stack: React · TypeScript · Vite · ElevenLabs · Supabase");
  await sleep(2200);

  await setSubtitle(page, "ElevenLabs Agents power Estimator intake and Buyer/Closer calls");
  await moveAndClick(page, 'button:has-text("Start Estimator"), button:has-text("Start the Estimator"), button:has-text("Run the demo")', "Start", 1200);
  await injectChrome(page);
  await sleep(900);

  await setSubtitle(page, "WebRTC voice sessions — tokens minted server-side, never in the browser");
  await page.evaluate(() => window.scrollTo({ top: 80, behavior: "smooth" }));
  await sleep(1800);

  await setSubtitle(page, "Supabase Auth gates billable live mode; simulated walkthrough stays public");
  await moveAndClick(page, 'button:has-text("Unlock live"), button:has-text("Sign in")', "Auth", 900);
  await injectChrome(page);
  await sleep(1400);
  await page.keyboard.press("Escape").catch(() => {});
  await sleep(400);

  await setSubtitle(page, "Caller injects scope_json into every live session — identical job every time");
  await moveAndClick(page, 'button:has-text("02 Caller"), button:has-text("Call room"), button:has-text("Open Call Room")', "Caller", 1200);
  await injectChrome(page);
  // If still on scope, try lock path quickly for navigation
  if (await page.locator('button:has-text("Lock confirmed scope")').isVisible().catch(() => false)) {
    const input = page.locator('input[type="file"]').first();
    if (await input.count()) {
      await input.setInputFiles({ name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    }
    await moveAndClick(page, 'button:has-text("Use voice")', "v1", 300);
    await moveAndClick(page, 'button:has-text("Use voice")', "v2", 300);
    await moveAndClick(page, 'button:has-text("Mark voice-path")', "mark", 300);
    await moveAndClick(page, 'button:has-text("Lock confirmed scope")', "lock", 800);
    await moveAndClick(page, 'button:has-text("Open Call Room")', "open", 1000);
    await injectChrome(page);
  }
  await sleep(1200);

  await setSubtitle(page, "HMAC webhook → transcript persisted → RECORDED LIVE RUN provenance");
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
  await sleep(2000);

  await setSubtitle(page, "Honesty Firewall: check_leverage rejects invented competing bids");
  await moveAndClick(page, 'button:has-text("03 Closer"), button:has-text("Deal room")', "Closer", 1200);
  await injectChrome(page);
  await sleep(1000);

  await setSubtitle(page, "Deterministic TypeScript ranking + 30% red-flag rule outside the LLM");
  await page.evaluate(() => window.scrollTo({ top: 240, behavior: "smooth" }));
  await sleep(2000);

  await setSubtitle(page, "Evidence ledger in Postgres — fixtures never masquerade as live");
  await page.evaluate(() => window.scrollTo({ top: 560, behavior: "smooth" }));
  await sleep(1800);

  await setSubtitle(page, "Architecture: voice in, structured evidence out — not a chatbot skin");
  await sleep(2000);
}

console.log(`Recording against ${BASE}`);
await record("Demo", demoFlow);
await record("Tech", techFlow);
console.log("Done. Upload:");
console.log(`  ${join(OUT, "BenchDial-Demo.mp4")}`);
console.log(`  ${join(OUT, "BenchDial-Tech.mp4")}`);
