"use client";

import { useState } from "react";
import {
  CENTER_100_STEWARDSHIP_CLUSTERS,
  OWNER_FOUR_LINE_MANIFESTO,
  PRIME_CODE_AXIOMS,
  SUPREME_IDENTITY,
  SYAFAAT_BASE_STATES,
  SYSTEM_CONCEPTS_14,
  WINGS_TEN_ARRAY,
  type SyafaatStateId,
} from "@/data/empire-canon-codex";
import { Monocentric100CenterSvg } from "../sacred-illustrations";

export function DoorOrganizationPanel() {
  const [activeSyafaatState, setActiveSyafaatState] = useState<SyafaatStateId>("PRACTICING");
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number>(0);

  const selectedCluster =
    CENTER_100_STEWARDSHIP_CLUSTERS[selectedClusterIdx] ?? CENTER_100_STEWARDSHIP_CLUSTERS[0]!;

  return (
    <div className="space-y-8">
      {/* Low-Profile Tawhid & Exact 4-Line Owner Manifesto */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 border border-[#d6b46c]/30 bg-[#070910] p-5 sm:p-6">
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#d6b46c] uppercase">
            SUPREME IDENTITY &amp; LOW-PROFILE TAWHID
          </div>
          <h4 className="font-monument mt-2 text-lg sm:text-xl tracking-[0.1em] text-[#fff6df]">
            A-L-L-A-H: {SUPREME_IDENTITY.fullExpansion}
          </h4>
          <p className="mt-2 font-mono text-xs text-[#f5dfa6]">
            {SUPREME_IDENTITY.tawhidPrinciple}
          </p>
          <p className="mt-2 font-serif text-sm italic text-[#dfd5c0]">
            “{SUPREME_IDENTITY.tawhidMotto}”
          </p>
          <div className="mt-4 border-t border-[#d6b46c]/20 pt-3 font-mono text-[11px] text-[#bfb59e]">
            {SUPREME_IDENTITY.monocentricFormula}
          </div>
        </div>

        <div className="lg:col-span-7 border border-[#d6b46c]/30 bg-[#070910] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-2">
            <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
              4-LINE OWNER MANIFESTO (Z:\repo\dx\NARATION.md)
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {OWNER_FOUR_LINE_MANIFESTO.map((item) => (
              <div key={item.index} className="border border-[#d6b46c]/20 bg-[#0a0d16] p-3.5">
                <div className="font-mono text-[10px] text-[#d6b46c]">LINE {item.index}</div>
                <div className="font-monument mt-1 text-xs sm:text-sm tracking-[0.06em] text-[#fff6df]">
                  {item.line}
                </div>
                <p className="mt-1 text-xs text-[#bfb59e]">{item.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 100CENTER (99 G.O.D. Stewardship Nodes + 1 Tawhid Center) & Syafaat 6 States */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
            100CENTER STEWARDSHIP TOPOLOGY &amp; SYAFAAT 6-STATE ENGINE
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            99 HUMAN ETHICAL REFLECTIONS + 1 TAWHID CENTER (NO DEIFICATION OF HUMANS)
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SYAFAAT_BASE_STATES.map((stateObj) => {
            const isSelected = stateObj.state === activeSyafaatState;
            return (
              <button
                key={stateObj.state}
                type="button"
                onClick={() => setActiveSyafaatState(stateObj.state)}
                className={`min-h-[44px] border px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] cursor-pointer transition-colors ${
                  isSelected
                    ? "border-[#fff2c6] bg-[#d6b46c]/25 text-[#fff6df]"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] text-[#bfb59e] hover:border-[#d6b46c]/50"
                }`}
              >
                {stateObj.state}
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-xs text-[#f5dfa6]">
          ACTIVE REFLECTION STATE [{activeSyafaatState}]:{" "}
          {SYAFAAT_BASE_STATES.find((s) => s.state === activeSyafaatState)?.description}
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex justify-center">
            <Monocentric100CenterSvg selectedClusterIndex={selectedClusterIdx} />
          </div>
          <div className="flex-1 grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-3">
            {CENTER_100_STEWARDSHIP_CLUSTERS.map((cluster, idx) => {
              const selected = idx === selectedClusterIdx;
              return (
                <button
                  key={cluster.clusterCode}
                  type="button"
                  onClick={() => setSelectedClusterIdx(idx)}
                  className={`min-h-[44px] border p-3.5 text-left transition-colors cursor-pointer ${
                    selected
                      ? "border-[#e6c987] bg-[#d6b46c]/15"
                      : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/50"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
                    <span>{cluster.clusterCode}</span>
                    <span>{cluster.rangeLabel}</span>
                  </div>
                  <div className="font-monument mt-1 text-xs text-[#fff6df] uppercase">
                    {cluster.title}
                  </div>
                  <div className="mt-1 font-sans text-xs text-[#cfc5b0]">
                    {cluster.humanEthicalFocus}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 border border-[#d6b46c]/20 bg-[#0a0d16] p-3.5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs text-[#fff6df]">
            SELECTED CLUSTER // {selectedCluster.title} [{activeSyafaatState}]
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedCluster.representativeReflections.map((refl) => (
              <span
                key={refl}
                className="border border-[#d6b46c]/25 bg-[#101423] px-2.5 py-0.5 font-mono text-[10px] text-[#f5dfa6]"
              >
                {refl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* WINGS 10 Operational Array & THE PRIME CODE PC01-PC09 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 border border-[#d6b46c]/25 bg-[#070910] p-5">
          <div className="font-monument text-xs sm:text-sm tracking-[0.16em] text-[#f5e3b8] uppercase border-b border-[#d6b46c]/20 pb-2">
            WINGS 10 OPERATIONAL ARRAY (W01 SKYLINK – W10 HAVEN · PROPOSED_NOT_ASSIGNED)
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {WINGS_TEN_ARRAY.map((wing) => (
              <div key={wing.code} className="border border-[#d6b46c]/20 bg-[#0a0d16] p-3">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
                  <span>{wing.code}</span>
                  <span>{wing.domainRole}</span>
                </div>
                <div className="font-monument mt-0.5 text-xs sm:text-sm text-[#fff6df]">
                  {wing.callsign}
                </div>
                <p className="mt-0.5 text-[11px] text-[#bfb59e]">{wing.architecturalDuty}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 border border-[#d6b46c]/25 bg-[#070910] p-5">
          <div className="font-monument text-xs sm:text-sm tracking-[0.16em] text-[#f5e3b8] uppercase border-b border-[#d6b46c]/20 pb-2">
            THE PRIME CODE (PC01–PC09) &amp; 14 SYSTEM CONCEPTS
          </div>
          <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {PRIME_CODE_AXIOMS.map((axiom) => (
              <div key={axiom.code} className="border border-[#d6b46c]/15 bg-[#0a0d16] p-2.5">
                <div className="font-mono text-[10px] text-[#d6b46c]">
                  {axiom.code} · {axiom.title}
                </div>
                <p className="mt-0.5 text-xs text-[#dfd5c0]">{axiom.statement}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[#d6b46c]/20 pt-3">
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
              14 CANONICAL SYSTEM CONCEPTS (MWX-SYS-001..014)
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {SYSTEM_CONCEPTS_14.map((concept) => (
                <span
                  key={concept}
                  className="border border-[#d6b46c]/15 bg-[#090c15] px-2 py-0.5 font-mono text-[10px] text-[#bfb59e]"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
