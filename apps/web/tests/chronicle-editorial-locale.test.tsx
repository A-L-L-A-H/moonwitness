// @vitest-environment jsdom
import React, { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/configs/i18n";
import enDict from "@/data/dictionaries/en.json";
import idDict from "@/data/dictionaries/id.json";
import arDict from "@/data/dictionaries/ar.json";
import { TranslationWrapper } from "@/hocs/TranslationWrapper";
import { Signals } from "@/components/landing/signals";
import { Transmission } from "@/components/landing/transmission";
import { Storytelling } from "@/components/landing/storytelling";
import { LandingStoryStrip } from "@/components/landing/story-strip";

const routing = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, className }: Record<string, unknown>) =>
    React.createElement("img", {
      src: typeof src === "string" ? src : "/art/mock.webp",
      alt: typeof alt === "string" ? alt : "",
      className: typeof className === "string" ? className : undefined,
    }),
}));

const DICTIONARIES = {
  en: enDict,
  id: idDict,
  ar: arDict,
} as const;

const ENGLISH_LEAK_STRINGS = [
  enDict.chronicle.landing.storyStrip.ariaLabel,
  enDict.chronicle.landing.storyStrip.placesTitle,
  enDict.chronicle.landing.signals.badge,
  enDict.chronicle.landing.signals.sticker,
  enDict.chronicle.landing.signals.storyCardTitle,
  enDict.chronicle.landing.signals.storyCardCta,
  enDict.chronicle.landing.signals.collabCardTitle,
  enDict.chronicle.landing.signals.portalCardTitle,
  enDict.chronicle.landing.transmission.eyebrow,
  enDict.chronicle.landing.transmission.figcaption,
  enDict.chronicle.landing.transmission.narrativeTag,
  enDict.chronicle.landing.transmission.readMore,
  enDict.chronicle.landing.storytelling.eyebrow,
  enDict.chronicle.landing.storytelling.title,
  enDict.chronicle.landing.storytelling.subtitle,
  "STORYWORLD",
  "COLLAB_WALL",
  "SEALED",
  "TAG: #ROOFTOP",
  "STORYWORLD ARCHIVE",
  "Character dialogue, not a real account",
  "Story chapters",
  "// skyline // 3am frequency",
] as const;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  routing.pathname = "/";
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
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

async function renderEditorialSections(locale: Locale, pathname = "/") {
  routing.pathname = pathname;
  await act(async () => {
    root.render(
      <TranslationWrapper lang={locale}>
        <div>
          <LandingStoryStrip />
          <Transmission />
          <Storytelling />
          <Signals />
        </div>
      </TranslationWrapper>,
    );
  });
}

