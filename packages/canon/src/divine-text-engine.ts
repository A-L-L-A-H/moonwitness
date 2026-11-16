export type CompactQuranTuple = readonly [
  surah: number,
  ayah: number,
  surahName: string,
  textUthmani: string,
];

export interface QuranSearchHit {
  readonly surah: number;
  readonly ayah: number;
  readonly reference: string;
  readonly surahName: string;
  readonly textUthmani: string;
}

export interface ClassicalWitnessExcerpt {
  readonly corpusCode: "SRC-TOR" | "SRC-ZAB" | "SRC-INJ" | "SRC-QUR";
  readonly corpusName: string;
  readonly reference: string;
  readonly language: string;
  readonly dir: "rtl" | "ltr";
  readonly originalText: string;
  readonly summary: string;
}

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

  // Exact Surah:Ayah or Surah number match (e.g., "2:256", "55:1", "112")
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
      if (hits.length >= cappedLimit) {
        break;
      }
    }
  }

  return hits;
}
