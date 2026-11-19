// @vitest-environment jsdom
import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import { FOUR_ENTRY_DOORS, type EntryDoorId } from "@/data/empire-canon-codex";
import {
  WORLD_DOMAINS,
  type NavigationSectionId,
  type WorldIdentifier,
} from "@/data/empire-registry";
import en from "@/data/dictionaries/en.json";
import idDict from "@/data/dictionaries/id.json";
import ar from "@/data/dictionaries/ar.json";
import { TranslationWrapper, useTranslation } from "@/hocs/TranslationWrapper";
import { CanonCodexSanctum } from "@/components/canon-codex-sanctum";
import { EmpireNavigation } from "@/components/empire-navigation";
import { EmpireOfLightExperience } from "@/components/empire-of-light-experience";
import { SiteSubpageHeader } from "@/components/site-subpage-header";
import { WorldsSanctum } from "@/components/worlds-sanctum";

const routing = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const src = typeof props.src === "string" ? props.src : "/art/mock.webp";
    const alt = typeof props.alt === "string" ? props.alt : "";
    return React.createElement("img", {
      src,
      alt,
      className: props.className as string | undefined,
    });
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) =>
    React.createElement(
      "a",
      {
        href,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          onClick?.(event);
        },
        ...rest,
      },
      children,
    ),
}));

const DICTIONARIES = { en, id: idDict, ar } as const;

let container: HTMLDivElement;
let root: Root;

function resetBrowserState() {
  localStorage.clear();
  document.cookie = `${themeConfig.localeCookieName}=; path=/; max-age=0; SameSite=Lax`;
  document.documentElement.lang = "";
  document.documentElement.dir = "";
  routing.pathname = "/";
  window.history.replaceState({}, "", "/");
}

function LocaleControlBar() {
  const { locale, setLocale } = useTranslation();
  return (
    <div data-testid="locale-probe" data-locale={locale}>
      <button type="button" data-testid="set-en" onClick={() => setLocale("en")}>
        en
      </button>
      <button type="button" data-testid="set-id" onClick={() => setLocale("id")}>
        id
      </button>
      <button type="button" data-testid="set-ar" onClick={() => setLocale("ar")}>
        ar
      </button>
    </div>
  );
}

function WorldsHarness({ initialWorld = "human-pen" as WorldIdentifier }) {
  const [activeWorldId, setActiveWorldId] = useState<WorldIdentifier>(initialWorld);
  return (
    <>
      <LocaleControlBar />
      <WorldsSanctum activeWorldId={activeWorldId} quietMode onSelectWorld={setActiveWorldId} />
    </>
  );
}

function CodexHarness({ initialDoor = "story-universe" as EntryDoorId }) {
  const [activeDoorId, setActiveDoorId] = useState<EntryDoorId>(initialDoor);
  return (
    <>
      <LocaleControlBar />
      <CanonCodexSanctum activeDoorId={activeDoorId} quietMode onSelectDoor={setActiveDoorId} />
    </>
  );
}

function MobileNavigationHarness({
  onSectionSpy,
}: {
  readonly onSectionSpy: (sectionId: NavigationSectionId) => void;
}) {
  const [activeNavTab, setActiveNavTab] = useState<NavigationSectionId>("the-gate");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <LocaleControlBar />
      <EmpireNavigation
        activeNavTab={activeNavTab}
        sanctuaryRadianceActive={false}
        quietMode
        mobileMenuOpen={mobileMenuOpen}
        onNavigateToSection={(sectionId) => {
          setActiveNavTab(sectionId);
          onSectionSpy(sectionId);
        }}
        onOpenSearch={() => {}}
        onToggleRadiance={() => {}}
        onToggleQuietMode={() => {}}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />
    </>
  );
}

