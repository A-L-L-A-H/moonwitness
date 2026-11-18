"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MTIME_HISTORICAL_BENCHMARKS,
  MTIME_OBSERVER_SITES,
  computeMTimeSolarLunarEstimate,
  evaluateMTimeCriterion,
  type MTimeElongationBasis,
  type MTimeProfileId,
} from "@moonwitness/canon";
import { LunarDiscArt, RadialGauge, SkinOrnament } from "@moonwitness/ui";
import { MtimeHorizon } from "@moonwitness/ui/icons";
import { DnaBadge, DnaButton, SacredCornerBrackets } from "@moonwitness/ui/imperium";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { SiteSubpageHeader } from "./site-subpage-header";

const HISTORICAL_DATE_PRESETS = [
  { id: "ramadan-1447", iso: "2026-02-17T11:00:00Z", label: "Ramadan 1447 Eve (2026-02-17)" },
  { id: "shawwal-1447", iso: "2026-03-19T11:00:00Z", label: "Shawwal 1447 Eve (2026-03-19)" },
  {
    id: "dhulhijjah-1447",
    iso: "2026-05-16T11:00:00Z",
    label: "Dhulhijjah 1447 Eve (2026-05-16)",
  },
  {
    id: "ramadan-1446",
    iso: "2025-02-28T11:00:00Z",
    label: "Ramadan 1446 Eve (2025-02-28)",
  },
] as const;

const BENCHMARK_EVE_MAP: Readonly<Record<string, string>> = {
  "ID-RAMADAN-1447": "2026-02-17T11:00:00Z",
  "ID-SHAWWAL-1447": "2026-03-19T11:00:00Z",
  "ID-DHULHIJJAH-1447": "2026-05-16T11:00:00Z",
  "ID-RAMADAN-1446": "2025-02-28T11:00:00Z",
};

