"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  CrescentStarIcon,
  CrownEmblemIcon,
  IllustratedHero,
  PrimaryAction,
  SearchLensIcon,
  SecondaryAction,
  SiteNavigation,
  WorldExplorer,
  WorldTile,
} from "@moonwitness/ui/imperium";
import gateCrowdMoonArt from "../../public/art/gate-crowd-moon.webp";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import type { EntryDoorId } from "@/data/empire-canon-codex";
import {
  NAVIGATION_TABS,
  WORLD_DOMAINS,
  type NavigationSectionId,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { CanonCodexSanctum } from "./canon-codex-sanctum";
import { CovenantAboutSection } from "./covenant-about-section";
import { DockMatrixSection } from "./dock-matrix-section";
import { triggerSacredViewTransition } from "./motion-primitives";
import { SanctuaryIdentityControl } from "./sanctuary-identity-control";
import { UniversalSearchModal } from "./universal-search-modal";
import { WorldsSanctum } from "./worlds-sanctum";

const WORLD_ART: Readonly<
  Record<WorldIdentifier, { readonly src: string; readonly subject: string }>
> = {
  moonwitness: {
    src: "/art/world-moonwitness.webp",
    subject: "An illustrated archive hall beneath a moonlit sky",
  },
  arsy: {
    src: "/art/world-arsy.webp",
    subject: "A radio relay dish overlooking a twilight skyline",
  },
  "human-pen": {
    src: "/art/world-qalam.webp",
    subject: "An illuminated writing pen over editorial panels",
  },
  sidra: {
    src: "/art/world-sidra.webp",
    subject: "A luminous tree of connected knowledge",
  },
  "rocksoul-dx": {
    src: "/art/world-rocksoul.webp",
    subject: "A playful creative studio controller over vibrant color",
  },
  crayon: {
    src: "/art/story-plate-01.webp",
    subject: "A bright spectrum of illustrated editorial lenses",
  },
  "sin-can": {
    src: "/art/story-plate-02.webp",
    subject: "An open archway leading into honest self-reflection",
  },
  mythos: {
    src: "/art/story-plate-04.webp",
    subject: "Historic stone arches preserving ancient human memory",
  },
  "angel-with-shotgun": {
    src: "/art/celestial-gate-bg.webp",
    subject: "Balanced architectural scales under dramatic sky light",
  },
};

const WORLD_TAGLINES_ID: Readonly<Record<WorldIdentifier, string>> = {
  moonwitness: "Kisah · Pengetahuan · Arsip",
  arsy: "Radio · Teknologi · Infrastruktur",
  "human-pen": "Pikir · Tulis · Cipta · Bagikan",
  sidra: "Terhubung · Jelajahi · Pelajari",
  "rocksoul-dx": "Bermain · Cipta · Bermimpi",
  crayon: "Biar Hidup Lebih Berwarna!",
  "sin-can": "Refleksi · Tanya · Pahami",
  mythos: "Jelajahi · Temukan · Ingat",
  "angel-with-shotgun": "Hukum · Keadilan · Masyarakat",
};

export function EmpireOfLightExperience() {
  const { locale, toggleLocale } = useSanctuaryLocale();
  const [activeNavTab, setActiveNavTab] = useState<NavigationSectionId>("the-gate");
  const [activeWorldId, setActiveWorldId] = useState<WorldIdentifier>("human-pen");
  const [activeDoorId, setActiveDoorId] = useState<EntryDoorId>("story-universe");
  const [sanctuaryRadianceActive, setSanctuaryRadianceActive] = useState<boolean>(false);
  const [quietMode, setQuietMode] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Keyboard shortcut Ctrl+K / Cmd+K to open search from anywhere
  useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Load the motion/moments kit after hydration
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("m-enter", "mo-js");
    const enterTimer = window.setTimeout(() => root.classList.add("m-enter-done"), 700);
    const safeTimer = window.setTimeout(() => root.classList.add("mo-safe"), 2500);
    const load = (src: string) => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const el = document.createElement("script");
      el.type = "module";
      el.src = src;
      document.body.appendChild(el);
    };
    load("/assets/motion/motion.js");
    load("/assets/moments/moments.js");
    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(safeTimer);
    };
  }, []);

  // Keep the fixed navigation in sync with the section currently in view
  useEffect(() => {
    let rafId = 0;
    const sectionIds: readonly NavigationSectionId[] = [
      "the-gate",
      "the-worlds",
      "the-codex",
      "the-dock",
      "about",
    ];

    const updateScroll = () => {
      rafId = 0;
      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40;
      if (nearBottom) {
        setActiveNavTab("about");
        return;
      }

      let currentSection: NavigationSectionId = "the-gate";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 180) {
          currentSection = id;
        }
      }
      setActiveNavTab(currentSection);
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navigateToSection = useCallback(
    (sectionId: NavigationSectionId) => {
      setMobileMenuOpen(false);
      setActiveNavTab(sectionId);
      const targetElement = document.getElementById(sectionId);
      if (targetElement) {
        const reduced = quietMode || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        targetElement.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    },
    [quietMode],
  );

  const selectAndInspectWorld = useCallback(
    (worldId: WorldIdentifier) => {
      setMobileMenuOpen(false);
      triggerSacredViewTransition(() => {
        setActiveWorldId(worldId);
        setActiveNavTab("the-worlds");
      }, quietMode);
      const worldsElement = document.getElementById("the-worlds");
      if (worldsElement) {
        const reduced = quietMode || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        worldsElement.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    },
    [quietMode],
  );

  const handleWorldSelectOnly = useCallback(
    (worldId: WorldIdentifier) => {
      triggerSacredViewTransition(() => {
        setActiveWorldId(worldId);
      }, quietMode);
    },
    [quietMode],
  );

  const selectAndInspectDoor = useCallback(
    (doorId: EntryDoorId) => {
      setMobileMenuOpen(false);
      triggerSacredViewTransition(() => {
        setActiveDoorId(doorId);
        setActiveNavTab("the-codex");
      }, quietMode);
      const codexElement = document.getElementById("the-codex");
      if (codexElement) {
        const reduced = quietMode || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        codexElement.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      }
    },
    [quietMode],
  );

  const handleDoorSelectOnly = useCallback(
    (doorId: EntryDoorId) => {
      triggerSacredViewTransition(() => {
        setActiveDoorId(doorId);
      }, quietMode);
    },
    [quietMode],
  );

  const jumpToRemembranceSanctuary = useCallback(() => {
    setMobileMenuOpen(false);
    setActiveNavTab("about");
    const sanctuaryEl = document.getElementById("remembrance-sanctuary");
    if (sanctuaryEl) {
      const reduced = quietMode || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      sanctuaryEl.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    } else {
      navigateToSection("about");
    }
  }, [quietMode, navigateToSection]);

  return (
    <div className="home-page relative min-h-screen bg-[#08090d] text-[#fff8e8] selection:bg-[#f6d438] selection:text-[#08090d]">
      <SiteNavigation
        navLabel="Primary Empire Navigation"
        mobileMenuOpen={mobileMenuOpen}
        brand={
          <a
            href="#the-gate"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection("the-gate");
            }}
            className="home-header-brand group flex min-h-[44px] items-center gap-2.5 sm:gap-3"
          >
            <CrownEmblemIcon className="h-8 w-8 shrink-0 text-[#f6d438]" />
            <div className="flex flex-col leading-tight">
              <span className="home-brand-wordmark text-base sm:text-lg font-bold tracking-[0.06em] text-[#fff8e8]">
                A-L-L-A-H.COM
              </span>
              <span className="home-brand-tagline text-[11px] font-bold tracking-[0.12em] text-[#f6d438] uppercase">
                EMPIRE OF THE LIGHT
              </span>
            </div>
          </a>
        }
        items={NAVIGATION_TABS.map((navTab) => ({
          id: navTab.id,
          label: navTab.label,
          href: `#${navTab.id}`,
          active: activeNavTab === navTab.id,
          onSelect: (event) => {
            event.preventDefault();
            navigateToSection(navTab.id);
          },
        }))}
        actions={
          <>
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Search the Empire of the Light"
              title="Search (Ctrl+K)"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#fff8e8] hover:text-[#f6d438] transition-colors cursor-pointer"
            >
              <SearchLensIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-pressed={sanctuaryRadianceActive}
              onClick={() => setSanctuaryRadianceActive((prev) => !prev)}
              aria-label="Toggle Sanctuary Radiance Mode"
              title="Toggle Sanctuary Radiance"
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors cursor-pointer ${
                sanctuaryRadianceActive ? "text-[#f6d438]" : "text-[#fff8e8] hover:text-[#f6d438]"
              }`}
            >
              <CrescentStarIcon className="h-5 w-5" />
            </button>

            <SecondaryAction
              onClick={toggleLocale}
              aria-label={locale === "en" ? "Switch to Indonesian" : "Switch to English"}
              title={locale === "en" ? "Ganti ke Bahasa Indonesia" : "Switch to English"}
              className="hidden sm:inline-flex font-mono text-xs"
            >
              {locale.toUpperCase()}
            </SecondaryAction>

            <div className="hidden lg:inline-flex">
              <SanctuaryIdentityControl />
            </div>

            <SecondaryAction
              aria-pressed={quietMode}
              onClick={() => setQuietMode((prev) => !prev)}
              aria-label="Toggle Quiet Contemplative Motion Mode"
              className="hidden lg:inline-flex font-mono text-xs"
            >
              {quietMode ? "QUIET" : "LIGHT"}
            </SecondaryAction>

            <SecondaryAction
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-sanctuary-nav"
              aria-label="Toggle Empire Navigation Menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex min-w-[44px] px-3 lg:hidden"
            >
              <span className="font-mono text-sm">{mobileMenuOpen ? "✕" : "☰"}</span>
            </SecondaryAction>
          </>
        }
        mobileDrawer={
          <div
            id="mobile-sanctuary-nav"
            role="region"
            aria-label="Mobile Navigation"
            className="mx-4 mb-3 border-2 border-[#f6d438] bg-[#08090d] p-4 shadow-[4px_4px_0_#ed149b] lg:hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {NAVIGATION_TABS.map((navTab) => {
                const isTabActive = activeNavTab === navTab.id;
                return (
                  <SecondaryAction
                    key={navTab.id}
                    data-active={isTabActive ? "true" : "false"}
                    onClick={() => navigateToSection(navTab.id)}
                    className="w-full justify-center"
                  >
                    {navTab.label}
                  </SecondaryAction>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f6d438]/25 pt-3">
              <SecondaryAction
                aria-pressed={quietMode}
                onClick={() => setQuietMode((prev) => !prev)}
                className="flex-1"
              >
                {quietMode ? "RESTORE MOTION" : "QUIET MODE"}
              </SecondaryAction>
              <SecondaryAction onClick={toggleLocale}>{locale.toUpperCase()}</SecondaryAction>
              <SanctuaryIdentityControl compact />
            </div>
          </div>
        }
      />

      <main id="main" className="bg-girih-filigree">
        <IllustratedHero
          id="the-gate"
          labelledBy="gate-heading"
          data-enter
          backdrop={
            <Image
              src={gateCrowdMoonArt}
              alt="Original illustration of back-facing travelers facing a luminous moonlit city across nine worlds"
              fill
              priority
              sizes="(orientation: portrait) min(170vh, 1900px), max(100vw, 170vh)"
              data-source="illustration"
              data-subject="Back-facing travelers overlooking a bright moonlit universe"
              className={`home-gate-art-image object-cover ${
                sanctuaryRadianceActive ? "is-radiant" : ""
              }`}
            />
          }
          kicker={
            locale === "id"
              ? "HUB KEHIDUPAN · PEMBELAJARAN · AKSI"
              : "ACCOUNTABLE LIFE · LEARNING · ACTION HUB"
          }
          title={
            <h1 id="gate-heading" className="home-gate-heading">
              <span className="sr-only">
                {locale === "id"
                  ? "A-L-L-A-H.COM — Empire of the Light. Jelajahi sembilan dunia pembelajaran."
                  : "A-L-L-A-H.COM — Empire of the Light. Explore the nine learning worlds."}
              </span>
              <span className="home-gate-heading-visible" aria-hidden="true">
                A-L-L-A-H.COM
              </span>
            </h1>
          }
          subtitle={locale === "id" ? "KERAJAAN CAHAYA" : "EMPIRE OF THE LIGHT"}
          callouts={
            locale === "id"
              ? ["CAHAYA MILIK SEMUA", "TEMUKAN TERANG DALAM GELAP", "PENGINGAT JALAN PULANG"]
              : ["SUNSHINE BELONG", "FIND LIGHT IN DARKNESS", "HOW U REMIND ME"]
          }
          description={
            locale === "id"
              ? "Satu semesta berilustrasi dengan kemungkinan tanpa batas. Setiap orang punya ruang untuk belajar, mencipta, dan bertumbuh di sini."
              : "One universe. Infinite possibilities. Everyone has a welcoming world to explore, learn, and build here."
          }
          actions={
            <PrimaryAction onClick={() => navigateToSection("the-worlds")}>
              <span>{locale === "id" ? "JELAJAHI SEMBILAN DUNIA" : "EXPLORE THE NINE WORLDS"}</span>
              <span aria-hidden="true">&rarr;</span>
            </PrimaryAction>
          }
          asideContent={
            <div className="mw-editorial-aside-panel text-right">
              <div className="flex items-center justify-end gap-2 text-[#f6d438]">
                <CrownEmblemIcon className="h-6 w-6" />
                <span>{locale === "id" ? "MISI BERSAMA" : "SHARED COMPASS"}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#fff8e8]">
                DREAM · EXPLORE · LEARN · CREATE · CONNECT
              </p>
              <button
                type="button"
                onClick={() => navigateToSection("the-worlds")}
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 border border-[#f6d438] bg-[#171a26] px-3 py-1.5 text-xs text-[#f6d438] hover:bg-[#f6d438] hover:text-[#08090d] transition-colors cursor-pointer"
              >
                <span>{locale === "id" ? "MENUJU DUNIA" : "TO THE WORLDS"}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          }
          shelf={
            <WorldExplorer
              heading={
                <h2>{locale === "id" ? "JELAJAHI SEMBILAN DUNIA" : "EXPLORE THE NINE WORLDS"}</h2>
              }
              trailing={
                <span className="text-[#ed149b] text-xl" aria-hidden="true">
                  ✦
                </span>
              }
            >
              {WORLD_DOMAINS.map((worldItem, index) => {
                const art = WORLD_ART[worldItem.id];
                return (
                  <WorldTile
                    key={worldItem.id}
                    indexLabel={`0${index + 1}`}
                    title={worldItem.name}
                    tagline={locale === "id" ? WORLD_TAGLINES_ID[worldItem.id] : worldItem.tagline}
                    ctaLabel={locale === "id" ? "JELAJAHI" : "EXPLORE"}
                    active={activeWorldId === worldItem.id}
                    onClick={() => selectAndInspectWorld(worldItem.id)}
                    media={
                      <Image
                        src={art.src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1279px) 30vw, 11vw"
                        data-source="illustration"
                        data-subject={art.subject}
                        className="object-cover"
                      />
                    }
                  />
                );
              })}
            </WorldExplorer>
          }
        />

        <section
          data-moment="letters-assemble"
          aria-labelledby="home-moment-heading"
          className="home-moment relative flex min-h-screen items-center px-4 py-24 sm:px-8 lg:px-16"
        >
          <div className="wrap mx-auto w-full max-w-7xl">
            <h2 id="home-moment-heading" className="mo-la__type">
              9 WORLDS 1 LIGHT
            </h2>
            <p className="mo-la__sub">
              {locale === "id"
                ? "Moonwitness · Arsy · Human-Pen · Sidra · RockSoul DX · Crayon · Sin Can · Mythos · Angel With Shotgun."
                : "Moonwitness · Arsy · Human-Pen · Sidra · RockSoul DX · Crayon · Sin Can · Mythos · Angel With Shotgun."}
            </p>
          </div>
        </section>

        <WorldsSanctum
          activeWorldId={activeWorldId}
          quietMode={quietMode}
          onSelectWorld={handleWorldSelectOnly}
        />

        <CanonCodexSanctum
          activeDoorId={activeDoorId}
          quietMode={quietMode}
          onSelectDoor={handleDoorSelectOnly}
        />

        <DockMatrixSection
          quietMode={quietMode}
          onLaunchWorld={(worldId) => selectAndInspectWorld(worldId)}
        />

        <CovenantAboutSection
          quietMode={quietMode}
          onToggleQuietMode={() => setQuietMode((prev) => !prev)}
          onSelectWorld={(worldId) => selectAndInspectWorld(worldId)}
          onInspectCorpusDoor={() => selectAndInspectDoor("epistemic-corpus")}
          onReturnToGate={() => navigateToSection("the-gate")}
        />
      </main>

      <UniversalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigateToWorld={(worldId) => selectAndInspectWorld(worldId)}
        onNavigateToDoor={(doorId) => selectAndInspectDoor(doorId)}
        onJumpToRemembrance={jumpToRemembranceSanctuary}
      />
    </div>
  );
}
