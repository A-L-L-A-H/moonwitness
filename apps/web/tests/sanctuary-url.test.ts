import { describe, expect, it } from "vitest";
import { resolveSanctuaryHref } from "@/lib/sanctuary-url";

describe("sanctuary gateway href resolution", () => {
  it("resolves moonwitness hosts to the canonical A-L-L-A-H Sanctuary domain", () => {
    expect(resolveSanctuaryHref("moonwitness.biz.id")).toBe("https://a-l-l-a-h.com");
    expect(resolveSanctuaryHref("WWW.MOONWITNESS.BIZ.ID.")).toBe("https://a-l-l-a-h.com");
  });

  it("keeps same-origin root / on localhost, a-l-l-a-h.com, and empty host", () => {
    expect(resolveSanctuaryHref("localhost")).toBe("/");
    expect(resolveSanctuaryHref("127.0.0.1")).toBe("/");
    expect(resolveSanctuaryHref("a-l-l-a-h.com")).toBe("/");
    expect(resolveSanctuaryHref()).toBe("/");
  });
});
