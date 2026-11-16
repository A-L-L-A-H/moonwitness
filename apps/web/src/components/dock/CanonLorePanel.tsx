"use client";

import { useMemo, useState } from "react";
import {
  EIGHT_STORY_ERAS,
  FIFTEEN_STORY_EPISODES,
  SEVEN_STEP_PROMISE,
  WORLD_PATCHES_REGISTRY,
} from "@moonwitness/canon";
import { IMPERIUM_GATE_URL } from "@/lib/sanctuary-url";

export function CanonLorePanel() {
  const [patchSearch, setPatchSearch] = useState("");
  const [selectedEraId, setSelectedEraId] = useState<string>("all");

  const needle = patchSearch.trim().toLowerCase();
  const visiblePatches = useMemo(
    () =>
      WORLD_PATCHES_REGISTRY.filter((p) => {
        if (!needle) return true;
        return (
          p.patchNumber.toLowerCase().includes(needle) ||
          p.title.toLowerCase().includes(needle) ||
          p.notes.toLowerCase().includes(needle)
        );
      }),
    [needle],
  );

  const conflictPair = WORLD_PATCHES_REGISTRY.filter((p) => p.status === "number_conflict");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[var(--line)] bg-[var(--panel)] p-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.25em] text-[var(--blue)]">
            @MOONWITNESS/CANON SSOT · MOONWITNESS II &amp; XII ARCHIVE
          </p>
          <h2 className="mt-1 font-brush text-2xl text-zinc-100">
            8 STORY ERAS · 15 EPISODES · 33 WORLD PATCHES
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Promise Flow: {SEVEN_STEP_PROMISE.join(" → ")}
          </p>
        </div>
        <a
          href={`${IMPERIUM_GATE_URL}/#the-codex`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-zine btn-blue min-h-11 px-4 py-2 text-xs"
        >
          OPEN IN A-L-L-A-H CODEX ↗
        </a>
      </div>

      {/* 8 Canonical Story Eras */}
      <section aria-label="Canonical story eras" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--yellow)]">
            8 CANONICAL STORY ERAS (moonwitness-II)
          </h3>
          {selectedEraId !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedEraId("all")}
              className="font-mono text-xs text-[var(--blue)] underline"
            >
              Show all eras
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {EIGHT_STORY_ERAS.map((eraItem) => {
            const active = selectedEraId === eraItem.id;
            return (
              <button
                key={eraItem.id}
                type="button"
                onClick={() => setSelectedEraId(active ? "all" : eraItem.id)}
                className={`min-h-24 border-2 p-3 text-left transition-colors ${
                  active
                    ? "border-[var(--pink)] bg-[var(--pink)]/10"
                    : "border-[var(--line)] bg-[var(--panel)] hover:border-zinc-500"
                }`}
              >
                <div className="font-mono text-[10px] text-[var(--blue)]">
                  {eraItem.id.toUpperCase()} · {eraItem.subtitle}
                </div>
                <div className="mt-1 font-brush text-lg text-zinc-100">{eraItem.title}</div>
                <p className="mt-1 text-xs text-zinc-400">{eraItem.theme}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 15 Story Episodes */}
      <section aria-label="Story episodes" className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--pink)]">
          15 EDITORIAL SYNOPSIS EPISODES (storyArchive.js)
        </h3>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {FIFTEEN_STORY_EPISODES.map((ep) => (
            <div key={ep.code} className="border border-[var(--line)] bg-[var(--panel)] p-3">
              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--yellow)]">
                <span>{ep.code}</span>
                <span>{ep.arcFocus}</span>
              </div>
              <h4 className="mt-1 text-sm font-bold text-zinc-100">{ep.title}</h4>
              <p className="mt-1 text-xs text-zinc-400">{ep.coreQuestion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 33 World Patches + Explicit #014 Disclosure */}
      <section aria-label="World patches registry" className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--blue)]">
            33 WORLD PATCHES REGISTRY (0 DIVINE APPROVALS)
          </h3>
          <input
            type="search"
            value={patchSearch}
            onChange={(e) => setPatchSearch(e.target.value)}
            placeholder="Filter #001, #014, MAROON, RIBA…"
            aria-label="Filter canonical world patches"
            className="min-h-11 w-full sm:w-64 border-2 border-[var(--line)] bg-black/30 px-3 text-xs text-zinc-100 outline-none focus:border-[var(--blue)]"
          />
        </div>

        <div className="border-2 border-[var(--yellow)]/50 bg-black/25 p-3">
          <p className="font-mono text-[10px] tracking-widest text-[var(--yellow)]">
            DISCLOSED #014 NUMBER CONFLICT — PRESERVED SIDE BY SIDE
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {conflictPair.map((c) => (
              <div key={c.id} className="border border-[var(--line)] bg-[var(--panel)] p-2.5">
                <div className="font-mono text-[10px] text-[var(--yellow)]">{c.category}</div>
                <div className="text-xs font-bold text-zinc-100">{c.title}</div>
                <p className="text-[11px] text-zinc-400">{c.notes}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePatches.map((patch) => (
            <div key={patch.id} className="border border-[var(--line)] bg-[var(--panel)] p-3">
              <div className="flex items-center justify-between font-mono text-[10px] text-[var(--blue)]">
                <span>{patch.patchNumber}</span>
                <span>{patch.category}</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-zinc-100">{patch.title}</div>
              <p className="mt-0.5 text-[11px] text-zinc-400">{patch.notes}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
