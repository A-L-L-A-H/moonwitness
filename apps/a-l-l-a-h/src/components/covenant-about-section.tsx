"use client";

import { COVENANT_PILLARS } from "@/data/empire-registry";
import { DiamondStarOrnament, OctagramMandalaIcon, PortalAstrolabeIcon } from "./sacred-icons";

export function CovenantAboutSection({
  onReturnToGate,
}: {
  readonly onReturnToGate: () => void;
}) {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative border-t border-[#d6b46c]/25 bg-gradient-to-b from-[#05060b] via-[#090c16] to-[#030407] pt-24 pb-16 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <PortalAstrolabeIcon className="h-20 w-20 animate-spin-slow" />
          <div className="mt-4 flex items-center gap-4 text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
            <span>IN THE NAME OF ALLAH</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
          </div>
          <h2
            id="about-heading"
            className="mt-4 font-serif text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
          >
            ARCHITECTURE OF THE LIGHT
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-base sm:text-lg leading-relaxed text-[#dfd6c3]/90">
            A-L-L-A-H.COM is designed as a luminous sanctuary where remembrance, rigorous
            knowledge, and masterful creation converge into a single harmonious civilization.
          </p>
        </div>

        {/* Three Pillars of the Covenant */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {COVENANT_PILLARS.map((pillarEntry) => (
            <div
              key={pillarEntry.numeral}
              className="relative border border-[#d6b46c]/30 bg-[#080a12]/90 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#d6b46c]/50 bg-[#d6b46c]/10 font-serif text-sm tracking-[0.1em] text-[#f8eac6]">
                {pillarEntry.numeral}
              </div>
              <h3 className="mt-5 font-serif text-lg tracking-[0.2em] text-[#fff6df]">
                {pillarEntry.heading}
              </h3>
              <p className="mt-1 text-xs tracking-[0.16em] text-[#d6b46c] uppercase">
                {pillarEntry.subtitle}
              </p>
              <p className="mt-4 font-serif text-sm leading-relaxed text-[#cfc6b2]">
                {pillarEntry.statement}
              </p>
            </div>
          ))}
        </div>

        {/* Return to Gate Ornament */}
        <div className="mt-16 flex flex-col items-center">
          <button
            type="button"
            onClick={onReturnToGate}
            className="btn-chamfer px-8 py-3 font-serif text-xs sm:text-sm tracking-[0.25em] text-[#f8eac6] uppercase hover:text-white transition-all cursor-pointer"
          >
            ASCEND TO THE GATE &uarr;
          </button>

          <div className="mt-10 flex w-full max-w-xl items-center justify-center gap-3 text-[#d6b46c]/70">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d6b46c]/50 to-[#d6b46c]" />
            <DiamondStarOrnament className="h-4 w-4 text-[#f8eac6]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d6b46c]/50 to-[#d6b46c]" />
          </div>

          <footer className="mt-8 flex w-full flex-col items-center justify-between gap-4 border-t border-[#d6b46c]/15 pt-6 text-[11px] tracking-[0.24em] text-[#cfc5b0]/80 uppercase sm:flex-row">
            <div className="flex items-center gap-3">
              <OctagramMandalaIcon className="h-6 w-6" />
              <span>A-L-L-A-H.COM &middot; EMPIRE OF THE LIGHT</span>
            </div>
            <div>DREAM &middot; EXPLORE &middot; CREATE</div>
          </footer>
        </div>
      </div>
    </section>
  );
}
