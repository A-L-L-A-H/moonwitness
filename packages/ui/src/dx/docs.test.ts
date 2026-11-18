// Moonwitness DX — Unit tests for documentation generation
import { describe, it, expect } from "vitest";
import {
  generateTokenDocs,
  generateSkinDocs,
  generateSkinAtmosphereDocs,
  generateArtworkDocs,
  generateBrandCatalogDocs,
  generateTelemetryDocs,
  generateThemeCSSDocs,
  generateEffectsDocs,
  generateDocsMarkdown,
} from "./docs";

describe("DX Docs Generator", () => {
  describe("generateTokenDocs", () => {
    it("returns array of TokenDoc", () => {
      const docs = generateTokenDocs();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
    });

    it("each TokenDoc has required fields", () => {
      const docs = generateTokenDocs();
      for (const doc of docs) {
        expect(doc.category).toBeDefined();
        expect(doc.path).toBeDefined();
        expect(doc.value).toBeDefined();
        expect(["color", "string", "number", "boolean", "object"]).toContain(doc.type);
      }
    });

    it("includes semantic color tokens", () => {
      const docs = generateTokenDocs();
      const semanticTokens = docs.filter((d) => d.category === "colors.semantic");
      expect(semanticTokens.length).toBeGreaterThan(0);
      expect(semanticTokens.some((d) => d.type === "color")).toBe(true);
    });

    it("includes spacing tokens", () => {
      const docs = generateTokenDocs();
      const spacingTokens = docs.filter((d) => d.category === "spacing");
      expect(spacingTokens.length).toBeGreaterThan(0);
    });

    it("includes radius tokens", () => {
      const docs = generateTokenDocs();
      const radiusTokens = docs.filter((d) => d.category === "radius");
      expect(radiusTokens.length).toBeGreaterThan(0);
    });

    it("includes motion tokens", () => {
      const docs = generateTokenDocs();
      // Motion tokens may be nested differently, check they exist somewhere
      expect(docs.some((d) => d.category.includes("motion"))).toBe(true);
    });
  });

  describe("generateSkinDocs", () => {
    it("returns array of SkinDoc", () => {
      const docs = generateSkinDocs();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBe(10);
    });

    it("each SkinDoc has required fields", () => {
      const docs = generateSkinDocs();
      for (const doc of docs) {
        expect(doc.name).toBeDefined();
        expect(doc.label).toBeDefined();
        expect(doc.description).toBeDefined();
        expect(Array.isArray(doc.effects)).toBe(true);
        expect(doc.components).toBeDefined();
      }
    });

    it("includes all expected skins", () => {
      const docs = generateSkinDocs();
      const names = docs.map((d) => d.name);
      expect(names).toContain("default");
      expect(names).toContain("riot");
      expect(names).toContain("editorial");
      expect(names).toContain("technical");
      expect(names).toContain("archive");
      expect(names).toContain("transmission");
      expect(names).toContain("sanctuary");
      expect(names).toContain("brutalist");
      expect(names).toContain("noir");
      expect(names).toContain("kinetic");
    });

    it("each skin has component configs", () => {
      const docs = generateSkinDocs();
      for (const doc of docs) {
        expect(doc.components.button).toBeDefined();
        expect(doc.components.card).toBeDefined();
        expect(doc.components.input).toBeDefined();
        expect(doc.components.badge).toBeDefined();
        expect(doc.components.eventCard).toBeDefined();
        expect(doc.components.kanbanColumn).toBeDefined();
        expect(doc.components.moduleCard).toBeDefined();
      }
    });

    it("riot skin has effects", () => {
      const docs = generateSkinDocs();
      const riot = docs.find((d) => d.name === "riot");
      expect(riot).toBeDefined();
      expect(riot?.effects.length).toBeGreaterThan(0);
    });
  });

  describe("generateThemeCSSDocs", () => {
    it("returns CSS for all themes", () => {
      const css = generateThemeCSSDocs();
      expect(css.default).toBeDefined();
      expect(css.highContrast).toBeDefined();
      expect(css.print).toBeDefined();
      expect(css.lowMotion).toBeDefined();
      expect(css.sepia).toBeDefined();
    });

    it("each CSS contains :root", () => {
      const css = generateThemeCSSDocs();
      for (const [name, styles] of Object.entries(css)) {
        expect(name).toBeTruthy();
        expect(styles).toContain(":root {");
      }
    });

    it("default theme CSS contains semantic colors", () => {
      const css = generateThemeCSSDocs();
      expect(css.default).toContain("mw-colors-semantic");
      expect(css.default).toContain("--background:");
      expect(css.default).toContain("--primary:");
    });
  });

  describe("generateEffectsDocs", () => {
    it("returns effect documentation", () => {
      const effects = generateEffectsDocs();
      expect(effects.halftone).toBeDefined();
      expect(effects.grain).toBeDefined();
      expect(effects.cmykSlip).toBeDefined();
      expect(effects.duotone).toBeDefined();
      expect(effects.tape).toBeDefined();
      expect(effects.sticker).toBeDefined();
      expect(effects.brushUnderline).toBeDefined();
    });

    it("halftone has correct properties", () => {
      const effects = generateEffectsDocs();
      expect(effects.halftone).toEqual(["dotSize", "spacing", "opacity", "color"]);
    });

    it("grain has correct properties", () => {
      const effects = generateEffectsDocs();
      expect(effects.grain).toEqual(["opacity", "blendMode", "size"]);
    });

    it("cmykSlip has correct properties", () => {
      const effects = generateEffectsDocs();
      expect(effects.cmykSlip).toEqual(["offset", "cyan", "magenta"]);
    });
  });

  describe("generateDocsMarkdown", () => {
    it("returns markdown string", () => {
      const md = generateDocsMarkdown();
      expect(typeof md).toBe("string");
      expect(md.length).toBeGreaterThan(0);
    });

    it("contains themes section", () => {
      const md = generateDocsMarkdown();
      expect(md).toContain("# Moonwitness Design System Documentation");
      expect(md).toContain("## Themes");
    });

    it("contains skins section", () => {
      const md = generateDocsMarkdown();
      expect(md).toContain("## Skins");
    });

    it("contains token reference table", () => {
      const md = generateDocsMarkdown();
      expect(md).toContain("## Token Reference");
      expect(md).toContain("| Path | Value | Type |");
    });

    it("lists all themes", () => {
      const md = generateDocsMarkdown();
      expect(md).toContain("default");
      expect(md).toContain("highContrast");
      expect(md).toContain("print");
      expect(md).toContain("lowMotion");
      expect(md).toContain("sepia");
    });

    it("lists all skins", () => {
      const md = generateDocsMarkdown();
      expect(md).toContain("Moonwitness");
      expect(md).toContain("Riot");
      expect(md).toContain("Editorial");
      expect(md).toContain("Technical");
      expect(md).toContain("Archive");
      expect(md).toContain("Transmission");
    });

    it("documents 8-axis skin atmosphere, brand logos, cutouts, and telemetry primitives", () => {
      const atmosphere = generateSkinAtmosphereDocs();
      expect(atmosphere).toHaveLength(10);

      const icons = generateArtworkDocs();
      expect(icons).toHaveLength(12);

      const catalog = generateBrandCatalogDocs();
      expect(catalog.logos).toHaveLength(18);
      expect(catalog.cutouts).toHaveLength(24);

      const telemetry = generateTelemetryDocs();
      const symbols = telemetry.map((c) => c.symbol);
      expect(symbols).toContain("Sparkline");
      expect(symbols).toContain("RadialGauge");
      expect(symbols).toContain("AutoModelView");
      expect(symbols).toContain("SkinBackdrop");
      expect(symbols).toContain("SkinOrnament");

      const md = generateDocsMarkdown();
      expect(md).toContain("## 8-Axis Skin Atmosphere");
      expect(md).toContain("## Brand Logos, Cutouts & Domain Icons");
      expect(md).toContain("## Telemetry & Composite Components");
      expect(md).toContain("AutoModelView");
    });
  });
});
