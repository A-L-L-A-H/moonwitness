"use client";

import Image from "next/image";
import { ARTWORK } from "@moonwitness/assets";
import type { ArtKey } from "@moonwitness/types";
import { SprayCan } from "@moonwitness/ui/icons";
import {
  Halftone,
  Staple,
  TactileTape,
  ScenePage,
  ScenePanel,
  ChapterBanner,
  FilmStrip,
} from "@moonwitness/ui";
import { artSrc } from "@/lib/art";
import { useScrollReveal } from "@/lib/motion/use-scroll-reveal";

interface StoryUnit {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  excerpt: string;
  art: ArtKey;
  marginalia: string;
  rotation: number;
}

const STORIES: StoryUnit[] = [
  {
    id: "s1",
    tag: "PEOPLE",
    tagColor: "var(--pink)",
    title: "THE BATTERIES",
    excerpt:
      "A garage band in Jakarta channels something older than rock'n'roll — frequencies that predate electricity.",
    art: "night-shift",
    marginalia: "// jakarta // night session",
    rotation: -1.5,
  },
  {
    id: "s2",
    tag: "PLACES",
    tagColor: "var(--blue)",
    title: "NEON CITIES",
    excerpt:
      "Mapping the underground circuit of cities that never sleep — Seoul, Istanbul, Lagos. The skyline tells a different story at 3 AM.",
    art: "city-shadow",
    marginalia: "// skyline // 3am frequency",
    rotation: 1,
  },
  {
    id: "s3",
    tag: "STORIES",
    tagColor: "var(--yellow)",
    title: "PENDETA ONLINE",
    excerpt:
      "A spiritual guide in rural Malaysia receives what he calls ‘signals from the other side’ — transmitted through prayer and radio static.",
    art: "signal-sky",
    marginalia: "// prayer × radio // malay realm",
    rotation: -0.8,
  },
  {
    id: "s4",
    tag: "WORLDS",
    tagColor: "var(--purple)",
    title: "ZILL",
    excerpt:
      "A fiction project that reads like a field report. A city that might not exist, documented by someone who swears they were there.",
    art: "mirror-archive",
    marginalia: "// urban legend or // field report?",
    rotation: 1.2,
  },
];

const SETTLE_S = 0.55;
const STAGGER_S = 0.1;

export function Storytelling() {
  const [revealRef, revealed] = useScrollReveal(0.1, "0px 0px -40px 0px");

  return (
    <section
      id="storytelling"
      className="relative scroll-mt-20 overflow-x-clip bg-[var(--ink)] py-24"
    >
      <Halftone tone="pink" className="pointer-events-none absolute inset-0 opacity-20" />

      <div ref={revealRef} className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <ScenePage>
          <ChapterBanner
            chapter="01"
            meta={
              <span className="flex items-center gap-2">
                <SprayCan className="h-5 w-5 text-[var(--pink)]" />
                STORY WORLD // FICTION FILES
              </span>
            }
            title={
              <>
                STRANGE PEOPLE.{" "}
                <span className="text-[var(--pink)] brush-underline">BIGGER HORIZONS.</span>
              </>
            }
          />
          <FilmStrip label="Story chapters">
            {STORIES.map((story, i) => (
              <a
                key={story.id}
                href={`#story-${story.id}`}
                className="group block border border-[var(--line)] bg-[var(--panel)] focus-visible:outline-2 focus-visible:outline-[var(--yellow)]"
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={artSrc(story.art)}
                    alt=""
                    fill
                    sizes="224px"
                    className="object-cover grayscale transition-[filter] group-hover:grayscale-0 motion-reduce:transition-none"
                  />
                </div>
                <span className="block min-h-11 px-3 py-3 font-mono text-xs text-[var(--paper)]">
                  0{i + 1} / {story.title}
                </span>
              </a>
            ))}
          </FilmStrip>
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-5">
            {STORIES.map((story, i) => {
              const artRight = i % 2 === 1;
              const art = ARTWORK[story.art];
              return (
                <div
                  key={story.id}
                  data-story-unit
                  className={`min-w-0 transition-[opacity,transform] ease-[var(--ease-ink-out)] motion-reduce:transition-none ${i === 0 ? "lg:col-span-3" : ""}`}
                  style={{
                    transitionDuration: `${SETTLE_S}s`,
                    transitionDelay: `${i * STAGGER_S}s`,
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? "none" : `translateX(${artRight ? 40 : -40}px)`,
                  }}
                >
                  <div style={{ transform: `rotate(${story.rotation}deg)` }}>
                    <ScenePanel
                      id={`story-${story.id}`}
                      aria-labelledby={`story-title-${story.id}`}
                      scrim={artRight ? "left" : "right"}
                      className="group scroll-mt-28"
                      art={
                        <Image
                          src={artSrc(story.art)}
                          alt=""
                          fill
                          loading={i === 0 ? "eager" : undefined}
                          sizes={
                            i === 0
                              ? "(min-width: 1280px) 1200px, 100vw"
                              : "(min-width: 1024px) 33vw, 100vw"
                          }
                          className="object-cover"
                          style={{ objectPosition: art.position }}
                        />
                      }
                      effects={
                        <>
                          <Staple className="-top-1 left-5 z-10 -rotate-12" />
                          <TactileTape
                            variant="black"
                            label={story.tag}
                            width={70}
                            className="-top-2 right-4 z-10 rotate-3 text-[9px]"
                          />
                        </>
                      }
                    >
                      <div
                        className={`flex min-h-[26rem] flex-col justify-end px-6 py-8 @[40rem]:min-h-[30rem] @[40rem]:px-10 ${artRight ? "" : "@[40rem]:items-end"}`}
                      >
                        <div className="max-w-md">
                          <span
                            className="font-mono text-xs font-black tracking-widest"
                            style={{ color: story.tagColor }}
                          >
                            [{story.tag}] / 0{i + 1}
                          </span>
                          <h3
                            id={`story-title-${story.id}`}
                            className="cmyk-slip mt-3 font-brush text-4xl leading-tight text-[var(--paper)] @[40rem]:text-5xl"
                          >
                            {story.title}
                          </h3>
                          <p className="mt-4 font-mono text-sm leading-relaxed text-[var(--paper)]">
                            {story.excerpt}
                          </p>
                          <p
                            aria-hidden="true"
                            className="mt-6 font-hand text-sm text-[var(--yellow)]"
                          >
                            {story.marginalia}
                          </p>
                        </div>
                      </div>
                    </ScenePanel>
                  </div>
                </div>
              );
            })}
          </div>
        </ScenePage>
      </div>
    </section>
  );
}
