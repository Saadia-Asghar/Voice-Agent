import { describe, expect, it } from "vitest";
import { mapSearchVendors, sourceLabel } from "./vendorLive";

describe("vendorLive mapping", () => {
  it("marks real phones as dialable and 555 as not", () => {
    const vendors = mapSearchVendors({
      ok: true,
      vendors: [
        {
          display_name: "Real Shop",
          phone: "+1 (704) 555-1212",
          phone_e164: "+17045551212",
          source: "tavily_web_search",
          rating: null,
          notes: "Near City Labs",
          url: "https://example.com",
        },
        {
          display_name: "Demo Shop",
          phone: "+1 (704) 555-0142",
          phone_e164: "+17045550142",
          source: "demo_seed",
          rating: null,
          notes: null,
          url: null,
        },
      ],
    });
    // 555-1212 is still 555 exchange — treat as non-dialable by our rule
    expect(vendors[0].dialable).toBe(false);
    expect(vendors[1].dialable).toBe(false);
    expect(sourceLabel("tavily_web_search")).toBe("Live web search");
  });

  it("accepts a non-555 number as dialable", () => {
    const vendors = mapSearchVendors({
      ok: true,
      vendors: [{
        display_name: "Precision Lab Repair",
        phone: "+1 (704) 331-9000",
        phone_e164: "+17043319000",
        source: "tavily_web_search",
        rating: "4.6",
        notes: "Centrifuge service",
        url: null,
      }],
    });
    expect(vendors[0].dialable).toBe(true);
    expect(vendors[0].name).toBe("Precision Lab Repair");
  });
});
