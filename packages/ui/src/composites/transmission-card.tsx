"use client";

import { useEffect, useState } from "react";
import { CassetteTape, PauseIcon, PlayIcon } from "../icons";
import { ZineImage } from "../primitives/zine-image";
import { SkinOrnament } from "../primitives/tactile-hardware";
import { useSkin } from "../skin";

export interface TransmissionCardProps {
  /** Artwork key for the image */
  image?: string;
  /** Title displayed on the card */
  title: string;
  /** Excerpt text */
  excerpt?: string;
  durationSeconds?: number;
  /** Sticker label */
  label?: string;
}

/** Kartu transmisi berdurasi: timer dan state putar/jeda murni internal dengan tactile riot aesthetics. */
export function TransmissionCard({
  image,
  title,
  excerpt,
  durationSeconds = 204,
  label = "TRANSMISSION 001",
}: TransmissionCardProps) {
  const { skin } = useSkin();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= durationSeconds) {
          setPlaying(false);
          return durationSeconds;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, durationSeconds]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <article
      data-skin={skin}
      className="zine-card-rough group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
    >
      <SkinOrnament slot="corner" className="top-2 left-3 z-20" />
      <SkinOrnament
        slot="tag"
        label="LEAKED AUDIO"
        className="absolute top-2 right-3 z-20 text-[9px]"
      />

      <div className="relative h-48 overflow-hidden bg-[var(--background)]">
        {image && (
          <ZineImage
            art={image}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="duo-img transition-transform duration-700 group-hover:scale-110"
          />
        )}
        <span className="duo-tint" />

        {/* Vintage Cassette watermark */}
        <CassetteTape className="pointer-events-none absolute right-3 top-10 h-7 w-12 text-white/20" />

        <span className="sticker sticker-pink absolute left-3 top-3 px-3 py-1 font-brush text-xs rotate-[-2deg] shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
          {label}
        </span>
        <button
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? "Pause transmission" : "Play transmission"}
          className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--background)]/85 text-[var(--primary)] shadow-[0_0_12px_rgba(255,210,31,0.35)] backdrop-blur transition hover:scale-110 hover:border-[var(--primary)]"
        >
          {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="ml-0.5 h-5 w-5" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col bg-[var(--card)] p-5">
        <h3 className="cmyk-slip font-brush text-2xl leading-tight tracking-wide text-[var(--card-foreground)]">
          {title.toUpperCase()}
        </h3>
        {excerpt && (
          <p className="mt-2 flex-1 font-mono text-xs leading-relaxed text-[var(--muted-foreground)]">
            {excerpt}
          </p>
        )}
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <div
            className="h-2 w-full overflow-hidden border border-[var(--border)] bg-[var(--background)]"
            role="progressbar"
            aria-valuenow={elapsed}
            aria-valuemin={0}
            aria-valuemax={durationSeconds}
            aria-label="Transmission progress"
          >
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-[width] duration-300"
              style={{ width: `${(elapsed / durationSeconds) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[var(--muted-foreground)]">
            <span className={playing ? "font-bold text-[var(--primary)] animate-pulse" : ""}>
              {playing
                ? "▶ BROADCASTING FREQUENCY…"
                : elapsed >= durationSeconds
                  ? "TRANSMISSION ENDED"
                  : "STANDBY FOR SIGNAL"}
            </span>
            <span className="font-bold text-[var(--foreground)]">
              {fmt(elapsed)} / {fmt(durationSeconds)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
