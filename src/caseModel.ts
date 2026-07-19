import type { ServiceScope } from "./contracts";
import { concessions, quotes } from "./fixtures";
import { labEquipmentRepair } from "./verticalConfig";

/** Short display id used across the demo UI; full canonical hash is computed on lock. */
export const SCOPE_PRINT_SHORT = "BD-7F3A-1042";

export type ConflictChoice = "voice" | "document" | null;

export type ScopeDraft = {
  instrumentCategory: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  symptoms: string;
  errorCodes: string;
  site: string;
  deadline: string;
  calibrationRequired: boolean;
  responseHoursRequired: number;
  deliverables: string;
  constraints: string;
  approvalAuthority: string;
  documentName: string | null;
  responseChoice: ConflictChoice;
  calibrationChoice: ConflictChoice;
  voiceInterviewTouched: boolean;
};

export type ConfirmedScopePrint = {
  shortId: string;
  canonicalHash: string;
  confirmedAt: string;
  confirmedBy: string;
  specification: ServiceScope;
  scopeJson: string;
};

export type ProviderLane = {
  name: string;
  style: string;
  negotiationType: string;
  discovery: string;
  phone: string;
  rating: string;
  outcome: "ITEMIZED QUOTE" | "CALLBACK COMMITMENT" | "DOCUMENTED DECLINE";
  tone: "good" | "warn" | "bad";
  fields: [string, string][];
  transcript: string[];
  conversationPoints: string[];
};

export const defaultScopeDraft = (): ScopeDraft => ({
  instrumentCategory: "Centrifuge",
  manufacturer: "Beckman Coulter",
  model: "SpinPro X2",
  serialNumber: "SPX2-88421",
  symptoms: "Unit stops during acceleration and displays Error E17. Will not complete a run.",
  errorCodes: "E17",
  site: "City Labs / Main Building / 5th floor",
  deadline: "2026-07-21",
  calibrationRequired: true,
  responseHoursRequired: 18,
  deliverables: "On-site labor, parts, calibration certificate, full performance verification",
  constraints: "Business-hours access. Notify security 30 minutes before arrival.",
  approvalAuthority: "Saadia Asghar, Lab Operations Lead",
  documentName: null,
  responseChoice: null,
  calibrationChoice: null,
  voiceInterviewTouched: false,
});

/** Demo document extraction — same schema as voice interview (challenge Estimator requirement). */
export const extractScopeFromDocument = (fileName: string, draft: ScopeDraft): ScopeDraft => ({
  ...draft,
  documentName: fileName,
  instrumentCategory: "Centrifuge",
  manufacturer: "Beckman Coulter",
  model: "SpinPro X2",
  serialNumber: draft.serialNumber || "SPX2-88421",
  symptoms: "Service report: drive module fault, Error E17 during acceleration, incomplete runs.",
  errorCodes: "E17",
  site: "City Labs / Main Building / 5th floor",
  deadline: "2026-07-21",
  // Document path initially conflicts with voice defaults — user must reconcile.
  calibrationRequired: false,
  responseHoursRequired: 24,
  deliverables: "On-site diagnosis, parts, labor; calibration listed as optional add-on",
  constraints: "Business-hours access. Loading dock clearance required.",
  approvalAuthority: "Saadia Asghar, Lab Operations Lead",
});

export const applyConflictResolutions = (draft: ScopeDraft): ScopeDraft => ({
  ...draft,
  responseHoursRequired: draft.responseChoice === "document" ? 24 : 18,
  calibrationRequired: draft.calibrationChoice !== "document",
});

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`).join(",")}}`;
};

export async function hashScopeJson(scopeJson: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(scopeJson));
  return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function confirmScopePrint(draft: ScopeDraft): Promise<ConfirmedScopePrint> {
  const resolved = applyConflictResolutions(draft);
  const evidence = [
    ...(resolved.voiceInterviewTouched
      ? [{ id: "voice-1", source: "voice_interview" as const, label: "ElevenLabs intake interview" }]
      : []),
    ...(resolved.documentName
      ? [{ id: "doc-1", source: "document" as const, label: resolved.documentName }]
      : []),
  ];
  const specification: ServiceScope = {
    version: 3,
    instrumentCategory: resolved.instrumentCategory,
    manufacturer: resolved.manufacturer,
    model: resolved.model,
    serialNumber: resolved.serialNumber || null,
    symptoms: resolved.symptoms.split(/\n+/).map((line) => line.trim()).filter(Boolean),
    errorCodes: resolved.errorCodes.split(/[,\s]+/).map((code) => code.trim()).filter(Boolean),
    site: resolved.site,
    deadline: `${resolved.deadline}T17:00:00.000Z`,
    requiredDeliverables: resolved.deliverables.split(",").map((item) => item.trim()).filter(Boolean),
    calibrationRequired: resolved.calibrationRequired,
    responseHoursRequired: resolved.responseHoursRequired,
    constraints: resolved.constraints.split(".").map((item) => item.trim()).filter(Boolean),
    approvalAuthority: resolved.approvalAuthority,
    evidence,
    unknownFields: [],
    confirmationStatus: "confirmed",
    canonicalHash: null,
  };
  const scopeJson = stableStringify(specification);
  const canonicalHash = await hashScopeJson(scopeJson);
  specification.canonicalHash = canonicalHash;
  const confirmedJson = stableStringify(specification);
  return {
    shortId: SCOPE_PRINT_SHORT,
    canonicalHash,
    confirmedAt: new Date().toISOString(),
    confirmedBy: "Saadia Asghar",
    specification: { ...specification, canonicalHash },
    scopeJson: confirmedJson,
  };
}

