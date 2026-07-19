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

export type ConcessionEvent = { at: string; label: string; detail: string };

export type ProofState = "complete" | "pending";
export type ProofRow = [label: string, status: string, state: ProofState];

/** Map Estimator agent tool args (serviceScopeSchema-shaped) into the editable draft. */
export function patchDraftFromVoiceScope(params: Record<string, unknown>, draft: ScopeDraft): ScopeDraft {
  const str = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };
  const list = (key: string) => {
    const value = params[key];
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    if (typeof value === "string" && value.trim()) return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    return undefined;
  };
  const symptoms = list("symptoms");
  const errorCodes = list("errorCodes") ?? list("error_codes");
  const deliverables = list("requiredDeliverables") ?? list("required_deliverables") ?? list("deliverables");
  const constraints = list("constraints");
  const deadlineRaw = str("deadline");
  const deadline = deadlineRaw ? deadlineRaw.slice(0, 10) : undefined;
  const calibration = params.calibrationRequired ?? params.calibration_required;
  const responseHours = params.responseHoursRequired ?? params.response_hours_required;
  return {
    ...draft,
    voiceInterviewTouched: true,
    instrumentCategory: str("instrumentCategory") ?? str("instrument_category") ?? draft.instrumentCategory,
    manufacturer: str("manufacturer") ?? draft.manufacturer,
    model: str("model") ?? draft.model,
    serialNumber: str("serialNumber") ?? str("serial_number") ?? draft.serialNumber,
    symptoms: symptoms?.join("\n") ?? draft.symptoms,
    errorCodes: errorCodes?.join(", ") ?? draft.errorCodes,
    site: str("site") ?? draft.site,
    deadline: deadline ?? draft.deadline,
    calibrationRequired: typeof calibration === "boolean" ? calibration : draft.calibrationRequired,
    responseHoursRequired: typeof responseHours === "number" && responseHours > 0 ? responseHours : draft.responseHoursRequired,
    deliverables: deliverables?.join(", ") ?? draft.deliverables,
    constraints: constraints?.join(". ") ?? draft.constraints,
    approvalAuthority: str("approvalAuthority") ?? str("approval_authority") ?? draft.approvalAuthority,
  };
}

function parseHintIntoDraft(text: string, draft: ScopeDraft): Partial<ScopeDraft> {
  const patch: Partial<ScopeDraft> = {};
  const pick = (re: RegExp) => text.match(re)?.[1]?.trim();
  const manufacturer = pick(/(?:manufacturer|make)\s*[:\-]\s*(.+)/i);
  const model = pick(/(?:model|unit)\s*[:\-]\s*(.+)/i);
  const serial = pick(/(?:serial(?:\s*number)?|s\/n)\s*[:\-]\s*([A-Za-z0-9\-_/]+)/i);
  const error = pick(/(?:error(?:\s*code)?|fault)\s*[:\-]\s*([A-Za-z0-9\-]+)/i) ?? pick(/\b(E\d{2,4})\b/i);
  const site = pick(/(?:site|location|facility)\s*[:\-]\s*(.+)/i);
  const symptoms = pick(/(?:symptoms?|complaint|failure)\s*[:\-]\s*(.+)/i);
  const category = pick(/(?:instrument|equipment)\s*(?:category|type)?\s*[:\-]\s*(.+)/i);
  if (manufacturer) patch.manufacturer = manufacturer.split(/\n/)[0];
  if (model) patch.model = model.split(/\n/)[0];
  if (serial) patch.serialNumber = serial;
  if (error) patch.errorCodes = error;
  if (site) patch.site = site.split(/\n/)[0];
  if (symptoms) patch.symptoms = symptoms.split(/\n/).slice(0, 3).join("\n");
  if (category) patch.instrumentCategory = category.split(/\n/)[0];
  if (/calibration\s*(required|needed|yes)/i.test(text)) patch.calibrationRequired = true;
  if (/calibration\s*(not required|optional|no)\b/i.test(text)) patch.calibrationRequired = false;
  const hours = text.match(/(\d{1,3})\s*(?:hour|hr)s?\s*(?:response|eta|sla)/i)?.[1];
  if (hours) patch.responseHoursRequired = Number(hours);
  return patch;
}

