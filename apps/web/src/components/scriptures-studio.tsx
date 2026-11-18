"use client";

import { requestApiResponse } from "@moonwitness/contracts/sdk";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FOUR_CORPUS_CONCORDANCE,
  FOUR_CORPUS_POLICY,
  type ClassicalWitnessExcerpt,
  type QuranSearchHit,
  type ScriptureCorpusFilter,
  type UnifiedScriptureHit,
} from "@moonwitness/canon";
import { Button, CutoutArtwork, DnaBrandLogo, Input } from "@moonwitness/ui";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { DnaBadge, DnaButton, DnaChamber, SearchLensIcon } from "@moonwitness/ui/imperium";
import { ClassicalWitnessPanel, MoralRootsConcordancePanel } from "./scriptures-panels";
import { SiteSubpageHeader } from "./site-subpage-header";

interface ScripturesApiResponse {
  readonly corpusStatus: "LIVE_INDEXED" | "UNAVAILABLE";
  readonly corpusFilter?: ScriptureCorpusFilter;
  readonly totalAyahs: number;
  readonly totalSurahs: number;
  readonly corpusCounts?: {
    readonly taurat: number;
    readonly zabur: number;
    readonly injil: number;
    readonly quran: number;
    readonly totalVerses: number;
  };
  readonly query: string;
  readonly hits: readonly QuranSearchHit[];
  readonly unifiedHits?: readonly UnifiedScriptureHit[];
  readonly crosswalk: {
    readonly invariant: string;
    readonly note: string;
    readonly passages: readonly ClassicalWitnessExcerpt[];
  } | null;
}

const CORPUS_TABS: readonly {
  readonly id: ScriptureCorpusFilter;
  readonly labelEn: string;
  readonly labelId: string;
  readonly countKey: "totalVerses" | "taurat" | "zabur" | "injil" | "quran";
}[] = [
  { id: "ALL", labelEn: "ALL FOUR CORPORA", labelId: "EMPAT KITAB PENUH", countKey: "totalVerses" },
  { id: "SRC-TOR", labelEn: "TAURAT · WLC", labelId: "TAURAT · WLC", countKey: "taurat" },
  { id: "SRC-ZAB", labelEn: "ZABUR · PSALMS", labelId: "ZABUR · MAZMUR", countKey: "zabur" },
  { id: "SRC-INJ", labelEn: "INJĪL · SBLGNT", labelId: "INJĪL · SBLGNT", countKey: "injil" },
  {
    id: "SRC-QUR",
    labelEn: "AL-QUR’ĀN · UTHMANI",
    labelId: "AL-QUR’ĀN · UTSMANI",
    countKey: "quran",
  },
];

const PRESET_QUERIES: readonly {
  readonly q: string;
  readonly corpus: ScriptureCorpusFilter;
  readonly labelEn: string;
  readonly labelId: string;
}[] = [
  { q: "Gen 1:1", corpus: "SRC-TOR", labelEn: "Taurat · Gen 1:1", labelId: "Taurat · Kej 1:1" },
  { q: "Deut 6:4", corpus: "SRC-TOR", labelEn: "Taurat · Deut 6:4", labelId: "Taurat · Ul 6:4" },
  { q: "Ps 23:1", corpus: "SRC-ZAB", labelEn: "Zabur · Ps 23:1", labelId: "Zabur · Mzm 23:1" },
  { q: "John 1:1", corpus: "SRC-INJ", labelEn: "Injīl · John 1:1", labelId: "Injīl · Yoh 1:1" },
  { q: "θεος", corpus: "SRC-INJ", labelEn: "Greek · θεός", labelId: "Yunani · θεός" },
  { q: "2:256", corpus: "SRC-QUR", labelEn: "Qur’ān · 2:256", labelId: "Qur’ān · 2:256" },
  {
    q: "55:7",
    corpus: "SRC-QUR",
    labelEn: "Qur’ān · 55:7 (Mīzān)",
    labelId: "Qur’ān · 55:7 (Mīzān)",
  },
  { q: "الله", corpus: "SRC-QUR", labelEn: "Arabic · الله", labelId: "Arab · الله" },
];

