"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FOUR_CORPUS_CONCORDANCE,
  FOUR_CORPUS_POLICY,
  type ClassicalWitnessExcerpt,
  type QuranSearchHit,
} from "@moonwitness/canon";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { DiamondStarOrnament, SearchLensIcon } from "./sacred-icons";
import { SacredCornerBrackets } from "./sacred-illustrations";
import { SiteSubpageHeader } from "./site-subpage-header";

interface ScripturesApiResponse {
  readonly corpusStatus: "LIVE_INDEXED" | "UNAVAILABLE";
  readonly totalAyahs: number;
  readonly totalSurahs: number;
  readonly query: string;
  readonly hits: readonly QuranSearchHit[];
  readonly crosswalk: {
    readonly invariant: string;
    readonly note: string;
    readonly passages: readonly ClassicalWitnessExcerpt[];
  } | null;
}

const PRESET_QUERIES = [
  { q: "2:256", labelEn: "2:256 Zero Coercion", labelId: "2:256 Tanpa Paksaan" },
  { q: "4:135", labelEn: "4:135 Impartial Justice", labelId: "4:135 Keadilan Adil" },
  { q: "55:7", labelEn: "55:7 Measure (Mīzān)", labelId: "55:7 Timbangan Adil" },
  { q: "90:12", labelEn: "90:12 Orphan & Poor", labelId: "90:12 Yatim & Fakir" },
  { q: "الله", labelEn: "Arabic: الله (ALLAH)", labelId: "Arab: الله (ALLAH)" },
  { q: "رحم", labelEn: "Root: رحم (Mercy)", labelId: "Akar: رحم (Kasih)" },
  { q: "قسط", labelEn: "Root: قسط (Equity)", labelId: "Akar: قسط (Keadilan)" },
] as const;

