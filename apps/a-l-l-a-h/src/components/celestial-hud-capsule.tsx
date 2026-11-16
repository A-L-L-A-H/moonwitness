"use client";

import {
  NAVIGATION_TABS,
  WORLD_DOMAINS,
  type NavigationSectionId,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { DiamondStarOrnament, SearchLensIcon } from "./sacred-icons";

/**
 * Slim Vertical Observatory Meridian Spine anchored cleanly inside the outer right gutter
 * on wide viewports (>=1400px), leaving centered max-w-7xl cards 100% unobstructed.
 */
export function CelestialHudCapsule({
  activeNavTab,
  activeWorldId,
  pageScrollFraction,
  onNavigateSection,
  onJumpToRemembrance,
  onOpenSearch,
}: {
  readonly activeNavTab: NavigationSectionId;
  readonly activeWorldId: WorldIdentifier;
  readonly pageScrollFraction: number;
  readonly onNavigateSection: (sectionId: NavigationSectionId) => void;
  readonly onJumpToRemembrance: () => void;
  readonly onOpenSearch: () => void;
}) {
  if (pageScrollFraction < 0.06) {
    return null;
  }

  const azimuthDegrees = String(Math.round(pageScrollFraction * 360)).padStart(3, "0");
  const activeWorld = WORLD_DOMAINS.find((w) => w.id === activeWorldId) ?? WORLD_DOMAINS[0]!;

  return (
    <aside
      aria-label="Observatory Celestial Telemetry Capsule"
      className="hud-glass-capsule fixed right-1.5 top-1/2 z-40 hidden min-[1400px]:flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-full border border-[#d6b46c]/35 py-2.5 px-1 text-[9px] font-mono tracking-[0.12em] text-[#e8dec8] transition-opacity duration-300 opacity-85 hover:opacity-100"
      title={`Active Realm: ${activeWorld.name} · ${azimuthDegrees}° Azimuth`}
    >
      {/* Live Azimuth Degree Counter */}
      <div className="text-[9.5px] font-semibold text-[#fff4d2] tabular-nums">
        {azimuthDegrees}°
      </div>

      <span className="h-px w-4 bg-[#d6b46c]/30" aria-hidden="true" />

      {/* 5 Interactive Meridian Chapter Beacons */}
      <nav aria-label="Quick Meridian Spine" className="flex flex-col items-center gap-1">
        {NAVIGATION_TABS.map((tab, idx) => {
          const isCurrent = activeNavTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigateSection(tab.id)}
              title={tab.label}
              aria-label={`Jump to ${tab.label}`}
              aria-current={isCurrent ? "page" : undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-full border text-[9px] transition-all cursor-pointer ${
                isCurrent
                  ? "border-[#fff4d2] bg-[#d6b46c]/25 text-[#fff8e6] shadow-[0_0_14px_rgba(245,223,166,0.35)]"
                  : "border-transparent text-[#bfb59e]/80 hover:border-[#d6b46c]/45 hover:text-[#fff6df]"
              }`}
            >
              0{idx + 1}
            </button>
          );
        })}
      </nav>

      <span className="h-px w-4 bg-[#d6b46c]/30" aria-hidden="true" />

      {/* Quick Dhikr Jump */}
      <button
        type="button"
        onClick={onJumpToRemembrance}
        title="Jump to Remembrance Sanctuary"
        aria-label="Jump to Remembrance Sanctuary"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6b46c]/35 bg-[#d6b46c]/12 text-[#fff4d2] hover:border-[#fff4d2] hover:bg-[#d6b46c]/28 transition-colors cursor-pointer"
      >
        <DiamondStarOrnament className="h-3.5 w-3.5" />
      </button>

      {/* Command Search Trigger */}
      <button
        type="button"
        onClick={onOpenSearch}
        title="Search Empire (Ctrl+K)"
        aria-label="Open Empire Command Search"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d6b46c]/30 text-[#dfc07b] hover:border-[#fff4d2] hover:text-[#fff8e6] transition-colors cursor-pointer"
      >
        <SearchLensIcon className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
