"use client";

import { DiamondStarOrnament } from "@moonwitness/ui/imperium";
import { FOUR_ENTRY_DOORS, SUPREME_IDENTITY, type EntryDoorId } from "@/data/empire-canon-codex";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { DoorEpistemicPanel } from "./canon-doors/door-epistemic-panel";
import { DoorOrganizationPanel } from "./canon-doors/door-organization-panel";
import { DoorSovereignPanel } from "./canon-doors/door-sovereign-panel";
import { DoorUniversePanel } from "./canon-doors/door-universe-panel";
import { ScrollChapterReveal, SpatialTiltCard } from "./motion-primitives";
import { DoorPortalGlyph } from "./sacred-illustrations";
import { CodexWorkbench } from "./codex-workbench";

export function CanonCodexSanctum({
  activeDoorId,
  quietMode = false,
  onSelectDoor,
}: {
  readonly activeDoorId: EntryDoorId;
  readonly quietMode?: boolean;
  readonly onSelectDoor: (doorId: EntryDoorId) => void;
}) {
  const { locale } = useSanctuaryLocale();
  const activeDoor =
    FOUR_ENTRY_DOORS.find((door) => door.id === activeDoorId) ?? FOUR_ENTRY_DOORS[0]!;

  const handleDoorKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
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
      className="scroll-mt-16 relative bg-gradient-to-b from-[#040509]/95 via-[#080b13]/90 to-[#05060a]/95 py-24 px-4 sm:px-8 lg:px-16"
    >
      <div className="wrap mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="flex flex-col items-center text-center">
            <div className="font-monument flex items-center gap-4 text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
              <span>A-L-L-A-H · {SUPREME_IDENTITY.fullExpansion}</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
            </div>
            <h2
              id="codex-heading"
              className="font-monument mt-4 text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
            >
              {locale === "id" ? "KODEKS KANON" : "THE CANON CODEX"}
            </h2>
            <p className="mt-3 max-w-3xl font-serif text-base sm:text-lg text-[#e6decb] leading-relaxed">
              {locale === "id"
                ? "Empat pintu galeri arsitektur yang mengorganisasi kronik MoonWitness, kajian netral lintas Taurat, Zabur, Injīl & Al-Qur’ān, etika amanah manusia tanpa kultus, dan ekosistem multi-runtime."
                : "Four architectural gallery doors organizing MoonWitness chronicles, neutral comparative study across Taurat, Zabur, Injīl & Al-Qur’ān, unassigned human stewardship ethics, and the unified multi-runtime ecosystem."}
            </p>
            <div className="mt-3 font-mono text-[11px] tracking-[0.16em] text-[#f5dfa6]">
              {SUPREME_IDENTITY.tawhidPrinciple}
            </div>
          </div>
        </ScrollChapterReveal>

        {/* 4 Archway Portal Entry Doors Selector */}
        <div
          role="tablist"
          aria-label="Select a Canon Entry Door"
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
                  className={`portal-arch-card relative flex h-full w-full min-h-[44px] flex-col justify-between border px-5 pt-7 pb-5 text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-[#fff4d2] bg-gradient-to-b from-[#d6b46c]/22 via-[#0e1320]/90 to-[#060810] shadow-[0_0_32px_rgba(223,192,123,0.22)]"
                      : "border-[#d6b46c]/25 bg-[#090c16]/85 hover:border-[#d6b46c]/60 hover:bg-[#d6b46c]/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#d6b46c]">
                      <div className="flex items-center gap-2.5">
                        <DoorPortalGlyph doorId={door.id} active={isSelected} />
                        <span>{door.numeral}</span>
                      </div>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.16em] text-[#fff4d2] uppercase">
                          <DiamondStarOrnament className="h-3 w-3" /> OPEN
                        </span>
                      )}
                    </div>
                    <h3 className="font-monument mt-3.5 text-sm tracking-[0.14em] text-[#fff6df] uppercase">
                      {door.title}
                    </h3>
                    <p className="mt-1.5 font-sans text-xs text-[#cfc5b0] leading-relaxed">
                      {door.subtitle}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-[#d6b46c]/15 pt-2.5 font-mono text-[10px] text-[#9f9580]">
                    {door.sourceSpec}
                  </div>
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-4 left-1/2 h-4 w-px -translate-x-1/2 bg-gradient-to-b from-[#fff4d2] to-transparent"
                    />
                  )}
                </button>
              </SpatialTiltCard>
            );
          })}
        </div>

        {/* Active Door Banner & Mounted Chamber */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="octa-bevel-shell relative mt-8 p-6 sm:p-9">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/20 pb-4">
              <div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-[#dfc07b] uppercase">
                  {activeDoor.numeral} // {activeDoor.title}
                </div>
                <p className="mt-1 font-serif text-base text-[#e6decb]">{activeDoor.summary}</p>
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

          <CodexWorkbench />
        </ScrollChapterReveal>
      </div>
    </section>
  );
}
