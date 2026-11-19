// @vitest-environment jsdom
import React, { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkinProvider } from "@moonwitness/ui";
import type { Locale } from "@/configs/i18n";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import { getDictionarySync } from "@/utils/getDictionary";
import { AddonsStudioView } from "@/views/apps/addons";
import { ObservatoryAppView } from "@/views/apps/observatory";
import { AnalyticsDashboardView } from "@/views/dashboards/analytics";

const routing = vi.hoisted(() => ({
  pathname: "/ar/dashboards/analytics",
  search: "",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => ({ push: routing.push }),
  useSearchParams: () => new URLSearchParams(routing.search),
}));

vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => createElement("a", props),
}));

let container: HTMLDivElement;
let root: Root;
const fetchMock = vi.fn<typeof fetch>();

function setInputValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function flushEffects() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );

  routing.pathname = "/ar/dashboards/analytics";
  routing.search = "";
  routing.push.mockReset();
  localStorage.clear();
  document.cookie = "mw-locale=; path=/; max-age=0; SameSite=Lax";

  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

async function renderView(locale: Locale, ui: React.ReactNode) {
  await act(async () => {
    root.render(
      <SkinProvider>
        <TranslationWrapper lang={locale}>{ui}</TranslationWrapper>
      </SkinProvider>,
    );
  });
  await flushEffects();
}

