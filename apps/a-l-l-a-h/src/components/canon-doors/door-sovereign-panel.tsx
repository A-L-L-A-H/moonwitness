"use client";

import { useState } from "react";
import {
  CROSS_REPO_TOPOLOGY_ATLAS,
  OX_DX_SEVEN_ZONES,
  SOVEREIGN_ENGINE_SPECS,
  type RepoOrgCluster,
} from "@/data/empire-canon-codex";

export function DoorSovereignPanel() {
  const [selectedZoneIdx, setSelectedZoneIdx] = useState<number>(0);
  const [selectedOrg, setSelectedOrg] = useState<RepoOrgCluster["orgName"]>("bjo163");

  const activeZone = OX_DX_SEVEN_ZONES[selectedZoneIdx] ?? OX_DX_SEVEN_ZONES[0]!;
  const activeOrg =
    CROSS_REPO_TOPOLOGY_ATLAS.find((cluster) => cluster.orgName === selectedOrg) ??
    CROSS_REPO_TOPOLOGY_ATLAS[0]!;

  const totalRepos = CROSS_REPO_TOPOLOGY_ATLAS.reduce((acc, org) => acc + org.repoCount, 0);

  return (
    <div className="space-y-8">
      {/* OX-DX 7 Zones x 7 Levels = 49 Canonical Levels */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
            OX-DX UNIVERSAL ONTOLOGY PYRAMID (7 ZONES × 7 LEVELS = 49 LEVELS)
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            SOURCE: bjo163/universal-ontology-engine · 01 UNIVERSE → 49 BIT
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {OX_DX_SEVEN_ZONES.map((zone, idx) => {
            const isSelected = idx === selectedZoneIdx;
            return (
              <button
                key={zone.zoneName}
                type="button"
                onClick={() => setSelectedZoneIdx(idx)}
                className={`min-h-[44px] border p-2.5 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-[#e6c987] bg-[#d6b46c]/20"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/45"
                }`}
              >
                <div className="font-mono text-[10px] text-[#d6b46c]">LVL {zone.levelRange}</div>
                <div className="font-monument mt-0.5 text-[11px] text-[#fff6df]">
                  {zone.zoneName.replace(/^ZONE 0\d · /, "")}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border border-[#d6b46c]/20 bg-[#0a0d16] p-4">
          <div className="font-monument text-xs sm:text-sm text-[#fff6df]">
            {activeZone.zoneName}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {activeZone.levels.map((levelLabel) => (
              <div
                key={levelLabel}
                className="border border-[#d6b46c]/25 bg-[#0d111e] p-2.5 text-center font-mono text-[11px] text-[#f5dfa6]"
              >
                {levelLabel}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sovereign Runtimes: M-Time, AQEL, DHGS, AGE CODE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-[#d6b46c]/25 bg-[#070910] p-5">
          <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
            <span>{SOVEREIGN_ENGINE_SPECS.mTime.repo}</span>
            <span>{SOVEREIGN_ENGINE_SPECS.mTime.version}</span>
          </div>
          <h4 className="font-monument mt-1 text-sm sm:text-base text-[#fff6df]">
            {SOVEREIGN_ENGINE_SPECS.mTime.name}
          </h4>
          <p className="mt-1 text-xs text-[#d9d0be]">{SOVEREIGN_ENGINE_SPECS.mTime.purpose}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SOVEREIGN_ENGINE_SPECS.mTime.standards.map((std) => (
              <span
                key={std}
                className="border border-[#d6b46c]/25 bg-[#0b0e18] px-2 py-0.5 font-mono text-[10px] text-[#f5dfa6]"
              >
                {std}
              </span>
            ))}
            {SOVEREIGN_ENGINE_SPECS.mTime.hijriCriteria.map((crit) => (
              <span
                key={crit}
                className="border border-[#d6b46c]/25 bg-[#101423] px-2 py-0.5 font-mono text-[10px] text-[#e6decb]"
              >
                {crit}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-[#d6b46c]/25 bg-[#070910] p-5">
          <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
            <span>{SOVEREIGN_ENGINE_SPECS.aqel.repo}</span>
            <span>ARABIC-FIRST AST ENGINE</span>
          </div>
          <h4 className="font-monument mt-1 text-sm sm:text-base text-[#fff6df]">
            {SOVEREIGN_ENGINE_SPECS.aqel.name}
          </h4>
          <p className="mt-1 text-xs text-[#d9d0be]">{SOVEREIGN_ENGINE_SPECS.aqel.purpose}</p>
          <pre
            dir="rtl"
            className="mt-3 overflow-x-auto border border-[#d6b46c]/20 bg-[#0a0d16] p-3 text-right font-mono text-xs text-[#f5dfa6]"
          >
            {SOVEREIGN_ENGINE_SPECS.aqel.sampleSnippet}
          </pre>
        </div>

        <div className="border border-[#d6b46c]/25 bg-[#070910] p-5">
          <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
            <span>{SOVEREIGN_ENGINE_SPECS.dhgs.repo}</span>
            <span>{SOVEREIGN_ENGINE_SPECS.dhgs.version}</span>
          </div>
          <h4 className="font-monument mt-1 text-sm sm:text-base text-[#fff6df]">
            {SOVEREIGN_ENGINE_SPECS.dhgs.name}
          </h4>
          <p className="mt-1 text-xs text-[#d9d0be]">{SOVEREIGN_ENGINE_SPECS.dhgs.purpose}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SOVEREIGN_ENGINE_SPECS.dhgs.primitives.map((prim) => (
              <span
                key={prim}
                className="border border-[#d6b46c]/25 bg-[#0b0e18] px-2.5 py-0.5 font-mono text-[10px] text-[#f5dfa6]"
              >
                {prim}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-[#d6b46c]/25 bg-[#070910] p-5">
          <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
            <span>{SOVEREIGN_ENGINE_SPECS.ageCode.repo}</span>
            <span>CROSS-CIVILIZATION CORPUS</span>
          </div>
          <h4 className="font-monument mt-1 text-sm sm:text-base text-[#fff6df]">
            {SOVEREIGN_ENGINE_SPECS.ageCode.name}
          </h4>
          <p className="mt-1 text-xs text-[#d9d0be]">{SOVEREIGN_ENGINE_SPECS.ageCode.purpose}</p>
          <div className="mt-3 border border-[#d6b46c]/25 bg-[#0b0e18] px-3 py-2 font-mono text-xs text-[#f5dfa6]">
            MATRIX // {SOVEREIGN_ENGINE_SPECS.ageCode.matrix}
          </div>
        </div>
      </div>

      {/* 368-Repo Cross-Organization Topology Atlas */}
      <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
          <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
            CROSS-REPOSITORY TOPOLOGY ATLAS ({totalRepos} VERIFIED GITHUB REPOS · 7 OWNERS + LOCAL
            WORKSPACE)
          </span>
          <span className="font-mono text-[11px] text-[#d6b46c]">
            7 GITHUB OWNERS CONVERGING INTO A-L-L-A-H.COM (+ LOCAL WORKSPACE)
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CROSS_REPO_TOPOLOGY_ATLAS.map((org) => {
            const isSelected = org.orgName === activeOrg.orgName;
            return (
              <button
                key={org.orgName}
                type="button"
                onClick={() => setSelectedOrg(org.orgName)}
                className={`min-h-[44px] border p-3.5 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "border-[#e6c987] bg-[#d6b46c]/20"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/50"
                }`}
              >
                <div className="font-mono text-[11px] text-[#d6b46c]">{org.repoCount} REPOS</div>
                <div className="font-monument mt-0.5 text-xs sm:text-sm text-[#fff6df]">
                  {org.orgName}/*
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border border-[#d6b46c]/20 bg-[#0a0d16] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-monument text-base text-[#fff6df]">
              {activeOrg.orgName}/* ({activeOrg.repoCount} Repositories)
            </span>
            <span className="font-mono text-[11px] text-[#f5dfa6]">{activeOrg.roleInEmpire}</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
                FLAGSHIP REPOSITORIES
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {activeOrg.flagshipRepos.map((repo) => (
                  <span
                    key={repo}
                    className="border border-[#d6b46c]/25 bg-[#0d111e] px-2.5 py-1 font-mono text-[11px] text-[#f8eac6]"
                  >
                    {repo}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] text-[#d6b46c] uppercase">
                LOCAL WORKSPACE ANCHORS
              </div>
              <div className="mt-1.5 space-y-1">
                {activeOrg.localClones.map((clonePath) => (
                  <div
                    key={clonePath}
                    className="border border-[#d6b46c]/15 bg-[#080a12] px-2.5 py-1 font-mono text-[11px] text-[#bfb59e]"
                  >
                    {clonePath}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
