"use client";

import Image from "next/image";
import Link from "next/link";
import { artSrc } from "@/lib/art";
import { ArrowRight, Crown, SafetyPin, SprayCan } from "@moonwitness/ui/icons";
import { DistressedSticker, Staple, TactileTape, Button } from "@moonwitness/ui";

export function Signals() {
  return (
    <section id="signals" className="relative mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-dashed border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SprayCan className="h-5 w-5 text-[var(--pink)]" />
            <span className="font-mono text-xs font-black tracking-widest text-[var(--accent)]">
              FREQUENCY LOGS // PIRATE FEED
            </span>
          </div>
          <h2 className="cmyk-slip font-brush text-4xl text-[var(--foreground)] sm:text-5xl">
            THE <span className="brush-underline text-[var(--primary)]">SIGNALS</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <DistressedSticker variant="foil" text="FICTIONAL STORIES" className="rotate-2" />
          <Crown className="h-8 w-11 text-[var(--yellow)] rotate-6" />
        </div>
      </div>

      {/* Street Flyer Paste-Up Grid: Asymmetric offsets with tactiles */}
      <div className="grid gap-8 md:grid-cols-3">
        <article className="zine-card-rough photocopy-grit group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:rotate-[-0.5deg] md:-rotate-1">
          <Staple className="top-2 left-3 -rotate-12" />
          <TactileTape
            variant="yellow"
            label="STORYWORLD"
            width={90}
            className="-top-1 -right-4 rotate-12 text-[9px]"
          />
          <div className="relative h-48 overflow-hidden bg-[var(--muted)]">
            <Image
              src={artSrc("signal-tunnel")}
              alt="Illustrated tunnel scene from a fictional Moonwitness story"
              fill
              className="duo-img object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <span className="sticker sticker-pink absolute left-3 top-3 px-3 py-1 font-brush text-xs rotate-[-2deg] shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
              FICTIONAL SIGNAL
            </span>
          </div>
          <div className="flex flex-1 flex-col bg-[var(--card)] p-5 text-[var(--card-foreground)]">
            <h3 className="cmyk-slip font-brush text-2xl leading-tight text-[var(--card-foreground)] tracking-wide">
              A SIGNAL FROM BELOW
            </h3>
            <p className="mt-2 flex-1 font-mono text-xs leading-relaxed text-[var(--muted-foreground)]">
              A story from the Moonwitness storyworld. Strange sounds. A deeper current. What are we
              really hearing?
            </p>
            <Link href="/dock" className="mt-4 inline-block">
              <Button className="min-h-11 px-5 py-2.5 text-sm">
                READ SIGNAL STORY <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </article>

        <article className="zine-card-rough photocopy-grit group relative flex flex-col overflow-hidden transition-all duration-300 md:rotate-1 hover:rotate-0 hover:-translate-y-2">
          <Staple className="top-2 left-3 -rotate-12" />
          <TactileTape
            variant="yellow"
            label="COLLAB_WALL"
            width={95}
            className="-top-1 -right-3 rotate-12 text-[9px]"
          />

          <div className="relative h-48 overflow-hidden bg-[var(--muted)]">
            <Image
              src={artSrc("crew-rooftop")}
              alt="Three friends on a rooftop under the same moon"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <span className="sticker sticker-yellow absolute left-3 top-3 px-3 py-1 font-brush text-xs rotate-[-3deg] shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
              STORYTELLING
            </span>
            <SafetyPin className="absolute bottom-2 right-2 h-7 w-7 text-[var(--foreground)]/45 rotate-45" />
          </div>
          <div className="flex flex-1 flex-col bg-[var(--card)] p-5 text-[var(--card-foreground)]">
            <h3 className="cmyk-slip font-brush text-2xl leading-tight text-[var(--card-foreground)]">
              STORIES. BIGGER HORIZONS.
            </h3>
            <p className="mt-2 flex-1 font-mono text-xs leading-relaxed text-[var(--muted-foreground)]">
              Fictional story fragments from the Moonwitness storyworld.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
              <Link href="/dock">
                <Button className="min-h-11 px-5 py-2.5 text-sm">
                  EXPLORE STORIES <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                TAG: #ROOFTOP
              </span>
            </div>
          </div>
        </article>

        <article className="zine-card-rough photocopy-grit group relative flex flex-col overflow-hidden transition-all duration-300 md:-rotate-1 hover:rotate-0 hover:-translate-y-2">
          <Staple className="top-2 right-3 rotate-45" />
          <TactileTape
            variant="black"
            label="SEALED"
            width={80}
            className="-top-1 left-2 -rotate-12 text-[9px]"
          />

          <div className="relative h-48 overflow-hidden bg-[var(--muted)]">
            <Image
              src={artSrc("city-shadow")}
              alt="A hooded witness overlooking the city at night"
              fill
              className="object-cover object-[70%_center] transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <span className="sticker sticker-pink absolute left-3 top-3 px-3 py-1 font-brush text-xs rotate-2 shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
              THE SHADOW
            </span>
          </div>
          <div className="flex flex-1 flex-col bg-[var(--card)] p-5 text-[var(--card-foreground)]">
            <h3 className="cmyk-slip font-brush text-2xl leading-tight text-[var(--card-foreground)]">
              NOT EVERYTHING IS VISIBLE.
            </h3>
            <p className="mt-2 flex-1 font-mono text-xs leading-relaxed text-[var(--muted-foreground)]">
              Fictional signals, invented connections, and scenes from the Moonwitness storyworld.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
              <Link href="/dock">
                <Button className="min-h-11 px-5 py-2.5 text-sm">
                  ACCESS ARCHIVE <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="font-mono text-[10px] text-[var(--red)] font-bold">
                STORYWORLD ARCHIVE
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