async function clickEl(el: Element | null) {
  if (!el) throw new Error("Expected element to exist before click");
  await act(async () => {
    (el as HTMLElement).click();
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
    const gradient = { addColorStop: () => {} };
    return new Proxy(
      {
        createLinearGradient: () => gradient,
        createRadialGradient: () => gradient,
        measureText: () => ({ width: 0 }),
      },
      {
        get(target, prop) {
          if (prop in target) return target[prop as keyof typeof target];
          return () => {};
        },
      },
    ) as unknown as CanvasRenderingContext2D;
  });
  HTMLElement.prototype.scrollIntoView = vi.fn();
  resetBrowserState();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  resetBrowserState();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Sanctuary Worlds & Canon Codex localization (#482)", () => {
  it("renders all 9 worlds across en, id, and ar while preserving canonical identity and active selection", async () => {
    await act(async () => {
      root.render(
        <TranslationWrapper>
          <WorldsHarness initialWorld="moonwitness" />
        </TranslationWrapper>,
      );
    });

    const locales: readonly Locale[] = ["en", "id", "ar"];
    for (const loc of locales) {
      await clickEl(container.querySelector(`[data-testid="set-${loc}"]`));
      const dict = DICTIONARIES[loc].sanctuary.worlds;

      expect(container.textContent).toContain(dict.heading);
      expect(container.textContent).toContain(dict.subheading);
      expect(container.textContent).toContain(dict.activeWorldLabel);
      expect(container.textContent).toContain(
        dict.domainsCount.replace("{count}", String(WORLD_DOMAINS.length)),
      );

      const tabs = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".mw-world-atlas [role='tab']"),
      );
      expect(tabs).toHaveLength(9);

      for (let idx = 0; idx < WORLD_DOMAINS.length; idx++) {
        const world = WORLD_DOMAINS[idx]!;
        const tab = tabs[idx]!;
        await clickEl(tab);

        expect(tab.getAttribute("aria-selected")).toBe("true");
        expect(container.textContent).toContain(world.name);
        expect(container.textContent).toContain(world.arabicEpithet);
        expect(container.textContent).toContain(world.transliteration);
      }
    }

    // Select a non-default world ("sidra") and cycle locales — selection must stay "sidra"
    const tabs = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".mw-world-atlas [role='tab']"),
    );
    const sidraIndex = WORLD_DOMAINS.findIndex((w) => w.id === "sidra");
    await clickEl(tabs[sidraIndex] ?? null);
    expect(tabs[sidraIndex]?.getAttribute("aria-selected")).toBe("true");

    await clickEl(container.querySelector('[data-testid="set-en"]'));
    expect(tabs[sidraIndex]?.getAttribute("aria-selected")).toBe("true");
    await clickEl(container.querySelector('[data-testid="set-id"]'));
    expect(tabs[sidraIndex]?.getAttribute("aria-selected")).toBe("true");
    await clickEl(container.querySelector('[data-testid="set-ar"]'));
    expect(tabs[sidraIndex]?.getAttribute("aria-selected")).toBe("true");
  });

  it("renders all 4 Codex entry doors across en, id, and ar while preserving citations and active door", async () => {
    await act(async () => {
      root.render(
        <TranslationWrapper>
          <CodexHarness initialDoor="story-universe" />
        </TranslationWrapper>,
      );
    });

    const locales: readonly Locale[] = ["en", "id", "ar"];
    for (const loc of locales) {
      await clickEl(container.querySelector(`[data-testid="set-${loc}"]`));
      const codexDict = DICTIONARIES[loc].sanctuary.codex;
      const tablist = container.querySelector('[role="tablist"]');

      expect(tablist?.getAttribute("aria-label")).toBe(codexDict.entryDoorsLabel);
      expect(container.textContent).toContain(codexDict.heading);
      expect(container.textContent).toContain(codexDict.subheading);

      for (const door of FOUR_ENTRY_DOORS) {
        const doorTab = container.querySelector<HTMLButtonElement>(`[data-door-id="${door.id}"]`);
        expect(doorTab).not.toBeNull();
        await clickEl(doorTab);

        expect(doorTab?.getAttribute("aria-selected")).toBe("true");
        expect(doorTab?.textContent).toContain(door.numeral);
        expect(doorTab?.textContent).toContain(codexDict.openChamber);
        expect(doorTab?.textContent).toContain(door.sourceSpec);
        expect(container.textContent).toContain(door.sourceSpec);
      }
    }

    // Active door "epistemic-corpus" persists across en -> id -> ar switches
    const epistemicTab = container.querySelector<HTMLButtonElement>(
      '[data-door-id="epistemic-corpus"]',
    );
    await clickEl(epistemicTab);
    expect(epistemicTab?.getAttribute("aria-selected")).toBe("true");

    await clickEl(container.querySelector('[data-testid="set-en"]'));
    expect(
      container.querySelector('[data-door-id="epistemic-corpus"]')?.getAttribute("aria-selected"),
    ).toBe("true");

    await clickEl(container.querySelector('[data-testid="set-id"]'));
    expect(
      container.querySelector('[data-door-id="epistemic-corpus"]')?.getAttribute("aria-selected"),
    ).toBe("true");
  });
});