/** Demo / local fallback — same schema as voice interview. Prefer extractScopeFromFile when a File is available. */
export const extractScopeFromDocument = (fileName: string, draft: ScopeDraft, textHint = ""): ScopeDraft => {
  const hinted = textHint ? parseHintIntoDraft(textHint, draft) : {};
  const hasHints = Object.keys(hinted).length > 0;
  if (hasHints) {
    return {
      ...draft,
      ...hinted,
      documentName: fileName,
      // Seed conflict fields when the report is silent so the Estimator checklist still exercises voice-vs-doc.
      calibrationRequired: hinted.calibrationRequired ?? false,
      responseHoursRequired: hinted.responseHoursRequired ?? 24,
      deliverables: draft.deliverables || "On-site diagnosis, parts, labor; calibration listed as optional add-on",
      constraints: draft.constraints || "Business-hours access. Loading dock clearance required.",
      approvalAuthority: draft.approvalAuthority || "Saadia Asghar, Lab Operations Lead",
    };
  }
  return {
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
  };
};

async function readExtractableText(file: File): Promise<string> {
  if (file.type.startsWith("text/") || /\.(txt|csv|md|json)$/i.test(file.name)) {
    return (await file.text()).slice(0, 12000);
  }
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let ascii = "";
    for (let i = 0; i < Math.min(bytes.length, 400000); i += 1) {
      const code = bytes[i];
      ascii += code >= 32 && code <= 126 ? String.fromCharCode(code) : " ";
    }
    return ascii.replace(/\s+/g, " ").slice(0, 12000);
  }
  return "";
}

export type ExtractSource = "model" | "local-parse" | "demo-fallback";

/** Prefer OpenAI edge extract; fall back to local text parse, then demo seed. */
export async function extractScopeFromFile(
  file: File,
  draft: ScopeDraft,
  authToken?: string | null,
): Promise<{ draft: ScopeDraft; source: ExtractSource }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  const textHint = await readExtractableText(file);

  if (supabaseUrl && publishableKey) {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      const contentBase64 = btoa(binary);
      const response = await fetch(`${supabaseUrl}/functions/v1/extract-scope`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: publishableKey,
          Authorization: `Bearer ${authToken ?? publishableKey}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          contentBase64,
          textHint: textHint || undefined,
        }),
      });
      if (response.ok) {
        const payload = (await response.json()) as { fields?: Partial<ScopeDraft>; source?: string };
        if (payload.fields && typeof payload.fields === "object") {
          return {
            draft: {
              ...draft,
              ...payload.fields,
              documentName: file.name,
              voiceInterviewTouched: draft.voiceInterviewTouched,
            },
            source: "model",
          };
        }
      }
    } catch {
      // Fall through to local parse / demo seed.
    }
  }

  if (textHint.trim()) {
    return { draft: extractScopeFromDocument(file.name, draft, textHint), source: "local-parse" };
  }
  return { draft: extractScopeFromDocument(file.name, draft), source: "demo-fallback" };
}

export function buildChallengeProof(input: {
  confirmedScope: ConfirmedScopePrint | null;
  recordedLiveCount: number;
  liveLeverageVerified: boolean;
}): ProofRow[] {
  const { confirmedScope, recordedLiveCount, liveLeverageVerified } = input;
  return [
    ["Estimator loop", confirmedScope ? "ScopePrint locked this session" : "Voice + doc → ScopePrint (lock still needed)", confirmedScope ? "complete" : "pending"],
    ["Call-list provenance", "Places / Yelp / OSM shown", "complete"],
    ["3 negotiation styles", recordedLiveCount >= 3 ? "Three live sessions recorded" : `${recordedLiveCount}/3 live sessions recorded`, recordedLiveCount >= 3 ? "complete" : "pending"],
    ["Structured outcomes", "Quote · decline · leverage", recordedLiveCount > 0 || Boolean(confirmedScope) ? "complete" : "pending"],
    ["Leverage causation", liveLeverageVerified ? "Live concession verified" : "Needs live concession evidence", liveLeverageVerified ? "complete" : "pending"],
    ["Honesty firewall", "Server-tested leverage gate", "complete"],
    ["Closer report", "Ranked + red-flag rule", "complete"],
  ];
}

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