export function MTimeInteractiveEngine({ compact = false }: { readonly compact?: boolean }) {
  const { locale } = useSanctuaryLocale();
  const [dateIso, setDateIso] = useState<string>("2026-03-19T11:00:00Z");
  const [siteId, setSiteId] = useState<string>(MTIME_OBSERVER_SITES[0]!.id);
  const [profileId, setProfileId] = useState<MTimeProfileId>("MABIMS_ID_2026");
  const [elongationBasis, setElongationBasis] = useState<MTimeElongationBasis>(
    "GEOCENTRIC_CENTER_TO_CENTER",
  );
  const [copiedScenario, setCopiedScenario] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset");
    const criterionParam = params.get("criterion");
    const siteParam = params.get("site");
    const matchedPreset = HISTORICAL_DATE_PRESETS.find((p) => p.id === presetParam);
    if (matchedPreset) {
      setDateIso(matchedPreset.iso);
    }
    if (criterionParam === "MABIMS_ID_2026" || criterionParam === "DIYANET_1978") {
      setProfileId(criterionParam);
    }
    if (siteParam && MTIME_OBSERVER_SITES.some((s) => s.id === siteParam)) {
      setSiteId(siteParam);
    }
  }, []);

  const copyScenarioDeepLink = async () => {
    const url = new URL(window.location.href);
    const matched = HISTORICAL_DATE_PRESETS.find((p) => p.iso === dateIso);
    if (matched) {
      url.searchParams.set("preset", matched.id);
    } else {
      url.searchParams.delete("preset");
    }
    url.searchParams.set("criterion", profileId);
    url.searchParams.set("site", siteId);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedScenario(true);
      window.setTimeout(() => setCopiedScenario(false), 2000);
    } catch {
      // Ignore clipboard denials
    }
  };

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
        <div className="lg:col-span-5 border border-[var(--dna-accent)]/25 bg-[var(--dna-canvas)] p-4 space-y-3">
          <div className="font-mono text-[10.5px] text-[var(--dna-accent)] uppercase">
            {locale === "id"
              ? "LAPIS 1 · WAKTU FISIK UTC & MERIDIAN"
              : "LAYER 1 · PHYSICAL UTC TIME & MERIDIAN"}
          </div>
          <input
            type="text"
            value={dateIso}
            onChange={(e) => setDateIso(e.target.value)}
            aria-label="UTC ISO Timestamp"
            className="w-full border border-[var(--dna-accent)]/35 bg-[var(--dna-canvas)] px-3 py-2 font-mono text-xs text-[var(--dna-text)] focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {HISTORICAL_DATE_PRESETS.map((preset) => (
              <DnaButton
                key={preset.id}
                tone="secondary"
                aria-pressed={dateIso === preset.iso}
                onClick={() => setDateIso(preset.iso)}
                className="px-3 py-1 text-[10px] text-[var(--dna-muted)]"
              >
                {preset.label}
              </DnaButton>
            ))}
          </div>

          <div className="pt-2">
            <div className="font-mono text-[10px] text-[var(--dna-muted)] uppercase mb-1.5">
              OBSERVER SITE
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {MTIME_OBSERVER_SITES.map((s) => (
                <DnaButton
                  key={s.id}
                  tone="secondary"
                  aria-pressed={s.id === activeSite.id}
                  onClick={() => setSiteId(s.id)}
                  className="px-3 py-1.5 justify-start text-left text-[10px] text-[var(--dna-text)]"
                >
                  {s.label}
                </DnaButton>
              ))}
            </div>
          </div>
        </div>

        {/* Computed Geometry Layer */}
        <div className="lg:col-span-7 border border-[var(--dna-accent)]/25 bg-[var(--dna-canvas)] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/15 pb-2.5">
            <span className="inline-flex items-center gap-2 font-mono text-[10.5px] text-[var(--dna-accent)] uppercase">
              <MtimeHorizon className="h-4 w-4" />
              <span>
                {locale === "id"
                  ? "LAPIS 2 · GEOMETRI BULAN-MATAHARI"
                  : "LAYER 2 · SOLAR-LUNAR GEOMETRY ESTIMATE"}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <SkinOrnament slot="tag" label="MABIMS / DIYANET" />
              <span className="font-mono text-[10px] text-[var(--dna-muted)]">
                JD {geometry.julianDayUtc}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border border-[var(--dna-accent)]/20 bg-[var(--dna-surface)] p-3">
            <RadialGauge
              value={geometry.illuminatedPercent}
              max={100}
              size={68}
              label="ILLUM"
              colorVar="var(--dna-accent)"
            />
            <LunarDiscArt className="h-14 w-14 shrink-0" decorative />
            <div className="min-w-0 flex-1 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
              <div className="border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-2.5">
                <div className="text-[9.5px] text-[var(--dna-muted)]">MOON AGE</div>
                <div className="mt-1 text-base text-[var(--dna-text)]">
                  {geometry.moonAgeDays} d
                </div>
              </div>
              <div className="border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-2.5">
                <div className="text-[9.5px] text-[var(--dna-muted)]">ILLUMINATION</div>
                <div className="mt-1 text-base text-[var(--dna-text)]">
                  {geometry.illuminatedPercent}%
                </div>
              </div>
              <div className="border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-2.5">
                <div className="text-[9.5px] text-[var(--dna-muted)]">ELONGATION</div>
                <div className="mt-1 text-base text-[var(--dna-accent)]">
                  {geometry.elongationGeocentricDeg}°
                </div>
              </div>
              <div className="border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-2.5">
                <div className="text-[9.5px] text-[var(--dna-muted)]">SUNSET ALTITUDE</div>
                <div className="mt-1 text-base text-[var(--dna-accent)]">
                  {geometry.estimatedSunsetAltitudeDeg}°
                </div>
              </div>
            </div>
          </div>

          {/* Criterion Evaluation & Semantic Basis Separation */}
          <div className="border-t border-[var(--dna-accent)]/15 pt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] text-[var(--dna-accent)] uppercase">
                LAYER 3 · CRITERION &amp; SEMANTIC GUARD ({criterion.profileId})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["MABIMS_ID_2026", "DIYANET_1978"] as const).map((id) => (
                  <DnaButton
                    key={id}
                    tone="secondary"
                    aria-pressed={profileId === id}
                    onClick={() => setProfileId(id)}
                    className="px-3 py-1 text-[10px] text-[var(--dna-text)]"
                  >
                    {id}
                  </DnaButton>
                ))}
                <DnaButton
                  tone="secondary"
                  aria-pressed={elongationBasis === "GEOCENTRIC_APPARENT"}
                  onClick={() =>
                    setElongationBasis((prev) =>
                      prev === "GEOCENTRIC_CENTER_TO_CENTER"
                        ? "GEOCENTRIC_APPARENT"
                        : "GEOCENTRIC_CENTER_TO_CENTER",
                    )
                  }
                  className="px-3 py-1 text-[10px] text-[var(--dna-muted)]"
                >
                  BASIS:{" "}
                  {elongationBasis === "GEOCENTRIC_CENTER_TO_CENTER"
                    ? "CENTER-TO-CENTER"
                    : "APPARENT"}
                </DnaButton>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {criterion.clauses.map((c) => (
                <div
                  key={c.id}
                  className="border border-[var(--dna-accent)]/20 bg-[var(--dna-surface)] p-3 font-mono text-[10.5px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--dna-accent)]">{c.id}</span>
                    <span
                      className={
                        c.passed === true
                          ? "text-[var(--dna-text)]"
                          : c.passed === false
                            ? "text-[var(--dna-accent)]"
                            : "text-[var(--dna-warning)]"
                      }
                    >
                      {c.passed === true ? "PASS" : c.passed === false ? "FAIL" : "UNKNOWN"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--dna-muted)]">{c.reason}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--dna-accent)]/30 bg-[var(--dna-surface)] px-3.5 py-2.5 font-mono text-[11px]">
              <span>
                VERDICT: <strong className="text-[var(--dna-text)]">{criterion.verdict}</strong> ·
                ACTION:{" "}
                <strong className="text-[var(--dna-accent)]">{criterion.computedAction}</strong>
              </span>
              <div className="flex items-center gap-2">
                <DnaButton
                  tone="secondary"
                  onClick={() => void copyScenarioDeepLink()}
                  className="px-3 py-1 text-[10px] text-[var(--dna-accent)]"
                >
                  {copiedScenario
                    ? locale === "id"
                      ? "DISALIN"
                      : "COPIED"
                    : locale === "id"
                      ? "SALIN TAUTAN"
                      : "SHARE SCENARIO"}
                </DnaButton>
                <span className="text-[10px] text-[var(--dna-muted)]">
                  {locale === "id"
                    ? "OBSERVASI & OTORITAS TETAP TERPISAH"
                    : "OBSERVATION & AUTHORITY REMAIN SEPARATE"}
                </span>
              </div>
            </div>
            <p className="text-[11px] font-sans text-[var(--dna-muted)]">{geometry.methodNote}</p>
          </div>
        </div>
      </div>

      {!compact && (
        <section className="relative border border-[var(--dna-accent)]/30 bg-[var(--dna-canvas)] p-6 sm:p-8 space-y-4">
          <SacredCornerBrackets />
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
            <h2 className="font-monument text-base sm:text-lg tracking-[0.16em] text-[var(--dna-text)] uppercase">
              KEMENAG RI 1446–1447 H VERIFIED HISTORICAL FALSIFICATION CORPUS
            </h2>
            <span className="font-mono text-[10px] text-[var(--dna-accent)]">
              SOURCE: ANTIKYTHERA-TIME v0.11 / MTIME-HIJRI
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {MTIME_HISTORICAL_BENCHMARKS.map((item) => (
              <div
                key={item.id}
                className="border border-[var(--dna-accent)]/25 bg-[var(--dna-surface)] p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between font-mono text-[10.5px]">
                  <span className="text-[var(--dna-accent)] font-bold">
                    {item.id} · {item.officialMonthStart}
                  </span>
                  <DnaBadge className="font-mono text-[10px] text-[var(--dna-text)]">
                    {item.criterionStatus}
                  </DnaBadge>
                </div>
                <div className="font-mono text-[10px] text-[var(--dna-accent)]">
                  {item.sourceAuthority} · {item.observationStatus}
                </div>
                <p className="font-serif text-xs text-[var(--dna-muted)]">{item.sourceNote}</p>
                <div className="pt-1">
                  <DnaButton
                    tone="secondary"
                    onClick={() => {
                      const targetIso =
                        BENCHMARK_EVE_MAP[item.id] ?? `${item.officialMonthStart}T11:00:00Z`;
                      setDateIso(targetIso);
                      setProfileId("MABIMS_ID_2026");
                      setSiteId("ID-JAKARTA");
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="px-3 py-1 text-[10px] text-[var(--dna-accent)] uppercase"
                  >
                    {locale === "id" ? "MUAT KE EVALUATOR" : "LOAD INTO EVALUATOR"}
                  </DnaButton>
                </div>
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
    <div className="min-h-screen bg-[var(--dna-canvas)] text-[var(--dna-text)] bg-girih-filigree">
      <SiteSubpageHeader activeRoute="mtime" />
      <main id="main" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="font-mono text-[11px] tracking-[0.26em] text-[var(--dna-accent)] uppercase">
            ANTIKYTHERA M-TIME · MĪQĀT TEMPORAL PROTOCOL
          </div>
          <h1 className="font-monument text-3xl sm:text-5xl tracking-[0.16em] text-gold-gradient uppercase">
            {locale === "id" ? "OBSERVATORIUM WAKTU M-TIME" : "EXPLAINABLE M-TIME OBSERVATORY"}
          </h1>
          <p className="mx-auto max-w-3xl font-serif text-base text-[var(--dna-muted)] leading-relaxed">
            {locale === "id"
              ? "Memisahkan waktu fisik UTC, estimasi geometri bulan-matahari, kriteria imkanur rukyat (MABIMS / Diyanet), hasil rukyat lapangan, dan keputusan otoritas tanpa mencampuradukkan peran."
              : "Strictly separating physical UTC time, solar-lunar geometry, calendar visibility criteria (MABIMS_ID_2026 / DIYANET_1978), field observation, and official decree."}
          </p>
          <div>
            <Link
              href="/codex?door=sovereign-runtimes"
              className="btn-luxe-secondary inline-flex items-center px-4 py-1.5 font-mono text-[10.5px] text-[var(--dna-accent)] uppercase"
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
