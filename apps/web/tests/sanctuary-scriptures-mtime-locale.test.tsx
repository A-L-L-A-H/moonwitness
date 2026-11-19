// @vitest-environment jsdom
import React, { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TranslationWrapper, useTranslation } from "@/hocs/TranslationWrapper";
import { ScripturesStudio } from "@/components/scriptures-studio";
import { MTimeInteractiveEngine, MTimeObservatory } from "@/components/mtime-observatory";
import { MTimeLiveTelemetryPanel } from "@/components/mtime-live-telemetry";
import en from "@/data/dictionaries/en.json";
import idDict from "@/data/dictionaries/id.json";
import ar from "@/data/dictionaries/ar.json";
import type { Locale } from "@/configs/i18n";

vi.mock("next/navigation", () => ({
  usePathname: () => "/scriptures",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) =>
    React.createElement("a", { href, ...props }, children),
}));

const SOURCE_EXCERPTS = [
  {
    corpusCode: "SRC-TOR",
    corpusName: "TAURAT · WLC",
    language: "Hebrew",
    reference: "Gen 1:1",
    dir: "ltr" as const,
    originalText: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
    summary: "Opening witness of creation from Westminster Leningrad Codex.",
  },
  {
    corpusCode: "SRC-QUR",
    corpusName: "AL-QUR’ĀN · Uthmani",
    language: "Arabic",
    reference: "QS 2:256",
    dir: "rtl" as const,
    originalText: "لَا إِكْرَاهَ فِي الدِّينِ",
    summary: "Constitutional rule of zero compulsion in faith (QS 2:256).",
  },
] as const;

const SOURCE_HITS = [
  {
    corpusCode: "SRC-TOR",
    corpusLabel: "TAURAT (WLC)",
    reference: "Gen 1:1",
    bookOrSurah: "Genesis",
    chapterOrSurah: 1,
    verseOrAyah: 1,
    dir: "ltr" as const,
    language: "Hebrew",
    text: "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
  },
  {
    corpusCode: "SRC-QUR",
    corpusLabel: "AL-QUR’ĀN (Uthmani)",
    reference: "QS 2:256",
    bookOrSurah: "Al-Baqarah",
    chapterOrSurah: 2,
    verseOrAyah: 256,
    dir: "rtl" as const,
    language: "Arabic",
    text: "لَا إِكْرَاهَ فِي الدِّينِ قَد تَّبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ",
  },
] as const;

function LocaleSwitcherBar() {
  const { locale, setLocale } = useTranslation();
  return (
    <div data-testid="locale-bar">
      <span data-testid="active-locale">{locale}</span>
      {(["en", "id", "ar"] as const).map((target) => (
        <button
          key={target}
          type="button"
          data-testid={`switch-${target}`}
          onClick={() => setLocale(target)}
        >
          {target}
        </button>
      ))}
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;

async function switchLocale(next: Locale) {
  const btn = container.querySelector<HTMLButtonElement>(`[data-testid="switch-${next}"]`);
  if (!btn) throw new Error(`Missing locale button switch-${next}`);
  await act(async () => {
    btn.click();
  });
}

function createScripturesFetchMock(options?: { failScriptures?: boolean; emptyHits?: boolean }) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.startsWith("/api/scriptures")) {
      if (options?.failScriptures) {
        return new Response("Upstream unavailable", { status: 503 });
      }
      const parsed = new URL(url, "https://a-l-l-a-h.com");
      const q = parsed.searchParams.get("q") ?? "2:256";
      const corpus = parsed.searchParams.get("corpus") ?? "ALL";
      const hits = options?.emptyHits
        ? []
        : SOURCE_HITS.filter((h) => corpus === "ALL" || h.corpusCode === corpus);
      return Response.json({
        corpusStatus: "LIVE_INDEXED",
        corpusFilter: corpus,
        totalAyahs: 6236,
        totalSurahs: 114,
        corpusCounts: {
          taurat: 5853,
          zabur: 2527,
          injil: 3768,
          quran: 6236,
          totalVerses: 18384,
        },
        query: q,
        hits: [],
        unifiedHits: hits,
        crosswalk: {
          invariant: "REVEALED SOURCE CATEGORY ≠ EXTANT TEXTUAL WITNESS",
          note: "Neutral canonical crosswalk",
          passages: SOURCE_EXCERPTS,
        },
      });
    }
    if (url.startsWith("/api/v1/celestial/now")) {
      return Response.json({
        hijri: { year: 1447, month: 9, day: 15, monthName: "Ramadan" },
        lunar: { phaseName: "Waxing Crescent", illumination: 14.2, elongationDeg: 7.45 },
      });
    }
    if (url.startsWith("/api/v1/celestial/prayer-times")) {
      return Response.json({
        date: "2026-03-19",
        fajr: "04:41",
        sunrise: "05:56",
        dhuhr: "12:01",
        asr: "15:14",
        maghrib: "18:04",
        isha: "19:13",
        qibla_bearing: 295.15,
      });
    }
    if (url.startsWith("/api/v1/celestial/qibla")) {
      return Response.json({
        qibla_bearing_deg: 295.15,
        cardinal_direction: "WNW",
        distance_to_kabah_km: 7920.4,
      });
    }
    if (url.startsWith("/api/v1/observatory/summary")) {
      return Response.json({ feeds: 4, operations: 12 });
    }
    if (url.startsWith("/api/v1/celestial/hilal")) {
      return Response.json({
        altitude_deg: 4.12,
        elongation_deg: 7.45,
        crescent_width_arcmin: 0.35,
        mabims_criterion: { status: "MET", passed: true },
        overall_verdict: "MABIMS_PASS",
      });
    }
    return Response.json({ user: null });
  });
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
  localStorage.clear();
  document.cookie = "mw-locale=; path=/; max-age=0; SameSite=Lax";
  window.history.replaceState({}, "", "/scriptures");
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

