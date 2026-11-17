import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES_DIR = resolve(__dirname, "../interface/routes");
const INTERNAL_PROXY_ROUTES = [
  "radius.routes.ts",
  "snmp-poller.routes.ts",
  "syslog.routes.ts",
  "storage.routes.ts",
];

describe("Private-Only Ingress for Internal Rust Services", () => {
  for (const file of INTERNAL_PROXY_ROUTES) {
    it(`${file} does not forward browser cookies or authorization headers upstream`, () => {
      const content = readFileSync(resolve(ROUTES_DIR, file), "utf8");
      expect(content).toContain("resolveUpstreamServiceUrl");
      expect(content).not.toMatch(/request\.headers\.cookie/i);
      expect(content).not.toMatch(/request\.headers\.authorization/i);
    });
  }
});
