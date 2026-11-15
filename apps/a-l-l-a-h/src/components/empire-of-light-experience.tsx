"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { EntryDoorId } from "@/data/empire-canon-codex";
import type { RenderingCapabilityTier } from "@/data/design-tokens";
import {
  NAVIGATION_TABS,
  WORLD_DOMAINS,
  type NavigationSectionId,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { CanonCodexSanctum } from "./canon-codex-sanctum";
import { CelestialCanvas } from "./celestial-canvas";
import { CinematicEntrance } from "./cinematic-entrance";
import { CovenantAboutSection } from "./covenant-about-section";
import { DockMatrixSection } from "./dock-matrix-section";
import { MagneticPortal, triggerSacredViewTransition } from "./motion-primitives";
import {
  CrescentStarIcon,
  DiamondStarOrnament,
  OctagramMandalaIcon,
  SearchLensIcon,
  WorldEmblemById,
} from "./sacred-icons";
import { UniversalSearchModal } from "./universal-search-modal";
import { WorldsSanctum } from "./worlds-sanctum";

export function EmpireOfLightExperience() {
  const [activeNavTab, setActiveNavTab] = useState<NavigationSectionId>("the-gate");
  const [activeWorldId, setActiveWorldId] = useState<WorldIdentifier>("qalam");
  const [activeDoorId, setActiveDoorId] = useState<EntryDoorId>("story-universe");
  const [sanctuaryRadianceActive, setSanctuaryRadianceActive] = useState<boolean>(false);
  const [quietMode, setQuietMode] = useState<boolean>(false);
  const [renderingTier, setRenderingTier] = useState<RenderingCapabilityTier>("canvas-2d");
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [replayCounter, setReplayCounter] = useState<number>(0);
  const [entranceActive, setEntranceActive] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

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

  // Passive scroll progress for hero parallax + shader attenuation
  useEffect(() => {
    let rafId = 0;
    const updateScroll = () => {
      rafId = 0;
      const vh = Math.max(window.innerHeight, 1);
      const progress = Math.max(0, Math.min(1, window.scrollY / vh));
      setScrollProgress(progress);
      document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(3));
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

  // Scroll-spy IntersectionObserver updating active navigation tab
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const sectionIds: readonly NavigationSectionId[] = [
      "the-gate",
      "the-worlds",
      "the-codex",
      "the-dock",
      "about",
    ];
    const observedElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (observedElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }
        if (bestEntry) {
          const id = bestEntry.target.id as NavigationSectionId;
          setActiveNavTab(id);
        }
      },
      {
        threshold: [0.22, 0.45, 0.7],
        rootMargin: "-10% 0px -25% 0px",
      },
    );

    for (const element of observedElements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
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

  const handleCapabilityDetected = useCallback((tier: RenderingCapabilityTier) => {
    setRenderingTier(tier);
  }, []);

  const handleReplayEntrance = useCallback(() => {
    setMobileMenuOpen(false);
    setQuietMode(false);
    setReplayCounter((prev) => prev + 1);
  }, []);

  const parallaxTranslateY = quietMode ? 0 : Math.round(scrollProgress * 42);
  const parallaxScale = quietMode
    ? 1
    : (sanctuaryRadianceActive ? 1.018 : 1.0) + scrollProgress * 0.03;

  const capabilityStatusLabel =
    renderingTier === "webgl2-full"
      ? "LIVING LIGHT · WEBGL2 GLSL"
      : renderingTier === "canvas-2d"
        ? "LIVING LIGHT · CANVAS 2D"
        : "QUIET CONTEMPLATIVE MODE";

  return (
    <div className="relative min-h-screen bg-[#040509] text-[#f5efe2] selection:bg-[#d6b46c] selection:text-[#040509]">
      {/* Non-Blocking Staged Cinematic Opening Sequence */}
      <CinematicEntrance
        quietMode={quietMode}
        replayCounter={replayCounter}
        onVisibilityChange={setEntranceActive}
      />

      {/* =====================================================================
          HERO VIEWPORT — THE GATE OF LIGHT (Sacred Minimalism × Living Light)
         ===================================================================== */}
      <section
        id="the-gate"
        aria-label="A-L-L-A-H.COM — Empire of the Light Gate"
        aria-hidden={entranceActive ? true : undefined}
        className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden"
      >
        {/* Background Master Celestial Vista with Scroll-Depth Parallax */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-[#040509]">
          <div
            className="relative h-full w-full transition-transform duration-700 ease-out"
            style={{
              transform: `translate3d(0, ${parallaxTranslateY}px, 0) scale(${parallaxScale.toFixed(4)})`,
            }}
          >
            <Image
              src="/art/celestial-gate-bg.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className={`object-cover object-center transition-[filter] duration-1000 ${
                sanctuaryRadianceActive ? "brightness-110 contrast-105" : "brightness-100"
              }`}
            />
          </div>
          {/* Legibility & Horizon Vignette Veils */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />
          <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#040509]/92 via-[#040509]/48 to-transparent" />
        </div>

        {/* Multi-Layer WebGL2 GLSL Shader + 2D Orbital Starfield & Ripple Canvas */}
        <CelestialCanvas
          sanctuaryRadianceActive={sanctuaryRadianceActive}
          quietMode={quietMode}
          scrollProgress={scrollProgress}
          onCapabilityDetected={handleCapabilityDetected}
        />

        {/* 1. TOP NAVIGATION BAR */}
        <header className="relative z-30 mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 pt-4 pb-2 sm:px-8 sm:pt-6 lg:px-12">
          {/* Brand Emblem & Title */}
          <a
            href="#the-gate"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection("the-gate");
            }}
            className="group flex min-h-[44px] items-center gap-2.5 sm:gap-3.5 focus:outline-none"
          >
            <OctagramMandalaIcon className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 transition-transform duration-700 group-hover:rotate-45" />
            <div className="flex items-center gap-2.5 sm:gap-3.5 whitespace-nowrap">
              <span className="font-serif text-sm md:text-xs lg:text-lg tracking-[0.14em] lg:tracking-[0.16em] text-[#f7efe0] font-normal">
                A-L-L-A-H.COM
              </span>
              <span
                className="hidden h-4 w-px bg-[#d6b46c]/45 lg:inline-block"
                aria-hidden="true"
              />
              <span className="hidden font-serif text-[10px] sm:text-xs tracking-[0.22em] text-[#dfd5c0]/85 uppercase lg:inline-block">
                EMPIRE OF THE LIGHT
              </span>
            </div>
          </a>

          {/* Center Navigation Tabs (Desktop & Tablet Large) */}
          <nav
            aria-label="Primary Empire Navigation"
            className="hidden md:flex items-center gap-3 lg:gap-8"
          >
            {NAVIGATION_TABS.map((navTab) => {
              const isTabActive = activeNavTab === navTab.id;
              return (
                <a
                  key={navTab.id}
                  href={`#${navTab.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToSection(navTab.id);
                  }}
                  aria-current={isTabActive ? "page" : undefined}
                  className={`relative flex min-h-[44px] items-center whitespace-nowrap py-2 font-serif text-[10px] lg:text-[13px] tracking-[0.12em] lg:tracking-[0.2em] uppercase transition-colors ${
                    isTabActive
                      ? "text-[#fff8e8] drop-shadow-[0_0_10px_rgba(248,234,198,0.65)]"
                      : "text-[#d8ceba]/80 hover:text-[#fff6df]"
                  }`}
                >
                  {navTab.label}
                  {isTabActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-[-10px] bottom-0.5 flex items-center justify-center"
                    >
                      <span className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#f5dfa6] to-transparent shadow-[0_0_12px_#f5dfa6]" />
                      <span className="absolute h-2 w-2 rotate-45 bg-[#fff8e6] shadow-[0_0_10px_#fff8e6]" />
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Utility Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Search the Empire of the Light"
              title="Search (Ctrl+K)"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[#e8dec8]/85 hover:text-[#fff8e6] transition-colors cursor-pointer"
            >
              <SearchLensIcon className="h-5 w-5" />
            </button>

            <span className="h-4 w-px bg-[#d6b46c]/40" aria-hidden="true" />

            <button
              type="button"
              aria-pressed={sanctuaryRadianceActive}
              onClick={() => setSanctuaryRadianceActive((prev) => !prev)}
              aria-label="Toggle Sanctuary Radiance Mode"
              title="Toggle Sanctuary Radiance"
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-all cursor-pointer ${
                sanctuaryRadianceActive
                  ? "text-[#fff6d6] drop-shadow-[0_0_12px_rgba(255,242,198,0.9)] scale-110"
                  : "text-[#e8dec8]/85 hover:text-[#fff8e6]"
              }`}
            >
              <CrescentStarIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-pressed={quietMode}
              onClick={() => setQuietMode((prev) => !prev)}
              aria-label="Toggle Quiet Contemplative Motion Mode"
              title={
                quietMode
                  ? "Restore Living Light Shaders & Motion"
                  : "Enable Quiet Contemplative Mode (Low Motion)"
              }
              className={`hidden lg:inline-flex min-h-[44px] items-center border px-3 text-[10px] font-mono tracking-[0.18em] uppercase transition-colors cursor-pointer ${
                quietMode
                  ? "border-[#fff4d2]/75 bg-[#dfc07b]/20 text-[#fff4d2]"
                  : "border-[#d6b46c]/30 bg-[#080a12]/60 text-[#dfd5c0]/80 hover:border-[#dfc07b]/65 hover:text-[#fff6df]"
              }`}
            >
              {quietMode ? "QUIET" : "LIGHT"}
            </button>

            {/* Mobile Menu Toggle (< md) */}
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-sanctuary-nav"
              aria-label="Toggle Empire Navigation Menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-[#d6b46c]/35 bg-[#080a12]/80 text-[#f5efe2] md:hidden cursor-pointer"
            >
              <span className="font-mono text-xs tracking-widest">
                {mobileMenuOpen ? "✕" : "☰"}
              </span>
            </button>
          </div>
        </header>

        {/* Mobile Sanctuary Drawer Navigation */}
        {mobileMenuOpen && (
          <div
            id="mobile-sanctuary-nav"
            role="region"
            aria-label="Mobile Navigation"
            className="absolute left-4 right-4 top-[72px] z-40 border border-[#d6b46c]/45 bg-[#060810]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-md md:hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {NAVIGATION_TABS.map((navTab) => {
                const isTabActive = activeNavTab === navTab.id;
                return (
                  <button
                    key={navTab.id}
                    type="button"
                    onClick={() => navigateToSection(navTab.id)}
                    className={`min-h-[44px] border px-3 py-2 font-serif text-xs tracking-[0.18em] uppercase transition-colors cursor-pointer ${
                      isTabActive
                        ? "border-[#dfc07b] bg-[#dfc07b]/18 text-[#fff6df]"
                        : "border-[#d6b46c]/25 bg-[#0a0d16] text-[#d8ceba]"
                    }`}
                  >
                    {navTab.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#d6b46c]/20 pt-3">
              <button
                type="button"
                aria-pressed={quietMode}
                onClick={() => setQuietMode((prev) => !prev)}
                className="min-h-[44px] flex-1 border border-[#d6b46c]/35 bg-[#0a0d16] px-3 py-2 font-mono text-[11px] tracking-[0.16em] text-[#dfc07b] uppercase cursor-pointer"
              >
                {quietMode ? "RESTORE LIVING LIGHT" : "QUIET MODE"}
              </button>
              <button
                type="button"
                onClick={handleReplayEntrance}
                className="min-h-[44px] flex-1 border border-[#d6b46c]/35 bg-[#0a0d16] px-3 py-2 font-mono text-[11px] tracking-[0.16em] text-[#f5efe2] uppercase cursor-pointer"
              >
                REPLAY ENTRANCE
              </button>
            </div>
          </div>
        )}

        {/* 2. CENTRAL HERO MONUMENT & SACRED PORTAL */}
        <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center mt-[3vh] sm:mt-[5vh]">
          {/* — IN THE NAME OF ALLAH — */}
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <span
              aria-hidden="true"
              className="h-px w-10 sm:w-20 bg-gradient-to-r from-transparent to-[#d6b46c]/80"
            />
            <p className="font-serif text-[10px] sm:text-xs md:text-[13px] tracking-[0.28em] text-[#e8dfd0]/90 uppercase">
              IN THE NAME OF ALLAH
            </p>
            <span
              aria-hidden="true"
              className="h-px w-10 sm:w-20 bg-gradient-to-l from-transparent to-[#d6b46c]/80"
            />
          </div>

          {/* A-L-L-A-H.COM */}
          <h1 className="mt-2 sm:mt-3 font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-normal leading-none tracking-[0.12em] text-gold-monument select-none">
            A-L-L-A-H.COM
          </h1>

          {/* E M P I R E   O F   T H E   L I G H T */}
          <p className="mt-2.5 sm:mt-3.5 font-serif text-xs sm:text-lg md:text-2xl tracking-[0.46em] text-[#eee5d3]/95 uppercase pl-[0.46em]">
            EMPIRE OF THE LIGHT
          </p>

          {/* A world to witness. A world to learn. A world to build. */}
          <p className="mt-3 sm:mt-4 font-serif text-xs sm:text-base md:text-[19px] tracking-[0.06em] text-[#f5efe2]/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            A world to witness. A world to learn. A world to build.
          </p>

          {/* Interactive Gate Threshold with Magnetic Portal */}
          <div className="mt-6 sm:mt-10 flex flex-col items-center">
            <MagneticPortal disabled={quietMode} maxOffsetPx={7}>
              <button
                type="button"
                onClick={() => navigateToSection("the-worlds")}
                aria-label="Enter the Golden Gate of Light"
                className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full focus:outline-none cursor-pointer"
              >
                <span className="absolute inset-0 rounded-full border border-[#f5dfa6]/25 transition-transform duration-700 group-hover:scale-125 group-hover:border-[#fff6dc]/80" />
                <DiamondStarOrnament className="h-4 w-4 text-[#f5dfa6]/70 transition-all duration-500 group-hover:scale-125 group-hover:text-[#fff8e6]" />
                <span className="sr-only">Enter the Golden Gate</span>
              </button>
            </MagneticPortal>
          </div>
        </div>

        {/* 3. FOREGROUND REFLECTIVE WATER DOCK — 5 WORLDS + CTA + FOOTER */}
        <div className="relative z-20 mt-auto w-full pt-8 pb-4 sm:pb-6">
          <div className="mx-auto max-w-[1480px] px-4 sm:px-8 lg:px-12">
            {/* Five Worlds Reflective Row */}
            <div
              role="region"
              aria-label="The Five Worlds Dock"
              className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0"
            >
              {WORLD_DOMAINS.map((worldItem, worldIdx) => {
                const isWorldSelected = activeWorldId === worldItem.id;
                return (
                  <div
                    key={worldItem.id}
                    className={`relative flex flex-col items-center px-2 sm:px-4 text-center ${
                      worldIdx === WORLD_DOMAINS.length - 1 ? "col-span-2 sm:col-span-1" : ""
                    }`}
                  >
                    {worldIdx > 0 && (
                      <span
                        aria-hidden="true"
                        className="hidden lg:block absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-transparent via-[#e8cd8c]/45 to-transparent"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => selectAndInspectWorld(worldItem.id)}
                      className="group flex min-h-[44px] flex-col items-center py-1 text-center focus:outline-none cursor-pointer"
                    >
                      <div className="relative flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
                        <span
                          aria-hidden="true"
                          className={`absolute inset-0 rounded-full bg-[#f5dfa6]/18 blur-md transition-opacity duration-300 ${
                            isWorldSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        <WorldEmblemById
                          worldId={worldItem.id}
                          className="relative h-10 w-10 sm:h-12 sm:w-12 drop-shadow-[0_0_12px_rgba(245,223,166,0.45)]"
                        />
                      </div>

                      <span className="mt-2 font-serif text-xs sm:text-sm md:text-[15px] tracking-[0.16em] text-[#f8f1e1] group-hover:text-[#fff9e8] transition-colors">
                        {worldItem.name}
                      </span>

                      <span className="mt-1 font-serif text-[11px] sm:text-xs tracking-[0.04em] text-[#d4cbb8]/85 group-hover:text-[#efe6d2] transition-colors">
                        {worldItem.tagline}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Center Chamfered Button with Magnetic Interaction */}
            <div className="mt-6 sm:mt-8 flex flex-col items-center">
              <MagneticPortal disabled={quietMode} maxOffsetPx={6}>
                <button
                  type="button"
                  onClick={() => navigateToSection("the-worlds")}
                  className="btn-chamfer group inline-flex items-center gap-3 px-7 sm:px-10 py-2.5 sm:py-3 font-serif text-xs sm:text-sm tracking-[0.22em] text-[#f5ecd7] uppercase hover:text-white cursor-pointer"
                >
                  <span>EXPLORE THE WORLDS</span>
                  <span
                    aria-hidden="true"
                    className="text-[#e6c987] transition-transform duration-300 group-hover:translate-x-1"
                  >
                    &rsaquo;
                  </span>
                </button>
              </MagneticPortal>

              {/* Bottom Ornament Line with Center 4-Point Diamond Star */}
              <div
                aria-hidden="true"
                className="mt-4 flex w-full max-w-md items-center justify-center gap-2.5"
              >
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d6b46c]/55 to-[#e6c987]/80" />
                <DiamondStarOrnament className="h-3.5 w-3.5 text-[#f5dfa6]" />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d6b46c]/55 to-[#e6c987]/80" />
              </div>
            </div>

            {/* Bottom Corner Signatures + Subtle Engine Capability Indicator */}
            <div className="mt-2 flex flex-col items-center justify-between gap-2 text-[10px] sm:text-[11px] font-serif tracking-[0.2em] text-[#d8ceba]/80 uppercase sm:flex-row">
              <div>A-L-L-A-H.COM &middot; EMPIRE OF THE LIGHT</div>
              <div className="font-mono text-[10px] tracking-[0.18em] text-[#dfc07b]/80">
                {capabilityStatusLabel}
              </div>
              <div>DREAM &middot; EXPLORE &middot; CREATE</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          INTERACTIVE SANCTUM SECTIONS BELOW THE FOLD
         ===================================================================== */}
      <main id="main">
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
          capabilityStatusLabel={capabilityStatusLabel}
          onReplayEntrance={handleReplayEntrance}
          onToggleQuietMode={() => setQuietMode((prev) => !prev)}
          onReturnToGate={() => navigateToSection("the-gate")}
        />
      </main>

      {/* Universal Empire Search & Command Palette */}
      <UniversalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigateToWorld={(worldId) => selectAndInspectWorld(worldId)}
        onNavigateToDoor={(doorId) => selectAndInspectDoor(doorId)}
      />
    </div>
  );
}
