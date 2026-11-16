"use client";

import { useState } from "react";
import { FOUR_CORPUS_POLICY } from "@/data/empire-canon-codex";
import {
  ScrollChapterReveal,
  SpatialTiltCard,
  triggerSacredViewTransition,
} from "./motion-primitives";
import { DiamondStarOrnament } from "./sacred-icons";
import { SacredCornerBrackets } from "./sacred-illustrations";

export function FourScripturesSanctum({
  quietMode = false,
  onInspectCorpusDoor,
}: {
  readonly quietMode?: boolean;
  readonly onInspectCorpusDoor?: () => void;
}) {
  const [selectedCode, setSelectedCode] =
    useState<(typeof FOUR_CORPUS_POLICY.corpora)[number]["code"]>("SRC-TOR");
  const selectedCorpus =
    FOUR_CORPUS_POLICY.corpora.find((entry) => entry.code === selectedCode) ??
    FOUR_CORPUS_POLICY.corpora[0]!;

  return (
    <div
      id="four-scriptures"
      className="scroll-mt-20 mt-16 border border-[#d6b46c]/35 bg-[#060911]/95 p-6 sm:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.82)] relative"
    >
      <SacredCornerBrackets />

      <ScrollChapterReveal quietMode={quietMode}>
        <div className="flex flex-col items-center text-center border-b border-[#d6b46c]/20 pb-8">
          <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.26em] text-[#d6b46c] uppercase">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#d6b46c]" />
            <span>FOUR REVEALED WITNESSES · NEUTRAL MONOCENTRIC ARCHIVE</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#d6b46c]" />
          </div>
          <h3 className="font-monument mt-3 text-2xl sm:text-3xl tracking-[0.16em] text-gold-gradient uppercase">
            TAURAT · ZABUR · INJĪL · AL-QUR’ĀN
          </h3>
          <p className="mt-3 max-w-3xl font-serif text-base text-[#e6decb] leading-relaxed">
            {FOUR_CORPUS_POLICY.neutralityPrinciple}
          </p>
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 border border-[#d6b46c]/30 bg-[#0a0d16] px-4 py-1.5 font-mono text-[10.5px] tracking-[0.14em] text-[#f5dfa6]">
            <span>{FOUR_CORPUS_POLICY.invariant}</span>
            <span className="text-[#d6b46c]" aria-hidden="true">
              ·
            </span>
            <span>ZERO RELIGION RANKING · NO COMPULSION IN FAITH</span>
          </div>
        </div>
      </ScrollChapterReveal>

      {/* Equal-Stature Four-Scripture Pillars */}
      <div
        role="tablist"
        aria-label="Inspect the Four Revealed Scriptural Witnesses"
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FOUR_CORPUS_POLICY.corpora.map((corpus, idx) => {
          const isSelected = corpus.code === selectedCorpus.code;
          return (
            <SpatialTiltCard key={corpus.code} disabled={quietMode} maxTiltDeg={3}>
              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() =>
                  triggerSacredViewTransition(() => {
                    setSelectedCode(corpus.code);
                  }, quietMode)
                }
                className={`portal-arch-card relative flex h-full w-full min-h-[168px] flex-col justify-between border px-5 pt-7 pb-5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#fff4d2] bg-gradient-to-b from-[#d6b46c]/20 via-[#0e1320] to-[#070910] shadow-[0_0_28px_rgba(223,192,123,0.2)]"
                    : "border-[#d6b46c]/25 bg-[#090c16]/90 hover:border-[#d6b46c]/60 hover:bg-[#0d111e]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-[#dfc07b]">
                    <span>
                      0{idx + 1} · {corpus.code}
                    </span>
                    <span className="text-[#cfc5b0]">{corpus.classicalLanguage}</span>
                  </div>
                  <h4 className="font-monument mt-2.5 text-lg tracking-[0.14em] text-[#fff8e6]">
                    {corpus.name}
                  </h4>
                  <div className="mt-1 font-mono text-[11px] text-[#f5dfa6]">
                    {corpus.prophetAnchor}
                  </div>
                </div>
                <p className="mt-3 border-t border-[#d6b46c]/15 pt-2.5 font-serif text-xs leading-relaxed text-[#e0d7c4]">
                  {corpus.ethicalCore}
                </p>
              </button>
            </SpatialTiltCard>
          );
        })}
      </div>

      {/* Selected Scripture Deep Inspection Bay */}
      <div className="mt-6 border border-[#dfc07b]/35 bg-[#080b14] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <DiamondStarOrnament className="h-4 w-4 text-[#f5dfa6]" />
            <span className="font-monument text-base sm:text-lg tracking-[0.14em] text-[#fff6df]">
              {selectedCorpus.name} · {selectedCorpus.prophetAnchor}
            </span>
          </div>
          <span className="border border-[#d6b46c]/30 bg-[#0d111e] px-3 py-1 font-mono text-[10.5px] text-[#f5dfa6]">
            {selectedCorpus.epistemicRole}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-2">
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#dfc07b] uppercase">
              ETHICAL WITNESS FOCUS ({selectedCorpus.classicalLanguage})
            </div>
            <p className="font-serif text-base leading-relaxed text-[#ece4d3]">
              {selectedCorpus.neutralSummary}
            </p>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-between gap-3 border border-[#d6b46c]/20 bg-[#0a0e18] p-4">
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.14em] text-[#dfc07b] uppercase">
                EPISTEMIC DISCIPLINE
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#dfd6c3]">
                {selectedCorpus.invariant}
              </p>
            </div>
            {onInspectCorpusDoor && (
              <button
                type="button"
                onClick={onInspectCorpusDoor}
                className="min-h-[44px] w-full border border-[#d6b46c]/40 bg-[#0d1220] px-4 py-2 font-mono text-[11px] tracking-[0.16em] text-[#fff4d2] uppercase hover:border-[#fff4d2] hover:bg-[#d6b46c]/20 transition-colors cursor-pointer"
              >
                INSPECT P18 CORPUS SPINE IN DOOR II &rsaquo;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
