"use client";

import { useState } from "react";
import {
  DX_MANGA_FOUR_PANELS,
  EIGHT_STORY_ERAS,
  FEATURED_GATE_TRANSMISSIONS,
  FIFTEEN_STORY_EPISODES,
  GOD_PROMISE_THREE_TRACKS,
  ORIGINAL_CREW_ARCHETYPES,
  SEVEN_STEP_PROMISE,
  SIXTEEN_STAGE_LOOP,
  UNIVERSE_FOUR_LENSES,
  WORLD_PATCH_HIGHLIGHTS,
} from "@/data/empire-canon-codex";

export function DoorUniversePanel({ quietMode }: { readonly quietMode: boolean }) {
  const [activeTrackCode, setActiveTrackCode] = useState<string>(
    GOD_PROMISE_THREE_TRACKS[0]!.trackCode
  );
  const [activeLensId, setActiveLensId] = useState<string>(UNIVERSE_FOUR_LENSES[0]!.id);
  const [activeEpisodeCode, setActiveEpisodeCode] = useState<string>(
    FIFTEEN_STORY_EPISODES[0]!.code
  );
  const [noiseSilenceMode, setNoiseSilenceMode] = useState<"SILENCE" | "NOISE">("SILENCE");

  const activeTrack =
    GOD_PROMISE_THREE_TRACKS.find((track) => track.trackCode === activeTrackCode) ??
    GOD_PROMISE_THREE_TRACKS[0]!;
  const activeLens =
    UNIVERSE_FOUR_LENSES.find((lens) => lens.id === activeLensId) ?? UNIVERSE_FOUR_LENSES[0]!;
  const activeEpisode =
    FIFTEEN_STORY_EPISODES.find((ep) => ep.code === activeEpisodeCode) ??
    FIFTEEN_STORY_EPISODES[0]!;
  const transitionClass = quietMode ? "transition-none" : "transition-colors duration-150";

  return (
    <div className="space-y-8">
      {/* Top Strip: NOISE x SILENCE Cognitive Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[#d6b46c]/30 bg-[#080b14] px-5 py-4">
        <div>
          <div className="font-mono text-[11px] tracking-[0.22em] text-[#dfc07b] uppercase">
            ROCKSOUL-DX LIVING UNIVERSE AXIS // NOISE × SILENCE
          </div>
          <p className="mt-1 font-serif text-sm text-[#e6decb]">
            {noiseSilenceMode === "SILENCE"
              ? "SILENCE MODE: Direct clarity of Tawhid contemplation — stripping fragmented high-frequency distraction."
              : "NOISE MODE: Observing chaotic cultural signals, scars, and global transmissions before Positive Correction."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["SILENCE", "NOISE"] as const).map((modeLabel) => {
            const selected = noiseSilenceMode === modeLabel;
            return (
              <button
                key={modeLabel}
                type="button"
                aria-pressed={selected}
                onClick={() => setNoiseSilenceMode(modeLabel)}
                className={`min-h-[44px] border px-4 py-2 font-mono text-xs tracking-[0.18em] uppercase ${transitionClass} cursor-pointer ${
                  selected
                    ? "border-[#fff2c6] bg-[#d6b46c]/25 text-[#fff6df]"
                    : "border-[#d6b46c]/25 bg-[#0a0d17] text-[#bfb59e] hover:border-[#d6b46c]/60"
                }`}
              >
                {modeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 GOD-PROMISE Tracks + Monocentric 1-6-3 */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-serif text-base tracking-[0.18em] text-[#f5e3b8] uppercase">
            THREE GOD-PROMISE TRACKS &amp; MONOCENTRIC 1·6·3
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            SOURCE: bjo163/GOD-PROMISE · moonwitness-xiv
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {GOD_PROMISE_THREE_TRACKS.map((track) => {
            const isCurrent = track.trackCode === activeTrack.trackCode;
            return (
              <button
                key={track.trackCode}
                type="button"
                onClick={() => setActiveTrackCode(track.trackCode)}
                className={`min-h-[44px] border p-4 text-left ${transitionClass} cursor-pointer ${
                  isCurrent
                    ? "border-[#e6c987] bg-[#d6b46c]/15"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/50"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-[#d6b46c]">
                  <span>{track.trackCode}</span>
                  <span>{track.anchorScripture}</span>
                </div>
                <div className="mt-1 font-serif text-sm tracking-[0.1em] text-[#fff6df]">
                  {track.title}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border border-[#d6b46c]/20 bg-[#0a0d16] p-4 sm:p-5">
          <div className="font-mono text-xs tracking-[0.14em] text-[#f5dfa6]">
            {activeTrack.theorem}
          </div>
          <p className="mt-2 font-serif text-sm leading-relaxed text-[#dfd5c0]">
            {activeTrack.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeTrack.pillars.map((pillar) => (
              <span
                key={pillar}
                className="border border-[#d6b46c]/30 bg-[#101423] px-2.5 py-1 font-mono text-[11px] text-[#f8eac6]"
              >
                {pillar}
              </span>
            ))}
            {activeTrack.motifTitles.map((motif) => (
              <span
                key={motif}
                className="border border-[#d6b46c]/15 bg-[#080a12] px-2.5 py-1 text-[11px] text-[#bfb59e]"
              >
                {motif}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Panel DX Storyboard (Abstract Architectural Plates — Zero Faces) */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-serif text-base tracking-[0.18em] text-[#f5e3b8] uppercase">
            SIN CAN BE BETTER HUMAN — 4-PANEL ARCHITECTURAL STORYBOARD
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            SOURCE: Z:\repo\dx\NARATION.md · ZERO HUMAN FACES
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DX_MANGA_FOUR_PANELS.map((panel) => (
            <div
              key={panel.panelNumber}
              className="flex flex-col justify-between border border-[#d6b46c]/25 bg-[#0a0d16] p-4"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
                  <span>{panel.panelNumber}</span>
                  <span>{panel.paletteTag}</span>
                </div>
                <div
                  className="mt-2 font-serif text-xl tracking-[0.14em]"
                  style={{ color: panel.accentHex }}
                >
                  {panel.japaneseSfx}
                </div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-[#bfb59e]">
                  {panel.romajiSfx}
                </div>
                <h4 className="mt-2 font-serif text-sm tracking-[0.06em] text-[#fff6df]">
                  {panel.title}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[#d9d0be]">{panel.meaning}</p>
              </div>
              <div className="mt-3 border-t border-[#d6b46c]/15 pt-2 font-mono text-[10px] text-[#9f9580]">
                FORM: {panel.architecturalForm}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Creative Lenses across 99 Chapters */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-serif text-base tracking-[0.18em] text-[#f5e3b8] uppercase">
            99-CHAPTER MASTER VISION NARRATIVE (S01–S99 · 4 LENSES)
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            SOURCE: bjo163/moonwitnessxv
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {UNIVERSE_FOUR_LENSES.map((lens) => {
            const isSelected = lens.id === activeLens.id;
            return (
              <button
                key={lens.id}
                type="button"
                onClick={() => setActiveLensId(lens.id)}
                className={`min-h-[44px] border p-3.5 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-[#e6c987] bg-[#d6b46c]/15"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/45"
                }`}
              >
                <div className="font-mono text-[11px] text-[#d6b46c]">
                  {lens.chapterRange} ({lens.chapterCount} Chapters)
                </div>
                <div className="mt-1 font-serif text-sm text-[#fff6df]">{lens.name}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 border border-[#d6b46c]/20 bg-[#0a0d16] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-serif text-sm text-[#fff6df]">{activeLens.name}</div>
            <p className="mt-1 text-xs text-[#d9d0be]">{activeLens.focus}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeLens.keyMotifs.map((motif) => (
              <span
                key={motif}
                className="border border-[#d6b46c]/30 bg-[#101423] px-2.5 py-1 font-mono text-[10px] text-[#f5dfa6]"
              >
                {motif}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* MoonWitness II (8 Eras, 7-Step Promise, 16-Stage Loop) & XII (15 Episodes, 33 Patches) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6 border border-[#d6b46c]/25 bg-[#070910] p-5">
          <div className="font-serif text-sm tracking-[0.18em] text-[#f5e3b8] uppercase border-b border-[#d6b46c]/20 pb-2">
            MOONWITNESS II · 8 STORY ERAS &amp; 16-STAGE LOOP
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {EIGHT_STORY_ERAS.map((era) => (
              <div key={era.id} className="border border-[#d6b46c]/15 bg-[#0a0d16] p-2.5">
                <div className="font-mono text-[10px] text-[#d6b46c]">
                  {era.id.toUpperCase()} · {era.subtitle}
                </div>
                <div className="font-serif text-xs text-[#fff6df]">{era.title}</div>
                <div className="mt-0.5 text-[11px] text-[#bfb59e]">{era.theme}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
              7-STEP PROMISE &amp; 16-STAGE EXPRESSIVE LOOP
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SEVEN_STEP_PROMISE.map((step) => (
                <span
                  key={step}
                  className="border border-[#d6b46c]/30 bg-[#111524] px-2 py-0.5 font-mono text-[10px] text-[#f8eac6]"
                >
                  {step}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {SIXTEEN_STAGE_LOOP.map((stage) => (
                <span
                  key={stage}
                  className="border border-[#d6b46c]/15 bg-[#090c15] px-2 py-0.5 font-mono text-[10px] text-[#bfb59e]"
                >
                  {stage}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
              ORIGINAL CREW ARCHETYPES ({ORIGINAL_CREW_ARCHETYPES.length})
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ORIGINAL_CREW_ARCHETYPES.map((crew) => (
                <span
                  key={crew}
                  className="border border-[#d6b46c]/15 bg-[#0b0e18] px-2 py-0.5 font-mono text-[10px] text-[#dfd5c0]"
                >
                  {crew}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 border border-[#d6b46c]/25 bg-[#070910] p-5 flex flex-col justify-between">
          <div>
            <div className="font-serif text-sm tracking-[0.18em] text-[#f5e3b8] uppercase border-b border-[#d6b46c]/20 pb-2">
              MOONWITNESS XII · 15 STORY EPISODES &amp; 33 WORLD PATCHES
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FIFTEEN_STORY_EPISODES.map((ep) => {
                const isSelected = ep.code === activeEpisode.code;
                return (
                  <button
                    key={ep.code}
                    type="button"
                    onClick={() => setActiveEpisodeCode(ep.code)}
                    className={`min-h-[44px] border px-2.5 py-1.5 font-mono text-[10px] cursor-pointer ${transitionClass} ${
                      isSelected
                        ? "border-[#e6c987] bg-[#d6b46c]/20 text-[#fff6df]"
                        : "border-[#d6b46c]/20 bg-[#0b0e18] text-[#bfb59e] hover:border-[#d6b46c]/50"
                    }`}
                  >
                    {ep.code} · {ep.title}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 border border-[#d6b46c]/25 bg-[#0b0f1a] p-3.5">
              <div className="flex items-center justify-between font-mono text-[11px] text-[#d6b46c]">
                <span>
                  {activeEpisode.code} // {activeEpisode.arcFocus}
                </span>
                <span>EPISODE {activeEpisode.number} / 15</span>
              </div>
              <div className="mt-1 font-serif text-base text-[#fff6df]">{activeEpisode.title}</div>
              <p className="mt-1 text-xs text-[#d9d0be]">{activeEpisode.coreQuestion}</p>
            </div>

            <div className="mt-4">
              <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
                WORLD PATCH HIGHLIGHTS (#001 – #033 + DUAL-DRAFT DISCLOSURE)
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {WORLD_PATCH_HIGHLIGHTS.map((patch) => (
                  <div
                    key={patch.patchNumber}
                    className="border border-[#d6b46c]/20 bg-[#0a0d16] p-2.5"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
                      <span>PATCH {patch.patchNumber}</span>
                      <span>{patch.category}</span>
                    </div>
                    <div className="mt-0.5 font-serif text-xs text-[#fff6df]">{patch.title}</div>
                    <p className="mt-0.5 text-[11px] text-[#bfb59e]">{patch.summary}</p>
                    {patch.provenanceNote && (
                      <div className="mt-1 font-mono text-[10px] text-[#f5dfa6]">
                        {patch.provenanceNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-[#d6b46c]/20 pt-3">
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
              FEATURED GATE TRANSMISSIONS &amp; KINGSLAYER AGREEMENT
            </div>
            <div className="mt-2 space-y-2">
              {FEATURED_GATE_TRANSMISSIONS.map((tx) => (
                <div key={tx.id} className="border border-[#d6b46c]/20 bg-[#0a0d16] p-3">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
                    <span>{tx.domainOrigin}</span>
                    <span>{tx.format}</span>
                  </div>
                  <div className="mt-0.5 font-serif text-sm text-[#fff6df]">{tx.title}</div>
                  <p className="mt-0.5 text-xs text-[#bfb59e]">{tx.premise}</p>
                  <p className="mt-1 font-serif text-xs italic text-[#f5dfa6]">
                    “{tx.signatureQuote}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
