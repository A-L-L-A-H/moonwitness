import { describe, expect, it } from "vitest";
import { activeByPath, navItems, navHref } from "../src/components/shell/nav-items";
import type { SnmpDevice } from "../src/lib/api/snmp-poller";
import { sanitizeSnmpDevices } from "../src/views/operations/security";

describe("SNMP operations route", () => {
  it("registers navigation and never exposes community values to presentation", () => {
    const snmp = navItems.find((item) => item.id === "snmp");
    const device: SnmpDevice = {
      id: "router-1",
      name: "Router",
      host: "192.0.2.1",
      port: 161,
      version: "2c",
      community: "do-not-render",
      enabled: true,
      created_at: 1,
    };

    expect(snmp && navHref(snmp)).toBe("/snmp");
    expect(activeByPath("/snmp")).toBe("snmp");
    expect(sanitizeSnmpDevices([device])).toEqual([
      {
        id: "router-1",
        name: "Router",
        host: "192.0.2.1",
        port: 161,
        version: "2c",
        enabled: true,
        created_at: 1,
      },
    ]);
  });
});

describe("SNMP management payload safety", () => {
  it("never echoes community back through the sanitized device type", () => {
    const [safe] = sanitizeSnmpDevices([
      {
        id: "device-2",
        name: "Core Switch",
        host: "192.0.2.2",
        port: 161,
        version: "3",
        community: "top-secret-community",
        enabled: false,
        created_at: 2,
      },
    ]);

    expect(safe).not.toHaveProperty("community");
    expect(JSON.stringify(safe)).not.toContain("top-secret-community");
  });
});