export function ScripturesStudio() {
  const { locale } = useSanctuaryLocale();
  const [query, setQuery] = useState<string>("2:256");
  const [corpusFilter, setCorpusFilter] = useState<ScriptureCorpusFilter>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [payload, setPayload] = useState<ScripturesApiResponse | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string>(FOUR_CORPUS_CONCORDANCE[0]!.id);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q")?.trim();
    const initialCorpus = params.get("corpus")?.trim().toUpperCase();
    if (initialQ) {
      setQuery(initialQ.slice(0, 120));
    }
    if (
      initialCorpus === "ALL" ||
      initialCorpus === "SRC-TOR" ||
      initialCorpus === "SRC-ZAB" ||
      initialCorpus === "SRC-INJ" ||
      initialCorpus === "SRC-QUR"
    ) {
      setCorpusFilter(initialCorpus);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set("q", query.trim());
    } else {
      url.searchParams.delete("q");
    }
    if (corpusFilter !== "ALL") {
      url.searchParams.set("corpus", corpusFilter);
    } else {
      url.searchParams.delete("corpus");
    }
    window.history.replaceState(null, "", url.toString());
  }, [query, corpusFilter]);

  const copyShareUrl = async (targetQuery?: string, targetCorpus?: ScriptureCorpusFilter) => {
    const url = new URL(window.location.href);
    if (targetQuery) {
      url.searchParams.set("q", targetQuery);
    }
    if (targetCorpus && targetCorpus !== "ALL") {
      url.searchParams.set("corpus", targetCorpus);
    } else if (!targetCorpus && corpusFilter === "ALL") {
      url.searchParams.delete("corpus");
    }
    const label = targetQuery ?? "search";
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(label);
      window.setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    async function runSearch() {
      setLoading(true);
      try {
        const res = await requestApiResponse(
          `/api/scriptures?corpus=${encodeURIComponent(corpusFilter)}&q=${encodeURIComponent(query)}&limit=12`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
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
  }, [query, corpusFilter]);

  const activeTheme =
    FOUR_CORPUS_CONCORDANCE.find((item) => item.id === activeThemeId) ??
    FOUR_CORPUS_CONCORDANCE[0]!;

  const counts = payload?.corpusCounts;
  const displayedHits: readonly UnifiedScriptureHit[] =
    payload?.unifiedHits && payload.unifiedHits.length > 0
      ? payload.unifiedHits
      : (payload?.hits ?? []).map((h) => ({
          corpusCode: "SRC-QUR" as const,
          corpusLabel: "AL-QUR’ĀN (Uthmani)",
          reference: `QS ${h.reference}`,
          bookOrSurah: h.surahName,
          chapterOrSurah: h.surah,
          verseOrAyah: h.ayah,
          dir: "rtl" as const,
          language: "Arabic" as const,
          text: h.textUthmani,
        }));

  return (
    <div className="min-h-screen bg-[var(--dna-canvas)] text-[var(--dna-text)] bg-girih-filigree">
      <SiteSubpageHeader activeRoute="scriptures" />

      <main id="main" className="relative mx-auto max-w-7xl px-4 py-12 sm:px-8 space-y-10">
        <CutoutArtwork
          id="codex-scroll"
          decorative
          className="pointer-events-none absolute right-6 top-8 hidden h-24 w-24 text-[var(--dna-accent)] opacity-20 md:block"
        />
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <DnaBrandLogo id="scriptures-codex" variant="stamp" size={32} decorative />
          </div>
          <div className="font-mono text-[11px] tracking-[0.26em] text-[var(--dna-accent)] uppercase">
            {locale === "id"
              ? "PUSAT KAJIAN EMPAT KITAB · NETRAL & TERBUKA"
              : "FOUR-SCRIPTURE PARALLEL STUDIO · NEUTRAL & SOURCE-GROUNDED"}
          </div>
          <h1 className="font-monument text-3xl sm:text-5xl tracking-[0.16em] text-gold-gradient uppercase">
            TAURAT · ZABUR · INJĪL · AL-QUR’ĀN
          </h1>
          <p className="mx-auto max-w-3xl font-serif text-base text-[var(--dna-muted)] leading-relaxed">
            {locale === "id"
              ? "Meneliti empat korpus teks klasik penuh—Taurat Ibrani (WLC), Zabur (Mazmur WLC), Injīl Yunani Koine (SBLGNT), dan Al-Qur’ān Arab Utsmani (6.236 ayat)—secara jujur, netral, tanpa peringkat agama, dan tanpa paksaan."
              : FOUR_CORPUS_POLICY.neutralityPrinciple}
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 border border-[var(--dna-accent)]/30 bg-[var(--dna-canvas)] px-4 py-1.5 font-mono text-[10.5px] text-[var(--dna-accent)]">
            <span>{FOUR_CORPUS_POLICY.invariant}</span>
            <span>·</span>
            <span>
              {counts?.totalVerses
                ? `${counts.totalVerses.toLocaleString("en-US")} VERSE RECORDS INDEXED ACROSS ALL 4 CORPORA`
                : payload?.totalAyahs
                  ? `${payload.totalAyahs} AYAH / ${payload.totalSurahs} SURAH INDEXED`
                  : "LOADING CORPUS INDEX…"}
            </span>
          </div>
        </div>

        {/* Classical Manuscript Witness Panel */}
        <ClassicalWitnessPanel locale={locale} passages={payload?.crosswalk?.passages ?? []} />

        {/* Live 18,384-Verse 4-Corpus Witness Search Console */}
        <DnaChamber cornerBrackets className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dna-accent)]/20 pb-4">
            <div>
              <h2 className="font-monument text-base sm:text-lg tracking-[0.16em] text-[var(--dna-text)] uppercase">
                {locale === "id"
                  ? "MESIN PENCARI EMPAT KITAB (18.384 AYAT ASLI)"
                  : "FOUR-CORPUS WITNESS ENGINE (18,384 ORIGINAL VERSES)"}
              </h2>
              <p className="mt-1 font-serif text-xs text-[var(--dna-muted)]">
                {locale === "id"
                  ? "Cari langsung lintas Taurat (Gen/Exod/Lev/Num/Deut 5.853), Zabur (Ps 2.527), Injīl (Matt-John 3.768), dan Al-Qur’ān (6.236 ayat)."
                  : "Search directly across Taurat (WLC 5,853), Zabur (Psalms 2,527), Injīl (SBLGNT 3,768), and Al-Qur’ān (Uthmani 6,236) by ref or root script."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DnaButton
                tone="secondary"
                onClick={() => void copyShareUrl()}
                className="px-3.5 py-1.5 font-mono text-[10.5px] text-[var(--dna-muted)]"
              >
                {copiedLink === "search"
                  ? locale === "id"
                    ? "TAUTAN DISALIN"
                    : "LINK COPIED"
                  : locale === "id"
                    ? "SALIN TAUTAN"
                    : "COPY DEEP LINK"}
              </DnaButton>
              <DnaButton
                asChild
                tone="secondary"
                className="min-h-0 inline-flex items-center px-4 py-1.5 font-mono text-[10.5px] text-[var(--dna-accent)] uppercase"
              >
                <Link href="/codex?door=epistemic-corpus">DOOR II EPISTEMIC SPINE &rsaquo;</Link>
              </DnaButton>
            </div>
          </div>

          {/* 4-Corpus Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {CORPUS_TABS.map((tab) => {
              const active = corpusFilter === tab.id;
              const num = counts ? counts[tab.countKey] : null;
              return (
                <DnaButton
                  key={tab.id}
                  type="button"
                  tone="secondary"
                  aria-pressed={active}
                  onClick={() => setCorpusFilter(tab.id)}
                  className={`min-h-0 px-3.5 py-2 font-mono text-[10.5px] tracking-[0.12em] uppercase transition-colors ${
                    active
                      ? "border border-[var(--dna-accent)] bg-[var(--dna-accent)]/20 text-[var(--dna-text)]"
                      : "text-[var(--dna-muted)]"
                  }`}
                >
                  {locale === "id" ? tab.labelId : tab.labelEn}
                  {num ? ` (${num.toLocaleString("en-US")})` : ""}
                </DnaButton>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 border border-[var(--dna-accent)]/40 bg-[var(--dna-canvas)] px-4 py-2.5">
              <SearchLensIcon className="h-4 w-4 text-[var(--dna-accent)]" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search across Taurat, Zabur, Injil, and Quran corpora"
                placeholder="Gen 1:1, Ps 23:1, John 1:1, 2:256, الله, θεος..."
                className="min-h-0 w-full border-0 bg-transparent px-0 py-0 font-mono text-sm text-[var(--dna-text)] placeholder-[var(--dna-muted)] focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((preset) => (
              <DnaButton
                key={`${preset.corpus}-${preset.q}`}
                tone="secondary"
                aria-pressed={query === preset.q && corpusFilter === preset.corpus}
                onClick={() => {
                  setCorpusFilter(preset.corpus);
                  setQuery(preset.q);
                }}
                className="px-3.5 py-1.5 text-[10px] text-[var(--dna-muted)]"
              >
                {locale === "id" ? preset.labelId : preset.labelEn}
              </DnaButton>
            ))}
          </div>

          <div className="space-y-2.5">
            {loading && !payload ? (
              <div className="border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-4 font-mono text-xs text-[var(--dna-muted)]">
                PROBING FOUR-CORPUS INDEX (18,384 VERSES)…
              </div>
            ) : displayedHits.length > 0 ? (
              displayedHits.map((hit) => (
                <div
                  key={`${hit.corpusCode}-${hit.reference}`}
                  className="border border-[var(--dna-accent)]/25 bg-[var(--dna-canvas)]/90 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-[var(--dna-accent)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <DnaBadge className="font-mono text-[10px] text-[var(--dna-accent)]">
                        {hit.corpusCode}
                      </DnaBadge>
                      <span>
                        {hit.corpusLabel} · {hit.bookOrSurah.toUpperCase()} ({hit.language})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DnaBadge className="font-mono text-[10px] text-[var(--dna-text)]">
                        {hit.reference}
                      </DnaBadge>
                      <Button
                        type="button"
                        variant="plain"
                        onClick={() =>
                          void copyShareUrl(hit.reference.replace(/^QS\s+/i, ""), hit.corpusCode)
                        }
                        className="border border-[var(--dna-accent)]/25 bg-[var(--dna-surface)] px-2 py-0.5 text-[10px] text-[var(--dna-accent)] hover:text-[var(--dna-text)] cursor-pointer"
                      >
                        {copiedLink === hit.reference.replace(/^QS\s+/i, "") ? "COPIED" : "SHARE"}
                      </Button>
                    </div>
                  </div>
                  <p
                    dir={hit.dir}
                    lang={
                      hit.language === "Arabic" ? "ar" : hit.language === "Hebrew" ? "he" : "el"
                    }
                    className={
                      hit.dir === "rtl"
                        ? "text-xl sm:text-2xl leading-loose text-[var(--dna-text)]"
                        : "font-serif text-lg sm:text-xl leading-relaxed text-[var(--dna-text)]"
                    }
                  >
                    {hit.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-4 font-mono text-xs text-[var(--dna-muted)]">
                NO MATCHING WITNESS RECORD FOR &ldquo;{query}&rdquo;.
              </div>
            )}
          </div>
        </DnaChamber>

        {/* Shared Moral Roots Concordance Matrix */}
        <MoralRootsConcordancePanel activeTheme={activeTheme} onSelectTheme={setActiveThemeId} />
      </main>
    </div>
  );
}
