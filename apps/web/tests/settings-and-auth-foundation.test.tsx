// @vitest-environment jsdom
import React, { act, useContext, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsContext, SettingsProvider } from "@/@core/contexts/settingsContext";
import { evaluateServerRequestAccess } from "@/@core/auth/serverRouteGuard";
import { Providers } from "@/components/providers";
import { evaluateRouteAccess, hasRequiredRole, resolveRoutePolicy } from "@/configs/routePolicy";
import themeConfig from "@/configs/themeConfig";
import { AuthGuard } from "@/hocs/AuthGuard";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import {
  assertProductionAuthSafety,
  isDevSessionFallbackEnabled,
  parseSessionPayload,
} from "@/lib/session";

const navigation = vi.hoisted(() => ({
  pathname: "/en/dashboards/analytics",
  redirect: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
  redirect: (target: string) => navigation.redirect(target),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a">) =>
    React.createElement("a", { href, ...rest }, children),
}));

let container: HTMLDivElement;
let root: Root;

function clearCookies(): void {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  }
}

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("Web foundation: SettingsContext, Providers, RBAC fail-closed & AuthGuard", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("React", React);
    navigation.pathname = "/en/dashboards/analytics";
    navigation.redirect.mockReset();
    navigation.push.mockReset();
    clearCookies();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    clearCookies();
  });

  it("decouples SettingsContext state updates from cookie persistence and restores updatePageSettings cleanly", async () => {
    let ctxSnapshot: React.ContextType<typeof SettingsContext> | null = null;

    function SettingsProbe() {
      const ctx = useContext(SettingsContext);
      ctxSnapshot = ctx;
      return (
        <div data-testid="probe">
          {ctx.settings.mode}|{ctx.settings.skin}|{ctx.settings.density}
        </div>
      );
    }

    await act(async () => {
      root.render(
        <SettingsProvider mode="dark">
          <SettingsProbe />
        </SettingsProvider>,
      );
    });

    expect(container.textContent).toBe("dark|default|comfortable");
    expect(document.cookie).toBe("");

    await act(async () => {
      ctxSnapshot!.updateSettings({ mode: "light" }, { updateCookie: false });
    });

    expect(ctxSnapshot!.settings.mode).toBe("light");
    expect(container.textContent).toBe("light|default|comfortable");
    expect(document.cookie).toBe("");

    let restorePageSettings: (() => void) | undefined;
    await act(async () => {
      restorePageSettings = ctxSnapshot!.updatePageSettings({
        mode: "dark",
        density: "compact",
      });
    });

    expect(ctxSnapshot!.settings.mode).toBe("dark");
    expect(ctxSnapshot!.settings.density).toBe("compact");
    expect(document.cookie).toBe("");

    await act(async () => {
      restorePageSettings?.();
    });

    expect(ctxSnapshot!.settings.mode).toBe("light");
    expect(ctxSnapshot!.settings.density).toBe("comfortable");
    expect(document.cookie).toBe("");

    await act(async () => {
      ctxSnapshot!.updateSettings({ skin: "riot" }, { updateCookie: true });
    });

    expect(ctxSnapshot!.settings.skin).toBe("riot");
    expect(document.cookie).toContain(`${themeConfig.settingsCookieName}=`);
  });

  it("reuses outer SettingsProvider and QueryClient across nested layout boundaries", async () => {
    const clients: QueryClient[] = [];
    let nestedMode = "";

    function NestedProbe({ label }: { label: string }) {
      const queryClient = useQueryClient();
      const { settings } = useContext(SettingsContext);
      useEffect(() => {
        clients.push(queryClient);
      }, [queryClient]);
      nestedMode = `${label}:${settings.mode}`;
      return <span>{nestedMode}</span>;
    }

    await act(async () => {
      root.render(
        <Providers>
          <SettingsProvider mode="light">
            <NestedProbe label="outer" />
            <Providers>
              <SettingsProvider>
                <NestedProbe label="inner" />
              </SettingsProvider>
            </Providers>
          </SettingsProvider>
        </Providers>,
      );
    });

    expect(clients).toHaveLength(2);
    expect(clients[0]).toBe(clients[1]);
    expect(container.textContent).toBe("outer:lightinner:light");
  });

  it("fails closed on missing, malformed, unknown, or prototype-key roles and unknown routes", () => {
    expect(hasRequiredRole("admin", "admin")).toBe(true);
    expect(hasRequiredRole("editor", "viewer")).toBe(true);
    expect(hasRequiredRole("creator", "viewer")).toBe(true);
    expect(hasRequiredRole("viewer", "admin")).toBe(false);
    expect(hasRequiredRole(undefined, "viewer")).toBe(false);
    expect(hasRequiredRole(null, "viewer")).toBe(false);
    expect(hasRequiredRole("", "viewer")).toBe(false);
    expect(hasRequiredRole("guest", "viewer")).toBe(false);
    expect(hasRequiredRole("superadmin", "admin")).toBe(false);
    expect(hasRequiredRole("__proto__", "viewer")).toBe(false);
    expect(hasRequiredRole("constructor", "viewer")).toBe(false);
    expect(hasRequiredRole("toString", "viewer")).toBe(false);

    const unknownRoute = resolveRoutePolicy("/en/unregistered-enterprise-module");
    expect(unknownRoute.access).toBe("protected");
    expect(unknownRoute.minRole).toBe("viewer");

    expect(
      evaluateRouteAccess("/en/apps/permissions", {
        isAuthenticated: true,
        role: "unknown-role",
      }),
    ).toMatchObject({ allowed: false, reason: "forbidden", requiredRole: "admin" });

    expect(
      evaluateRouteAccess("/en/shadow", {
        isAuthenticated: true,
        role: "viewer",
      }),
    ).toMatchObject({ allowed: false, reason: "already-authenticated" });
  });

  it("hardens production dev-bypass checks and avoids implicit role fallback in parseSessionPayload", () => {
    expect(parseSessionPayload({ user: { displayName: "NoRole" } })).toEqual({
      identity: "NoRole",
      role: "",
      username: undefined,
      id: undefined,
    });

    expect(() =>
      assertProductionAuthSafety({ NODE_ENV: "production", MW_DEV_AUTH_BYPASS: "1" }),
    ).toThrow(/Security violation/);
    expect(() =>
      assertProductionAuthSafety({ NODE_ENV: "production", NEXT_PUBLIC_DEV_AUTH_BYPASS: "1" }),
    ).toThrow(/Security violation/);

    expect(
      isDevSessionFallbackEnabled({ NODE_ENV: "development", NEXT_PUBLIC_DEV_AUTH_BYPASS: "1" }),
    ).toBe(false);
    expect(isDevSessionFallbackEnabled({ NODE_ENV: "test", MW_DEV_AUTH_BYPASS: "1" })).toBe(false);
    expect(isDevSessionFallbackEnabled({ NODE_ENV: "development", MW_DEV_AUTH_BYPASS: "1" })).toBe(
      true,
    );
  });

  it("enforces server-side route policy in evaluateServerRequestAccess", async () => {
    const deferred = await evaluateServerRequestAccess({
      pathname: "/en/apps/permissions",
      enforcePreviewAuth: true,
    });
    expect(deferred).toMatchObject({
      allowed: false,
      reason: "unauthenticated",
      deferredToClientGuard: true,
    });

    const viewerRes = await evaluateServerRequestAccess({
      pathname: "/en/apps/permissions",
      cookieHeader: "mw_session=tok-viewer",
      fetchImpl: vi.fn(
        async () =>
          new Response(JSON.stringify({ user: { displayName: "Viewer", role: "viewer" } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    });
    expect(viewerRes).toMatchObject({
      allowed: false,
      reason: "forbidden",
      requiredRole: "admin",
      deferredToClientGuard: false,
    });

    const unknownRoleRes = await evaluateServerRequestAccess({
      pathname: "/en/apps/roles",
      cookieHeader: "mw_session=tok-weird",
      fetchImpl: vi.fn(
        async () =>
          new Response(JSON.stringify({ user: { displayName: "Weird", role: "ghost" } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    });
    expect(unknownRoleRes).toMatchObject({
      allowed: false,
      reason: "forbidden",
      deferredToClientGuard: false,
    });

    const adminRes = await evaluateServerRequestAccess({
      pathname: "/en/apps/permissions",
      cookieHeader: "mw_session=tok-admin",
      fetchImpl: vi.fn(
        async () =>
          new Response(JSON.stringify({ user: { displayName: "Admin", role: "admin" } }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    });
    expect(adminRes).toMatchObject({
      allowed: true,
      reason: "authorized",
      deferredToClientGuard: false,
    });
  });

  it("blocks protected content in AuthGuard for unauthenticated and unauthorized users while allowing authorized sessions", async () => {
    // 1. Unauthenticated -> redirects without leaking children
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })),
    );
    navigation.pathname = "/en/dashboards/analytics";

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <AuthGuard key="case-unauth" locale="en" enforceRedirect>
            <div>SECRET_ANALYTICS_PAYLOAD</div>
          </AuthGuard>
        </TranslationWrapper>,
      );
    });
    await flushMicrotasks();

    expect(container.textContent).not.toContain("SECRET_ANALYTICS_PAYLOAD");
    expect(navigation.redirect).toHaveBeenCalledWith(
      "/en/shadow?redirectTo=%2Fen%2Fdashboards%2Fanalytics",
    );

    // 2. Authenticated viewer hitting admin-policy route -> NotAuthorizedView
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ user: { id: "u1", displayName: "Viewer", role: "viewer" } }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
      ),
    );
    navigation.pathname = "/en/apps/permissions";
    navigation.redirect.mockReset();

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <AuthGuard key="case-viewer" locale="en" enforceRedirect>
            <div>ADMIN_PERMISSIONS_PANEL</div>
          </AuthGuard>
        </TranslationWrapper>,
      );
    });
    await flushMicrotasks();

    expect(container.textContent).not.toContain("ADMIN_PERMISSIONS_PANEL");
    expect(container.textContent).toContain("HTTP 401 / RBAC DENIED");
    expect(container.textContent).toContain("ADMIN");

    // 3. Authenticated admin hitting admin-policy route -> renders children
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ user: { id: "u2", displayName: "Admin", role: "admin" } }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
      ),
    );

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <AuthGuard key="case-admin" locale="en" enforceRedirect>
            <div>ADMIN_PERMISSIONS_PANEL</div>
          </AuthGuard>
        </TranslationWrapper>,
      );
    });
    await flushMicrotasks();

    expect(container.textContent).toContain("ADMIN_PERMISSIONS_PANEL");
  });
});
