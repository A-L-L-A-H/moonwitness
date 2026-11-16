import Image from "next/image";
import Link from "next/link";
import { Crown, Splatter, Star4 } from "@moonwitness/ui/icons";
import {
  DistressedSticker,
  Staple,
  TactileTape,
  Button,
  CornerBrackets,
  Gauge,
} from "@moonwitness/ui";
import type { Project } from "@moonwitness/types";
import { artSrc } from "@/lib/art";
import { AtmosphereField } from "@/components/atmosphere";

export function CommandHero({ project }: { project: Project }) {
  return (
    <div className="grain relative overflow-hidden border-b-2 border-black bg-black">
      <Image
        src={artSrc("shadow-command-hero")}
        alt=""
        fill
        priority
        quality={82}
        sizes="(max-width: 1024px) 100vw, 80vw"
        className="object-cover object-[72%_42%] filter contrast-110"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[color-mix(in_srgb,var(--ink)_96%,transparent)] via-[color-mix(in_srgb,var(--ink)_70%,transparent)] to-[color-mix(in_srgb,var(--ink)_8%,transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--ink)_90%,transparent)] via-transparent to-transparent" />
      <AtmosphereField
        variant="hero"
        interactive
        className="inset-0 z-[1] mix-blend-screen opacity-40"
      />
      <Splatter className="absolute -left-6 top-6 h-40 w-40 text-[var(--pink)] opacity-70" />
      <Staple className="left-4 top-3 -rotate-45" />
      <TactileTape
        variant="yellow"
        label="EMPIRE OF THE LIGHT"
        width={190}
        className="-top-1 right-8 hidden rotate-2 text-[10px] sm:flex"
      />
      <Star4 className="absolute right-[34%] top-10 hidden h-6 w-6 text-[var(--yellow)] opacity-70 lg:block" />

      <div className="relative z-10 grid gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <DistressedSticker variant="hazard" text="SAME MOON DIFFERENT PEOPLE" />
            <DistressedSticker
              variant="barcode"
              code={`${project.progress}% COMPLETE`}
              className="rotate-2"
            />
          </div>
          <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-[var(--yellow)]">
            EMPIRE OF THE LIGHT // A-L-L-A-H
          </p>
          <h1
            id="cc-top"
            className="cmyk-slip mt-2 max-w-full scroll-mt-24 font-brush text-4xl leading-[0.95] tracking-tight text-[var(--paper)] sm:text-5xl xl:text-6xl"
          >
            <span className="block">SHADOW</span>
            <span className="block text-[var(--pink)]">COMMAND CENTER</span>
          </h1>
          <p className="mt-4 font-mono text-[11px] font-bold tracking-[0.18em] text-zinc-300">
            MOONWITNESS // PRIVATE // CREATE · CURATE · DEPLOY
          </p>
        </div>

        <CornerBrackets className="min-w-0">
          <aside className="relative min-w-0 border-2 border-[var(--yellow)] bg-[color-mix(in_srgb,var(--ink)_90%,transparent)] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.7)]">
            <TactileTape
              variant="black"
              label="FEATURED PROJECT"
              width={150}
              className="-top-2 right-4 rotate-2 text-[9px]"
            />
            <div className="flex items-start justify-between gap-3 pt-2">
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-bold tracking-widest text-[var(--yellow)]">
                  THE BATTERIES
                </p>
                <p className="mt-1 font-brush text-2xl leading-tight text-white">
                  {project.title.toUpperCase()}
                </p>
              </div>
              <Crown className="h-5 w-8 shrink-0 -rotate-12 text-[var(--yellow)]" />
            </div>
            <p className="mt-2 font-mono text-[11px] tracking-widest text-zinc-300">
              {project.status.toUpperCase()} // STORY WORLD
            </p>
            <Gauge
              className="mt-3"
              label="Story progress"
              value={`${project.progress}%`}
              percent={project.progress}
            />
            <Button
              asChild
              className="mt-4 min-h-11 w-full justify-between gap-2 px-4 py-2.5 text-sm"
            >
              <Link href={`/dock?q=${encodeURIComponent(project.title)}`}>
                OPEN PROJECT <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </aside>
        </CornerBrackets>
      </div>

      <Crown className="absolute right-[6%] top-10 hidden h-10 w-14 -rotate-12 text-[var(--yellow)] md:block" />
    </div>
  );
}
