// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import { getLocalizedUrl } from "@/utils/i18n";
import { LanguageDropdown } from "@/components/layout/shared/LanguageDropdown";

const routing = vi.hoisted(() => ({
  pathname: "/en/operations",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => ({ push: routing.push }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  routing.pathname = "/en/operations";
  routing.push.mockReset();
  localStorage.clear();
  document.cookie = "mw-locale=; path=/; max-age=0; SameSite=Lax";
  window.history.replaceState({}, "", "/en/operations");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
});

describe("Operations Console locale navigation & query/hash preservation", () => {
  it("preserves query parameters and hash fragments in getLocalizedUrl across en, id, and ar", () => {
    expect(getLocalizedUrl("/en/operations?model=ir.addon#details", "ar")).toBe(
      "/ar/operations?model=ir.addon#details",
    );
    expect(getLocalizedUrl("/ar/apps/addons?model=witness.claim&tab=fields#schema", "id")).toBe(
      "/id/apps/addons?model=witness.claim&tab=fields#schema",
    );
    expect(getLocalizedUrl("/id/dashboards/analytics?range=30d&tenant=2#sla", "en")).toBe(
      "/en/dashboards/analytics?range=30d&tenant=2#sla",
    );
    expect(getLocalizedUrl("/operations?model=res.partner#directory", "ar")).toBe(
      "/ar/operations?model=res.partner#directory",
    );
    expect(getLocalizedUrl("/en?model=ir.rule#top", "id")).toBe("/id?model=ir.rule#top");
    expect(getLocalizedUrl("/?sanctuary=1#worlds", "ar")).toBe("/ar?sanctuary=1#worlds");
  });

  it("navigates with preserved search & hash when LanguageDropdown switches locale on a prefixed route", async () => {
    routing.pathname = "/en/apps/addons";
    window.history.replaceState({}, "", "/en/apps/addons?model=ir.addon&view=form#fields");

    await act(async () => {
      root.render(
        React.createElement(TranslationWrapper, {
          lang: "en",
          children: React.createElement(LanguageDropdown),
        }),
      );
    });

    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Change language"]',
    );
    expect(trigger).not.toBeNull();
    await act(async () => {
      trigger?.click();
    });

    const arabicButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("العربية"),
    );
    expect(arabicButton).toBeDefined();
    await act(async () => {
      arabicButton?.click();
    });

    expect(routing.push).toHaveBeenCalledTimes(1);
    expect(routing.push).toHaveBeenCalledWith("/ar/apps/addons?model=ir.addon&view=form#fields");
  });

  it("updates locale in place without calling router.push on unprefixed routes", async () => {
    routing.pathname = "/operations";
    window.history.replaceState({}, "", "/operations?model=ir.addon#details");

    await act(async () => {
      root.render(
        React.createElement(TranslationWrapper, {
          children: React.createElement(LanguageDropdown),
        }),
      );
    });

    const trigger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Change language"]',
    );
    await act(async () => {
      trigger?.click();
    });

    const idButton = Array.from(document.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Bahasa Indonesia"),
    );
    expect(idButton).toBeDefined();
    await act(async () => {
      idButton?.click();
    });

    expect(routing.push).not.toHaveBeenCalled();
    expect(document.documentElement.lang).toBe("id");
    expect(document.cookie).toContain("mw-locale=id");
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      "/operations?model=ir.addon#details",
    );
  });
});
