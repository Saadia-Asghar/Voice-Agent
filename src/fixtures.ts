import type { ServiceQuote } from "./domain";

/** Fixture quotes aligned with Call Room outcomes: quote / negotiated quote / decline. */
export const quotes: ServiceQuote[] = [
  {
    provider: "OEM Precision",
    providerType: "Manufacturer service",
    status: "quote",
    packageTotal: 3100,
    callout: { amount: 350, inclusion: "additional" },
    calibration: { amount: 0, inclusion: "included" },
    parts: { amount: 500, inclusion: "additional" },
    responseHours: 18,
    turnaroundHours: 28,
    warrantyDays: 180,
    loanerIncluded: true,
    scopeMatch: 100,
    unknowns: [],
    evidence: [{ id: "oem-1", at: "02:14", quote: "That includes calibration and a six-month warranty." }],
  },
  {
    provider: "RapidBench",
    providerType: "Independent repair",
    status: "quote",
    packageTotal: 2450,
    callout: { amount: 450, inclusion: "additional" },
    calibration: { amount: 600, inclusion: "additional" },
    parts: { amount: 400, inclusion: "additional" },
    responseHours: 36,
    turnaroundHours: 52,
    warrantyDays: 90,
    loanerIncluded: false,
    scopeMatch: 86,
    unknowns: ["loaner"],
    evidence: [
      { id: "rapid-1", at: "01:48", quote: "Calibration would be another six hundred dollars." },
      { id: "rapid-2", at: "04:18", quote: "Call-out drops to four fifty and we’ll add ninety-day labor warranty." },
    ],
  },
  {
    provider: "MetroLab Field",
    providerType: "Regional service",
    status: "declined",
    packageTotal: null,
    callout: { amount: null, inclusion: "unknown" },
    calibration: { amount: 250, inclusion: "additional" },
    parts: { amount: null, inclusion: "unknown" },
    responseHours: 24,
    turnaroundHours: null,
    warrantyDays: null,
    loanerIncluded: null,
    scopeMatch: 40,
    unknowns: ["package total", "callout fee", "parts", "warranty", "loaner"],
    evidence: [{ id: "metro-1", at: "03:08", quote: "We don’t quote that model by phone. We’re going to pass." }],
  },
];

/** Concession ledger — terms moved because of verified competing leverage (Closer requirement). */
export const concessions = [
  { at: "03:02", label: "Leverage verified", detail: "check_leverage confirmed OEM calibration-included offer on the same ScopePrint." },
  { at: "03:26", label: "Response improved", detail: "RapidBench moved from 48 hours to 36 hours after the verified OEM comparison." },
  { at: "03:55", label: "Warranty added", detail: "RapidBench added a 90-day labor warranty that was not in the opening offer." },
  { at: "04:18", label: "Call-out reduced", detail: "Call-out fee changed from $650 to $450 because of leverage — not a scripted concession." },
];
