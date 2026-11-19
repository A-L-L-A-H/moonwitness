// @vitest-environment jsdom
import React, { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkinProvider } from "@moonwitness/ui";
import type { Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import { SiteNav } from "@/components/site-nav";
import { getChronicleNavLinks } from "@/components/site-nav/links";
import { MobileMenu } from "@/components/site-nav/mobile-menu";
import { SearchDialog } from "@/components/site-nav/search-dialog";

const routing = vi.hoisted(() => ({
  pathname: "/en/moonwitness",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => ({ push: routing.push, replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

let container: HTMLDivElement;
let root: Root;

function clearLocaleState() {
  localStorage.clear();
  document.cookie = `${themeConfig.localeCookieName}=; path=/; max-age=0; SameSite=Lax`;
  document.documentElement.lang = "";
  document.documentElement.dir = "";
  window.history.replaceState({}, "", "/");
}

function renderWithProviders(node: React.ReactNode, lang?: Locale) {
  return (
    <SkinProvider defaultSkin="default" persist={false}>
      <TranslationWrapper lang={lang}>{node}</TranslationWrapper>
    </SkinProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  routing.pathname = "/en/moonwitness";
  routing.push.mockReset();
  clearLocaleState();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  clearLocaleState();
  vi.unstubAllGlobals();
});

describe("Chronicle SiteNav, MobileMenu & SearchDialog localization", () => {
  it("renders localized labels and links in static markup across EN, ID, and AR", () => {
    routing.pathname = "/en/moonwitness";
    const enHtml = renderToStaticMarkup(renderWithProviders(<SiteNav />, "en"));
    expect(enHtml).toContain("HOME");
    expect(enHtml).toContain("SIGNALS");
    expect(enHtml).toContain("STORIES");
    expect(enHtml).toContain("JOIN THE CREW");
    expect(enHtml).toContain('href="/en/moonwitness"');
    expect(enHtml).toContain('href="/en/shadow"');
    expect(enHtml).toContain('href="/en/mission-control"');
    expect(enHtml).toContain("Toggle menu (Open menu)");

    routing.pathname = "/id/moonwitness";
    const idHtml = renderToStaticMarkup(renderWithProviders(<SiteNav />, "id"));
    expect(idHtml).toContain("BERANDA");
    expect(idHtml).toContain("SINYAL");
    expect(idHtml).toContain("KISAH");
    expect(idHtml).toContain("ARSIP");
    expect(idHtml).toContain("GABUNG BERSAMA KRU");
    expect(idHtml).toContain('href="/id/moonwitness"');
    expect(idHtml).toContain('href="/id/shadow"');
    expect(idHtml).toContain('href="/id/mission-control"');
    expect(idHtml).toContain('aria-label="Buka menu"');

    routing.pathname = "/ar/moonwitness";
    const arHtml = renderToStaticMarkup(renderWithProviders(<SiteNav />, "ar"));
    expect(arHtml).toContain("الرئيسية");
    expect(arHtml).toContain("الإشارات");
    expect(arHtml).toContain("القصص");
    expect(arHtml).toContain("الظل");
    expect(arHtml).toContain("الطاقم");
    expect(arHtml).toContain("الأرشيف");
    expect(arHtml).toContain("انضم إلى الطاقم");
    expect(arHtml).toContain('href="/ar/moonwitness"');
    expect(arHtml).toContain('href="/ar/shadow"');
    expect(arHtml).toContain('href="/ar/mission-control"');
    expect(arHtml).toContain('aria-label="افتح القائمة"');

    const mobileArHtml = renderToStaticMarkup(
      renderWithProviders(
        <MobileMenu
          links={getChronicleNavLinks({
            home: "الرئيسية",
            signals: "الإشارات",
            storytelling: "القصص",
            shadow: "الظل",
            crew: "الطاقم",
            archive: "الأرشيف",
          })}
          active="home"
          onSelect={() => {}}
          onClose={() => {}}
        />,
        "ar",
      ),
    );
    expect(mobileArHtml).toContain('aria-label="Mobile"');
    expect(mobileArHtml).toContain("الرئيسية");
    expect(mobileArHtml).toContain('href="/ar/shadow"');
    expect(mobileArHtml).toContain('aria-pressed="true"');
  });

  it("navigates with preserved query & hash when switching locale on /[lang]/... routes", async () => {
    routing.pathname = "/en/moonwitness";
    window.history.replaceState({}, "", "/en/moonwitness?tab=feed#signals");

    await act(async () => {
      root.render(renderWithProviders(<SiteNav />, "en"));
    });

    const arButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent?.trim() === "AR",
    );
    expect(arButton).toBeDefined();
    expect(arButton?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      arButton?.click();
    });

    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.cookie).toContain(`${themeConfig.localeCookieName}=ar`);
    expect(routing.push).toHaveBeenCalledTimes(1);
    expect(routing.push).toHaveBeenCalledWith("/ar/moonwitness?tab=feed#signals");
  });

  it("updates locale in place without router.push on unprefixed MoonWitness host / and /moonwitness", async () => {
    routing.pathname = "/";
    window.history.replaceState({}, "", "/?filter=all#signals");

    await act(async () => {
      root.render(renderWithProviders(<SiteNav />));
    });

    const idButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent?.trim() === "ID",
    );
    expect(idButton).toBeDefined();

    await act(async () => {
      idButton?.click();
    });

    expect(routing.push).not.toHaveBeenCalled();
    expect(document.documentElement.lang).toBe("id");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.cookie).toContain(`${themeConfig.localeCookieName}=id`);
    expect(container.textContent).toContain("BERANDA");
    expect(container.textContent).toContain("SINYAL");

    const toggle = container.querySelector<HTMLButtonElement>('button[aria-label="Buka menu"]');
    expect(toggle).not.toBeNull();
    await act(async () => {
      toggle?.click();
    });

    const mobileNav = container.querySelector('nav[aria-label="Mobile"]');
    expect(mobileNav).not.toBeNull();
    expect(mobileNav?.textContent).toContain("BERANDA");

    const mobileArButton = Array.from(mobileNav?.querySelectorAll("button") ?? []).find(
      (btn) => btn.textContent?.trim() === "AR",
    );
    expect(mobileArButton).toBeDefined();

    await act(async () => {
      mobileArButton?.click();
    });

    expect(routing.push).not.toHaveBeenCalled();
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(mobileNav?.textContent).toContain("الرئيسية");
    expect(mobileNav?.textContent).toContain("الإشارات");
  });

  it("preserves locale prefix for SearchDialog archive submission on /[lang]/... and keeps /dock on unprefixed host", async () => {
    routing.pathname = "/id/moonwitness";
    window.history.replaceState({}, "", "/id/moonwitness");

    await act(async () => {
      root.render(
        renderWithProviders(
          <SearchDialog query="signal / moon" onQueryChange={() => {}} onClose={() => {}} />,
          "id",
        ),
      );
    });

    const form = document.body.querySelector("form");
    expect(form).not.toBeNull();
    expect(form?.getAttribute("action")).toBe("/id/dock?q=signal%20%2F%20moon");
    expect(document.body.textContent).toContain("CARI SINYAL");
    expect(document.body.textContent).toContain("Tutup pencarian");
    expect(document.body.textContent).toContain("CARI");

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(routing.push).toHaveBeenCalledWith("/id/dock?q=signal%20%2F%20moon");

    routing.push.mockReset();
    routing.pathname = "/";
    window.history.replaceState({}, "", "/");

    await act(async () => {
      root.render(
        renderWithProviders(
          <SearchDialog query="signal / moon" onQueryChange={() => {}} onClose={() => {}} />,
          "ar",
        ),
      );
    });

    const unprefixedForm = document.body.querySelector("form");
    expect(unprefixedForm?.getAttribute("action")).toBe("/dock?q=signal%20%2F%20moon");
    expect(document.body.textContent).toContain("ابحث في الإشارات");
    expect(document.body.textContent).toContain("انطلق");

    await act(async () => {
      unprefixedForm?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(routing.push).toHaveBeenCalledWith("/dock?q=signal%20%2F%20moon");
  });

  it("preserves mobile menu Escape dismiss and focus restoration in EN", async () => {
    routing.pathname = "/moonwitness";
    window.history.replaceState({}, "", "/moonwitness");

    await act(async () => {
      root.render(renderWithProviders(<SiteNav />, "en"));
    });

    const toggle = container.querySelector<HTMLButtonElement>('button[aria-label*="Toggle menu"]');
    expect(toggle).not.toBeNull();
    toggle?.focus();

    await act(async () => {
      toggle?.click();
    });
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    const mobileLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Mobile"] a'),
    );
    expect(mobileLinks[0]?.textContent).toBe("HOME");
    expect(mobileLinks[1]?.textContent).toBe("SIGNALS");

    const header = container.querySelector("header");
    await act(async () => {
      header?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    });

    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });
});
