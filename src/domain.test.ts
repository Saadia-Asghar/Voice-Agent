import { describe, expect, it } from "vitest";
import { effectiveCost, isSuspiciouslyLowQuote, knownCashTotal, rankQuotes, type ServiceQuote } from "./domain";
import { labEquipmentRepair } from "./verticalConfig";

const quote: ServiceQuote = {
  provider: "Test",
  providerType: "Demo",
  status: "quote",
  packageTotal: 2000,
  callout: { amount: 200, inclusion: "additional" },
  calibration: { amount: 300, inclusion: "additional" },
  parts: { amount: 500, inclusion: "additional" },
  responseHours: 12,
  turnaroundHours: 20,
  warrantyDays: 90,
  loanerIncluded: false,
  scopeMatch: 90,
  unknowns: ["loaner"],
  evidence: [],
};

describe("quote economics", () => {
  it("adds all known mandatory cash charges", () => {
    expect(knownCashTotal(quote)).toBe(3000);
  });

  it("never treats a missing mandatory charge as zero", () => {
    expect(knownCashTotal({ ...quote, callout: { amount: null, inclusion: "unknown" } })).toBeNull();
  });

  it("does not double count components already included in a package", () => {
    expect(knownCashTotal({ ...quote, calibration: { amount: 300, inclusion: "included" } })).toBe(2700);
  });

  it("adds explicit downtime and exclusion scenarios", () => {
    expect(effectiveCost(quote, { downtimeCostPerHour: 100, requiredExcludedServices: { loaner: 700 } })).toBe(5700);
  });

  it("puts incomplete quotes after comparable quotes", () => {
    const ranked = rankQuotes(
      [{ ...quote, provider: "Complete" }, { ...quote, provider: "Incomplete", callout: { amount: null, inclusion: "unknown" } }],
      { downtimeCostPerHour: 100, requiredExcludedServices: {} },
    );
    expect(ranked.map((item) => item.quote.provider)).toEqual(["Complete", "Incomplete"]);
  });

  it("preserves input order when multiple quotes are incomplete", () => {
    const ranked = rankQuotes(
      [
        { ...quote, provider: "Incomplete A", callout: { amount: null, inclusion: "unknown" } },
        { ...quote, provider: "Incomplete B", packageTotal: null },
      ],
      { downtimeCostPerHour: 100, requiredExcludedServices: {} },
    );
    expect(ranked.map((item) => item.quote.provider)).toEqual(["Incomplete A", "Incomplete B"]);
  });

  it("warns when a comparable quote is at least 30% below the peer median", () => {
    const candidate = { ...quote, provider: "Low", packageTotal: 1100, callout: { amount: 0, inclusion: "included" as const }, calibration: { amount: 0, inclusion: "included" as const }, parts: { amount: 0, inclusion: "included" as const } };
    const peers = [{ ...quote, provider: "Peer A", packageTotal: 2000 }, { ...quote, provider: "Peer B", packageTotal: 2200 }];
    expect(isSuspiciouslyLowQuote(candidate, [candidate, ...peers], labEquipmentRepair.suspiciousLowQuoteThreshold)).toBe(true);
  });

  it("does not call an incomplete quote suspiciously cheap", () => {
    const incomplete = { ...quote, provider: "Unknown", packageTotal: null };
    expect(isSuspiciouslyLowQuote(incomplete, [incomplete, quote, { ...quote, provider: "Peer" }])).toBe(false);
  });
});

describe("vertical configuration", () => {
  it("keeps the challenge-specific vertical rules in data rather than screen logic", () => {
    expect(labEquipmentRepair.supportedDocumentTypes.length).toBeGreaterThan(0);
    expect(labEquipmentRepair.requiredScopeFields).toContain("calibration requirement");
    expect(labEquipmentRepair.comparableQuoteFields).toContain("exclusions");
    expect(labEquipmentRepair.negotiationLevers).toContain("warranty");
    expect(labEquipmentRepair.suspiciousLowQuoteThreshold).toBe(0.3);
  });
});
