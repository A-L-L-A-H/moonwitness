"use client";

import Image from "next/image";
import { useState } from "react";
import {
  NAVIGATION_TABS,
  WORLD_DOMAINS,
  type NavigationSectionId,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { CelestialCanvas } from "./celestial-canvas";
import { CovenantAboutSection } from "./covenant-about-section";
import { DockMatrixSection } from "./dock-matrix-section";
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
  const [sanctuaryRadianceActive, setSanctuaryRadianceActive] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);

  const navigateToSection = (sectionId: NavigationSectionId) => {
    setActiveNavTab(sectionId);
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const selectAndInspectWorld = (worldId: WorldIdentifier) => {
    setActiveWorldId(worldId);
    setActiveNavTab("the-worlds");
    const worldsElement = document.getElementById("the-worlds");
    if (worldsElement) {
      worldsElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#040509] text-[#f5efe2] selection:bg-[#d6b46c] selection:text-[#040509]">
      {/* =====================================================================
          HERO VIEWPORT — THE GATE OF LIGHT (100% Reference Visual Fidelity)
         ===================================================================== */}
      <section
        id="the-gate"
        aria-label="A-L-L-A-H.COM — Empire of the Light Gate"
        className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden"
      >
        {/* Background Master Celestial Vista */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[#040509]"
        >
          <Image
            src="/art/celestial-gate-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className={`object-cover object-center transition-all duration-1000 ${
              sanctuaryRadianceActive
                ? "scale-[1.015] brightness-110 contrast-105"
                : "scale-100 brightness-100"
            }`}
          />
          {/* Subtle vignette & readability gradients matching reference lighting */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />
          <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#040509]/90 via-[#040509]/45 to-transparent" />
        </div>

        {/* Interactive Starfield & Golden Light Motes Canvas */}
        <CelestialCanvas sanctuaryRadianceActive={sanctuaryRadianceActive} />

        {/* 1. TOP NAVIGATION BAR */}
        <header className="relative z-20 mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 pt-4 pb-2 sm:px-8 sm:pt-6 lg:px-12">
          {/* Brand Emblem & Title */}
          <a
            href="#the-gate"
            onClick={(event) => {
              event.preventDefault();
              navigateToSection("the-gate");
            }}
            className="group flex items-center gap-2.5 sm:gap-3.5 focus:outline-none"
          >
            <OctagramMandalaIcon className="h-9 w-9 sm:h-11 sm:w-11 transition-transform duration-700 group-hover:rotate-45" />
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <span className="font-serif text-sm sm:text-lg tracking-[0.16em] text-[#f7efe0] font-normal">
                A-L-L-A-H.COM
              </span>
              <span className="hidden h-4 w-px bg-[#d6b46c]/45 sm:inline-block" aria-hidden="true" />
              <span className="hidden font-serif text-[10px] sm:text-xs tracking-[0.22em] text-[#dfd5c0]/85 uppercase md:inline-block">
                EMPIRE OF THE LIGHT
              </span>
            </div>
          </a>

          {/* Center Navigation Tabs */}
          <nav
            aria-label="Primary Empire Navigation"
            className="hidden md:flex items-center gap-8 lg:gap-11"
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
                  className={`relative py-2 font-serif text-xs lg:text-[13px] tracking-[0.2em] uppercase transition-colors ${
                    isTabActive
                      ? "text-[#fff8e8] drop-shadow-[0_0_10px_rgba(248,234,198,0.65)]"
                      : "text-[#d8ceba]/80 hover:text-[#fff6df]"
                  }`}
                >
                  {navTab.label}
                  {isTabActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-[-10px] -bottom-1 flex items-center justify-center"
                    >
                      <span className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#f5dfa6] to-transparent shadow-[0_0_12px_#f5dfa6]" />
                      <span className="absolute h-2 w-2 rotate-45 bg-[#fff8e6] shadow-[0_0_10px_#fff8e6]" />
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Utility Icons (Search & Celestial Mode) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Search the Empire of the Light"
              title="Search (Ctrl+K)"
              className="p-1.5 text-[#e8dec8]/85 hover:text-[#fff8e6] transition-colors cursor-pointer"
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
              className={`p-1.5 transition-all cursor-pointer ${
                sanctuaryRadianceActive
                  ? "text-[#fff6d6] drop-shadow-[0_0_12px_rgba(255,242,198,0.9)] scale-110"
                  : "text-[#e8dec8]/85 hover:text-[#fff8e6]"
              }`}
            >
              <CrescentStarIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* 2. CENTRAL HERO MONUMENT & SACRED PORTAL */}
        <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center mt-[4vh] sm:mt-[6vh]">
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

          {/* Interactive Gate Threshold Spacer (aligns over the Golden Portal Archway) */}
          <div className="mt-6 sm:mt-10 flex flex-col items-center">
            <button
              type="button"
              onClick={() => navigateToSection("the-worlds")}
              aria-label="Enter the Golden Gate of Light"
              className="group relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full focus:outline-none cursor-pointer"
            >
              <span className="absolute inset-0 rounded-full border border-[#f5dfa6]/30 transition-transform duration-700 group-hover:scale-125 group-hover:border-[#fff6dc]/70" />
              <span className="sr-only">Enter the Golden Gate</span>
            </button>
          </div>
        </div>

        {/* 3. FOREGROUND REFLECTIVE WATER DOCK — 5 WORLDS + CTA + FOOTER */}
        <div className="relative z-20 mt-auto w-full pt-8 pb-4 sm:pb-6">
          <div className="mx-auto max-w-[1480px] px-4 sm:px-8 lg:px-12">
            {/* Five Worlds Reflective Row */}
            <div
              role="region"
              aria-label="The Five Worlds Dock"
              className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0"
            >
              {WORLD_DOMAINS.map((worldItem, worldIdx) => {
                const isWorldSelected = activeWorldId === worldItem.id;
                return (
                  <div
                    key={worldItem.id}
                    className="relative flex flex-col items-center px-2 sm:px-4 text-center"
                  >
                    {/* Vertical Luminous Divider Line between columns on desktop */}
                    {worldIdx > 0 && (
                      <span
                        aria-hidden="true"
                        className="hidden lg:block absolute left-0 top-1 bottom-1 w-px bg-gradient-to-b from-transparent via-[#e8cd8c]/45 to-transparent"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => selectAndInspectWorld(worldItem.id)}
                      className="group flex flex-col items-center text-center focus:outline-none cursor-pointer"
                    >
                      <div className="relative flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center transition-transform duration-300 group-hover:-translate-y-1">
                        <span
                          aria-hidden="true"
                          className={`absolute inset-0 rounded-full bg-[#f5dfa6]/15 blur-md transition-opacity duration-300 ${
                            isWorldSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        <WorldEmblemById
                          worldId={worldItem.id}
                          className="relative h-10 w-10 sm:h-12 sm:w-12 drop-shadow-[0_0_12px_rgba(245,223,166,0.45)]"
                        />
                      </div>

                      <span className="mt-2.5 font-serif text-xs sm:text-sm md:text-[15px] tracking-[0.16em] text-[#f8f1e1] group-hover:text-[#fff9e8] transition-colors">
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

            {/* Center Chamfered Button: EXPLORE THE WORLDS > */}
            <div className="mt-7 sm:mt-9 flex flex-col items-center">
              <button
                type="button"
                onClick={() => navigateToSection("the-worlds")}
                className="btn-chamfer group inline-flex items-center gap-3 px-7 sm:px-10 py-2.5 sm:py-3 font-serif text-xs sm:text-sm tracking-[0.22em] text-[#f5ecd7] uppercase transition-all duration-300 hover:text-white cursor-pointer"
              >
                <span>EXPLORE THE WORLDS</span>
                <span
                  aria-hidden="true"
                  className="text-[#e6c987] transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rsaquo;
                </span>
              </button>

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

            {/* Bottom Corner Signatures */}
            <div className="mt-2 flex flex-col items-center justify-between gap-2 text-[10px] sm:text-[11px] font-serif tracking-[0.22em] text-[#d8ceba]/80 uppercase sm:flex-row">
              <div>A-L-L-A-H.COM &middot; EMPIRE OF THE LIGHT</div>
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
          onSelectWorld={(worldId) => setActiveWorldId(worldId)}
        />

        <DockMatrixSection
          onLaunchWorld={(worldId) => selectAndInspectWorld(worldId)}
        />

        <CovenantAboutSection
          onReturnToGate={() => navigateToSection("the-gate")}
        />
      </main>

      {/* Universal Empire Search & Command Palette */}
      <UniversalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigateToWorld={(worldId) => selectAndInspectWorld(worldId)}
      />
    </div>
  );
}
