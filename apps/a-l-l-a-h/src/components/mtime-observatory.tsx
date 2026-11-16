"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MTIME_HISTORICAL_BENCHMARKS,
  MTIME_OBSERVER_SITES,
  computeMTimeSolarLunarEstimate,
  evaluateMTimeCriterion,
  type MTimeElongationBasis,
  type MTimeProfileId,
} from "@moonwitness/canon";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { SacredCornerBrackets } from "./sacred-illustrations";
import { SiteSubpageHeader } from "./site-subpage-header";

const HISTORICAL_DATE_PRESETS = [
  { id: "ramadan-1447", iso: "2026-02-17T11:00:00Z", label: "Ramadan 1447 Eve (2026-02-17)" },
  { id: "shawwal-1447", iso: "2026-03-19T11:00:00Z", label: "Shawwal 1447 Eve (2026-03-19)" },
  {
    id: "dhulhijjah-1447",
    iso: "2026-05-16T11:00:00Z",
    label: "Dhulhijjah 1447 Eve (2026-05-16)",
  },
] as const;

export function MTimeInteractiveEngine({ compact = false }: { readonly compact?: boolean }) {
  const { locale } = useSanctuaryLocale();
  const [dateIso, setDateIso] = useState<string>("2026-03-19T11:00:00Z");
  const [siteId, setSiteId] = useState<string>(MTIME_OBSERVER_SITES[0]!.id);
  const [profileId, setProfileId] = useState<MTimeProfileId>("MABIMS_ID_2026");
  const [elongationBasis, setElongationBasis] = useState<MTimeElongationBasis>(
    "GEOCENTRIC_CENTER_TO_CENTER",
  );

  const activeSite = MTIME_OBSERVER_SITES.find((s) => s.id === siteId) ?? MTIME_OBSERVER_SITES[0]!;
  const geometry = computeMTimeSolarLunarEstimate(dateIso, activeSite);
  const criterion = evaluateMTimeCriterion(profileId, {
    moonAltitudeDeg: geometry.estimatedSunsetAltitudeDeg,
    elongationDeg: geometry.elongationGeocentricDeg,
    semantics: {
      altitudeBasis: "TOPOCENTRIC",
      elongationBasis,
    },
  });

  return (
    <div className="space-y-6">
      {/* Date + Meridian + Profile Controls */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 border border-[#d6b46c]/25 bg-[#090d17] p-4 space-y-3">
          <div className="font-mono text-[10.5px] text-[#dfc07b] uppercase">
            {locale === "id"
              ? "LAPIS 1 · WAKTU FISIK UTC & MERIDIAN"
              : "LAYER 1 · PHYSICAL UTC TIME & MERIDIAN"}
          </div>
          <input
            type="text"
            value={dateIso}
            onChange={(e) => setDateIso(e.target.value)}
            aria-label="UTC ISO Timestamp"
            className="w-full border border-[#d6b46c]/35 bg-[#05070e] px-3 py-2 font-mono text-xs text-[#fff6df] focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {HISTORICAL_DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={dateIso === preset.iso}
                onClick={() => setDateIso(preset.iso)}
                className="btn-luxe-secondary px-3 py-1 font-mono text-[10px] text-[#e6decb] cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <div className="font-mono text-[10px] text-[#cfc5b0] uppercase mb-1.5">
              OBSERVER SITE
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {MTIME_OBSERVER_SITES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === activeSite.id}
                  onClick={() => setSiteId(s.id)}
                  className="btn-luxe-secondary px-3 py-1.5 text-left font-mono text-[10px] text-[#f5efe2] cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Computed Geometry Layer */}
        <div className="lg:col-span-7 border border-[#d6b46c]/25 bg-[#090d17] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/15 pb-2.5">
            <span className="font-mono text-[10.5px] text-[#dfc07b] uppercase">
              {locale === "id"
                ? "LAPIS 2 · GEOMETRI BULAN-MATAHARI"
                : "LAYER 2 · SOLAR-LUNAR GEOMETRY ESTIMATE"}
            </span>
            <span className="font-mono text-[10px] text-[#cfc5b0]">JD {geometry.julianDayUtc}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
            <div className="border border-[#d6b46c]/20 bg-[#0c101d] p-3">
              <div className="text-[9.5px] text-[#bfb59e]">MOON AGE</div>
              <div className="mt-1 text-base text-[#fff8e6]">{geometry.moonAgeDays} d</div>
            </div>
            <div className="border border-[#d6b46c]/20 bg-[#0c101d] p-3">
              <div className="text-[9.5px] text-[#bfb59e]">ILLUMINATION</div>
              <div className="mt-1 text-base text-[#fff8e6]">{geometry.illuminatedPercent}%</div>
            </div>
            <div className="border border-[#d6b46c]/20 bg-[#0c101d] p-3">
              <div className="text-[9.5px] text-[#bfb59e]">ELONGATION</div>
              <div className="mt-1 text-base text-[#f5dfa6]">
                {geometry.elongationGeocentricDeg}°
              </div>
            </div>
            <div className="border border-[#d6b46c]/20 bg-[#0c101d] p-3">
              <div className="text-[9.5px] text-[#bfb59e]">SUNSET ALTITUDE</div>
              <div className="mt-1 text-base text-[#f5dfa6]">
                {geometry.estimatedSunsetAltitudeDeg}°
              </div>
            </div>
          </div>

          {/* Criterion Evaluation & Semantic Basis Separation */}
          <div className="border-t border-[#d6b46c]/15 pt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] text-[#dfc07b] uppercase">
                LAYER 3 · CRITERION &amp; SEMANTIC GUARD ({criterion.profileId})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["MABIMS_ID_2026", "DIYANET_1978"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={profileId === id}
                    onClick={() => setProfileId(id)}
                    className="btn-luxe-secondary px-3 py-1 font-mono text-[10px] text-[#f5efe2] cursor-pointer"
                  >
                    {id}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={elongationBasis === "GEOCENTRIC_APPARENT"}
                  onClick={() =>
                    setElongationBasis((prev) =>
                      prev === "GEOCENTRIC_CENTER_TO_CENTER"
                        ? "GEOCENTRIC_APPARENT"
                        : "GEOCENTRIC_CENTER_TO_CENTER",
                    )
                  }
                  className="btn-luxe-secondary px-3 py-1 font-mono text-[10px] text-[#d8ceba] cursor-pointer"
                >
                  BASIS:{" "}
                  {elongationBasis === "GEOCENTRIC_CENTER_TO_CENTER"
                    ? "CENTER-TO-CENTER"
                    : "APPARENT"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {criterion.clauses.map((c) => (
                <div
                  key={c.id}
                  className="border border-[#d6b46c]/20 bg-[#0c101d] p-3 font-mono text-[10.5px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#dfc07b]">{c.id}</span>
                    <span
                      className={
                        c.passed === true
                          ? "text-[#fff4d2]"
                          : c.passed === false
                            ? "text-[#d6b46c]"
                            : "text-[#f59e0b]"
                      }
                    >
                      {c.passed === true ? "PASS" : c.passed === false ? "FAIL" : "UNKNOWN"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#dfd6c3]">{c.reason}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border border-[#d6b46c]/30 bg-[#0b101d] px-3.5 py-2.5 font-mono text-[11px]">
              <span>
                VERDICT: <strong className="text-[#fff8e6]">{criterion.verdict}</strong> · ACTION:{" "}
                <strong className="text-[#f5dfa6]">{criterion.computedAction}</strong>
              </span>
              <span className="text-[10px] text-[#cfc5b0]">
                OBSERVATION &amp; AUTHORITY REMAIN SEPARATE
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#bfb59e]">{geometry.methodNote}</p>
          </div>
        </div>
      </div>

      {!compact && (
        <section className="relative border border-[#d6b46c]/30 bg-[#070a13] p-6 sm:p-8 space-y-4">
          <SacredCornerBrackets />
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
            <h2 className="font-monument text-base sm:text-lg tracking-[0.16em] text-[#fff6df] uppercase">
              KEMENAG RI 1446–1447 H VERIFIED HISTORICAL FALSIFICATION CORPUS
            </h2>
            <span className="font-mono text-[10px] text-[#dfc07b]">
              SOURCE: ANTIKYTHERA-TIME v0.11 / MTIME-HIJRI
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MTIME_HISTORICAL_BENCHMARKS.map((item) => (
              <div
                key={item.id}
                className="border border-[#d6b46c]/25 bg-[#0a0f1c] p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between font-mono text-[10.5px]">
                  <span className="text-[#f5dfa6] font-bold">
                    {item.id} · {item.officialMonthStart}
                  </span>
                  <span className="border border-[#d6b46c]/35 px-2 py-0.5 text-[#fff4d2]">
                    {item.criterionStatus}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-[#dfc07b]">
                  {item.sourceAuthority} · {item.observationStatus}
                </div>
                <p className="font-serif text-xs text-[#e6decb]">{item.sourceNote}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function MTimeObservatory() {
  const { locale } = useSanctuaryLocale();

  return (
    <div className="min-h-screen bg-[#040509] text-[#f5efe2] bg-girih-filigree">
      <SiteSubpageHeader activeRoute="mtime" />
      <main id="main" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="font-mono text-[11px] tracking-[0.26em] text-[#dfc07b] uppercase">
            ANTIKYTHERA M-TIME · MĪQĀT TEMPORAL PROTOCOL
          </div>
          <h1 className="font-monument text-3xl sm:text-5xl tracking-[0.16em] text-gold-gradient uppercase">
            {locale === "id" ? "OBSERVATORIUM WAKTU M-TIME" : "EXPLAINABLE M-TIME OBSERVATORY"}
          </h1>
          <p className="mx-auto max-w-3xl font-serif text-base text-[#e6decb] leading-relaxed">
            {locale === "id"
              ? "Memisahkan waktu fisik UTC, estimasi geometri bulan-matahari, kriteria imkanur rukyat (MABIMS / Diyanet), hasil rukyat lapangan, dan keputusan otoritas tanpa mencampuradukkan peran."
              : "Strictly separating physical UTC time, solar-lunar geometry, calendar visibility criteria (MABIMS_ID_2026 / DIYANET_1978), field observation, and official decree."}
          </p>
          <div>
            <Link
              href="/codex?door=sovereign-runtimes"
              className="btn-luxe-secondary inline-flex items-center px-4 py-1.5 font-mono text-[10.5px] text-[#f5dfa6] uppercase"
            >
              DOOR IV SOVEREIGN RUNTIMES &rsaquo;
            </Link>
          </div>
        </div>

        <MTimeInteractiveEngine />
      </main>
    </div>
  );
}