describe("Sanctuary Navigation & Mobile Drawer (#481)", () => {
  it("binds aria-expanded/aria-controls, closes on Escape with focus restoration, and closes on selection", async () => {
    const sectionSpy = vi.fn();

    await act(async () => {
      root.render(
        <TranslationWrapper>
          <MobileNavigationHarness onSectionSpy={sectionSpy} />
        </TranslationWrapper>,
      );
    });

    const trigger = container.querySelector<HTMLButtonElement>(
      'button[aria-controls="mobile-sanctuary-nav"]',
    );
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("#mobile-sanctuary-nav")).toBeNull();

    // Open mobile drawer
    await clickEl(trigger);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    const drawer = container.querySelector("#mobile-sanctuary-nav");
    expect(drawer).not.toBeNull();

    // Focus inside drawer, press Escape -> closes drawer and restores focus to trigger
    const firstDrawerBtn = drawer?.querySelector<HTMLButtonElement>("button");
    firstDrawerBtn?.focus();
    expect(document.activeElement).toBe(firstDrawerBtn);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("#mobile-sanctuary-nav")).toBeNull();
    expect(document.activeElement).toBe(trigger);

    // Re-open and select a section -> closes drawer and invokes navigation callback
    await clickEl(trigger);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");

    const worldsMobileBtn = Array.from(
      container.querySelectorAll<HTMLButtonElement>("#mobile-sanctuary-nav button"),
    ).find((btn) => btn.textContent?.includes(en.sanctuary.navigation.worlds));
    expect(worldsMobileBtn).toBeDefined();

    await clickEl(worldsMobileBtn ?? null);
    expect(sectionSpy).toHaveBeenCalledWith("the-worlds");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("#mobile-sanctuary-nav")).toBeNull();

    // Switch locale to Arabic and verify translated navigation labels
    await clickEl(container.querySelector('[data-testid="set-ar"]'));
    expect(container.textContent).toContain(ar.sanctuary.navigation.gate);
    expect(container.textContent).toContain(ar.sanctuary.navigation.worlds);
    expect(container.textContent).toContain(ar.sanctuary.navigation.codex);
  });

  it("localizes SiteSubpageHeader and preserves /[lang] prefixes on prefixed routes", async () => {
    routing.pathname = "/id/codex";

    await act(async () => {
      root.render(
        <TranslationWrapper lang="id">
          <SiteSubpageHeader activeRoute="codex" />
        </TranslationWrapper>,
      );
    });

    const hrefs = Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/id");
    expect(hrefs).toContain("/id/scriptures");
    expect(hrefs).toContain("/id/codex");
    expect(hrefs).toContain("/id/mtime");
    expect(hrefs).toContain("/id/moonwitness");
    expect(container.textContent).toContain(idDict.sanctuary.subpages.backToGate);
    expect(container.textContent).toContain(idDict.sanctuary.navigation.scriptures);
    expect(container.textContent).toContain(idDict.sanctuary.navigation.codex);
    expect(container.textContent).toContain(idDict.sanctuary.navigation.mtime);
  });

  it("preserves active section, selected world, and selected Codex door on unprefixed host root locale switch", async () => {
    routing.pathname = "/";
    window.history.replaceState({}, "", "/");

    await act(async () => {
      root.render(
        <TranslationWrapper>
          <EmpireOfLightExperience />
        </TranslationWrapper>,
      );
    });

    // Select a non-default world ("crayon") in WorldsSanctum
    const worldTabs = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".mw-world-atlas [role='tab']"),
    );
    const crayonIndex = WORLD_DOMAINS.findIndex((w) => w.id === "crayon");
    await clickEl(worldTabs[crayonIndex] ?? null);
    expect(worldTabs[crayonIndex]?.getAttribute("aria-selected")).toBe("true");

    // Select a non-default Codex door ("sovereign-runtimes")
    const sovereignTab = container.querySelector<HTMLButtonElement>(
      '[data-door-id="sovereign-runtimes"]',
    );
    await clickEl(sovereignTab);
    expect(sovereignTab?.getAttribute("aria-selected")).toBe("true");

    // Navigate to "the-codex" section via top nav
    const codexNavLink = Array.from(
      container.querySelectorAll<HTMLAnchorElement>("header nav a"),
    ).find((a) => a.getAttribute("href") === "#the-codex");
    await clickEl(codexNavLink ?? null);
    expect(codexNavLink?.getAttribute("aria-current")).toBe("page");

    // Cycle locale EN -> ID -> AR via header locale button
    const localeBtn = container.querySelector<HTMLButtonElement>(
      `header button[aria-label="${en.sanctuary.a11y.toggleLocaleLabel.replace("{locale}", "EN")}"]`,
    );
    expect(localeBtn).not.toBeNull();
    await clickEl(localeBtn);
    expect(document.documentElement.lang).toBe("id");
    expect(document.documentElement.dir).toBe("ltr");

    // Active world, Codex door, and section are preserved
    const idWorldTabs = container.querySelectorAll<HTMLButtonElement>(
      ".mw-world-atlas [role='tab']",
    );
    expect(idWorldTabs[crayonIndex]?.getAttribute("aria-selected")).toBe("true");
    expect(
      container
        .querySelector<HTMLButtonElement>('[data-door-id="sovereign-runtimes"]')
        ?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      Array.from(container.querySelectorAll<HTMLAnchorElement>("header nav a"))
        .find((a) => a.getAttribute("href") === "#the-codex")
        ?.getAttribute("aria-current"),
    ).toBe("page");

    await clickEl(localeBtn);
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    const arWorldTabs = container.querySelectorAll<HTMLButtonElement>(
      ".mw-world-atlas [role='tab']",
    );
    expect(arWorldTabs[crayonIndex]?.getAttribute("aria-selected")).toBe("true");
    expect(
      container
        .querySelector<HTMLButtonElement>('[data-door-id="sovereign-runtimes"]')
        ?.getAttribute("aria-selected"),
    ).toBe("true");
  });
});