describe("Chronicle landing editorial sections localization (en, id, ar)", () => {
  it.each<{ locale: Locale; dir: "ltr" | "rtl"; filmStripLabel: string; quoteFooter: string }>([
    {
      locale: "en",
      dir: "ltr",
      filmStripLabel: "Story chapters",
      quoteFooter: "Character dialogue, not a real account",
    },
    {
      locale: "id",
      dir: "ltr",
      filmStripLabel: "Bab kisah",
      quoteFooter: "Dialog tokoh fiksi, bukan kisah nyata",
    },
    {
      locale: "ar",
      dir: "rtl",
      filmStripLabel: "فصول القصص",
      quoteFooter: "حوار شخصية روائية، وليس رواية واقعية",
    },
  ])(
    "renders localized story-strip, signals, transmission, and storytelling for '$locale'",
    async ({ locale, dir, filmStripLabel, quoteFooter }) => {
      await renderEditorialSections(locale);
      const dict = DICTIONARIES[locale].chronicle.landing;
      const text = container.textContent ?? "";

      const sections = Array.from(container.querySelectorAll("section"));
      expect(sections).toHaveLength(4);
      for (const section of sections) {
        expect(section.getAttribute("dir")).toBe(dir);
      }

      // story-strip
      const stripSection = container.querySelector(
        `section[aria-label="${dict.storyStrip.ariaLabel}"]`,
      );
      expect(stripSection).not.toBeNull();
      expect(text).toContain(dict.storyStrip.peopleLabel);
      expect(text).toContain(dict.storyStrip.placesLabel);
      expect(text).toContain(dict.storyStrip.placesTitle);
      expect(text).toContain(dict.storyStrip.storiesLabel);
      expect(text).toContain(dict.storyStrip.worldsLabel);

      // signals
      const signalsSection = container.querySelector("section#signals");
      expect(signalsSection).not.toBeNull();
      expect(text).toContain(dict.signals.badge);
      expect(text).toContain(dict.signals.titlePrefix);
      expect(text).toContain(dict.signals.titleAccent);
      expect(text).toContain(dict.signals.sticker);
      expect(text).toContain(dict.signals.storyCardLabel);
      expect(text).toContain(dict.signals.storyCardTitle);
      expect(text).toContain(dict.signals.storyCardDesc);
      expect(text).toContain(dict.signals.storyCardCta);
      expect(text).toContain(dict.signals.collabCardLabel);
      expect(text).toContain(dict.signals.collabCardTitle);
      expect(text).toContain(dict.signals.collabCardCta);
      expect(text).toContain(dict.signals.portalCardLabel);
      expect(text).toContain(dict.signals.portalCardTitle);
      expect(text).toContain(dict.signals.portalCardCta);

      // transmission
      const transmissionSection = container.querySelector("section#transmission");
      expect(transmissionSection).not.toBeNull();
      expect(text).toContain(dict.transmission.eyebrow);
      expect(text).toContain(dict.transmission.titlePrefix);
      expect(text).toContain(dict.transmission.titleAccent);
      expect(text).toContain(dict.transmission.badge);
      expect(text).toContain(dict.transmission.tapeLabel);
      expect(text).toContain(dict.transmission.figcaption);
      expect(text).toContain(dict.transmission.narrativeTag);
      expect(text).toContain(dict.transmission.body);
      expect(text).toContain(dict.transmission.quote);
      expect(text).toContain(dict.transmission.readMore);
      expect(text).toContain(quoteFooter);

      // storytelling
      const storytellingSection = container.querySelector("section#storytelling");
      expect(storytellingSection).not.toBeNull();
      expect(text).toContain(dict.storytelling.eyebrow);
      expect(text).toContain(dict.storytelling.title);
      expect(text).toContain(dict.storytelling.subtitle);
      expect(text).toContain(dict.storytelling.peopleExcerpt);
      expect(text).toContain(dict.storytelling.placesExcerpt);
      expect(text).toContain(dict.storytelling.storiesExcerpt);
      expect(text).toContain(dict.storytelling.worldsExcerpt);
      expect(
        container.querySelector(`[role="region"][aria-label="${filmStripLabel}"]`),
      ).not.toBeNull();

      // non-empty localized image alt attributes in signals and transmission
      const alts = Array.from(container.querySelectorAll("img"))
        .map((img) => img.getAttribute("alt") ?? "")
        .filter((alt) => alt.length > 0);
      expect(alts.length).toBe(4);
      if (locale === "id") {
        for (const alt of alts) {
          expect(alt).not.toContain("Illustrated tunnel");
          expect(alt).not.toContain("Three friends");
          expect(alt).not.toContain("A hooded witness");
          expect(alt).not.toContain("fog rolling");
        }
      } else if (locale === "ar") {
        for (const alt of alts) {
          expect(/[\u0600-\u06FF]/.test(alt)).toBe(true);
        }
      }

      if (locale !== "en") {
        const serialized = container.innerHTML;
        for (const leak of ENGLISH_LEAK_STRINGS) {
          expect(serialized).not.toContain(leak);
        }
      }
    },
  );

  it("preserves artwork paths, section anchors, and /dock prefixing only when on /[lang]", async () => {
    await renderEditorialSections("en", "/");
    const unprefixedDockLinks = Array.from(container.querySelectorAll('a[href$="/dock"]'));
    expect(unprefixedDockLinks).toHaveLength(4);
    for (const link of unprefixedDockLinks) {
      expect(link.getAttribute("href")).toBe("/dock");
    }

    await renderEditorialSections("id", "/id");
    const prefixedIdLinks = Array.from(container.querySelectorAll('a[href="/id/dock"]'));
    expect(prefixedIdLinks).toHaveLength(4);

    await renderEditorialSections("ar", "/ar/chronicle");
    const prefixedArLinks = Array.from(container.querySelectorAll('a[href="/ar/dock"]'));
    expect(prefixedArLinks).toHaveLength(4);

    // story-strip anchors and storytelling chapter anchors preserved
    const stripHrefs = Array.from(
      container.querySelectorAll('section[aria-label] a[href="#storytelling"]'),
    );
    expect(stripHrefs).toHaveLength(4);
    for (const storyId of ["s1", "s2", "s3", "s4"]) {
      expect(container.querySelector(`#story-${storyId}`)).not.toBeNull();
    }

    // artwork paths preserved
    const srcs = Array.from(container.querySelectorAll("img")).map((img) =>
      img.getAttribute("src"),
    );
    expect(srcs.every((src) => typeof src === "string" && src.startsWith("/art/"))).toBe(true);
  });
});
