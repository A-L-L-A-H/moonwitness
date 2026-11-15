import { describe, expect, it } from "vitest";
import { activeByPath, navItems, navHref } from "../src/components/shell/nav-items";
import { sanitizeRadiusLogs } from "../src/lib/api/radius";
import { isWriteRole, normalizeRole } from "../src/lib/roles";

describe("RADIUS operations navigation", () => {
  it("registers the read-only console route", () => {
    const radius = navItems.find((item) => item.id === "radius");
    expect(radius && navHref(radius)).toBe("/radius");
    expect(activeByPath("/radius")).toBe("radius");
  });

  it("removes credential-like fields from log records", () => {
    expect(
      sanitizeRadiusLogs([
        {
          timestamp: "2026-11-15T00:00:00Z",
          message: "authentication accepted",
          password_hash: "sensitive",
          access_token: "sensitive",
        },
      ]),
    ).toEqual([
      {
        timestamp: "2026-11-15T00:00:00Z",
        message: "authentication accepted",
      },
    ]);
  });
});

describe("RADIUS write-role gate", () => {
  it("grants write access only to admins", () => {
    expect(isWriteRole("admin")).toBe(true);
    expect(isWriteRole("editor")).toBe(false);
    expect(isWriteRole("viewer")).toBe(false);
    expect(isWriteRole(undefined)).toBe(false);
    expect(isWriteRole(null)).toBe(false);
  });

  it("normalizes only the three canonical crew roles", () => {
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("editor")).toBe("editor");
    expect(normalizeRole("viewer")).toBe("viewer");
    expect(normalizeRole("root")).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
  });
});
