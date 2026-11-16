import { describe, expect, it } from "vitest";
import {
  activeByPath,
  navHref,
  navItems,
  operationsNavItems,
} from "../src/components/shell/nav-items";

describe("Creator and Operations shell navigation separation", () => {
  it("keeps operations routes out of Creator navItems and separates Control Plane", () => {
    const creatorHrefs = navItems.map((item) => navHref(item));
    for (const opsRoute of ["/control", "/vpn", "/syslog", "/snmp", "/storage", "/radius"]) {
      expect(creatorHrefs).not.toContain(opsRoute);
    }

    const shadow = navItems.find((item) => item.target.href === "/shadow");
    expect(shadow?.label).toBe("Shadow Sign-In");
  });

  it("registers all operations routes including /control in operationsNavItems", () => {
    const opsHrefs = operationsNavItems.map((item) => navHref(item));
    for (const opsRoute of ["/control", "/vpn", "/syslog", "/snmp", "/storage", "/radius"]) {
      expect(opsHrefs).toContain(opsRoute);
    }
    expect(activeByPath("/control")).toBe("control");
    expect(activeByPath("/vpn")).toBe("vpn");
  });
});
