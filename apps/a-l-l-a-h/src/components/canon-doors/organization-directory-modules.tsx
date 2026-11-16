"use client";

import { useMemo, useState } from "react";
import { AMANAH_25_ATLAS, GOD_99_DEPARTMENTS, GOD_99_DIRECTORY } from "@/data/empire-canon-codex";

export function God99DirectoryExplorer() {
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");

  const needle = query.trim().toLowerCase();
  const visibleSlots = useMemo(
    () =>
      GOD_99_DIRECTORY.filter((slot) => {
        if (selectedDept !== "ALL" && slot.departmentCode !== selectedDept) return false;
        if (!needle) return true;
        return (
          slot.slotId.toLowerCase().includes(needle) ||
          slot.codename.toLowerCase().includes(needle) ||
          slot.attributeReflection.toLowerCase().includes(needle) ||
          slot.departmentName.toLowerCase().includes(needle)
        );
      }),
    [selectedDept, needle],
  );

  return (
    <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
        <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
          G.O.D. 99 STEWARDSHIP DIRECTORY (9 DEPTS × 11 = 99 SLOTS)
        </span>
        <span className="border border-[#d6b46c]/40 bg-[#d6b46c]/15 px-2.5 py-0.5 font-mono text-[10px] text-[#f5dfa6]">
          ALL SLOTS: UNASSIGNED · POWERS: NONE · ETHICAL_ANALOGY_NOT_IDENTITY
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={selectedDept === "ALL"}
            onClick={() => setSelectedDept("ALL")}
            className={`min-h-[44px] border px-2.5 py-1 font-mono text-[10px] cursor-pointer ${
              selectedDept === "ALL"
                ? "border-[#fff2c6] bg-[#d6b46c]/20 text-[#fff6df]"
                : "border-[#d6b46c]/20 bg-[#0b0e18] text-[#bfb59e]"
            }`}
          >
            ALL (99)
          </button>
          {GOD_99_DEPARTMENTS.map((dept) => {
            const active = selectedDept === dept.code;
            return (
              <button
                key={dept.code}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedDept(dept.code)}
                className={`min-h-[44px] border px-2.5 py-1 font-mono text-[10px] cursor-pointer ${
                  active
                    ? "border-[#fff2c6] bg-[#d6b46c]/20 text-[#fff6df]"
                    : "border-[#d6b46c]/20 bg-[#0b0e18] text-[#bfb59e] hover:border-[#d6b46c]/45"
                }`}
              >
                {dept.code} {dept.name}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GOD-001, codename, Al-Haqq..."
          aria-label="Search G.O.D. 99 directory"
          className="min-h-[44px] w-full sm:w-64 border border-[#d6b46c]/30 bg-[#090c15] px-3 py-1.5 font-mono text-xs text-[#fff6df] placeholder-[#8e8572] focus:border-[#f5dfa6] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-4 max-h-[380px] overflow-y-auto pr-1">
        {visibleSlots.map((slot) => (
          <div key={slot.slotId} className="border border-[#d6b46c]/20 bg-[#0a0d16] p-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
              <span>{slot.slotId}</span>
              <span>
                {slot.departmentCode} · {slot.pillar}
              </span>
            </div>
            <div className="font-monument mt-1 text-xs text-[#fff6df]">{slot.codename}</div>
            <div className="mt-0.5 font-serif text-xs text-[#f5dfa6]">
              {slot.attributeReflection}
            </div>
            <div className="mt-1.5 font-mono text-[9.5px] text-[#9e9580]">
              {slot.status} · {slot.powers}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Amanah25AtlasPanel() {
  const [filterText, setFilterText] = useState<string>("");
  const needle = filterText.trim().toLowerCase();
  const visible = useMemo(
    () =>
      AMANAH_25_ATLAS.filter(
        (entry) =>
          !needle ||
          entry.prophet.toLowerCase().includes(needle) ||
          entry.amanahKey.toLowerCase().includes(needle) ||
          entry.domainFocus.toLowerCase().includes(needle) ||
          entry.quranRef.toLowerCase().includes(needle),
      ),
    [needle],
  );

  return (
    <div className="border border-[#d6b46c]/25 bg-[#070910] p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
        <div>
          <span className="font-monument text-sm sm:text-base tracking-[0.16em] text-[#f5e3b8] uppercase">
            25 BIDANG AMANAH PEDAGOGICAL ATLAS (01 ADAM → 25 MUHAMMAD ﷺ)
          </span>
          <div className="mt-0.5 font-mono text-[10px] text-[#cfc5b0]">
            Origin: Narrative Stewardship Archive (conv-001[33]) · Pedagogical anchor only (Avatar =
            teaching metaphor, never infallibility claim)
          </div>
        </div>
        <input
          type="search"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search prophet, amanah, surah..."
          aria-label="Filter 25 Bidang Amanah"
          className="min-h-[44px] w-full sm:w-64 border border-[#d6b46c]/30 bg-[#090c15] px-3 py-1.5 font-mono text-xs text-[#fff6df] placeholder-[#8e8572] focus:border-[#f5dfa6] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((entry) => (
          <div
            key={entry.number}
            className={`border p-3 ${
              entry.rejectedFlag
                ? "border-[#e6c987]/50 bg-[#140e12]"
                : "border-[#d6b46c]/20 bg-[#0a0d16]"
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-[#d6b46c]">
              <span>#{String(entry.number).padStart(2, "0")}</span>
              <span>{entry.quranRef}</span>
            </div>
            <div className="font-monument mt-1 text-xs text-[#fff6df]">{entry.prophet}</div>
            <div className="mt-0.5 font-mono text-[11px] text-[#f5dfa6]">{entry.amanahKey}</div>
            <p className="mt-1 text-[11px] text-[#bfb59e]">{entry.domainFocus}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
