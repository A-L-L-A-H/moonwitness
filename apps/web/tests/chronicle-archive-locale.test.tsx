// @vitest-environment jsdom
import React, { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TimelineEvent } from "@moonwitness/contracts/types";
import type { Locale } from "@/configs/i18n";
import themeConfig from "@/configs/themeConfig";
import ar from "@/data/dictionaries/ar.json";
import en from "@/data/dictionaries/en.json";
import id from "@/data/dictionaries/id.json";
import { TranslationWrapper, useTranslation } from "@/hocs/TranslationWrapper";
import { SanctuaryLocaleProvider } from "@/lib/sanctuary-locale";
import { witnesses } from "@/lib/data";
import { Shadow } from "@/components/landing/shadow";
import { Crew } from "@/components/landing/crew";
import { Archive } from "@/components/landing/archive";
import { About } from "@/components/landing/about";
import { LandingFooter } from "@/components/landing/footer";

const routing = vi.hoisted(() => ({
  pathname: "/",
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => ({ push: routing.push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: Record<string, unknown>) =>
    React.createElement("img", {
      src: typeof src === "string" ? src : "/art/mock.webp",
      alt: typeof alt === "string" ? alt : "",
      className: props.className as string | undefined,
    }),
}));

const DICTIONARIES = { en, id, ar } as const;

const FIRST_EVENT: TimelineEvent = {
  id: "evt-harbor-001",
  kind: "SIGNAL",
  date: "2026-11-19",
  era: "origins",
  title: "Harbor Relay Frequency 1420.4 MHz",
  excerpt: "Original canonical excerpt from harbor hydrophone array.",
  body: "Unmodified canonical body text.",
  location: "Tanjung Priok",
  tags: ["harbor", "1420mhz"],
  sources: 3,
  notes: 2,
  image: "fog-voices",
  related: [],
};

const SECOND_EVENT: TimelineEvent = {
  id: "evt-rooftop-002",
  kind: "STORY",
  date: "2026-11-18",
  era: "neon",
  title: "Bandung Rooftop Beacon Log",
  excerpt: "Canonical rooftop optical flare observation.",
  body: "Second canonical body.",
  location: "Bandung",
  tags: ["rooftop"],
  sources: 2,
  notes: 1,
  image: "crew-rooftop",
  related: [],
};

const CANONICAL_EVENTS: TimelineEvent[] = [FIRST_EVENT, SECOND_EVENT];

let container: HTMLDivElement;
let root: Root;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function LocaleControls() {
  const { locale, setLocale } = useTranslation();
  return (
    <div data-testid="locale-controls" data-locale={locale}>
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

function LandingHarness() {
  return (
    <>
      <LocaleControls />
      <Shadow />
      <Crew />
      <Archive />
      <About />
      <LandingFooter />
    </>
  );
}

function installEnvironmentMocks() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("React", React);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
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
      disconnect() {}
      unobserve() {}
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  Element.prototype.scrollBy = vi.fn();
  Element.prototype.scrollTo = vi.fn();
}

function stubTimelineFetch(events: TimelineEvent[]) {
  return vi.fn(async () =>
    Response.json({
      data: events,
      total: events.length,
    }),
  );
}

async function flushQueries() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

beforeEach(() => {
  installEnvironmentMocks();
  routing.pathname = "/";
  routing.push.mockReset();
  localStorage.clear();
  document.cookie = `${themeConfig.localeCookieName}=; path=/; max-age=0; SameSite=Lax`;
  document.documentElement.lang = "";
  document.documentElement.dir = "";
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

describe("Chronicle landing & archive locale coverage (en, id, ar)", () => {
  it.each(["en", "id", "ar"] as const satisfies readonly Locale[])(
    "renders all 5 sections in '%s' while keeping canonical timeline & witness records untouched",
    async (locale) => {
      const dict = DICTIONARIES[locale].chronicle.landing;
      const fetchMock = stubTimelineFetch(CANONICAL_EVENTS);
      vi.stubGlobal("fetch", fetchMock);
      routing.pathname = locale === "en" ? "/" : `/${locale}`;

      const queryClient = createQueryClient();

      await act(async () => {
        root.render(
          <QueryClientProvider client={queryClient}>
            <TranslationWrapper lang={locale}>
              <LandingHarness />
            </TranslationWrapper>
          </QueryClientProvider>,
        );
      });
      await flushQueries();

      const shadowEl = container.querySelector("#shadow");
      const crewEl = container.querySelector("#crew");
      const archiveEl = container.querySelector("#archive");
      const aboutEl = container.querySelector("#about");
      const footerEl = container.querySelector("footer");

      expect(shadowEl).not.toBeNull();
      expect(crewEl).not.toBeNull();
      expect(archiveEl).not.toBeNull();
      expect(aboutEl).not.toBeNull();
      expect(footerEl).not.toBeNull();

      // Shadow section localized UI
      expect(shadowEl?.textContent).toContain(dict.shadow.restrictedTag);
      expect(shadowEl?.querySelector("h2")?.textContent).toBe(dict.shadow.title);
      expect(shadowEl?.textContent).toContain(dict.shadow.description);
      expect(shadowEl?.textContent).toContain(dict.shadow.liveSignalLabel);
      expect(shadowEl?.textContent).toContain(dict.shadow.cta);

      // Canonical server timeline record in Shadow remains untouched
      expect(shadowEl?.textContent).toContain(FIRST_EVENT.title);
      expect(shadowEl?.textContent).toContain(`${FIRST_EVENT.kind} // ${FIRST_EVENT.date}`);

      // Crew section localized UI + untouched witness records
      const firstWitness = witnesses[0];
      if (!firstWitness) throw new Error("Expected at least one witness fixture");
      expect(crewEl?.textContent).toContain(dict.crew.eyebrow);
      expect(crewEl?.textContent).toContain(dict.crew.titlePrefix);
      expect(crewEl?.textContent).toContain(dict.crew.titleAccent);
      expect(crewEl?.textContent).toContain(dict.crew.subtitle);
      expect(crewEl?.textContent).toContain(dict.crew.collageLabel);
      expect(crewEl?.textContent).toContain(dict.crew.sticker);
      expect(crewEl?.textContent).toContain(dict.crew.cta);
      expect(crewEl?.querySelector(`img[alt="${dict.crew.collageLabel}"]`)).not.toBeNull();
      expect(crewEl?.textContent).toContain(firstWitness.name);
      expect(crewEl?.textContent).toContain(firstWitness.place);
      expect(crewEl?.textContent).toContain(firstWitness.quote);

      // Archive section localized UI + ARIA labels
      expect(archiveEl?.textContent).toContain(dict.archive.eyebrow);
      expect(archiveEl?.querySelector("h2")?.textContent).toBe(dict.archive.title);
      expect(archiveEl?.textContent).toContain(dict.archive.subtitle);
      expect(archiveEl?.textContent).toContain(dict.archive.openDock);
      expect(archiveEl?.querySelector(`[aria-label="${dict.archive.title}"]`)).not.toBeNull();
      expect(
        archiveEl?.querySelector(`button[aria-label="${dict.archive.previous}"]`),
      ).not.toBeNull();
      expect(archiveEl?.querySelector(`button[aria-label="${dict.archive.next}"]`)).not.toBeNull();

      // Canonical timeline event cards in Archive remain untouched
      for (const ev of CANONICAL_EVENTS) {
        expect(archiveEl?.textContent).toContain(ev.title);
        expect(archiveEl?.textContent).toContain(ev.kind);
        expect(archiveEl?.textContent).toContain(ev.date);
      }

      // About section localized UI
      expect(aboutEl?.querySelector("h2")?.textContent).toBe(dict.about.title);
      expect(aboutEl?.textContent).toContain(dict.about.subtitle);
      expect(aboutEl?.textContent).toContain(dict.about.joinCta);
      expect(aboutEl?.textContent).toContain(dict.about.missionControlCta);

      // Footer localized UI + ARIA nav label + localized links on prefixed routes
      expect(footerEl?.textContent).toContain(dict.footer.tagline);
      expect(footerEl?.textContent).toContain(dict.footer.sanctuary);
      expect(footerEl?.textContent).toContain(dict.footer.archive);
      expect(footerEl?.textContent).toContain(dict.footer.shadow);
      expect(footerEl?.textContent).toContain(dict.footer.missionControl);
      expect(footerEl?.textContent).toContain(dict.footer.backToTop);

      const expectedDockHref = locale === "en" ? "/dock" : `/${locale}/dock`;
      expect(archiveEl?.querySelector(`a[href="${expectedDockHref}"]`)).not.toBeNull();
      expect(footerEl?.querySelector(`a[href="${expectedDockHref}"]`)).not.toBeNull();
      expect(footerEl?.querySelector("nav")?.getAttribute("aria-label")).toBeTruthy();

      queryClient.clear();
    },
  );

  it("switches UI chrome cleanly on live locale changes without mutating fetched timeline records", async () => {
    vi.stubGlobal("fetch", stubTimelineFetch(CANONICAL_EVENTS));
    const queryClient = createQueryClient();

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <TranslationWrapper lang="en">
            <LandingHarness />
          </TranslationWrapper>
        </QueryClientProvider>,
      );
    });
    await flushQueries();

    expect(container.querySelector("#shadow h2")?.textContent).toBe(
      en.chronicle.landing.shadow.title,
    );
    expect(container.querySelector("#archive h2")?.textContent).toBe(
      en.chronicle.landing.archive.title,
    );

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="set-id"]')?.click();
    });

    expect(container.querySelector("#shadow h2")?.textContent).toBe(
      id.chronicle.landing.shadow.title,
    );
    expect(container.querySelector("#crew h2")?.textContent).toContain(
      id.chronicle.landing.crew.titleAccent,
    );
    expect(container.querySelector("#archive h2")?.textContent).toBe(
      id.chronicle.landing.archive.title,
    );
    expect(container.querySelector("#about h2")?.textContent).toBe(
      id.chronicle.landing.about.title,
    );
    expect(container.querySelector("footer")?.textContent).toContain(
      id.chronicle.landing.footer.backToTop,
    );
    expect(container.textContent).toContain("BUKTI #101");
    expect(container.textContent).toContain(FIRST_EVENT.title);
    expect(container.textContent).toContain(SECOND_EVENT.title);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="set-ar"]')?.click();
    });

    expect(document.documentElement.dir).toBe("rtl");
    expect(container.querySelector("#shadow h2")?.textContent).toBe(
      ar.chronicle.landing.shadow.title,
    );
    expect(container.querySelector("#archive h2")?.textContent).toBe(
      ar.chronicle.landing.archive.title,
    );
    expect(container.querySelector("#about h2")?.textContent).toBe(
      ar.chronicle.landing.about.title,
    );
    expect(container.querySelector("footer")?.textContent).toContain(
      ar.chronicle.landing.footer.shadow,
    );
    expect(container.textContent).toContain("دليل #101");
    expect(container.textContent).toContain(FIRST_EVENT.title);
    expect(container.textContent).toContain(SECOND_EVENT.title);

    queryClient.clear();
  });

  it("localizes loading, error, retry, retrying, and empty states while preserving API retry behavior", async () => {
    let resolveShadowPending!: (res: Response) => void;
    let resolveArchivePending!: (res: Response) => void;
    let resolveShadowRetry!: (res: Response) => void;
    let resolveArchiveRetry!: (res: Response) => void;

    const shadowPending = new Promise<Response>((resolve) => {
      resolveShadowPending = resolve;
    });
    const archivePending = new Promise<Response>((resolve) => {
      resolveArchivePending = resolve;
    });
    const shadowRetry = new Promise<Response>((resolve) => {
      resolveShadowRetry = resolve;
    });
    const archiveRetry = new Promise<Response>((resolve) => {
      resolveArchiveRetry = resolve;
    });

    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(shadowPending)
      .mockReturnValueOnce(archivePending)
      .mockReturnValueOnce(shadowRetry)
      .mockReturnValueOnce(archiveRetry);

    vi.stubGlobal("fetch", fetchMock);
    const queryClient = createQueryClient();

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <TranslationWrapper lang="id">
            <Shadow />
            <Archive />
          </TranslationWrapper>
        </QueryClientProvider>,
      );
    });

    // Pending state in Indonesian
    expect(container.querySelector("#shadow")?.textContent).toContain(
      id.chronicle.landing.archive.loading,
    );
    expect(container.querySelector("#archive")?.textContent).toContain(
      id.chronicle.landing.archive.loading,
    );

    // Resolve initial requests with 503 error
    await act(async () => {
      resolveShadowPending(Response.json({ error: "Upstream down" }, { status: 503 }));
      resolveArchivePending(Response.json({ error: "Upstream down" }, { status: 503 }));
    });
    await flushQueries();

    // Error state in Indonesian
    expect(container.querySelector("#shadow")?.textContent).toContain(
      id.chronicle.landing.shadow.unavailable,
    );
    expect(container.querySelector("#archive")?.textContent).toContain(
      id.chronicle.landing.archive.unavailable,
    );

    const retryButtons = Array.from(container.querySelectorAll("button")).filter((btn) =>
      btn.textContent?.includes(id.chronicle.landing.archive.retry),
    );
    expect(retryButtons).toHaveLength(2);

    // Trigger retry on both Shadow and Archive and verify retrying label
    await act(async () => {
      for (const btn of retryButtons) btn.click();
    });
    await flushQueries();

    expect(container.querySelector("#shadow")?.textContent).toContain(
      id.chronicle.landing.archive.retrying,
    );
    expect(container.querySelector("#archive")?.textContent).toContain(
      id.chronicle.landing.archive.retrying,
    );

    // Resolve retry responses with canonical events
    await act(async () => {
      resolveShadowRetry(Response.json({ data: [FIRST_EVENT], total: 1 }));
      resolveArchiveRetry(Response.json({ data: CANONICAL_EVENTS, total: 2 }));
    });
    await flushQueries();

    // Canonical records loaded after retry without translation
    expect(container.querySelector("#shadow")?.textContent).toContain(FIRST_EVENT.title);
    expect(container.querySelector("#archive")?.textContent).toContain(SECOND_EVENT.title);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    // Empty state in Arabic
    const emptyClient = createQueryClient();
    vi.stubGlobal("fetch", stubTimelineFetch([]));

    await act(async () => {
      root.render(
        <QueryClientProvider key="empty" client={emptyClient}>
          <TranslationWrapper lang="ar">
            <Shadow />
            <Archive />
          </TranslationWrapper>
        </QueryClientProvider>,
      );
    });
    await flushQueries();

    expect(container.querySelector("#shadow")?.textContent).toContain(
      ar.chronicle.landing.archive.empty,
    );
    expect(container.querySelector("#archive")?.textContent).toContain(
      ar.chronicle.landing.archive.empty,
    );

    queryClient.clear();
    emptyClient.clear();
  });

  it("stays compatible when wrapped inside SanctuaryLocaleProvider", async () => {
    vi.stubGlobal("fetch", stubTimelineFetch(CANONICAL_EVENTS));
    const queryClient = createQueryClient();

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <SanctuaryLocaleProvider initialLocale="ar">
            <About />
            <LandingFooter />
          </SanctuaryLocaleProvider>
        </QueryClientProvider>,
      );
    });

    expect(container.querySelector("#about h2")?.textContent).toBe(
      ar.chronicle.landing.about.title,
    );
    expect(container.querySelector("footer")?.textContent).toContain(
      ar.chronicle.landing.footer.missionControl,
    );

    queryClient.clear();
  });
});