describe("Sanctuary ScripturesStudio & Panels Localization + Source Immutability", () => {
  it("renders ScripturesStudio UI chrome in en, id, and ar while preserving source passages, directions, and active state", async () => {
    const fetchMock = createScripturesFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <LocaleSwitcherBar />
          <ScripturesStudio />
        </TranslationWrapper>,
      );
    });

    // Wait for initial fetch effects
    await act(async () => {
      await Promise.resolve();
    });

    // 1. EN UI verification
    const mainHeading = () => container.querySelector("h1")?.textContent ?? "";
    expect(mainHeading()).toBe(en.sanctuary.scriptures.heading);
    expect(container.textContent).toContain(en.sanctuary.scriptures.subheading);
    expect(container.textContent).toContain(en.sanctuary.scriptures.corporaLabel);
    expect(container.textContent).toContain(en.sanctuary.scriptures.compareMode);
    expect(container.textContent).toContain(en.sanctuary.scriptures.citationLabel);
    expect(container.textContent).toContain("SHARED MORAL ROOTS // FOUR-CORPUS CONCORDANCE");
    expect(container.textContent).toContain("STEWARDSHIP ACTION:");

    // Select a specific corpus tab, preset/search query, and concordance theme
    const torTab = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (btn) => btn.textContent?.includes("TAURAT · WLC"),
    );
    expect(torTab).toBeDefined();
    await act(async () => {
      torTab?.click();
    });

    const themeTab = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (btn) => btn.textContent?.includes("Care for the Vulnerable"),
    );
    expect(themeTab).toBeDefined();
    await act(async () => {
      themeTab?.click();
    });

    const searchInput = container.querySelector<HTMLInputElement>('input[type="search"]');
    expect(searchInput).not.toBeNull();
    expect(searchInput?.value).toBe("2:256");

    // Capture exact source passages & direction metadata before locale switches
    const hebrewExcerptBefore = container.querySelector(
      '[data-source-passage="SRC-TOR"]',
    )?.textContent;
    const hebrewDirBefore = container
      .querySelector('[data-source-passage="SRC-TOR"]')
      ?.getAttribute("dir");
    const arabicExcerptBefore = container.querySelector(
      '[data-source-passage="SRC-QUR"]',
    )?.textContent;
    const arabicDirBefore = container
      .querySelector('[data-source-passage="SRC-QUR"]')
      ?.getAttribute("dir");
    const torHitBefore = container.querySelector(
      '[data-source-passage="SRC-TOR:Gen 1:1"]',
    )?.textContent;
    const torHitLangBefore = container
      .querySelector('[data-source-passage="SRC-TOR:Gen 1:1"]')
      ?.getAttribute("lang");

    expect(hebrewExcerptBefore).toBe(SOURCE_EXCERPTS[0].originalText);
    expect(hebrewDirBefore).toBe("ltr");
    expect(arabicExcerptBefore).toBe(SOURCE_EXCERPTS[1].originalText);
    expect(arabicDirBefore).toBe("rtl");
    expect(torHitBefore).toBe(SOURCE_HITS[0].text);
    expect(torHitLangBefore).toBe("he");

    const fetchCountBeforeLocaleSwitch = fetchMock.mock.calls.filter(([u]) =>
      String(u).startsWith("/api/scriptures"),
    ).length;

    // 2. Switch to Indonesian (id)
    await switchLocale("id");
    expect(mainHeading()).toBe(idDict.sanctuary.scriptures.heading);
    expect(container.textContent).toContain(idDict.sanctuary.scriptures.subheading);
    expect(container.textContent).toContain(idDict.sanctuary.scriptures.corporaLabel);
    expect(container.textContent).toContain(idDict.sanctuary.scriptures.citationLabel);
    expect(container.textContent).toContain("AKAR MORAL BERSAMA // KONKORDANSI EMPAT KITAB");
    expect(container.textContent).toContain("AKSI AMANAH:");
    expect(container.querySelector("[dir]")?.getAttribute("dir")).toBe("ltr");

    // State preserved across locale change
    expect(torTab?.getAttribute("aria-selected")).toBe("true");
    expect(themeTab?.getAttribute("aria-selected")).toBe("true");
    expect(searchInput?.value).toBe("2:256");

    // 3. Switch to Arabic (ar)
    await switchLocale("ar");
    expect(mainHeading()).toBe(ar.sanctuary.scriptures.heading);
    expect(container.textContent).toContain(ar.sanctuary.scriptures.subheading);
    expect(container.textContent).toContain(ar.sanctuary.scriptures.corporaLabel);
    expect(container.textContent).toContain(ar.sanctuary.scriptures.citationLabel);
    expect(container.textContent).toContain(
      "الجذور الأخلاقية المشتركة // التوافق بين الكتب الأربعة",
    );
    expect(container.textContent).toContain("الممارسة المسؤولة:");
    expect(container.querySelector("main")?.parentElement?.getAttribute("dir")).toBe("rtl");

    // Active state still preserved under Arabic RTL
    expect(torTab?.getAttribute("aria-selected")).toBe("true");
    expect(themeTab?.getAttribute("aria-selected")).toBe("true");
    expect(searchInput?.value).toBe("2:256");

    // Source passages & direction metadata MUST remain strictly immutable and NOT re-fetched
    expect(container.querySelector('[data-source-passage="SRC-TOR"]')?.textContent).toBe(
      hebrewExcerptBefore,
    );
    expect(container.querySelector('[data-source-passage="SRC-TOR"]')?.getAttribute("dir")).toBe(
      "ltr",
    );
    expect(container.querySelector('[data-source-passage="SRC-QUR"]')?.textContent).toBe(
      arabicExcerptBefore,
    );
    expect(container.querySelector('[data-source-passage="SRC-QUR"]')?.getAttribute("dir")).toBe(
      "rtl",
    );
    expect(container.querySelector('[data-source-passage="SRC-TOR:Gen 1:1"]')?.textContent).toBe(
      torHitBefore,
    );
    expect(
      container.querySelector('[data-source-passage="SRC-TOR:Gen 1:1"]')?.getAttribute("lang"),
    ).toBe("he");

    // Citations & numeric counts are LTR-isolated inside RTL
    const ltrElements = Array.from(container.querySelectorAll('[data-ltr="true"]'));
    expect(ltrElements.length).toBeGreaterThan(0);
    for (const el of ltrElements) {
      expect(el.getAttribute("dir")).toBe("ltr");
    }

    const fetchCountAfterLocaleSwitch = fetchMock.mock.calls.filter(([u]) =>
      String(u).startsWith("/api/scriptures"),
    ).length;
    expect(fetchCountAfterLocaleSwitch).toBe(fetchCountBeforeLocaleSwitch);
  });

  it("renders localized error copy across en, id, and ar", async () => {
    vi.stubGlobal("fetch", createScripturesFetchMock({ failScriptures: true }));

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <LocaleSwitcherBar />
          <ScripturesStudio />
        </TranslationWrapper>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    const alertText = () => container.querySelector('[role="alert"]')?.textContent ?? "";
    expect(alertText()).toContain(en.errors.unexpected);

    await switchLocale("id");
    expect(alertText()).toContain(idDict.errors.unexpected);

    await switchLocale("ar");
    expect(alertText()).toContain(ar.errors.unexpected);
  });

  it("renders localized empty and loading copy across en, id, and ar", async () => {
    let resolvePending!: (res: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolvePending = resolve;
          }),
      ),
    );

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <LocaleSwitcherBar />
          <ScripturesStudio />
        </TranslationWrapper>,
      );
    });

    expect(container.textContent).toContain(en.common.loading);
    await switchLocale("id");
    expect(container.textContent).toContain(idDict.common.loading);
    await switchLocale("ar");
    expect(container.textContent).toContain(ar.common.loading);

    await act(async () => {
      resolvePending(
        Response.json({
          corpusStatus: "LIVE_INDEXED",
          totalAyahs: 6236,
          totalSurahs: 114,
          query: "2:256",
          hits: [],
          unifiedHits: [],
          crosswalk: {
            invariant: "REVEALED SOURCE CATEGORY ≠ EXTANT TEXTUAL WITNESS",
            note: "Neutral canonical crosswalk",
            passages: SOURCE_EXCERPTS,
          },
        }),
      );
      await Promise.resolve();
    });

    expect(container.textContent).toContain(ar.common.noRecords);
    await switchLocale("id");
    expect(container.textContent).toContain(idDict.common.noRecords);
    await switchLocale("en");
    expect(container.textContent).toContain(en.common.noRecords);
  });
});

