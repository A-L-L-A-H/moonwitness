import React from "react";
import { getDnaWorld, type MasterDnaId } from "../skin/dna-worlds";

export interface HeroIllustrationProps {
  title?: string;
  className?: string;
}

export function HeroIllustration({
  title = "Cosmic Horizon Sanctuary",
  className = "",
}: HeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 140"
      role="img"
      aria-label={title}
      className={`w-full h-auto ${className}`}
      fill="none"
    >
      <rect width="320" height="140" rx="8" fill="#080b14" stroke="#2a354d" strokeWidth="1.5" />
      <circle cx="160" cy="54" r="32" stroke="#d6b46c" strokeWidth="1.5" opacity="0.85" />
      <circle cx="160" cy="54" r="18" stroke="#5ab8ff" strokeWidth="1.2" opacity="0.7" />
      <line x1="160" y1="10" x2="160" y2="128" stroke="#f5efe2" strokeWidth="1" opacity="0.45" />
      <line x1="24" y1="96" x2="296" y2="96" stroke="#d6b46c" strokeWidth="1.2" opacity="0.7" />
      <path d="M96 96 C115 68 205 68 224 96" stroke="#fff4d2" strokeWidth="1.5" />
      <polygon points="160,36 165,49 178,54 165,59 160,72 155,59 142,54 155,49" fill="#d6b46c" opacity="0.7" />
    </svg>
  );
}

export interface EmptyStateArtProps {
  label?: string;
  className?: string;
}

export function EmptyStateArt({
  label = "Empty witness state",
  className = "",
}: EmptyStateArtProps) {
  return (
    <svg
      viewBox="0 0 180 110"
      role="img"
      aria-label={label}
      className={`w-full max-w-[180px] h-auto ${className}`}
      fill="none"
    >
      <rect x="8" y="8" width="164" height="94" rx="8" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />
      <circle cx="90" cy="50" r="20" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
      <line x1="48" y1="84" x2="132" y2="84" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="90" cy="50" r="3.5" fill="currentColor" fillOpacity="0.75" />
    </svg>
  );
}

export interface LoadingConstellationProps {
  label?: string;
  className?: string;
}

