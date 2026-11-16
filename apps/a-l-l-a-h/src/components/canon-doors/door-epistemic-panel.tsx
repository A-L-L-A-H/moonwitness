"use client";

import { useState } from "react";
import {
  EPISTEMIC_FEDERATION_DOMAINS,
  JERUSALEM_70CE_CASE_001,
  SRGBL_V8_STAGES,
  SWING_SWING_KEY_ROTATIONS,
} from "@/data/empire-canon-codex";
import { FourCorpusAndWhcmtPanel, P18KeyWitnessInspector } from "./epistemic-lab-modules";

export function DoorEpistemicPanel({ quietMode }: { readonly quietMode: boolean }) {
  const [activeStageLetter, setActiveStageLetter] = useState<"S" | "R" | "G" | "B" | "L">("S");
  const [activeRotationIdx, setActiveRotationIdx] = useState<number>(0);

  const activeStage =
    SRGBL_V8_STAGES.find((stage) => stage.letter === activeStageLetter) ?? SRGBL_V8_STAGES[0]!;
  const transitionClass = quietMode ? "transition-none" : "transition-colors duration-150";

  return (
    <div className="space-y-8">
      {/* SRGBL v8 Interactive 5-Stage Witness Pipeline */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
            SRGBL v8 CANONICAL 5-STAGE WITNESS PIPELINE &amp; SYMBOLIC RGBL
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            SOURCE: bjo163/moonwitness-corpus · P18 KEY WITNESS
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
          {SRGBL_V8_STAGES.map((stage) => {
            const selected = stage.letter === activeStage.letter;
            return (
              <button
                key={stage.stage}
                type="button"
                onClick={() => setActiveStageLetter(stage.letter)}
                className={`min-h-[44px] border p-3.5 text-left ${transitionClass} cursor-pointer ${
                  selected
                    ? "border-[#e6c987] bg-[#d6b46c]/20"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/50"
                }`}
              >
                <div className="font-mono text-[11px] text-[#d6b46c]">{stage.stage}</div>
                <div className="font-monument mt-1 text-xs sm:text-sm text-[#fff6df]">
                  {stage.title}
                </div>
                <div className="mt-1 font-mono text-[10px] text-[#f5dfa6]">
                  {stage.symbolicLayer}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border border-[#d6b46c]/20 bg-[#0a0d16] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-monument text-base sm:text-lg text-[#fff6df]">
              {activeStage.stage} — {activeStage.title}
            </span>
            <span className="border border-[#d6b46c]/35 bg-[#d6b46c]/10 px-2.5 py-0.5 font-mono text-[11px] text-[#f8eac6]">
              {activeStage.symbolicLayer}
            </span>
          </div>
          <p className="mt-2 font-serif text-sm text-[#dfd5c0]">
            AUDIT QUESTION: {activeStage.auditQuestion}
          </p>
        </div>

        {/* Swing Swing Key 7 Rotations */}
        <div className="mt-6 border-t border-[#d6b46c]/20 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] tracking-[0.18em] text-[#d6b46c] uppercase">
              SWING SWING KEY · 7 RESEARCH OPERATORS (MAX 3 HOPS · CANDIDATE ROTATIONS ONLY)
            </span>
            <span className="font-mono text-[11px] text-[#f5dfa6]">
              ACTIVE ROTATION {activeRotationIdx + 1} / 7
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SWING_SWING_KEY_ROTATIONS.map((rotationLabel, idx) => {
              const isSelected = idx === activeRotationIdx;
              return (
                <button
                  key={rotationLabel}
                  type="button"
                  onClick={() => setActiveRotationIdx(idx)}
                  className={`min-h-[44px] border px-3 py-2 text-left font-mono text-[11px] transition-colors cursor-pointer ${
                    isSelected
                      ? "border-[#fff2c6] bg-[#d6b46c]/20 text-[#fff6df]"
                      : "border-[#d6b46c]/20 bg-[#0b0e18] text-[#bfb59e] hover:border-[#d6b46c]/45"
                  }`}
                >
                  {rotationLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6 ROCKSOUL Domains + Correlation Layer */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
            6-DOMAIN + RELATIONSHIP ROCKSOUL EPISTEMIC FEDERATION
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            OFFSIDE → ONSIDE SEMANTIC VERIFICATION (QS 37:30)
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EPISTEMIC_FEDERATION_DOMAINS.map((domain) => (
            <div
              key={domain.code}
              className="border border-[#d6b46c]/20 bg-[#0a0d16] p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
                  <span>{domain.code}</span>
                  <span>{domain.repoSlug}</span>
                </div>
                <h4 className="font-monument mt-1 text-sm sm:text-base text-[#fff6df]">
                  {domain.name}
                </h4>
                <div className="mt-0.5 text-xs text-[#f5dfa6]">{domain.domainFocus}</div>
                <p className="mt-2 font-mono text-[11px] text-[#bfb59e]">
                  {domain.pipelineOrFamilies}
                </p>
              </div>
              <div className="mt-3 border-t border-[#d6b46c]/15 pt-2 text-[11px] text-[#dfd5c0]">
                INVARIANT: {domain.coreInvariant}
              </div>
            </div>
          ))}
        </div>

        {/* Shared Case 001: Jerusalem 70 CE */}
        <div className="mt-6 border border-[#e6c987]/35 bg-[#0b0f1b] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-monument text-sm sm:text-base tracking-[0.14em] text-[#fff6df]">
              {JERUSALEM_70CE_CASE_001.caseId} · {JERUSALEM_70CE_CASE_001.title}
            </span>
            <span className="border border-[#d6b46c]/40 bg-[#d6b46c]/15 px-2.5 py-0.5 font-mono text-[10px] text-[#fff4d2]">
              CROSS-DOMAIN BENCHMARK
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {JERUSALEM_70CE_CASE_001.strands.map((strand) => (
              <div key={strand.domain} className="border border-[#d6b46c]/20 bg-[#080a12] p-3">
                <div className="font-mono text-[10px] text-[#d6b46c]">{strand.domain}</div>
                <p className="mt-1 text-xs text-[#e6decb]">{strand.evidence}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 font-mono text-xs text-[#f5dfa6]">
            VERDICT // {JERUSALEM_70CE_CASE_001.verdict}
          </div>
        </div>
      </div>

      {/* P18 Key Witness v0 Spine, 20 Controlled Keys & 12 Relations */}
      <P18KeyWitnessInspector quietMode={quietMode} />

      {/* Four-Corpus Policy & WHCMT 2x4 vs BASS-HUNTER Boundary */}
      <FourCorpusAndWhcmtPanel />
    </div>
  );
}
