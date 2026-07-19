import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const estimatedTokens = (text) => Math.ceil(text.replace(/\s+/g, " ").trim().length / 4);
const intake = read("elevenlabs/intake-agent.md");
const buyer = read("elevenlabs/buyer-agent.md");
const counterparties = read("elevenlabs/counterparty-agents.md");
const shared = counterparties.match(/## Shared guardrails([\s\S]*?)(?=## OEM Precision)/)?.[0] ?? "";
const section = (heading, next) => {
  const start = counterparties.indexOf(heading);
  const end = next ? counterparties.indexOf(next, start + heading.length) : counterparties.indexOf("## Golden evaluation", start);
  if (start < 0 || end < 0) throw new Error(`Missing agent section: ${heading}`);
  return `${shared}\n${counterparties.slice(start, end)}`;
};
const agents = [
  { name: "Estimator", prompt: intake, required: ["AI voice agent", "untrusted", "Never invent", "explicitly ask the user to confirm", "tool failure"] },
  { name: "Buyer / Closer", prompt: buyer, required: ["AI voice agent", "untrusted", "Never invent", "check_leverage", "exactly one terminal", "authority to bind"] },
  { name: "OEM Precision", prompt: section("## OEM Precision", "## RapidBench"), required: ["consenting simulated", "verified", "Never invent inventory", "itemized quote"] },
  { name: "RapidBench", prompt: section("## RapidBench", "## MetroLab"), required: ["consenting simulated", "verified leverage", "callback", "provisional itemization"] },
  { name: "MetroLab Field", prompt: section("## MetroLab Field"), required: ["consenting simulated", "refuses", "documented decline", "Never produce an approximate total"] },
];
let failed = false;
console.log("Agent prompt readiness (conservative ~4 characters/token estimate)");
for (const agent of agents) {
  const tokens = estimatedTokens(agent.prompt);
  const missing = agent.required.filter((phrase) => !agent.prompt.toLowerCase().includes(phrase.toLowerCase()));
  const pass = tokens <= 2000 && missing.length === 0;
  console.log(`${agent.name.padEnd(18)} ${String(tokens).padStart(4)} estimated tokens  ${pass ? "PASS" : "FAIL"}`);
  if (tokens > 2000) console.error("  Prompt exceeds the 2,000-token review budget.");
  if (missing.length) console.error(`  Missing policy language: ${missing.join(", ")}`);
  failed ||= !pass;
}
if (failed) process.exitCode = 1;
