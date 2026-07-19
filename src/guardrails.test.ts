import { describe, expect, it } from "vitest";
import { BUYER_NON_NEGOTIABLE_GUARDRAILS, isMeasurableChange, itemizedQuoteSchema, terminalOutcomePayloadSchema } from "./guardrails";

const completeQuote = {
  package_total: 2450,
  diagnostic_callout_fee: 650,
  labor: null,
  parts: 400,
  travel: 0,
  calibration: 600,
  response_hours: 24,
  turnaround_hours: null,
  warranty_days: 90,
  loaner_included: false,
  taxes: null,
  exclusions: ["after-hours work"],
  expiration: "2026-07-26T17:00:00.000Z",
  unknowns: ["parts ETA", "taxes"],
  contact_identity: "Jordan, RapidBench quotes desk",
};

describe("terminal outcome guardrails", () => {
  it("accepts a complete itemized quote", () => {
    expect(terminalOutcomePayloadSchema.safeParse({ outcome: "quote", quote: completeQuote }).success).toBe(true);
  });

  it("rejects a quote terminal outcome with no quote", () => {
    expect(terminalOutcomePayloadSchema.safeParse({ outcome: "quote" }).success).toBe(false);
  });

  it("rejects quote data on non-quote outcomes", () => {
    for (const outcome of ["callback", "declined", "incomplete"] as const) {
      expect(terminalOutcomePayloadSchema.safeParse({ outcome, quote: completeQuote }).success).toBe(false);
    }
  });

  it("requires a dated callback contact and documented refusal reason", () => {
    expect(terminalOutcomePayloadSchema.safeParse({ outcome: "callback", committed_at: "2026-07-20T12:00:00.000Z", contact: "Jordan" }).success).toBe(true);
    expect(terminalOutcomePayloadSchema.safeParse({ outcome: "callback", contact: "Jordan" }).success).toBe(false);
    expect(terminalOutcomePayloadSchema.safeParse({ outcome: "declined", reason: "Policy prohibits phone quotes" }).success).toBe(true);
    expect(terminalOutcomePayloadSchema.safeParse({ outcome: "declined" }).success).toBe(false);
  });

  it("rejects malformed commercial numbers", () => {
    for (const package_total of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(itemizedQuoteSchema.safeParse({ ...completeQuote, package_total }).success).toBe(false);
    }
    expect(itemizedQuoteSchema.safeParse({ ...completeQuote, response_hours: -2 }).success).toBe(false);
    expect(itemizedQuoteSchema.safeParse({ ...completeQuote, response_hours: 2.5 }).success).toBe(false);
  });
});

describe("concession guardrails", () => {
  it("rejects cosmetically different but equivalent values", () => {
    expect(isMeasurableChange(650, " 650 ")).toBe(false);
    expect(isMeasurableChange({ amount: 650, included: false }, { included: false, amount: "650" })).toBe(false);
  });

  it("accepts a genuine measurable change", () => {
    expect(isMeasurableChange({ amount: 650 }, { amount: 450 })).toBe(true);
  });
});

describe("prompt policy", () => {
  it("covers every non-negotiable behavior", () => {
    const policy = BUYER_NON_NEGOTIABLE_GUARDRAILS.join(" ").toLowerCase();
    for (const requirement of ["ai voice agent", "human", "untrusted", "invent", "check_leverage", "bind", "unknowns", "exactly one terminal"]) {
      expect(policy).toContain(requirement);
    }
  });
});
