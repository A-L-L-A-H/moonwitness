"use client";

import {
  FOUR_ENTRY_DOORS,
  SUPREME_IDENTITY,
  type EntryDoorId,
} from "@/data/empire-canon-codex";
import { DoorEpistemicPanel } from "./canon-doors/door-epistemic-panel";
import { DoorOrganizationPanel } from "./canon-doors/door-organization-panel";
import { DoorSovereignPanel } from "./canon-doors/door-sovereign-panel";
import { DoorUniversePanel } from "./canon-doors/door-universe-panel";
import { ScrollChapterReveal, SpatialTiltCard } from "./motion-primitives";
import { DiamondStarOrnament } from "./sacred-icons";

export function CanonCodexSanctum({
  activeDoorId,
  quietMode = false,
  onSelectDoor,
}: {
  readonly activeDoorId: EntryDoorId;
  readonly quietMode?: boolean;
  readonly onSelectDoor: (doorId: EntryDoorId) => void;
}) {
  const activeDoor =
    FOUR_ENTRY_DOORS.find((door) => door.id === activeDoorId) ?? FOUR_ENTRY_DOORS[0]!;

  const handleDoorKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = FOUR_ENTRY_DOORS[(currentIndex + 1) % FOUR_ENTRY_DOORS.length];
      if (next) onSelectDoor(next.id);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prev =
        FOUR_ENTRY_DOORS[(currentIndex - 1 + FOUR_ENTRY_DOORS.length) % FOUR_ENTRY_DOORS.length];
      if (prev) onSelectDoor(prev.id);
    }
  };

  return (
    <section
      id="the-codex"
      aria-labelledby="codex-heading"
      className="relative border-t border-[#d6b46c]/25 bg-gradient-to-b from-[#040509] via-[#080b13] to-[#05060a] py-24 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4 text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
              <span>A-L-L-A-H · {SUPREME_IDENTITY.fullExpansion}</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
            </div>
            <h2
              id="codex-heading"
              className="mt-4 font-serif text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
            >
              THE CANON CODEX
            </h2>
            <p className="mt-3 max-w-3xl font-serif text-base sm:text-lg text-[#d6ceb8]/85">
              Four MoonFrame Entry Doors unifying 194+ repositories across bjo163/*, A-L-L-A-H/*,
              BRIDGE-ALLAH/*, and The-Batteries/* under one monocentric covenant.
            </p>
            <div className="mt-3 font-mono text-[11px] tracking-[0.16em] text-[#f5dfa6]">
              {SUPREME_IDENTITY.creativeFormula}
            </div>
          </div>
        </ScrollChapterReveal>

        {/* 4 Entry Doors Selector */}
        <div
          role="tablist"
          aria-label="Select a Canon Entry Door"
          className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FOUR_ENTRY_DOORS.map((door, doorIdx) => {
            const isSelected = door.id === activeDoor.id;
            return (
              <SpatialTiltCard key={door.id} disabled={quietMode} maxTiltDeg={4}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onKeyDown={(event) => handleDoorKeyDown(event, doorIdx)}
                  onClick={() => onSelectDoor(door.id)}
                  className={`flex h-full w-full min-h-[44px] flex-col justify-between border p-5 text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-[#e6c987] bg-gradient-to-b from-[#d6b46c]/18 via-[#d6b46c]/8 to-transparent shadow-[0_0_28px_rgba(214,180,108,0.16)]"
                      : "border-[#d6b46c]/20 bg-[#0b0d16]/75 hover:border-[#d6b46c]/55 hover:bg-[#d6b46c]/8"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#d6b46c]">
                      <span>{door.numeral}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.16em] text-[#f6dd9e] uppercase">
                          <DiamondStarOrnament className="h-3 w-3" /> OPEN
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-serif text-sm tracking-[0.14em] text-[#fff6df] uppercase">
                      {door.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#bfb59e]">{door.subtitle}</p>
                  </div>
                  <div className="mt-3 border-t border-[#d6b46c]/15 pt-2 font-mono text-[10px] text-[#9f9580]">
                    {door.sourceSpec}
                  </div>
                </button>
              </SpatialTiltCard>
            );
          })}
        </div>

        {/* Active Door Banner & Mounted Chamber */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="mt-8 border border-[#d6b46c]/35 bg-[#060810]/95 p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/20 pb-4">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-[#dfc07b] uppercase">
                  {activeDoor.numeral} // {activeDoor.title}
                </div>
                <p className="mt-1 font-serif text-sm text-[#e6decb]">{activeDoor.summary}</p>
              </div>
              <span className="border border-[#d6b46c]/35 bg-[#d6b46c]/10 px-3 py-1 font-mono text-[11px] text-[#f8eac6]">
                SOURCE: {activeDoor.sourceSpec}
              </span>
            </div>

            {activeDoor.id === "story-universe" && <DoorUniversePanel quietMode={quietMode} />}
            {activeDoor.id === "epistemic-corpus" && <DoorEpistemicPanel quietMode={quietMode} />}
            {activeDoor.id === "empire-organization" && <DoorOrganizationPanel />}
            {activeDoor.id === "sovereign-runtimes" && <DoorSovereignPanel />}
          </div>
        </ScrollChapterReveal>
      </div>
    </section>
  );
}
