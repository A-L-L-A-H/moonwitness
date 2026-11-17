import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BRAND_TOKENS,
  DEPRECATED_TOKEN_ALIASES,
  IMPERIUM_LUMEN_TOKENS,
  MASTER_DNA_LIGHT_PALETTES,
  MASTER_DNA_PALETTES,
  assertCanonicalTokensValid,
  canonicalTokensToCssVariables,
  hexToHslString,
  resolveCanonicalTokens,
  type CanonicalDnaId,
} from "./index";
import { measureContrastRatio } from "../dx/contrast";
import type { SkinName } from "../skin/compositions";

const DNA_IDS: readonly CanonicalDnaId[] = [
  "01-imperium-lumen",
  "02-lunar-chronicles",
  "03-rocksoul",
  "04-nexus-paradox",
  "05-riot-anarchy",
  "06-mycelium",
  "09-simpul-nusantara",
];

const SKINS: readonly SkinName[] = [
  "default",
  "riot",
  "editorial",
  "technical",
  "archive",
  "transmission",
];

describe("Canonical Design Token Engine (@moonwitness/ui/dna)", () => {
  it("stays free of React and browser globals at import and resolution time", () => {
    const canonicalSrc = readFileSync(resolve(import.meta.dirname, "./canonical.ts"), "utf8");
    const indexSrc = readFileSync(resolve(import.meta.dirname, "./index.ts"), "utf8");
    expect(canonicalSrc).not.toMatch(/from\s+["']react/);
    expect(canonicalSrc).not.toMatch(/\b(?:window|document|localStorage)\b/);
    expect(indexSrc).not.toMatch(/["']use client["']/);
  });

  it("derives BRAND_TOKENS directly from IMPERIUM_LUMEN_TOKENS without drift", () => {
    expect(BRAND_TOKENS.ink).toBe(IMPERIUM_LUMEN_TOKENS.brand.ink);
    expect(BRAND_TOKENS.paper).toBe(IMPERIUM_LUMEN_TOKENS.brand.paper);
    expect(BRAND_TOKENS.yellow).toBe(IMPERIUM_LUMEN_TOKENS.brand.yellow);
    expect(BRAND_TOKENS.pink).toBe(IMPERIUM_LUMEN_TOKENS.brand.pink);
    expect(BRAND_TOKENS.blue).toBe(IMPERIUM_LUMEN_TOKENS.brand.blue);
    expect(BRAND_TOKENS.white).toBe(IMPERIUM_LUMEN_TOKENS.brand.white);
  });

  it("resolves valid tokens across all 7 DNAs x 6 skins x 2 modes without undefined or object strings", () => {
    for (const dnaId of DNA_IDS) {
      for (const skin of SKINS) {
        for (const mode of ["dark", "light"] as const) {
          const resolved = resolveCanonicalTokens({ dnaId, skin, mode });
          expect(assertCanonicalTokensValid(resolved)).toEqual([]);
          const vars = canonicalTokensToCssVariables(resolved);
          expect(vars["--background"]).toMatch(/^hsl\(/);
          expect(vars["--foreground"]).toMatch(/^hsl\(/);
          expect(vars["--ring"]).toMatch(/^hsl\(/);
          expect(vars["--radius"]).not.toContain("[object");
        }
      }
    }
  });

  it("produces measurably distinct component tokens across skins", () => {
    const riot = resolveCanonicalTokens({ skin: "riot" });
    const technical = resolveCanonicalTokens({ skin: "technical" });
    const editorial = resolveCanonicalTokens({ skin: "editorial" });
    const archive = resolveCanonicalTokens({ skin: "archive" });

    expect(riot.components.button.radius).toBe("2px");
    expect(riot.components.button.textTransform).toBe("uppercase");
    expect(editorial.components.button.shadow).toBe("none");
    expect(technical.components.button.fontFamily).toContain("monospace");
    expect(archive.components.card.radius).toBe("10px");
  });

  it("passes WCAG 2.1 AA contrast across all 7 DNA dark and light palettes", () => {
    for (const dnaId of DNA_IDS) {
      const dark = MASTER_DNA_PALETTES[dnaId];
      const light = MASTER_DNA_LIGHT_PALETTES[dnaId];

      for (const [label, p] of [
        ["dark", dark],
        ["light", light],
      ] as const) {
        expect(measureContrastRatio(p.text, p.canvas), `${dnaId} ${label} text/canvas`).toBeGreaterThanOrEqual(4.5);
        expect(measureContrastRatio(p.text, p.surface), `${dnaId} ${label} text/surface`).toBeGreaterThanOrEqual(4.5);
        expect(measureContrastRatio(p.mutedText, p.surface), `${dnaId} ${label} muted/surface`).toBeGreaterThanOrEqual(4.5);
        expect(measureContrastRatio(p.accentForeground, p.accent), `${dnaId} ${label} accentFg/accent`).toBeGreaterThanOrEqual(4.5);
        expect(measureContrastRatio(p.focus, p.canvas), `${dnaId} ${label} focus/canvas`).toBeGreaterThanOrEqual(3.0);
      }
    }
  });

  it("keeps theme.css shadcn variables formatted as browser-valid hsl(...) matching canonical tokens", () => {
    const themeCss = readFileSync(resolve(import.meta.dirname, "../theme.css"), "utf8");
    const rootBlock = themeCss.split("[data-theme=\"light\"]")[0] ?? "";
    for (const name of [
      "background",
      "foreground",
      "card",
      "popover",
      "primary",
      "primary-foreground",
      "secondary",
      "muted",
      "muted-foreground",
      "accent",
      "destructive",
      "border",
      "input",
      "ring",
    ]) {
      const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(rootBlock);
      expect(match?.[1], `Missing --${name} in :root`).toBeDefined();
      expect(match?.[1], `--${name} must use valid hsl(...)`).toMatch(/^hsl\(/);
    }
    expect(themeCss).toContain('[data-theme="light"]');
    for (const skin of SKINS) {
      expect(themeCss).toContain(`[data-skin="${skin}"]`);
    }
  });

  it("documents deprecated token aliases and converts 3/6-digit hex to HSL", () => {
    expect(DEPRECATED_TOKEN_ALIASES.length).toBeGreaterThanOrEqual(4);
    expect(hexToHslString("#fff")).toBe("0 0% 100%");
    expect(hexToHslString("#000000")).toBe("0 0% 0%");
  });
});