/** Call list provenance — challenge asks where providers come from in the real world. */
export const providerCallList = [
  {
    name: "OEM Precision",
    style: "Tough OEM",
    negotiationType: "Tough negotiator",
    discovery: "Customer-approved OEM roster · Google Places “laboratory equipment repair” · Charlotte MSA",
    phone: "+1 (704) 555-0142",
    rating: "4.8 · 126 reviews",
    outcome: "ITEMIZED QUOTE" as const,
    tone: "good" as const,
    fields: [
      ["Package total", "$3,100"],
      ["Callout", "$350"],
      ["Parts", "$500"],
      ["Calibration", "Included"],
      ["Response", "18h"],
      ["Warranty", "180 days"],
    ],
    transcript: [
      "You: I’m BenchDial, an AI calling for City Labs.",
      "Lisa: Are you a robot?",
      "You: Yes. I’m an AI agent representing the customer.",
      "Lisa: Calibration is included with a six-month warranty.",
    ],
    conversationPoints: ["AI disclosure", "Identical ScopePrint", "Itemized fees"],
  },
  {
    name: "RapidBench",
    style: "Hidden-fee independent",
    negotiationType: "Lowballer with hidden fees → negotiated",
    discovery: "Yelp Fusion · category “scientific instrument repair” · 12 mi of City Labs",
    phone: "+1 (980) 555-0198",
    rating: "4.3 · 41 reviews",
    outcome: "ITEMIZED QUOTE" as const,
    tone: "warn" as const,
    fields: [
      ["Package total", "$2,450"],
      ["Callout", "$450"],
      ["Parts", "$400"],
      ["Calibration", "+$600"],
      ["Response", "36h"],
      ["Warranty", "90 days"],
    ],
    transcript: [
      "You: Please itemize every mandatory fee for ScopePrint BD-7F3A-1042.",
      "Dave: Calibration is separate.",
      "You: I have a verified OEM quote with calibration included — can you improve call-out and warranty?",
      "Dave: Call-out drops to $450 and we’ll add 90-day labor warranty.",
    ],
    conversationPoints: ["Fee itemization", "Verified leverage", "Terms moved mid-call"],
  },
  {
    name: "MetroLab Field",
    style: "Stonewalling regional",
    negotiationType: "Stonewaller / refusal to quote",
    discovery: "OpenStreetMap + customer-approved regional list · service radius filter",
    phone: "+1 (704) 555-0177",
    rating: "3.9 · 18 reviews",
    outcome: "DOCUMENTED DECLINE" as const,
    tone: "bad" as const,
    fields: [
      ["Package total", "Unknown"],
      ["Callout", "Unknown"],
      ["Parts", "Unknown"],
      ["Calibration", "$250"],
      ["Response", "24h"],
      ["Warranty", "Unknown"],
    ],
    transcript: [
      "You: Can you provide an itemized quote against the locked scope?",
      "Tom: We don’t quote that model by phone.",
      "You: Can you make a callback commitment with a named owner?",
      "Tom: No. We’re going to pass.",
    ],
    conversationPoints: ["Friction handled", "No invented bid", "Structured decline"],
  },
] satisfies ProviderLane[];

export const challengeModules = [
  { id: "01", title: "The Estimator", screen: "Scope" as const, blurb: "Voice interview + document → one confirmed job spec." },
  { id: "02", title: "The Caller", screen: "Call room" as const, blurb: "Three negotiation styles, identical scope, itemized outcomes." },
  { id: "03", title: "The Closer", screen: "Deal room" as const, blurb: "Leverage, 30% red-flag rule, ranked recommendation with receipts." },
] as const;

export const verticalPain = {
  market: labEquipmentRepair.label,
  persona: "Saadia Asghar, laboratory operations lead at City Labs",
  spreadClaim: "Identical centrifuge repairs routinely diverge once call-out, calibration, warranty, and downtime are itemized — the same opaque-pricing failure the challenge documents for movers.",
  redFlagRule: `${Math.round(labEquipmentRepair.suspiciousLowQuoteThreshold * 100)}%+ below peer median is a warning, not a win.`,
  discoverySources: labEquipmentRepair.discoverySources,
};

export { concessions, quotes };
