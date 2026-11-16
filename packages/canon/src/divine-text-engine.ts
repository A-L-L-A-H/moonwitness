export type CompactQuranTuple = readonly [
  surah: number,
  ayah: number,
  surahName: string,
  textUthmani: string,
];

export type CompactScriptureTuple = readonly [
  book: string,
  chapter: number,
  verse: number,
  text: string,
];

export type CorpusSourceCode = "SRC-TOR" | "SRC-ZAB" | "SRC-INJ" | "SRC-QUR";
export type ScriptureCorpusFilter = "ALL" | CorpusSourceCode;

export interface QuranSearchHit {
  readonly surah: number;
  readonly ayah: number;
  readonly reference: string;
  readonly surahName: string;
  readonly textUthmani: string;
}

export interface UnifiedScriptureHit {
  readonly corpusCode: CorpusSourceCode;
  readonly corpusLabel: string;
  readonly reference: string;
  readonly bookOrSurah: string;
  readonly chapterOrSurah: number;
  readonly verseOrAyah: number;
  readonly dir: "rtl" | "ltr";
  readonly language: "Hebrew" | "Koine Greek" | "Arabic";
  readonly text: string;
}

export interface ClassicalWitnessExcerpt {
  readonly corpusCode: CorpusSourceCode;
  readonly corpusName: string;
  readonly reference: string;
  readonly language: string;
  readonly dir: "rtl" | "ltr";
  readonly originalText: string;
  readonly summary: string;
}

const CORPUS_META: Record<
  Exclude<CorpusSourceCode, "SRC-QUR">,
  {
    readonly label: string;
    readonly language: "Hebrew" | "Koine Greek";
    readonly dir: "rtl" | "ltr";
  }
> = {
  "SRC-TOR": { label: "TAURAT (WLC)", language: "Hebrew", dir: "rtl" },
  "SRC-ZAB": { label: "ZABUR (WLC)", language: "Hebrew", dir: "rtl" },
  "SRC-INJ": { label: "INJĪL (SBLGNT)", language: "Koine Greek", dir: "ltr" },
};

/**
 * Strips Arabic diacritical marks and unifies Alef forms identically to divine-text/src/quran.mjs.
 */
export function normalizeArabicScript(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .toLowerCase();
}

/**
 * Strips Hebrew Masoretic niqqud & cantillation marks for clean consonantal Hebrew lookup.
 */
export function normalizeHebrewScript(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/\u05BE/g, " ")
    .toLowerCase();
}

/**
 * Normalizes Koine Greek by stripping breathing marks, accents, and combining diacritics.
 */
