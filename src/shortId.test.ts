import { describe, expect, it } from "vitest";
import { shortIdFromHash } from "./shortId";

describe("shortIdFromHash", () => {
  it("derives a stable brief id from canonical hash", () => {
    const hash = "sha256:7f3a1042abcd00000000000000000000000000000000000000000000000000";
    expect(shortIdFromHash(hash)).toBe("BD-7F3A-1042");
  });

  it("returns fallback for invalid hash", () => {
    expect(shortIdFromHash("bad")).toBe("BD-0000-0000");
  });
});