describe("Standardized operator workspace layouts (#486)", () => {
  it("renders AnalyticsDashboardView with localized header, RTL bidi isolation, grouped filters, and retryable error recovery", async () => {
    const arDict = getDictionarySync("ar");
    routing.pathname = "/ar/dashboards/analytics";
    let failTelemetry = true;

    fetchMock.mockImplementation(async (url) => {
      const target = String(url);
      if (target === "/api/v1/auth/me") {
        return Response.json({
          user: { id: 1, displayName: "Admin", username: "admin", role: "admin" },
        });
      }
      if (target === "/api/v1/performance/summary") {
        if (failTelemetry) return new Response(null, { status: 503 });
        return Response.json({
          runtime: { rssMb: 256, heapUsedMb: 128, heapTotalMb: 192, uptimeSec: 420 },
          widgets: [{ id: "w1" }, { id: "w2" }],
        });
      }
      if (target === "/api/v1/cab/summary") {
        if (failTelemetry) return new Response(null, { status: 503 });
        return Response.json({
          changes: 7,
          metrics: { submitted: 9, approved: 5, implemented: 3 },
        });
      }
      if (target.startsWith("/api/v1/_meta/views/")) {
        return Response.json({
          model: "px.system",
          table: "px_system",
          extensible: false,
          restEnabled: true,
          acl: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
          fields: [
            {
              id: "f1",
              model_name: "px.system",
              field_name: "name",
              field_type: "text",
              nullable: false,
              required: true,
              deprecated: false,
              is_custom: false,
              origin_addon: "__base",
              ui_widget: "text",
              label: "Name",
              selection: null,
              default_value: null,
            },
          ],
          views: [],
          actionBindings: { listUrl: "/api/v1/m/px.system" },
        });
      }
      if (target.startsWith("/api/v1/m/")) {
        return Response.json({ data: [] });
      }
      if (target === "/api/v1/_meta/models") {
        return Response.json({ models: ["px.system", "audit.log"] });
      }
      if (target === "/api/v1/_meta/navigation") {
        return Response.json({ menus: [] });
      }
      return Response.json({});
    });

    await renderView("ar", <AnalyticsDashboardView />);

    // RTL wrapper + standardized header hierarchy
    expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe(arDict.dashboards.analyticsTitle);
    expect(container.textContent).toContain(arDict.operations.workspace.planeLabel);
    expect(container.textContent).toContain(arDict.operations.workspace.healthStatus);

    // Explicit error alert with retry button
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain(arDict.errors.networkOffline);

    const retryBtn = Array.from(alert?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes(arDict.operations.workspace.telemetryRefresh),
    );
    expect(retryBtn).toBeDefined();

    failTelemetry = false;
    await act(async () => {
      retryBtn?.click();
    });
    await flushEffects();

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain("128 / 256");
    expect(container.textContent).toContain("5 / 9");

    // Technical metrics and model identifiers have dir="ltr" font-mono isolation
    const ltrMetric = Array.from(container.querySelectorAll('[dir="ltr"].font-mono')).find((el) =>
      el.textContent?.includes("128 / 256"),
    );
    expect(ltrMetric).toBeDefined();

    // Workbench link preserves /ar prefix and ?model=
    const workbenchLink = container.querySelector('a[href="/ar/apps/addons?model=px.system"]');
    expect(workbenchLink).not.toBeNull();

    // Grouped filter buttons switch activeModel
    const auditBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("audit.log"),
    );
    expect(auditBtn).toBeDefined();
    await act(async () => {
      auditBtn?.click();
    });
    await flushEffects();
    expect(container.querySelector('a[href="/ar/apps/addons?model=audit.log"]')).not.toBeNull();
  });

  it("renders AddonsStudioView with localized header, filter/empty reset, error retry, and ?model= explorer", async () => {
    const idDict = getDictionarySync("id");
    routing.pathname = "/id/apps/addons";
    routing.search = "";

    fetchMock.mockImplementation(async (url) => {
      const target = String(url);
      if (target === "/api/v1/auth/me") {
        return Response.json({
          user: { id: 1, displayName: "Admin", username: "admin", role: "admin" },
        });
      }
      if (target === "/api/v1/_meta/addons") {
        return Response.json({
          addons: [
            {
              id: "a1",
              name: "timeline",
              addon_version: "1.2.0",
              description: "Chronicle events",
              category: "Chronicle",
              state: "installed",
              auto_install: false,
              last_error: null,
              enabled: true,
            },
            {
              id: "a2",
              name: "radius",
              addon_version: "0.9.0",
              description: "RADIUS AAA",
              category: "Operations",
              state: "disabled",
              auto_install: false,
              last_error: null,
              enabled: false,
            },
          ],
        });
      }
      if (target === "/api/v1/_meta/models") {
        return Response.json({ models: ["timeline.event", "witness.claim"] });
      }
      if (target === "/api/v1/_meta/navigation") {
        return Response.json({ menus: [] });
      }
      if (target.startsWith("/api/v1/_meta/views/")) {
        return Response.json({
          model: "timeline.event",
          table: "events",
          extensible: true,
          restEnabled: true,
          acl: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
          fields: [
            {
              id: "f1",
              model_name: "timeline.event",
              field_name: "title",
              field_type: "text",
              nullable: false,
              required: true,
              deprecated: false,
              is_custom: false,
              origin_addon: "timeline",
              ui_widget: "text",
              label: "Title",
              selection: null,
              default_value: null,
            },
          ],
          views: [],
          actionBindings: { listUrl: "/api/v1/m/timeline.event" },
        });
      }
      if (target.startsWith("/api/v1/m/")) {
        return Response.json({ data: [] });
      }
      return Response.json({});
    });

    await renderView("id", <AddonsStudioView />);

    expect(container.querySelector("h1")?.textContent).toBe(idDict.addons.title);
    expect(container.textContent).toContain(idDict.operations.workspace.planeLabel);
    expect(container.textContent).toContain(idDict.addons.runtimeRegistry);
    expect(
      container.querySelector('a[href="/id/apps/addons?model=timeline.event"]'),
    ).not.toBeNull();

    // Filter to unmatched query -> explicit Empty state with Reset
    const filterInput = container.querySelector<HTMLInputElement>(
      `input[placeholder="${idDict.addons.filterPlaceholder}"]`,
    );
    expect(filterInput).not.toBeNull();
    await act(async () => {
      if (filterInput) setInputValue(filterInput, "nonexistent-addon-xyz");
    });

    expect(container.textContent).toContain(idDict.addons.emptyFilter);
    const resetBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(idDict.common.reset),
    );
    expect(resetBtn).toBeDefined();
    await act(async () => {
      resetBtn?.click();
    });
    expect(container.textContent).toContain("timeline");
    expect(container.textContent).toContain("radius");

    // Model Explorer mode (?model=timeline.event) on /ar/apps/addons
    const arDict = getDictionarySync("ar");
    routing.pathname = "/ar/apps/addons";
    routing.search = "?model=timeline.event";
    await renderView("ar", <AddonsStudioView />);

    const modelHeading = container.querySelector("h1");
    expect(modelHeading?.textContent).toBe("timeline.event");
    expect(modelHeading?.getAttribute("dir")).toBe("ltr");
    expect(container.querySelector('a[href="/ar/apps/addons"]')?.textContent).toContain(
      arDict.addons.title,
    );
  });

  it("renders ObservatoryAppView with localized header, RTL bidi coordinates/times, and retryable unavailable state", async () => {
    const arDict = getDictionarySync("ar");
    routing.pathname = "/ar/apps/observatory";
    let failCelestial = true;

    fetchMock.mockImplementation(async (url) => {
      const target = String(url);
      if (target === "/api/v1/auth/me") {
        return Response.json({
          user: { id: 1, displayName: "Admin", username: "admin", role: "admin" },
        });
      }
      if (target.startsWith("/api/v1/celestial/now")) {
        if (failCelestial) return new Response(null, { status: 503 });
        return Response.json({
          lunar: { phaseName: "Waxing Crescent", illumination: 14, elongationDeg: 11.4 },
        });
      }
      if (target.startsWith("/api/v1/celestial/prayer-times")) {
        if (failCelestial) return new Response(null, { status: 503 });
        return Response.json({
          fajr: "04:32",
          sunrise: "05:49",
          dhuhr: "11:51",
          asr: "15:10",
          maghrib: "17:52",
          isha: "19:03",
          qibla_bearing: 295.1,
        });
      }
      if (target === "/api/v1/observatory/summary") {
        if (failCelestial) return new Response(null, { status: 503 });
        return Response.json({ feeds: 4, operations: 12 });
      }
      if (target.startsWith("/api/v1/celestial/hilal")) {
        if (failCelestial) return new Response(null, { status: 503 });
        return Response.json({ overall_verdict: "MABIMS PASS" });
      }
      if (target.startsWith("/api/v1/_meta/views/")) {
        return Response.json({
          model: "observatory.feed",
          table: "observatory_feeds",
          extensible: false,
          restEnabled: true,
          acl: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
          fields: [
            {
              id: "f1",
              model_name: "observatory.feed",
              field_name: "name",
              field_type: "text",
              nullable: false,
              required: true,
              deprecated: false,
              is_custom: false,
              origin_addon: "observatory",
              ui_widget: "text",
              label: "Name",
              selection: null,
              default_value: null,
            },
          ],
          views: [],
          actionBindings: { listUrl: "/api/v1/m/observatory.feed" },
        });
      }
      if (target.startsWith("/api/v1/m/")) {
        return Response.json({ data: [] });
      }
      if (target === "/api/v1/_meta/models") {
        return Response.json({ models: ["observatory.feed", "celestial.snapshot"] });
      }
      if (target === "/api/v1/_meta/navigation") {
        return Response.json({ menus: [] });
      }
      return Response.json({});
    });

    await renderView("ar", <ObservatoryAppView />);

    expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe(arDict.apps.observatoryTitle);
    expect(container.textContent).toContain(arDict.operations.workspace.planeLabel);
    expect(container.textContent).toContain(arDict.sanctuary.mtime.criteriaLabel);

    const latInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Observer Latitude"]',
    );
    const lonInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Observer Longitude"]',
    );
    expect(latInput?.getAttribute("dir")).toBe("ltr");
    expect(lonInput?.getAttribute("dir")).toBe("ltr");

    // Error alert + retry recovers celestial data
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain(arDict.errors.networkOffline);

    const retryBtn = Array.from(alert?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes(arDict.operations.workspace.telemetryRefresh),
    );
    expect(retryBtn).toBeDefined();

    failCelestial = false;
    await act(async () => {
      retryBtn?.click();
    });
    await flushEffects();

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain("04:32");
    expect(container.textContent).toContain("295.1°");
    expect(container.textContent).toContain(arDict.sanctuary.mtime.azimuthLabel);
  });
});
