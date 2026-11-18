"use client";

import Image from "next/image";
import { artSrc } from "@/lib/art";
import { DistressedSticker, Grain } from "@moonwitness/ui";
import { Splatter, Star4 } from "@moonwitness/ui/icons";

export function DockHero({ visibleCount, total }: { visibleCount: number; total: number }) {
  return (
    <div className="relative overflow-hidden border-b-2 border-[var(--border)]">
      <Grain />
      <Image
        src={artSrc("dock-chronicle-hero")}
        alt=""
        fill
        priority
        quality={82}
        className="object-cover object-[62%_45%]"
        sizes="(max-width: 1024px) 100vw, 80vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[rgba(11,11,16,0.95)] via-[rgba(11,11,16,0.66)] to-[rgba(11,11,16,0.2)]" />
      <Splatter className="absolute -left-6 top-4 h-32 w-32 text-[var(--primary)] opacity-60" />
      <Star4 className="absolute right-[28%] top-8 hidden h-6 w-6 text-[var(--primary)] opacity-70 md:block" />
      <div className="relative z-10 grid gap-6 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--primary)]">
            ARCHIVE // PUBLIC RECORD
          </p>
          <h1 className="mt-2 font-brush text-4xl leading-none text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] sm:text-6xl">
            DOCK <span className="text-[var(--muted-foreground)]">//</span>{" "}
            <span className="text-[var(--primary)]">TIMELINE</span> CHRONICLE
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--foreground)]">
            A public chronology of projects, stories, signals, and moments across the Empire.
            Different people. Same sky. Many stories.
          </p>
          <p className="mt-2 text-[11px] font-semibold tracking-wide text-[var(--primary)]">
            STORY-WORLD DEMO DATA // NOT VERIFIED REAL-WORLD REPORTING
          </p>
        </div>
        <div className="flex min-w-0 flex-col items-start gap-3 lg:items-end">
          <div className="hidden flex-wrap gap-2 sm:flex lg:justify-end">
            <DistressedSticker variant="hazard" text="SAME MOON DIFFERENT PEOPLE" />
            <DistressedSticker variant="barcode" code="STORIES IN MOTION" className="rotate-2" />
          </div>
          <div className="w-full shrink-0 border-2 border-[var(--yellow)] bg-[var(--yellow)] px-5 py-3 text-left text-black shadow-[4px_4px_0_rgba(0,0,0,0.6)] sm:w-auto lg:min-w-[180px] lg:text-right">
            <div className="font-brush text-4xl leading-none">
              {visibleCount}
              <span className="text-2xl">/{total}</span>
            </div>
            <div className="mt-1 font-mono text-[11px] font-bold tracking-widest">
              EVENTS VISIBLE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