describe("MTimeObservatory, Engine & Live Telemetry Localization + RTL LTR Telemetry Isolation", () => {
  it("localizes MTimeObservatory chrome across en, id, ar while keeping numeric telemetry, coordinates, units, and active selections immutable", async () => {
    vi.stubGlobal("fetch", createScripturesFetchMock());
    window.history.replaceState({}, "", "/mtime");

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <LocaleSwitcherBar />
          <MTimeObservatory />
        </TranslationWrapper>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Change date preset, site, profile, and basis before switching locales
    const ramadanPresetBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Ramadan 1447 Eve"),
    );
    expect(ramadanPresetBtn).toBeDefined();
    await act(async () => {
      ramadanPresetBtn?.click();
    });

    const makkahBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Makkah"),
    );
    expect(makkahBtn).toBeDefined();
    await act(async () => {
      makkahBtn?.click();
    });

    const diyanetBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("DIYANET_1978"),
    );
    expect(diyanetBtn).toBeDefined();
    await act(async () => {
      diyanetBtn?.click();
    });

    // Verify EN headings & telemetry values
    expect(container.querySelector("h1")?.textContent).toBe(en.sanctuary.mtime.heading);
    expect(container.textContent).toContain(en.sanctuary.mtime.subheading);
    expect(container.textContent).toContain(en.sanctuary.mtime.criteriaLabel);
    expect(container.textContent).toContain(en.sanctuary.mtime.azimuthLabel);
    expect(container.textContent).toContain(en.sanctuary.mtime.hijriDateLabel);
    expect(container.textContent).toContain("Fajr");

    const snapshot = {
      moonAge: container.querySelector('[data-testid="mtime-moon-age"]')?.textContent,
      illumination: container.querySelector('[data-testid="mtime-illumination"]')?.textContent,
      elongation: container.querySelector('[data-testid="mtime-elongation"]')?.textContent,
      altitude: container.querySelector('[data-testid="mtime-sunset-altitude"]')?.textContent,
      coords: container.querySelector('[data-testid="telemetry-coords"]')?.textContent,
      qibla: container.querySelector('[data-testid="telemetry-qibla"]')?.textContent,
      hijri: container.querySelector('[data-testid="telemetry-hijri"]')?.textContent,
      fajr: container.querySelector('[data-testid="prayer-time-fajr"]')?.textContent,
      hilalAlt: container.querySelector('[data-testid="telemetry-hilal-alt"]')?.textContent,
      hilalElong: container.querySelector('[data-testid="telemetry-hilal-elong"]')?.textContent,
      dateInput: container.querySelector<HTMLInputElement>("input[aria-label]")?.value,
    };

    expect(snapshot.dateInput).toBe("2026-02-17T11:00:00Z");
    expect(snapshot.qibla).toBe("295.15°");
    expect(snapshot.hijri).toBe("1447-09-15");
    expect(snapshot.fajr).toBe("04:41");

    // Switch to Indonesian (id)
    await switchLocale("id");
    expect(container.querySelector("h1")?.textContent).toBe(idDict.sanctuary.mtime.heading);
    expect(container.textContent).toContain(idDict.sanctuary.mtime.subheading);
    expect(container.textContent).toContain(idDict.sanctuary.mtime.criteriaLabel);
    expect(container.textContent).toContain(idDict.sanctuary.mtime.azimuthLabel);
    expect(container.textContent).toContain(idDict.sanctuary.mtime.hijriDateLabel);
    expect(container.textContent).toContain("Subuh");
    expect(container.textContent).toContain("MUAT KE EVALUATOR");

    // Switch to Arabic (ar)
    await switchLocale("ar");
    expect(container.querySelector("h1")?.textContent).toBe(ar.sanctuary.mtime.heading);
    expect(container.textContent).toContain(ar.sanctuary.mtime.subheading);
    expect(container.textContent).toContain(ar.sanctuary.mtime.criteriaLabel);
    expect(container.textContent).toContain(ar.sanctuary.mtime.azimuthLabel);
    expect(container.textContent).toContain(ar.sanctuary.mtime.hijriDateLabel);
    expect(container.textContent).toContain("الفجر");
    expect(container.textContent).toContain("تحميل في أداة التقييم");
    expect(container.querySelector("main")?.parentElement?.getAttribute("dir")).toBe("rtl");

    // Active controls preserved
    expect(makkahBtn?.getAttribute("aria-pressed")).toBe("true");
    expect(diyanetBtn?.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector<HTMLInputElement>("input[aria-label]")?.value).toBe(
      "2026-02-17T11:00:00Z",
    );

    // Exact numeric telemetry values & units preserved and isolated with dir="ltr" data-ltr="true"
    const telemetryIds = [
      "mtime-moon-age",
      "mtime-illumination",
      "mtime-elongation",
      "mtime-sunset-altitude",
      "telemetry-coords",
      "telemetry-qibla",
      "telemetry-hijri",
      "prayer-time-fajr",
      "telemetry-hilal-alt",
      "telemetry-hilal-elong",
    ] as const;

    for (const id of telemetryIds) {
      const el = container.querySelector(`[data-testid="${id}"]`);
      expect(el).not.toBeNull();
      expect(el?.getAttribute("dir")).toBe("ltr");
      expect(el?.getAttribute("data-ltr")).toBe("true");
    }

    expect(container.querySelector('[data-testid="mtime-moon-age"]')?.textContent).toBe(
      snapshot.moonAge,
    );
    expect(container.querySelector('[data-testid="mtime-illumination"]')?.textContent).toBe(
      snapshot.illumination,
    );
    expect(container.querySelector('[data-testid="mtime-elongation"]')?.textContent).toBe(
      snapshot.elongation,
    );
    expect(container.querySelector('[data-testid="mtime-sunset-altitude"]')?.textContent).toBe(
      snapshot.altitude,
    );
    expect(container.querySelector('[data-testid="telemetry-coords"]')?.textContent).toBe(
      snapshot.coords,
    );
    expect(container.querySelector('[data-testid="telemetry-qibla"]')?.textContent).toBe(
      snapshot.qibla,
    );
    expect(container.querySelector('[data-testid="telemetry-hijri"]')?.textContent).toBe(
      snapshot.hijri,
    );
    expect(container.querySelector('[data-testid="prayer-time-fajr"]')?.textContent).toBe(
      snapshot.fajr,
    );
    expect(container.querySelector('[data-testid="telemetry-hilal-alt"]')?.textContent).toBe(
      snapshot.hilalAlt,
    );
    expect(container.querySelector('[data-testid="telemetry-hilal-elong"]')?.textContent).toBe(
      snapshot.hilalElong,
    );
  });

  it("renders localized telemetry network error state in MTimeLiveTelemetryPanel across en, id, and ar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Network down");
      }),
    );

    await act(async () => {
      root.render(
        <TranslationWrapper lang="en">
          <LocaleSwitcherBar />
          <MTimeLiveTelemetryPanel />
        </TranslationWrapper>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    const alertText = () => container.querySelector('[role="alert"]')?.textContent ?? "";
    expect(alertText()).toContain(en.errors.networkOffline);

    await switchLocale("id");
    expect(alertText()).toContain(idDict.errors.networkOffline);

    await switchLocale("ar");
    expect(alertText()).toContain(ar.errors.networkOffline);
  });

  it("isolates numeric readouts with dir='ltr' in compact MTimeInteractiveEngine under Arabic RTL", async () => {
    await act(async () => {
      root.render(
        <TranslationWrapper lang="ar">
          <MTimeInteractiveEngine compact />
        </TranslationWrapper>,
      );
    });

    const engineWrapper = container.firstElementChild;
    expect(engineWrapper?.getAttribute("dir")).toBe("rtl");
    expect(container.querySelector('[data-testid="mtime-elongation"]')?.getAttribute("dir")).toBe(
      "ltr",
    );
    expect(
      container.querySelector('[data-testid="mtime-elongation"]')?.getAttribute("data-ltr"),
    ).toBe("true");
  });
});
