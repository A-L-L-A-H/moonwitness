import { expect, test, type Page } from "@playwright/test";

async function mockAuthenticatedApi(page: Page, role: "admin" | "viewer" = "admin") {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/v1/auth/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: 1, displayName: "QA Steward", username: "qa", role },
        }),
      });
    }
    if (url.includes("/api/v1/_meta/navigation")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"menus":[]}' });
    }
    if (url.includes("/api/v1/_meta/models")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          models: [
            "witness.claim",
            "timeline.event",
            "account.move",
            "crm.lead",
            "stock.quant",
            "cab.change",
            "ir.automation",
            "observatory.feed",
            "mizan.case",
          ],
        }),
      });
    }
    if (url.includes("/api/v1/_meta/addons")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          addons: [
            {
              id: 1,
              name: "__base",
              addon_version: "1.0.0",
              category: "Core",
              description: "Kernel",
              enabled: true,
              state: "installed",
            },
          ],
        }),
      });
    }
    if (url.includes("/api/v1/_meta/views/")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          model: "witness.claim",
          label: "Witness Claim",
          restEnabled: true,
          fields: [
            { field_name: "id", label: "ID", field_type: "text" },
            { field_name: "statement", label: "Statement", field_type: "text" },
            {
              field_name: "verdict",
              label: "Verdict",
              field_type: "selection",
              selection: ["pending", "verified", "disputed"],
            },
          ],
          actionBindings: { listUrl: "/api/v1/m/witness.claim", createUrl: "/api/v1/m/witness.claim" },
        }),
      });
    }
    if (url.includes("/api/v1/performance/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runtime: { rssMb: 128, heapUsedMb: 64, heapTotalMb: 96, uptimeSec: 3600 },
          widgets: [],
        }),
      });
    }
    if (url.includes("/api/v1/crm/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ stages: [], leads: [], plannedActivities: [], byStage: {} }),
      });
    }
    if (url.includes("/api/v1/stock/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [], locations: [], quants: [], moves: [] }),
      });
    }
    if (url.includes("/api/v1/geo/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ provinces: [], cities: [] }),
      });
    }
    if (url.includes("/api/v1/account/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ accounts: [], journals: [], moves: [], byState: {} }),
      });
    }
    if (url.includes("/api/v1/cab/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ projects: [], tasks: [], changes: [], tickets: [], metrics: {} }),
      });
    }
    if (url.includes("/api/v1/khidra/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ automations: [], webhooks: [], webhookLogs: [] }),
      });
    }
    if (url.includes("/api/v1/observatory/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ feeds: [], operations: [], byCategory: {} }),
      });
    }
    if (url.includes("/api/v1/celestial/prayer-times")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          date: "2026-11-19",
          latitude: -6.2,
          longitude: 106.8,
          timezone_offset: 7,
          convention: "KEMENAG",
          fajr: "04:08",
          sunrise: "05:26",
          dhuhr: "11:44",
          asr: "15:02",
          maghrib: "17:52",
          isha: "19:03",
          qibla_bearing: 295.15,
        }),
      });
    }
    if (url.includes("/api/v1/celestial/qibla")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          latitude: -6.2,
          longitude: 106.8,
          qibla_bearing_deg: 295.15,
          cardinal_direction: "WNW",
          distance_to_kabah_km: 7915,
          target: "Al-Masjid al-Haram",
        }),
      });
    }
    if (url.includes("/api/v1/celestial/hilal")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          altitude_deg: 4.2,
          elongation_deg: 7.1,
          crescent_width_arcmin: 0.35,
          mabims_criterion: true,
          odeh_criterion: "C",
          overall_verdict: "POSSIBLE_WITH_OPTICAL_AID",
        }),
      });
    }
    if (url.includes("/api/v1/witness/engine/modules")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ modules: [{ code: "WSI-P18", version: "1.0", label: "WSI" }] }),
      });
    }
    if (url.includes("/api/v1/mizan/summary")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ cases: [], assessments: [] }),
      });
    }
    if (url.includes("/api/v1/mizan/decision")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ method: "MIZAN_STANDARD", decision: "SUFFICIENT" }),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"data":[]}' });
  });
}

test.describe("Enterprise Visual & Flow QA across all [lang] & unprefixed routes", () => {
  test("public front-pages & unprefixed sanctuary routes render cleanly with 0 pageerrors and 0 horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`${page.url()}: ${err.message} (${err.stack?.split("\n")[1]?.trim() ?? ""})`));

    for (const route of [
      "/",
      "/en",
      "/en/moonwitness",
      "/en/scriptures",
      "/en/codex",
      "/en/mtime",
      "/id/codex",
      "/ar/mtime",
      "/en/login",
      "/en/shadow",
      "/en/pages/misc/401-not-authorized",
    ]) {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `HTTP status for ${route}`).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(4);
    }

    expect(errors, `Uncaught pageerrors: ${errors.join("; ")}`).toEqual([]);
  });

  test("AuthGuard redirects unauthenticated users on /en/dashboards/analytics to /en/shadow?redirectTo=", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/me", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"unauthorized"}' }),
    );
    await page.goto("/en/dashboards/analytics", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/en\/shadow\?redirectTo=/);
    expect(page.url()).toContain("/en/shadow?redirectTo=%2Fen%2Fdashboards%2Fanalytics");
  });

  test("all authenticated [lang] dashboards & 25-addon apps + RTL /ar/apps/addons render cleanly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockAuthenticatedApi(page, "admin");
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`${page.url()}: ${err.message} (${err.stack?.split("\n")[1]?.trim() ?? ""})`));

    const privateRoutes = [
      "/en/dashboards/analytics",
      "/en/dashboards/crm",
      "/en/dashboards/logistics",
      "/en/apps/academy",
      "/en/apps/addons",
      "/en/apps/addons?model=witness.claim",
      "/en/apps/automation",
      "/en/apps/calendar",
      "/en/apps/chat",
      "/en/apps/control",
      "/en/apps/invoice",
      "/en/apps/kanban",
      "/en/apps/memory",
      "/en/apps/observatory",
      "/en/apps/permissions",
      "/en/apps/roles",
      "/en/apps/user/list",
      "/en/mission-control",
      "/en/dock",
      "/en/id-lab",
      "/en/skin-lab",
    ];

    for (const route of privateRoutes) {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `HTTP status for ${route}`).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      const bodyText = (await page.locator("body").textContent()) ?? "";
      expect(bodyText.trim().length, `Non-empty content for ${route}`).toBeGreaterThan(20);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(4);
    }

    // Verify Arabic RTL (applied in TranslationWrapper useEffect after hydration)
    await page.goto("/ar/apps/addons", { waitUntil: "load" });
    await expect
      .poll(async () =>
        page.evaluate(() => ({
          dir: document.documentElement.dir,
          lang: document.documentElement.lang,
        })),
      )
      .toEqual({ dir: "rtl", lang: "ar" });

    // Mobile viewport check (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/dashboards/analytics", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(mobileOverflow, "Mobile overflow on /en/dashboards/analytics").toBeLessThanOrEqual(4);

    expect(errors, `Uncaught pageerrors: ${errors.join("; ")}`).toEqual([]);
  });
});
