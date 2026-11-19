import { describe, expect, it } from "vitest";
import { i18n } from "@/configs/i18n";
import ar from "@/data/dictionaries/ar.json";
import en from "@/data/dictionaries/en.json";
import id from "@/data/dictionaries/id.json";

type DictNode = string | { [key: string]: DictNode };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractPlaceholders(value: string): string[] {
  const matches = value.match(/\{[a-zA-Z0-9_]+\}/g) ?? [];
  return [...matches].sort();
}

function assertRecursiveParity(
  reference: unknown,
  candidate: unknown,
  candidateLocale: string,
  path: string,
  errors: string[],
): void {
  if (typeof reference === "string") {
    if (typeof candidate !== "string") {
      errors.push(`${candidateLocale}.${path}: expected string, got ${typeof candidate}`);
      return;
    }
    if (candidate.trim().length === 0) {
      errors.push(`${candidateLocale}.${path}: empty string`);
      return;
    }
    const refPlaceholders = extractPlaceholders(reference);
    const candPlaceholders = extractPlaceholders(candidate);
    if (JSON.stringify(refPlaceholders) !== JSON.stringify(candPlaceholders)) {
      errors.push(
        `${candidateLocale}.${path}: placeholder mismatch expected ${JSON.stringify(refPlaceholders)} got ${JSON.stringify(candPlaceholders)}`,
      );
    }
    return;
  }

  if (!isRecord(reference)) {
    errors.push(`en.${path}: unsupported value type ${typeof reference}`);
    return;
  }
  if (!isRecord(candidate)) {
    errors.push(`${candidateLocale}.${path}: expected object, got ${typeof candidate}`);
    return;
  }

  const refKeys = Object.keys(reference);
  const candKeys = Object.keys(candidate);

  for (const key of refKeys) {
    const childPath = path ? `${path}.${key}` : key;
    if (!(key in candidate)) {
      errors.push(`${candidateLocale}.${childPath}: missing key`);
      continue;
    }
    assertRecursiveParity(reference[key], candidate[key], candidateLocale, childPath, errors);
  }

  for (const key of candKeys) {
    if (!(key in reference)) {
      const childPath = path ? `${path}.${key}` : key;
      errors.push(`${candidateLocale}.${childPath}: extra key not present in en`);
    }
  }
}

function countLeafStrings(node: DictNode): number {
  if (typeof node === "string") return 1;
  return Object.values(node).reduce((sum, child) => sum + countLeafStrings(child), 0);
}

describe("Locale dictionary parity contract", () => {
  it("supports strictly en, id, and ar in i18n.locales", () => {
    expect(i18n.locales).toEqual(["en", "id", "ar"]);
  });

  it("enforces recursive key, type, non-empty, and placeholder parity across en, id, and ar", () => {
    const errors: string[] = [];

    // Ensure en itself has no empty strings
    assertRecursiveParity(en, en, "en", "", errors);
    assertRecursiveParity(en, id, "id", "", errors);
    assertRecursiveParity(en, ar, "ar", "", errors);

    expect(errors).toEqual([]);
  });

  it("preserves legacy namespaces and provides complete chronicle, sanctuary, and operations catalogs", () => {
    expect(en.sanctuary.title).toBe("A-L-L-A-H.COM — Sanctuary of Light");
    expect(en.sanctuary.fourScriptures).toBe("Four Scriptures Studio");
    expect(en.sanctuary.canonCodex).toBe("The Canon Codex");
    expect(en.sanctuary.mtimeObservatory).toBe("Explainable M-Time Observatory");

    for (const dict of [en, id, ar]) {
      expect(Object.keys(dict.chronicle.landing)).toEqual([
        "storyStrip",
        "signals",
        "transmission",
        "storytelling",
        "shadow",
        "crew",
        "archive",
        "about",
        "footer",
      ]);
      expect(Object.keys(dict.sanctuary)).toEqual(
        expect.arrayContaining([
          "title",
          "fourScriptures",
          "canonCodex",
          "mtimeObservatory",
          "navigation",
          "subpages",
          "worlds",
          "codex",
          "scriptures",
          "mtime",
          "a11y",
        ]),
      );
      expect(Object.keys(dict.operations)).toEqual(["commandPalette", "workspace"]);
    }

    expect(countLeafStrings(en)).toBeGreaterThan(146);
  });
});