export function normalizeGreekScript(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Removes residual Qalbun/TeX verse formatting tokens (`\qt@no{...`) while preserving verse medallions.
 */
export function stripUthmaniMacros(text: string): string {
  return text
    .replace(/\\qt@no\{([^}]*)\}?/g, " $1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Searches verified Uthmani witness records by Surah:Ayah reference (`2:256`), Surah name (`Al-Fatihah`), or normalized Arabic text.
 */
export function searchCompactQuranTuples(
  records: readonly CompactQuranTuple[],
  rawQuery: string,
  limit = 24,
): readonly QuranSearchHit[] {
  const query = rawQuery.trim();
  const cappedLimit = Math.max(1, Math.min(50, limit));
  if (!query) {
    return records.slice(0, Math.min(7, cappedLimit)).map(([surah, ayah, surahName, text]) => ({
      surah,
      ayah,
      reference: `${surah}:${ayah}`,
      surahName,
      textUthmani: stripUthmaniMacros(text),
    }));
  }

  const refMatch = /^(\d{1,3})(?::(\d{1,3}))?$/.exec(query);
  if (refMatch) {
    const targetSurah = Number(refMatch[1]);
    const targetAyah = refMatch[2] ? Number(refMatch[2]) : null;
    const matched = records.filter(
      ([surah, ayah]) =>
        surah === targetSurah && (targetAyah === null ? true : ayah === targetAyah),
    );
    return matched.slice(0, cappedLimit).map(([surah, ayah, surahName, text]) => ({
      surah,
      ayah,
      reference: `${surah}:${ayah}`,
      surahName,
      textUthmani: stripUthmaniMacros(text),
    }));
  }

  const normalizedArQuery = normalizeArabicScript(query);
  const lowerLatinQuery = query.toLowerCase();
  const hits: QuranSearchHit[] = [];

  for (const [surah, ayah, surahName, text] of records) {
    const cleanText = stripUthmaniMacros(text);
    const matchesLatinName = surahName.toLowerCase().includes(lowerLatinQuery);
    const matchesArabic =
      normalizedArQuery.length > 0 && normalizeArabicScript(cleanText).includes(normalizedArQuery);

    if (matchesLatinName || matchesArabic) {
      hits.push({
        surah,
        ayah,
        reference: `${surah}:${ayah}`,
        surahName,
        textUthmani: cleanText,
      });
      if (hits.length >= cappedLimit) break;
    }
  }

  return hits;
}

const BOOK_SYNONYMS: Readonly<Record<string, string>> = {
  genesis: "gen",
  exodus: "exod",
  leviticus: "lev",
  numbers: "num",
  deuteronomy: "deut",
  psalm: "ps",
  psalms: "ps",
  tehillim: "ps",
  zabur: "ps",
  matthew: "matt",
  mark: "mark",
  luke: "luke",
  john: "john",
};

/**
 * Searches OSHB WLC (Taurat/Zabur) or SBLGNT (Injīl) tuple archives by Book.Chapter.Verse,
 * book name/prefix, Hebrew consonantal match, or unaccented Koine Greek match.
 */
export function searchCompactScriptureTuples(
  corpusCode: Exclude<CorpusSourceCode, "SRC-QUR">,
  records: readonly CompactScriptureTuple[],
  rawQuery: string,
  limit = 12,
): readonly UnifiedScriptureHit[] {
  const meta = CORPUS_META[corpusCode];
  const cappedLimit = Math.max(1, Math.min(50, limit));
  const query = rawQuery.trim();

  const toHit = ([book, chapter, verse, text]: CompactScriptureTuple): UnifiedScriptureHit => ({
    corpusCode,
    corpusLabel: meta.label,
    reference: `${book} ${chapter}:${verse}`,
    bookOrSurah: book,
    chapterOrSurah: chapter,
    verseOrAyah: verse,
    dir: meta.dir,
    language: meta.language,
    text,
  });

  if (!query) {
    return records.slice(0, Math.min(4, cappedLimit)).map(toHit);
  }

  // Match "Gen.1.1", "Gen 1:1", "Ps 23:1", "John 1:1", "Deut 6"
  const refMatch = /^([a-zA-Z]+)[.\s]+(\d{1,3})(?:[.:](\d{1,3}))?$/i.exec(query);
  if (refMatch) {
    const rawBook = refMatch[1]!.toLowerCase();
    const mappedBook = BOOK_SYNONYMS[rawBook] ?? rawBook;
    const ch = Number(refMatch[2]);
    const vs = refMatch[3] ? Number(refMatch[3]) : null;
    const matched = records.filter(([book, chapter, verse]) => {
      const bk = book.toLowerCase();
      return (
        (bk === mappedBook || bk.startsWith(mappedBook)) &&
        chapter === ch &&
        (vs === null || verse === vs)
      );
    });
    return matched.slice(0, cappedLimit).map(toHit);
  }

  const lowerQuery = query.toLowerCase();
  const mappedBookOnly = BOOK_SYNONYMS[lowerQuery] ?? lowerQuery;
  const isHebrew = corpusCode === "SRC-TOR" || corpusCode === "SRC-ZAB";
  const normScriptQuery = isHebrew ? normalizeHebrewScript(query) : normalizeGreekScript(query);

  const hits: UnifiedScriptureHit[] = [];
  for (const row of records) {
    const [book, , , text] = row;
    const bookLower = book.toLowerCase();
    const matchesBook =
      /^[a-z]+$/i.test(lowerQuery) &&
      (bookLower === mappedBookOnly || bookLower.startsWith(mappedBookOnly));
    const matchesScript =
      normScriptQuery.length > 0 &&
      (isHebrew ? normalizeHebrewScript(text) : normalizeGreekScript(text)).includes(
        normScriptQuery,
      );

    if (matchesBook || matchesScript) {
      hits.push(toHit(row));
      if (hits.length >= cappedLimit) break;
    }
  }
  return hits;
}

/**
 * Executes neutral multi-corpus search across Taurat, Zabur, Injīl, and Al-Qur’ān.
 */
export function searchFourCorpora(
  bundles: {
    readonly quran: readonly CompactQuranTuple[];
    readonly taurat: readonly CompactScriptureTuple[];
    readonly zabur: readonly CompactScriptureTuple[];
    readonly injil: readonly CompactScriptureTuple[];
  },
  rawQuery: string,
  corpusFilter: ScriptureCorpusFilter = "ALL",
  limitPerCorpus = 8,
): readonly UnifiedScriptureHit[] {
  const results: UnifiedScriptureHit[] = [];

  if (corpusFilter === "ALL" || corpusFilter === "SRC-TOR") {
    results.push(
      ...searchCompactScriptureTuples("SRC-TOR", bundles.taurat, rawQuery, limitPerCorpus),
    );
  }
  if (corpusFilter === "ALL" || corpusFilter === "SRC-ZAB") {
    results.push(
      ...searchCompactScriptureTuples("SRC-ZAB", bundles.zabur, rawQuery, limitPerCorpus),
    );
  }
  if (corpusFilter === "ALL" || corpusFilter === "SRC-INJ") {
    results.push(
      ...searchCompactScriptureTuples("SRC-INJ", bundles.injil, rawQuery, limitPerCorpus),
    );
  }
  if (corpusFilter === "ALL" || corpusFilter === "SRC-QUR") {
    const qHits = searchCompactQuranTuples(bundles.quran, rawQuery, limitPerCorpus);
    results.push(
      ...qHits.map((hit): UnifiedScriptureHit => ({
        corpusCode: "SRC-QUR",
        corpusLabel: "AL-QUR’ĀN (Uthmani)",
        reference: `QS ${hit.reference}`,
        bookOrSurah: hit.surahName,
        chapterOrSurah: hit.surah,
        verseOrAyah: hit.ayah,
        dir: "rtl",
        language: "Arabic",
        text: hit.textUthmani,
      })),
    );
  }

  return results;
}
