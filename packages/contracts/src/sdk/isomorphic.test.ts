import { describe, expect, it } from "vitest";
import { getCsrfTokenFromCookie, buildCsrfLogoutInit } from "./client";

describe("isomorphic sdk cookie guard", () => {
  it("returns null in non-DOM runtimes without global document", () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe("undefined");
    expect(getCsrfTokenFromCookie()).toBeNull();
    expect(buildCsrfLogoutInit()).toEqual({ method: "POST", credentials: "include" });
  });
});
