import { describe, expect, it } from "vitest";
import { effectiveCost, knownCashTotal, rankQuotes, type ServiceQuote } from "./domain";

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
});
