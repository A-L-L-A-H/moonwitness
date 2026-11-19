import { describe, expect, it } from "vitest";
import {
  buildCsrfLogoutInit,
  getActiveTenantFromStorage,
  getCsrfTokenFromCookie,
} from "./client";

describe("isomorphic sdk cookie and tenant guard", () => {
  it("returns null in non-DOM runtimes without global document or localStorage", () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe("undefined");
    expect(typeof (globalThis as { localStorage?: unknown }).localStorage).toBe("undefined");
    expect(getCsrfTokenFromCookie()).toBeNull();
    expect(getActiveTenantFromStorage()).toBeNull();
    expect(buildCsrfLogoutInit()).toEqual({ method: "POST", credentials: "include" });
  });
});
