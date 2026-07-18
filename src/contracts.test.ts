import { describe, expect, it } from "vitest";
import { callOutcomeSchema, serviceScopeSchema } from "./contracts";

describe("challenge contracts", () => {
  it("rejects an incomplete service scope", () => {
    expect(serviceScopeSchema.safeParse({ version: 1, confirmationStatus: "confirmed" }).success).toBe(false);
  });

  it("requires explicit provenance on every call outcome", () => {
    const result = callOutcomeSchema.safeParse({
      callId: crypto.randomUUID(), conversationId: "conv_demo", scopeHash: `sha256:${"a".repeat(64)}`,
      providerId: crypto.randomUUID(), status: "quote", disclosureHandled: true, endedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
