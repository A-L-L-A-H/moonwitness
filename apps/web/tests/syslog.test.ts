import { describe, expect, it } from "vitest";
import { activeByPath, navHref, operationsNavItems } from "../src/components/shell/nav-items";
import { buildSyslogMessagesUrl } from "../src/lib/api/syslog";

describe("Syslog navigation", () => {
  it("registers the Syslog route and highlights it when active", () => {
    const syslog = operationsNavItems.find((item) => item.id === "syslog");
    expect(syslog).toBeDefined();
    expect(syslog && navHref(syslog)).toBe("/control?tab=syslog");
    expect(activeByPath("/control", "syslog")).toBe("syslog");
    expect(activeByPath("/syslog")).toBe("syslog");
  });

  it("uses only the same-origin API and bounds filtered queries", () => {
    expect(buildSyslogMessagesUrl({ limit: 100, severity: 3, q: "router & gateway" })).toBe(
      "/api/v1/syslog/messages?limit=100&severity=3&q=router+%26+gateway",
    );
  });
});
