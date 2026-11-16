"use client";

import { useState } from "react";
import {
  FOUR_CORPUS_POLICY,
  P18_KEY_WITNESS_SPEC,
  RGBL_FOUR_LEVELS,
  WHCMT_VS_BASSHUNTER_SPEC,
} from "@/data/empire-canon-codex";

export function P18KeyWitnessInspector({ quietMode }: { readonly quietMode: boolean }) {
  const [selectedLayerIdx, setSelectedLayerIdx] = useState<number>(0);
  const [selectedFamilyIdx, setSelectedFamilyIdx] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const transitionClass = quietMode ? "transition-none" : "transition-colors duration-150";

  const activeFamily =
    P18_KEY_WITNESS_SPEC.controlledKeys5Families[selectedFamilyIdx] ??
    P18_KEY_WITNESS_SPEC.controlledKeys5Families[0]!;

  return (
    <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
        <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
          P18 KEY WITNESS v0 · 9-LAYER CORPUS SPINE &amp; 20 CONTROLLED KEYS
        </span>
        <span className="font-mono text-[11px] text-[#d6b46c]">
          {P18_KEY_WITNESS_SPEC.sourceRepo}
        </span>
      </div>

      {/* Formula + Rotation Rule */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="border border-[#d6b46c]/20 bg-[#0a0d16] p-3">
          <div className="font-mono text-[10px] text-[#d6b46c]">SCORING &amp; UNKNOWN GUARD</div>
          <div className="mt-1 font-mono text-xs text-[#fff6df]">
            {P18_KEY_WITNESS_SPEC.formula}
          </div>
        </div>
        <div className="border border-[#d6b46c]/20 bg-[#0a0d16] p-3">
          <div className="font-mono text-[10px] text-[#d6b46c]">INVARIANT ROTATION DOCTRINE</div>
          <div className="mt-1 font-mono text-xs text-[#f5dfa6]">
            {P18_KEY_WITNESS_SPEC.rotationRule}
          </div>
        </div>
      </div>

      {/* 9-Layer Corpus Spine */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
          9-LAYER CORPUS SPINE
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-9">
          {P18_KEY_WITNESS_SPEC.corpusSpine9Layers.map((layer, idx) => {
            const active = idx === selectedLayerIdx;
            return (
              <button
                key={layer}
                type="button"
                onClick={() => setSelectedLayerIdx(idx)}
                className={`min-h-[44px] border p-2 text-center font-mono text-[10px] cursor-pointer ${transitionClass} ${
                  active
                    ? "border-[#e6c987] bg-[#d6b46c]/20 text-[#fff6df]"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] text-[#bfb59e] hover:border-[#d6b46c]/50"
                }`}
              >
                {layer}
              </button>
            );
          })}
        </div>
      </div>

      {/* 20 Controlled Keys (5 Families) + 12 Relations + Frame Dimensions + Direction */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6 border border-[#d6b46c]/20 bg-[#0a0d16] p-4 space-y-3">
          <div className="font-mono text-[10px] text-[#d6b46c] uppercase">
            20 CONTROLLED KEYS (5 FAMILIES · CANDIDATE LEVEL)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {P18_KEY_WITNESS_SPEC.controlledKeys5Families.map((fam, idx) => {
              const selected = idx === selectedFamilyIdx;
              return (
                <button
                  key={fam.family}
                  type="button"
                  onClick={() => setSelectedFamilyIdx(idx)}
                  className={`min-h-[44px] border px-2.5 py-1 font-mono text-[10px] cursor-pointer ${transitionClass} ${
                    selected
                      ? "border-[#fff2c6] bg-[#d6b46c]/20 text-[#fff6df]"
                      : "border-[#d6b46c]/20 bg-[#080a12] text-[#bfb59e]"
                  }`}
                >
                  {fam.family}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {activeFamily.keys.map((keyWord) => (
              <div
                key={keyWord}
                className="border border-[#d6b46c]/30 bg-[#0d1220] px-2.5 py-2 text-center font-mono text-xs text-[#f5dfa6]"
              >
                {keyWord}
              </div>
            ))}
          </div>
          <div className="border-t border-[#d6b46c]/15 pt-2.5">
            <div className="font-mono text-[10px] text-[#d6b46c]">6 WITNESS TYPES</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {P18_KEY_WITNESS_SPEC.witnessTypes6.map((wt) => (
                <span
                  key={wt}
                  className="border border-[#d6b46c]/20 bg-[#080a12] px-2 py-0.5 font-mono text-[10px] text-[#dfd5c0]"
                >
                  {wt}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 border border-[#d6b46c]/20 bg-[#0a0d16] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#d6b46c] uppercase">
              5 FRAME DIMENSIONS &amp; 12 RELATIONS
            </span>
            <span className="font-mono text-[10px] text-[#f5dfa6]">
              DIRECTION: {direction > 0 ? `+${direction}` : direction} (RANGE -2..+2)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[-2, -1, 0, 1, 2].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setDirection(val)}
                className={`min-h-[44px] flex-1 border font-mono text-xs cursor-pointer ${transitionClass} ${
                  direction === val
                    ? "border-[#e6c987] bg-[#d6b46c]/25 text-[#fff6df]"
                    : "border-[#d6b46c]/20 bg-[#080a12] text-[#bfb59e]"
                }`}
              >
                {val > 0 ? `+${val}` : val}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {P18_KEY_WITNESS_SPEC.mandatoryFrameDimensions5.map((dim) => (
              <span
                key={dim}
                className="border border-[#d6b46c]/35 bg-[#101423] px-2.5 py-1 font-mono text-[10px] text-[#fff6df]"
              >
                {dim}
              </span>
            ))}
          </div>
          <div className="border-t border-[#d6b46c]/15 pt-2.5">
            <div className="font-mono text-[10px] text-[#d6b46c]">12 RELATIONS</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {P18_KEY_WITNESS_SPEC.relations12.map((rel) => (
                <span
                  key={rel}
                  className="border border-[#d6b46c]/15 bg-[#080a12] px-2 py-0.5 font-mono text-[10px] text-[#cfc5b0]"
                >
                  {rel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RGBL Cumulative Foundation */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RGBL_FOUR_LEVELS.map((lvl) => (
          <div key={lvl.level} className="border border-[#d6b46c]/20 bg-[#080a12] p-3">
            <div className="font-mono text-[10px] text-[#d6b46c]">
              {lvl.level} · {lvl.name}
            </div>
            <div className="mt-1 text-xs text-[#fff6df]">Yield: {lvl.yield}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FourCorpusAndWhcmtPanel() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Four-Corpus Policy */}
      <div className="lg:col-span-7 border border-[#d6b46c]/25 bg-[#070910] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-2">
          <span className="font-monument text-sm tracking-[0.16em] text-[#f5e3b8] uppercase">
            FOUR-CORPUS POLICY ({FOUR_CORPUS_POLICY.sourceRepo})
          </span>
          <span className="font-mono text-[10px] text-[#f5dfa6]">
            {FOUR_CORPUS_POLICY.invariant}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {FOUR_CORPUS_POLICY.corpora.map((corpus) => (
            <div
              key={corpus.code}
              className={`border p-3 ${
                corpus.code === "SRC-QUR"
                  ? "border-[#e6c987]/55 bg-[#0e1320]"
                  : "border-[#d6b46c]/20 bg-[#0a0d16]"
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
                <span>{corpus.code}</span>
                <span>{corpus.epistemicRole}</span>
              </div>
              <div className="font-monument mt-1 text-sm text-[#fff6df]">{corpus.name}</div>
              <p className="mt-1 text-xs text-[#cfc5b0]">{corpus.invariant}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WHCMT vs BASS-HUNTER */}
      <div className="lg:col-span-5 border border-[#d6b46c]/25 bg-[#070910] p-5 space-y-3">
        <div className="border-b border-[#d6b46c]/20 pb-2 font-monument text-sm tracking-[0.16em] text-[#f5e3b8] uppercase">
          WHCMT MATRIX vs BASS-HUNTER BOUNDARY
        </div>
        <div className="border border-[#d6b46c]/25 bg-[#0a0d16] p-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
            <span>{WHCMT_VS_BASSHUNTER_SPEC.whcmt.code} (2×4 MATRIX)</span>
            <span>conversations-002[69]</span>
          </div>
          <div className="mt-1 font-serif text-xs text-[#fff6df]">
            {WHCMT_VS_BASSHUNTER_SPEC.whcmt.expansion}
          </div>
          <div className="mt-2.5 space-y-1.5 font-mono text-xs">
            <div className="grid grid-cols-4 gap-1.5">
              {WHCMT_VS_BASSHUNTER_SPEC.whcmt.matrixTopRow.map((cell) => (
                <div
                  key={cell}
                  className="border border-[#d6b46c]/35 bg-[#101524] py-1.5 text-center text-[#f5dfa6]"
                >
                  {cell}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {WHCMT_VS_BASSHUNTER_SPEC.whcmt.matrixBottomRow.map((cell) => (
                <div
                  key={cell}
                  className="border border-[#d6b46c]/20 bg-[#080a12] py-1.5 text-center text-[#dfd5c0]"
                >
                  {cell}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-[#9e8862]/40 bg-[#0b0d14] p-3">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-[#d6b46c]">{WHCMT_VS_BASSHUNTER_SPEC.bassHunter.code}</span>
            <span className="border border-[#d6b46c]/30 px-2 py-0.5 text-[#f5dfa6]">
              METHOD: {WHCMT_VS_BASSHUNTER_SPEC.bassHunter.scoringStatus}
            </span>
          </div>
          <div className="mt-1 font-serif text-xs text-[#fff6df]">
            {WHCMT_VS_BASSHUNTER_SPEC.bassHunter.expansion}
          </div>
          <p className="mt-1 text-[11px] text-[#bfb59e]">
            {WHCMT_VS_BASSHUNTER_SPEC.bassHunter.rule}
          </p>
        </div>
      </div>
    </div>
  );
}