export function LoadingConstellation({
  label = "Loading constellation",
  className = "",
}: LoadingConstellationProps) {
  return (
    <svg
      viewBox="0 0 120 48"
      role="img"
      aria-label={label}
      className={`w-28 h-auto ${className}`}
      fill="none"
    >
      <polyline points="14,32 42,14 78,28 106,12" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="14" cy="32" r="3" fill="currentColor" />
      <circle cx="42" cy="14" r="3.5" fill="currentColor" />
      <circle cx="78" cy="28" r="3" fill="currentColor" />
      <circle cx="106" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}

export interface WorldArtworkProps {
  dnaId: MasterDnaId;
  className?: string;
}

/**
 * Pure abstract vector scene per Master DNA world.
 * Observes Quality Gate doctrine: zero anthropomorphic/deity depiction and zero decorative sacred filler text.
 */
export function WorldArtwork({ dnaId, className = "" }: WorldArtworkProps) {
  const world = getDnaWorld(dnaId);
  const { canvas, surfaceElevated, border, accent, text } = world.palette;

  return (
    <svg
      viewBox="0 0 280 120"
      role="img"
      aria-label={`${world.name} abstract geometry artwork`}
      className={`w-full h-auto ${className}`}
      fill="none"
    >
      <rect width="280" height="120" fill={canvas} stroke={border} strokeWidth="1.5" />
      <rect x="8" y="8" width="264" height="104" fill={surfaceElevated} fillOpacity="0.55" stroke={border} strokeOpacity="0.35" />

      {dnaId === "01-imperium-lumen" && (
        <>
          <line x1="140" y1="10" x2="140" y2="110" stroke={accent} strokeWidth="1.5" opacity="0.85" />
          <line x1="20" y1="86" x2="260" y2="86" stroke={border} strokeWidth="1" opacity="0.65" />
          <path d="M92 86 L92 48 C92 24 188 24 188 48 L188 86" stroke={accent} strokeWidth="1.8" />
          <polygon points="140,26 154,48 140,70 126,48" stroke={text} strokeWidth="1.2" opacity="0.85" />
        </>
      )}

      {dnaId === "02-lunar-chronicles" && (
        <>
          <circle cx="140" cy="60" r="38" stroke={border} strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="140" cy="60" r="22" stroke={accent} strokeWidth="1.8" />
          <path d="M132 42 A18 18 0 1 0 132 78 A13 18 0 1 1 132 42 Z" fill={accent} fillOpacity="0.85" />
          <circle cx="206" cy="40" r="3" fill={text} />
          <circle cx="72" cy="76" r="2.5" fill={accent} />
        </>
      )}

      {dnaId === "03-rocksoul" && (
        <>
          <line x1="20" y1="32" x2="260" y2="32" stroke={border} strokeWidth="1" />
          <line x1="20" y1="48" x2="260" y2="48" stroke={border} strokeWidth="1" opacity="0.7" />
          <line x1="20" y1="64" x2="260" y2="64" stroke={accent} strokeWidth="1.8" />
          <line x1="20" y1="80" x2="260" y2="80" stroke={border} strokeWidth="1" opacity="0.7" />
          <polyline points="35,64 68,42 96,84 128,28 158,76 190,46 222,74 248,64" stroke={text} strokeWidth="2" />
        </>
      )}

      {dnaId === "04-nexus-paradox" && (
        <>
          <polygon points="40,24 240,24 252,36 252,96 240,96 40,96 28,84 28,36" stroke={accent} strokeWidth="1.4" />
          <line x1="140" y1="18" x2="140" y2="102" stroke={border} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="24" y1="60" x2="256" y2="60" stroke={border} strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="140" cy="60" r="18" stroke={text} strokeWidth="1.5" />
          <rect x="134" y="54" width="12" height="12" stroke={accent} strokeWidth="1.5" />
        </>
      )}

      {dnaId === "05-riot-anarchy" && (
        <>
          <rect x="26" y="22" width="108" height="72" fill={canvas} stroke={accent} strokeWidth="2.5" />
          <rect x="148" y="30" width="104" height="68" fill={canvas} stroke={text} strokeWidth="2.5" />
          <polygon points="90,34 98,52 118,52 102,64 108,82 90,71 72,82 78,64 62,52 82,52" fill={accent} />
          <line x1="158" y1="44" x2="240" y2="44" stroke="#ffd21f" strokeWidth="3" />
          <line x1="158" y1="58" x2="226" y2="58" stroke={text} strokeWidth="2" />
        </>
      )}

      {dnaId === "06-mycelium" && (
        <>
          <path d="M36 86 C75 40 120 82 145 48 C170 22 205 64 246 40" stroke={accent} strokeWidth="2" />
          <path d="M52 38 C90 74 132 34 176 72 C202 92 224 72 244 84" stroke={border} strokeWidth="1.5" />
          <circle cx="88" cy="59" r="5" fill={accent} />
          <circle cx="145" cy="48" r="6" fill={text} />
          <circle cx="204" cy="54" r="4.5" fill={accent} />
        </>
      )}

      {dnaId === "09-simpul-nusantara" && (
        <>
          <polyline points="30,78 78,44 126,64 172,38 220,66 254,48" stroke={accent} strokeWidth="2" />
          <polyline points="30,44 96,86 156,52 212,88 254,72" stroke={border} strokeWidth="1.4" strokeDasharray="4 3" />
          <circle cx="78" cy="44" r="4.5" fill={accent} />
          <circle cx="126" cy="64" r="4.5" fill={text} />
          <circle cx="172" cy="38" r="5" fill={accent} />
          <circle cx="220" cy="66" r="4.5" fill={text} />
        </>
      )}
    </svg>
  );
}
