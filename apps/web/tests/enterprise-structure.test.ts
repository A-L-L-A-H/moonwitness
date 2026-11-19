// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { i18n } from "../src/configs/i18n";
import { ROUTE_INVENTORY, hasRequiredRole, resolveRoutePolicy } from "../src/configs/routePolicy";
import themeConfig from "../src/configs/themeConfig";
import { buildEnterpriseNavItems } from "../src/data/navigation/verticalMenuData";
import { getDictionarySync } from "../src/utils/getDictionary";
import {
  getLocaleFromPath,
  getLocalizedUrl,
  isUrlMissingLocale,
  isValidLocale,
  stripLocalePrefix,
} from "../src/utils/i18n";
import { resolveModelVisuals } from "../src/views/apps/addons";
import { WORLD_DOMAINS } from "../src/data/empire-registry";
import { activeByPath } from "../src/components/shell/nav-items";

describe("Enterprise Reference Architecture Gates (WEB-GATE-01..06)", () => {
  it("WEB-GATE-01: i18n configuration & dictionaries provide complete en, id, and ar (RTL) keysets", () => {
    expect(i18n.locales).toEqual(["en", "id", "ar"]);
    expect(i18n.langDirection.en).toBe("ltr");
    expect(i18n.langDirection.id).toBe("ltr");
    expect(i18n.langDirection.ar).toBe("rtl");

    const en = getDictionarySync("en");
    const id = getDictionarySync("id");
    const ar = getDictionarySync("ar");

    expect(Object.keys(en)).toEqual(Object.keys(id));
    expect(Object.keys(en)).toEqual(Object.keys(ar));
    expect(Object.keys(en.navigation)).toEqual(Object.keys(id.navigation));
    expect(Object.keys(en.navigation)).toEqual(Object.keys(ar.navigation));
    expect(Object.keys(en.apps)).toEqual(Object.keys(id.apps));
    expect(Object.keys(en.apps)).toEqual(Object.keys(ar.apps));
    expect(Object.keys(en.addons)).toEqual(Object.keys(id.addons));
    expect(Object.keys(en.addons)).toEqual(Object.keys(ar.addons));
    expect(ar.navigation.missionControl).toBeTruthy();
    expect(id.navigation.missionControl).toBeTruthy();
  });

  it("WEB-GATE-01b: URL localization utilities preserve routes across en, id, and ar", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("id")).toBe(true);
    expect(isValidLocale("ar")).toBe(true);
    expect(isValidLocale("fr")).toBe(false);

    expect(getLocaleFromPath("/ar/dashboards/analytics")).toBe("ar");
    expect(getLocaleFromPath("/mission-control")).toBeNull();
    expect(isUrlMissingLocale("/mission-control")).toBe(true);
    expect(isUrlMissingLocale("/id/mission-control")).toBe(false);

    expect(stripLocalePrefix("/ar/apps/invoice")).toBe("/apps/invoice");
    expect(stripLocalePrefix("/mission-control")).toBe("/mission-control");
    expect(getLocalizedUrl("/dashboards/crm", "id")).toBe("/id/dashboards/crm");
    expect(getLocalizedUrl("/en/dashboards/crm", "ar")).toBe("/ar/dashboards/crm");
  });

  it("WEB-GATE-02: routePolicy & RBAC hierarchy enforce public, guest-only, preview, and admin boundaries", () => {
    expect(resolveRoutePolicy("/").access).toBe("public");
    expect(resolveRoutePolicy("/ar/mtime").access).toBe("public");
    expect(resolveRoutePolicy("/en/shadow").access).toBe("guest-only");
    expect(resolveRoutePolicy("/id/dashboards/analytics").access).toBe("protected");
    expect(resolveRoutePolicy("/ar/apps/permissions").minRole).toBe("admin");
    expect(resolveRoutePolicy("/mission-control").access).toBe("preview-or-auth");

    expect(hasRequiredRole("viewer", "viewer")).toBe(true);
    expect(hasRequiredRole("viewer", "editor")).toBe(false);
    expect(hasRequiredRole("editor", "editor")).toBe(true);
    expect(hasRequiredRole("editor", "admin")).toBe(false);
    expect(hasRequiredRole("admin", "admin")).toBe(true);
  });

  it("WEB-GATE-03: activeByPath & verticalMenuData resolve localized and unprefixed enterprise routes", () => {
    expect(activeByPath("/en/dashboards/analytics")).toBe("analytics");
    expect(activeByPath("/id/dashboards/crm")).toBe("crm");
    expect(activeByPath("/ar/apps/invoice")).toBe("invoice");
    expect(activeByPath("/en/apps/permissions")).toBe("permissions");
    expect(activeByPath("/control", "radius")).toBe("radius");

    const arDict = getDictionarySync("ar");
    const viewerNav = buildEnterpriseNavItems("creator", arDict, "ar", "viewer");
    const adminNav = buildEnterpriseNavItems("creator", arDict, "ar", "admin");

    expect(viewerNav.some((item) => item.id === "permissions")).toBe(false);
    expect(adminNav.some((item) => item.id === "permissions")).toBe(true);
    expect(adminNav.find((item) => item.id === "analytics")?.target.href).toBe(
      "/ar/dashboards/analytics",
    );
  });

  it("WEB-GATE-04: resolveModelVisuals maps all 25 addon namespaces to valid CutoutArtworkId values", () => {
    const sampleModels = [
      "timeline.event",
      "mtime.calendar",
      "witness.claim",
      "witness.engine.run",
      "mizan.decision",
      "scripture.chunk",
      "snmp.probe",
      "observatory.feed",
      "celestial.hilal.sighting",
      "syslog.entry",
      "audit.log",
      "vpn.tunnel",
      "radius.client",
      "storage.bucket",
      "stock.move",
      "crm.lead",
      "res.partner",
      "res.company",
      "account.move",
      "cab.request",
      "command.directive",
      "performance.kpi",
      "khidra.rule",
      "mail.message",
      "geo.place",
      "ir.model.access",
      "auth.user",
    ];

    for (const model of sampleModels) {
      const profile = resolveModelVisuals(model);
      expect(profile.domainIcon).toBeTruthy();
      expect(profile.cutoutId).toBeTruthy();
      expect(profile.category).toBeTruthy();
    }
  });

  it("WEB-GATE-05: themeConfig provides sovereign enterprise defaults", () => {
    expect(themeConfig.templateName).toBe("MoonWitness");
    expect(themeConfig.homePageUrl).toBe("/mission-control");
    expect(themeConfig.loginUrl).toBe("/shadow");
    expect(themeConfig.settingsCookieName).toBe("mw-enterprise-settings-v1");
  });

  it("WEB-GATE-06: WORLD_DOMAINS catalog covers all 9 worlds cleanly", () => {
    expect(WORLD_DOMAINS).toHaveLength(9);
    expect(WORLD_DOMAINS.some((w) => w.id === "crayon")).toBe(true);
  });

  it("WEB-GATE-07: ROUTE_INVENTORY matches every Next.js App Router page and valid canonical owners", () => {
    const webRoot = path.resolve(import.meta.dirname, "..");
    const repoRoot = path.resolve(webRoot, "../..");
    const appDir = path.join(webRoot, "src", "app");

    const pageFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name === "page.tsx") {
          pageFiles.push(fullPath);
        }
      }
    };
    walk(appDir);

    const discoveredRoutes = pageFiles
      .map((filePath) => {
        const relDir = path
          .relative(appDir, path.dirname(filePath))
          .split(path.sep)
          .filter(Boolean);
        const runtimeSegments = relDir.filter(
          (segment) => !(segment.startsWith("(") && segment.endsWith(")")),
        );
        return runtimeSegments.length === 0 ? "/" : `/${runtimeSegments.join("/")}`;
      })
      .sort();

    const inventoryPaths = ROUTE_INVENTORY.map((entry) => entry.path).sort();
    expect(inventoryPaths).toEqual(discoveredRoutes);

    for (const entry of ROUTE_INVENTORY) {
      expect(fs.existsSync(path.join(repoRoot, entry.canonicalOwner))).toBe(true);
    }
  });

  it("WEB-GATE-08: features/<domain> modules expose barrel indexes and enforce boundary imports", () => {
    const webRoot = path.resolve(import.meta.dirname, "..");
    const srcDir = path.join(webRoot, "src");
    const pilotDomains = ["command-center", "memory"];

    for (const domain of pilotDomains) {
      for (const barrel of ["index.ts", "types/index.ts", "api/index.ts", "components/index.ts"]) {
        expect(fs.existsSync(path.join(srcDir, "features", domain, barrel))).toBe(true);
      }
    }

    const sourceFiles: string[] = [];
    const collectSources = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          collectSources(fullPath);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          sourceFiles.push(fullPath);
        }
      }
    };
    collectSources(srcDir);

    const violations: string[] = [];
    const deepImportPattern = /["']@\/features\/([^/"']+)\/([^"']+)["']/g;
    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      for (const match of content.matchAll(deepImportPattern)) {
        const domain = match[1];
        if (!domain) continue;
        const expectedDomainDir = path.join(srcDir, "features", domain);
        if (!filePath.startsWith(expectedDomainDir)) {
          violations.push(`${path.relative(srcDir, filePath)} -> ${match[0]}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
