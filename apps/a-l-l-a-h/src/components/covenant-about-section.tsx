"use client";

import { useState } from "react";
import { COVENANT_PILLARS, type WorldIdentifier } from "@/data/empire-registry";
import {
  MagneticPortal,
  ScrollChapterReveal,
  SpatialTiltCard,
  triggerSacredViewTransition,
} from "./motion-primitives";
import { RemembranceSanctuary } from "./remembrance-sanctuary";
import { DiamondStarOrnament, OctagramMandalaIcon } from "./sacred-icons";
import { AstrolabeSealMedallion } from "./sacred-illustrations";

export function CovenantAboutSection({
  quietMode = false,
  capabilityStatusLabel = "LIVING LIGHT · WEBGL2",
  onReplayEntrance,
  onToggleQuietMode,
  onSelectWorld,
  onReturnToGate,
}: {
  readonly quietMode?: boolean;
  readonly capabilityStatusLabel?: string;
  readonly onReplayEntrance?: () => void;
  readonly onToggleQuietMode?: () => void;
  readonly onSelectWorld?: (worldId: WorldIdentifier) => void;
  readonly onReturnToGate: () => void;
}) {
  const [focusedPillar, setFocusedPillar] = useState<string>(COVENANT_PILLARS[0]?.numeral ?? "I");

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-16 relative border-t border-[#d6b46c]/25 bg-gradient-to-b from-[#05060b]/95 via-[#090c16]/90 to-[#030407] pt-24 pb-16 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="flex flex-col items-center text-center">
            <AstrolabeSealMedallion className="h-20 w-20" spin={!quietMode} />
            <div className="mt-4 flex items-center gap-4 font-monument text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
              <span>IN THE NAME OF ALLAH</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
            </div>
            <h2
              id="about-heading"
              className="font-monument mt-4 text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
            >
              ARCHITECTURE OF THE LIGHT
            </h2>
            <p className="mt-4 max-w-2xl font-serif text-base sm:text-lg leading-relaxed text-[#dfd6c3]/90">
              A-L-L-A-H.COM is designed as a luminous sanctuary where remembrance, rigorous
              knowledge, and masterful creation converge into a single harmonious civilization.
            </p>
          </div>
        </ScrollChapterReveal>

        {/* Three Stepped Archway Pillars of the Covenant */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
            {COVENANT_PILLARS.map((pillarEntry, pillarIdx) => {
              const isFocused = focusedPillar === pillarEntry.numeral;
              const isCenterArch = pillarIdx === 1;
              return (
                <SpatialTiltCard
                  key={pillarEntry.numeral}
                  disabled={quietMode}
                  maxTiltDeg={3.5}
                  className={isCenterArch ? "md:-translate-y-4" : ""}
                >
                  <button
                    type="button"
                    aria-pressed={isFocused}
                    onClick={() =>
                      triggerSacredViewTransition(() => {
                        setFocusedPillar(pillarEntry.numeral);
                      }, quietMode)
                    }
                    className={`portal-arch-card relative flex h-full w-full flex-col items-center border px-8 pt-10 pb-8 text-center shadow-[0_16px_48px_rgba(0,0,0,0.75)] transition-colors cursor-pointer ${
                      isFocused
                        ? "border-[#fff4d2] bg-gradient-to-b from-[#d6b46c]/16 via-[#0c101b] to-[#070910]"
                        : "border-[#d6b46c]/30 bg-[#080a12]/90 hover:border-[#d6b46c]/60"
                    }`}
                  >
                    <div
                      className={`font-monument mx-auto flex h-11 w-11 items-center justify-center rounded-full border text-sm tracking-[0.1em] transition-colors ${
                        isFocused
                          ? "border-[#fff4d2] bg-[#d6b46c]/25 text-[#fff8e6]"
                          : "border-[#d6b46c]/50 bg-[#d6b46c]/10 text-[#f8eac6]"
                      }`}
                    >
                      {pillarEntry.numeral}
                    </div>
                    <h3 className="font-monument mt-5 text-lg tracking-[0.2em] text-[#fff6df]">
                      {pillarEntry.heading}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] tracking-[0.16em] text-[#d6b46c] uppercase">
                      {pillarEntry.subtitle}
                    </p>
                    <p className="mt-4 font-serif text-base leading-relaxed text-[#dfd6c2]">
                      {pillarEntry.statement}
                    </p>
                  </button>
                </SpatialTiltCard>
              );
            })}
          </div>
        </ScrollChapterReveal>

        {/* Sanctuary of Remembrance, 9 Luminous Attributes, Tasbih Counter & Breath Guide */}
        <RemembranceSanctuary quietMode={quietMode} onNavigateToWorld={onSelectWorld} />

        {/* Return to Gate Ornament & Experience Controls */}
        <div className="mt-16 flex flex-col items-center">
          <MagneticPortal disabled={quietMode} maxOffsetPx={6}>
            <button
              type="button"
              onClick={onReturnToGate}
              className="btn-chamfer font-monument px-8 py-3 text-xs sm:text-sm tracking-[0.25em] text-[#f8eac6] uppercase hover:text-white cursor-pointer"
            >
              ASCEND TO THE GATE &uarr;
            </button>
          </MagneticPortal>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {onReplayEntrance && (
              <button
                type="button"
                onClick={onReplayEntrance}
                className="min-h-[44px] border border-[#d6b46c]/35 bg-[#080a12]/80 px-5 py-2 font-mono text-[11px] tracking-[0.18em] text-[#e6decb] uppercase hover:border-[#f8eac6] hover:text-white transition-colors cursor-pointer"
              >
                REPLAY ENTRANCE
              </button>
            )}
            {onToggleQuietMode && (
              <button
                type="button"
                aria-pressed={quietMode}
                onClick={onToggleQuietMode}
                className="min-h-[44px] border border-[#d6b46c]/35 bg-[#080a12]/80 px-5 py-2 font-mono text-[11px] tracking-[0.18em] text-[#dfc07b] uppercase hover:border-[#f8eac6] hover:text-white transition-colors cursor-pointer"
              >
                {quietMode ? "ENABLE LIVING LIGHT SHADERS" : "QUIET CONTEMPLATIVE MODE"}
              </button>
            )}
          </div>

          <div className="mt-10 flex w-full max-w-xl items-center justify-center gap-3 text-[#d6b46c]/70">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d6b46c]/50 to-[#d6b46c]" />
            <DiamondStarOrnament className="h-4 w-4 text-[#f8eac6]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d6b46c]/50 to-[#d6b46c]" />
          </div>

          <footer className="mt-8 flex w-full flex-col items-center justify-between gap-4 border-t border-[#d6b46c]/15 pt-6 text-[11px] tracking-[0.22em] text-[#cfc5b0]/80 uppercase sm:flex-row">
            <div className="flex items-center gap-3">
              <OctagramMandalaIcon className="h-6 w-6" />
              <span>A-L-L-A-H.COM &middot; EMPIRE OF THE LIGHT</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#dfc07b]">
              {capabilityStatusLabel}
            </div>
            <div>DREAM &middot; EXPLORE &middot; CREATE</div>
          </footer>
        </div>
      </div>
    </section>
  );
}
