// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useQuery } from "@tanstack/react-query";
import { TENANT_STORAGE_KEY } from "@moonwitness/contracts/sdk";
import { useCurrentSessionState, notifySessionChange } from "../src/lib/session";
import {
  useCelestialNow,
  useCompaniesCatalog,
  useMetaNavigation,
  useMetaView,
  useModelRows,
} from "../src/lib/api/meta-views";
import { navItems } from "../src/components/shell/nav-items";
import { uploadMemoryArchive } from "../src/lib/api/memory";
import { Providers } from "../src/components/providers";
import { DockTopologyBridge } from "../src/components/dock-topology-bridge";

vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => createElement("a", props),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  localStorage.clear();
  document.cookie = "mw_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
  document.cookie = "mw_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  vi.unstubAllGlobals();
});

describe("Wave 9 session, tenant reactivity, XHR headers, and dock links", () => {
  it("useCurrentSessionState tracks loading, session, refresh, and mw:session-change", async () => {
    let userPayload: unknown = {
      user: { id: 1, displayName: "Alpha", username: "alpha", role: "admin" },
    };
    const fetchMock = vi.fn(async () => Response.json(userPayload));
    vi.stubGlobal("fetch", fetchMock);

    let latestState: ReturnType<typeof useCurrentSessionState> | null = null;
    function Probe() {
      latestState = useCurrentSessionState();
      return createElement("div", null, latestState.session?.identity ?? "anon");
    }

    await act(async () => {
      root.render(createElement(Probe));
    });
    expect(latestState!.loading).toBe(false);
    expect(latestState!.session?.identity).toBe("Alpha");

    userPayload = { user: { id: 2, displayName: "Beta", username: "beta", role: "editor" } };
    await act(async () => {
      notifySessionChange();
    });
    expect(latestState!.session?.identity).toBe("Beta");

    userPayload = { user: null };
    await act(async () => {
      await latestState!.refresh();
    });
    expect(latestState!.session).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("useMetaView and useModelRows reload on mw:tenant-changed (B1) and useCelestialNow respects enabled flag (B2)", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.startsWith("/api/v1/_meta/views/")) {
        return Response.json({
          model: "timeline.event",
          table: "events",
          extensible: false,
          restEnabled: true,
          acl: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
          fields: [],
          views: [],
          actionBindings: {},
        });
      }
      if (target.startsWith("/api/v1/m/")) {
        return Response.json({ data: [{ id: "row-1" }] });
      }
      if (target === "/api/v1/celestial/now") {
        return Response.json({
          hijri: { year: 1448, month: 5, day: 9, monthName: "Jumada al-Ula" },
          lunar: { phaseName: "Waxing", illumination: 60 },
          aeq4: { mode: "solar", formatted: "1448", hijriBridge: "9" },
        });
      }
      return Response.json({});
    });
    vi.stubGlobal("fetch", fetchMock);

    function Harness({ celestialEnabled }: { celestialEnabled: boolean }) {
      const meta = useMetaView("timeline.event");
      const rows = useModelRows("timeline.event");
      const celestial = useCelestialNow(celestialEnabled);
      return createElement(
        "div",
        null,
        `${meta.view?.model ?? "none"}:${rows.rows.length}:${celestial?.hijri.year ?? "off"}`,
      );
    }

    await act(async () => {
      root.render(createElement(Harness, { celestialEnabled: false }));
    });
    expect(container.textContent).toBe("timeline.event:1:off");
    expect(fetchMock.mock.calls.some(([url]) => String(url) === "/api/v1/celestial/now")).toBe(
      false,
    );

    const viewCallsBefore = fetchMock.mock.calls.filter(([u]) =>
      String(u).startsWith("/api/v1/_meta/views/"),
    ).length;
    const rowCallsBefore = fetchMock.mock.calls.filter(([u]) =>
      String(u).startsWith("/api/v1/m/"),
    ).length;

    await act(async () => {
      window.dispatchEvent(new Event("mw:tenant-changed"));
    });

    expect(
      fetchMock.mock.calls.filter(([u]) => String(u).startsWith("/api/v1/_meta/views/")).length,
    ).toBe(viewCallsBefore + 1);
    expect(fetchMock.mock.calls.filter(([u]) => String(u).startsWith("/api/v1/m/")).length).toBe(
      rowCallsBefore + 1,
    );

    await act(async () => {
      root.render(createElement(Harness, { celestialEnabled: true }));
    });
    expect(container.textContent).toBe("timeline.event:1:1448");
  });

  it("Providers invalidates auth queries on mw:session-change and active queries on mw:tenant-changed", async () => {
    let authCount = 0;
    let dataCount = 0;

    function Inner() {
      const authQuery = useQuery({
        queryKey: ["app", "auth", "me"],
        queryFn: async () => {
          authCount += 1;
          return { count: authCount };
        },
      });
      const dataQuery = useQuery({
        queryKey: ["app", "items"],
        queryFn: async () => {
          dataCount += 1;
          return { count: dataCount };
        },
      });
      return createElement(
        "div",
        null,
        `${authQuery.data?.count ?? 0}:${dataQuery.data?.count ?? 0}`,
      );
    }

    await act(async () => {
      root.render(createElement(Providers, null, createElement(Inner)));
    });
    expect(authCount).toBe(1);
    expect(dataCount).toBe(1);

    await act(async () => {
      notifySessionChange();
    });
    expect(authCount).toBe(2);
    expect(dataCount).toBe(1);

    await act(async () => {
      window.dispatchEvent(new Event("mw:tenant-changed"));
    });
    expect(authCount).toBe(3);
    expect(dataCount).toBe(2);
  });

  it("uploadMemoryArchive XHR path injects x-csrf-token and x-tenant-id (B5)", async () => {
    document.cookie = "mw_csrf=csrf-upload-123; path=/";
    localStorage.setItem(TENANT_STORAGE_KEY, "tenant-alpha");

    const headersSet: Record<string, string> = {};
    const listeners: Record<string, Array<() => void>> = {};

    class MockXMLHttpRequest {
      withCredentials = false;
      responseType = "";
      status = 200;
      responseText = JSON.stringify({ message: "uploaded" });
      upload = {
        addEventListener: () => {},
      };
      open() {}
      setRequestHeader(name: string, value: string) {
        headersSet[name] = value;
      }
      addEventListener(event: string, cb: () => void) {
        listeners[event] = listeners[event] ?? [];
        listeners[event]!.push(cb);
      }
      send() {
        for (const cb of listeners["load"] ?? []) cb();
      }
    }

    vi.stubGlobal("XMLHttpRequest", MockXMLHttpRequest);
    const file = new File(["{}"], "archive.json", { type: "application/json" });
    const res = await uploadMemoryArchive(file, () => {});
    expect(res).toEqual({ message: "uploaded" });
    expect(headersSet["x-csrf-token"]).toBe("csrf-upload-123");
    expect(headersSet["x-tenant-id"]).toBe("tenant-alpha");
  });

  it("DockTopologyBridge renders local routes as same-tab links without localhost:3000 (A6)", async () => {
    await act(async () => {
      root.render(
        createElement(DockTopologyBridge, {
          telemetry: {
            status: "offline",
            runtimeMode: "local-stack",
            refreshing: false,
            refresh: () => {},
            databaseStatus: null,
            timelineTotal: null,
            erasCount: null,
            edges: [],
            services: [],
            git: null,
            codexGovernance: null,
          } as unknown as ComponentProps<typeof DockTopologyBridge>["telemetry"],
        }),
      );
    });

    const dockLink = container.querySelector<HTMLAnchorElement>('a[href="/dock"]');
    expect(dockLink).not.toBeNull();
    expect(dockLink?.getAttribute("target")).toBeNull();
    expect(container.innerHTML).not.toContain("http://localhost:3000");
  });

  it("useCurrentSessionState discards stale out-of-order /api/v1/auth/me responses on rapid mw:session-change and refresh", async () => {
    const deferred: Array<(res: Response) => void> = [];
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          deferred.push(resolve);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    let latestState: ReturnType<typeof useCurrentSessionState> | null = null;
    function Probe() {
      latestState = useCurrentSessionState();
      return createElement(
        "div",
        null,
        `${latestState.loading}:${latestState.session?.identity ?? "anon"}`,
      );
    }

    await act(async () => {
      root.render(createElement(Probe));
    });
    expect(deferred).toHaveLength(1);

    await act(async () => {
      deferred[0]!(
        Response.json({
          user: { id: 1, displayName: "InitialUser", username: "init", role: "viewer" },
        }),
      );
    });
    expect(latestState!.loading).toBe(false);
    expect(latestState!.session?.identity).toBe("InitialUser");

    // Rapid session-change (#2 slow, #3 fast)
    await act(async () => {
      notifySessionChange();
      notifySessionChange();
    });
    expect(deferred).toHaveLength(3);

    // Resolve newer #3 first with logged-out null
    await act(async () => {
      deferred[2]!(Response.json({ user: null }));
    });
    expect(latestState!.session).toBeNull();
    expect(latestState!.loading).toBe(false);

    // Resolve older #2 later with StaleUserA — must be ignored
    await act(async () => {
      deferred[1]!(
        Response.json({
          user: { id: 9, displayName: "StaleUserA", username: "stale", role: "admin" },
        }),
      );
    });
    expect(latestState!.session).toBeNull();
    expect(latestState!.loading).toBe(false);

    // Trigger refresh() (#4), then start a rapid session-change (#5) before #4 settles
    let refreshPromise: Promise<void> | undefined;
    await act(async () => {
      refreshPromise = latestState!.refresh();
    });
    expect(latestState!.loading).toBe(true);
    expect(deferred).toHaveLength(4);

    await act(async () => {
      notifySessionChange();
    });
    expect(deferred).toHaveLength(5);

    // Older refresh #4 resolves first: must NOT clear loading or overwrite with stale user while #5 is in-flight
    await act(async () => {
      deferred[3]!(
        Response.json({
          user: { id: 10, displayName: "OlderRefresh", username: "older", role: "viewer" },
        }),
      );
      await refreshPromise;
    });
    expect(latestState!.loading).toBe(true);
    expect(latestState!.session).toBeNull();

    // Latest #5 resolves: updates session and clears loading
    await act(async () => {
      deferred[4]!(
        Response.json({
          user: { id: 11, displayName: "NewestUser", username: "newest", role: "editor" },
        }),
      );
    });
    expect(latestState!.loading).toBe(false);
    expect(latestState!.session?.identity).toBe("NewestUser");
  });

  it("useMetaNavigation and useCompaniesCatalog reset stale state when enabled flips true -> false", async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target === "/api/v1/_meta/navigation") {
        return Response.json({
          menus: [
            {
              id: "m-dyn",
              menu_key: "dyn.addons",
              addon: "addons",
              parent_key: null,
              label: "Dynamic Addons",
              href: "/addons",
              icon: "dot",
              plane: "creator",
              sort_order: 99,
              min_role: "admin",
            },
          ],
        });
      }
      if (target === "/api/v1/m/res.company") {
        return Response.json({
          data: [
            {
              id: "c1",
              slug: "acme",
              name: "Acme Sanctuary",
              default_locale: "en",
              currency: "USD",
              is_active: true,
            },
          ],
        });
      }
      return Response.json({});
    });
    vi.stubGlobal("fetch", fetchMock);

    let latestNavLen = 0;
    let latestCompaniesLen = 0;
    function Harness({ enabled }: { enabled: boolean }) {
      const items = useMetaNavigation("creator", navItems, enabled);
      const { companies } = useCompaniesCatalog(enabled);
      latestNavLen = items.length;
      latestCompaniesLen = companies.length;
      return createElement("div", null, `${items.length}:${companies.length}`);
    }

    await act(async () => {
      root.render(createElement(Harness, { enabled: true }));
    });
    expect(latestNavLen).toBe(navItems.length + 1);
    expect(latestCompaniesLen).toBe(1);

    await act(async () => {
      root.render(createElement(Harness, { enabled: false }));
    });
    expect(latestNavLen).toBe(navItems.length);
    expect(latestCompaniesLen).toBe(0);
  });
});