export function ScripturesStudio() {
  const { locale } = useSanctuaryLocale();
  const [query, setQuery] = useState<string>("2:256");
  const [loading, setLoading] = useState<boolean>(true);
  const [payload, setPayload] = useState<ScripturesApiResponse | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string>(FOUR_CORPUS_CONCORDANCE[0]!.id);

  useEffect(() => {
    const controller = new AbortController();
    async function runSearch() {
      setLoading(true);
      try {
        const res = await fetch(`/api/scriptures?q=${encodeURIComponent(query)}&limit=12`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as ScripturesApiResponse;
          setPayload(json);
        }
      } catch {
        // Ignore aborted fetches
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    void runSearch();
    return () => controller.abort();
  }, [query]);

  const activeTheme =
    FOUR_CORPUS_CONCORDANCE.find((item) => item.id === activeThemeId) ??
    FOUR_CORPUS_CONCORDANCE[0]!;

  return (
    <div className="min-h-screen bg-[#040509] text-[#f5efe2] bg-girih-filigree">
      <SiteSubpageHeader activeRoute="scriptures" />

      <main id="main" className="mx-auto max-w-7xl px-4 py-12 sm:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="font-mono text-[11px] tracking-[0.26em] text-[#dfc07b] uppercase">
            {locale === "id"
              ? "PUSAT KAJIAN EMPAT KITAB · NETRAL & TERBUKA"
              : "FOUR-SCRIPTURE PARALLEL STUDIO · NEUTRAL & SOURCE-GROUNDED"}
          </div>
          <h1 className="font-monument text-3xl sm:text-5xl tracking-[0.16em] text-gold-gradient uppercase">
            TAURAT · ZABUR · INJĪL · AL-QUR’ĀN
          </h1>
          <p className="mx-auto max-w-3xl font-serif text-base text-[#e6decb] leading-relaxed">
            {locale === "id"
              ? "Meneliti saksi teks klasik Ibrani (WLC), Yunani Koine (SBLGNT), dan Utsmani Arab (6.236 ayat) secara jujur—memisahkan kategori sumber wahyu dari naskah sejarah, tanpa peringkat agama dan tanpa paksaan."
              : FOUR_CORPUS_POLICY.neutralityPrinciple}
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 border border-[#d6b46c]/30 bg-[#0a0d16] px-4 py-1.5 font-mono text-[10.5px] text-[#f5dfa6]">
            <span>{FOUR_CORPUS_POLICY.invariant}</span>
            <span>·</span>
            <span>
              {payload?.totalAyahs
                ? `${payload.totalAyahs} AYAH / ${payload.totalSurahs} SURAH INDEXED`
                : "LOADING CORPUS INDEX…"}
            </span>
          </div>
        </div>

        {/* Classical Manuscript Witness Panel */}
        <section className="relative border border-[#d6b46c]/30 bg-[#070a13]/95 p-6 sm:p-8">
          <SacredCornerBrackets />
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
            <h2 className="font-monument text-base sm:text-lg tracking-[0.16em] text-[#fff6df] uppercase">
              {locale === "id"
                ? "SAMPEL NASKAH KLASIK PRIMER (IBRANI · YUNANI · ARAB)"
                : "PRIMARY CLASSICAL WITNESS EXCERPTS (HEBREW · GREEK · ARABIC)"}
            </h2>
            <span className="font-mono text-[10px] text-[#dfc07b]">
              OSHB WLC 4.20 · SBLGNT v1.2 · DIVINE-TEXT
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(payload?.crosswalk?.passages ?? []).map((item) => (
              <article
                key={item.corpusCode}
                className="border border-[#d6b46c]/25 bg-[#0a0e19] p-5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px]">
                  <span className="text-[#f5dfa6] font-bold">
                    {item.corpusCode} · {item.corpusName}
                  </span>
                  <span className="text-[#cfc5b0]">{item.language}</span>
                </div>
                <div className="font-mono text-[10px] text-[#d6b46c]">{item.reference}</div>
                <p
                  dir={item.dir}
                  lang={
                    item.language === "Arabic" ? "ar" : item.language === "Hebrew" ? "he" : "el"
                  }
                  className="border-y border-[#d6b46c]/15 py-3 font-serif text-base sm:text-lg leading-loose text-[#fff8e6]"
                >
                  {item.originalText}
                </p>
                <p className="font-serif text-xs text-[#dfd6c3] leading-relaxed">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Live 6,236-Ayah Witness Search Console */}
        <section className="octa-bevel-shell p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/20 pb-4">
            <div>
              <h2 className="font-monument text-base sm:text-lg tracking-[0.16em] text-[#fff6df] uppercase">
                {locale === "id"
                  ? "MESIN PENCARI SAKSI AL-QUR’ĀN (6.236 AYAT UTSMANI)"
                  : "LIVE UTHMANI QUR’ĀN WITNESS ENGINE (6,236 AYAHS)"}
              </h2>
              <p className="mt-1 font-serif text-xs text-[#cfc5b0]">
                {locale === "id"
                  ? "Cari berdasarkan rujukan (misal 2:256, 55:7), nama surah (Al-Fatihah, Ar-Rahman), atau kata/akar Arab (الله, رحم)."
                  : "Search by reference (e.g. 2:256, 55:7), Surah name (Al-Fatihah, Ar-Rahman), or Arabic root (الله, رحم)."}
              </p>
            </div>
            <Link
              href="/codex?door=epistemic-corpus"
              className="btn-luxe-secondary inline-flex items-center px-4 py-1.5 font-mono text-[10.5px] text-[#f5dfa6] uppercase"
            >
              DOOR II EPISTEMIC SPINE &rsaquo;
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 border border-[#d6b46c]/40 bg-[#05070e] px-4 py-2.5">
              <SearchLensIcon className="h-4 w-4 text-[#dfc07b]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search Uthmani corpus by Surah:Ayah or Arabic text"
                placeholder="2:256, Al-Baqarah, رحم..."
                className="w-full bg-transparent font-mono text-sm text-[#fff6df] placeholder-[#9f9580] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset.q}
                type="button"
                aria-pressed={query === preset.q}
                onClick={() => setQuery(preset.q)}
                className="btn-luxe-secondary px-3.5 py-1.5 font-mono text-[10px] text-[#e6decb] cursor-pointer"
              >
                {locale === "id" ? preset.labelId : preset.labelEn}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {loading && !payload ? (
              <div className="border border-[#d6b46c]/20 bg-[#080b14] p-4 font-mono text-xs text-[#cfc5b0]">
                PROBING INDEXED WITNESS CORPUS…
              </div>
            ) : payload && payload.hits.length > 0 ? (
              payload.hits.map((hit) => (
                <div
                  key={hit.reference}
                  className="border border-[#d6b46c]/25 bg-[#090d18]/90 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-[#dfc07b]">
                    <span>
                      SURAH {hit.surah} · {hit.surahName.toUpperCase()}
                    </span>
                    <span className="border border-[#d6b46c]/30 bg-[#0e1424] px-2 py-0.5 text-[#fff4d2]">
                      QS {hit.reference}
                    </span>
                  </div>
                  <p
                    dir="rtl"
                    lang="ar"
                    className="text-xl sm:text-2xl leading-loose text-[#fff8e6]"
                  >
                    {hit.textUthmani}
                  </p>
                </div>
              ))
            ) : (
              <div className="border border-[#d6b46c]/20 bg-[#080b14] p-4 font-mono text-xs text-[#cfc5b0]">
                NO MATCHING WITNESS RECORD FOR &ldquo;{query}&rdquo;.
              </div>
            )}
          </div>
        </section>

        {/* Shared Moral Roots Concordance Matrix */}
        <section className="relative border border-[#d6b46c]/30 bg-[#070a13] p-6 sm:p-8 space-y-5">
          <SacredCornerBrackets />
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-[#dfc07b] uppercase">
              <DiamondStarOrnament className="h-3.5 w-3.5 text-[#f5dfa6]" />
              <span>SHARED MORAL ROOTS // FOUR-CORPUS CONCORDANCE</span>
            </div>
            <span className="font-mono text-[10.5px] text-[#cfc5b0]">{activeTheme.arabicRoot}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {FOUR_CORPUS_CONCORDANCE.map((theme) => (
              <button
                key={theme.id}
                type="button"
                aria-pressed={theme.id === activeTheme.id}
                onClick={() => setActiveThemeId(theme.id)}
                className="btn-luxe-secondary px-3.5 py-2 text-left font-mono text-[10.5px] text-[#f5efe2] uppercase cursor-pointer"
              >
                {theme.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { code: "TAURAT", body: activeTheme.tauratWitness },
              { code: "ZABUR", body: activeTheme.zaburWitness },
              { code: "INJĪL", body: activeTheme.injilWitness },
              { code: "AL-QUR’ĀN", body: activeTheme.quranWitness },
            ].map((item) => (
              <div key={item.code} className="border border-[#d6b46c]/25 bg-[#0b101d] p-4">
                <div className="font-monument text-xs tracking-[0.16em] text-[#f5dfa6]">
                  {item.code}
                </div>
                <p className="mt-2 font-serif text-xs leading-relaxed text-[#e6decb]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#d6b46c]/15 pt-3 font-mono text-[11px] text-[#dfd6c3]">
            <span className="text-[#dfc07b]">STEWARDSHIP ACTION:</span> {activeTheme.livedPractice}
          </div>
        </section>
      </main>
    </div>
  );
}
