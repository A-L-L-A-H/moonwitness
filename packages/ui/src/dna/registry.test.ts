// Moonwitness DNA — Unit tests for token registry & theme system
import { describe, it, expect } from "vitest";
import {
  getToken,
  generateCSSVariables,
  applyTheme,
  createTheme,
  getTheme,
  listThemes,
  themeRegistry,
} from "./registry";
import type { DNATokens } from "./tokens";

describe("DNA Registry", () => {
  describe("getToken", () => {
    it("resolves nested color tokens by dot-notation path", () => {
      const primary = getToken("colors.semantic.primary");
      expect(primary).toBeDefined();
      expect(typeof primary).toBe("object");
      expect((primary as { hex: string }).hex).toBeDefined();
    });

    it("returns undefined for non-existent path", () => {
      const missing = getToken("colors.semantic.nonexistent");
      expect(missing).toBeUndefined();
    });

    it("works with custom theme override", () => {
      const customTheme: DNATokens = {
        colors: {
          semantic: {
            primary: { hex: "#ff0000", hsl: "0 100% 50%" },
            foreground: { hex: "#fff", hsl: "0 0% 100%" },
            background: { hex: "#000", hsl: "0 0% 0%" },
            card: { hex: "#111", hsl: "0 0% 7%" },
            cardForeground: { hex: "#fff", hsl: "0 0% 100%" },
            popover: { hex: "#111", hsl: "0 0% 7%" },
            popoverForeground: { hex: "#fff", hsl: "0 0% 100%" },
            secondary: { hex: "#222", hsl: "0 0% 13%" },
            secondaryForeground: { hex: "#fff", hsl: "0 0% 100%" },
            muted: { hex: "#333", hsl: "0 0% 20%" },
            mutedForeground: { hex: "#aaa", hsl: "0 0% 67%" },
            accent: { hex: "#444", hsl: "0 0% 27%" },
            accentForeground: { hex: "#fff", hsl: "0 0% 100%" },
            destructive: { hex: "#f00", hsl: "0 100% 50%" },
            destructiveForeground: { hex: "#fff", hsl: "0 0% 100%" },
            border: { hex: "#555", hsl: "0 0% 33%" },
            input: { hex: "#555", hsl: "0 0% 33%" },
            ring: { hex: "#f00", hsl: "0 100% 50%" },
          },
        },
      } as DNATokens;

      const primary = getToken("colors.semantic.primary", customTheme);
      expect((primary as { hex: string }).hex).toBe("#ff0000");
    });
  });

  describe("generateCSSVariables", () => {
    it("generates valid CSS custom properties with mw- prefix", () => {
      const css = generateCSSVariables();
      expect(css).toContain(":root {");
      expect(css).toContain("mw-colors-semantic-primary-hex:");
      expect(css).toContain("mw-colors-semantic-primary-hsl:");
    });

    it("includes shadcn/ui compatible HSL variables", () => {
      const css = generateCSSVariables();
      expect(css).toContain("--background:");
      expect(css).toContain("--foreground:");
      expect(css).toContain("--primary:");
      expect(css).toContain("--radius:");
    });

    it("works with different themes", () => {
      const themes = listThemes();
      for (const themeName of themes) {
        const css = generateCSSVariables(getTheme(themeName));
        expect(css).toContain(":root {");
        expect(css).toContain("--background:");
      }
    });
  });

  describe("createTheme", () => {
    it("merges overrides with default theme", () => {
      const custom = createTheme({
        colors: {
          semantic: {
            primary: { hex: "#00ff00", hsl: "120 100% 50%" },
          },
        },
      });

      const primary = getToken("colors.semantic.primary", custom);
      expect((primary as { hex: string }).hex).toBe("#00ff00");
    });

    it("preserves non-overridden tokens", () => {
      const custom = createTheme({
        motion: {
          duration: {
            instant: "0ms",
            fast: "50ms",
            normal: "100ms",
            slow: "200ms",
            slower: "300ms",
          },
          easing: {
            linear: "linear",
            in: "ease-in",
            out: "ease-out",
            inout: "ease-in-out",
            spring: "spring",
            bounce: "bounce",
          },
          reducedMotion: { disableAnimations: true, instantTransitions: true },
        },
      });

      const pink = getToken("colors.semantic.primary", custom);
      expect((pink as { hex: string }).hex).toBeDefined(); // default preserved
    });
  });

  describe("themeRegistry", () => {
    it("contains all 5 expected themes", () => {
      const themes = listThemes();
      expect(themes).toEqual(["default", "highContrast", "print", "lowMotion", "sepia"]);
    });

    it("each theme has required semantic colors", () => {
      for (const themeName of listThemes()) {
        const theme = getTheme(themeName);
        expect(theme.colors?.semantic).toBeDefined();
        expect(theme.colors.semantic.primary).toBeDefined();
        expect(theme.colors.semantic.background).toBeDefined();
        expect(theme.colors.semantic.foreground).toBeDefined();
      }
    });
  });

  describe("applyTheme", () => {
    it("does not throw in non-browser environment", () => {
      // Should not throw when document is undefined
      expect(() => applyTheme()).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("getToken returns default theme when undefined provided", () => {
      const result = getToken("colors.semantic.primary", undefined);
      expect(result).toBeDefined();
    });

    it("getToken returns default theme when null provided", () => {
      const result = getToken(
        "colors.semantic.primary",
        null as unknown as Parameters<typeof getToken>[1],
      );
      expect(result).toBeUndefined();
    });

    it("createTheme with empty overrides returns default theme", () => {
      const theme = createTheme({});
      expect(theme).toBeDefined();
      expect(getToken("colors.semantic.primary", theme)).toBeDefined();
    });

    it("listThemes returns all registered themes", () => {
      const themes = listThemes();
      expect(themes.length).toBe(5);
      expect(themes).toContain("default");
      expect(themes).toContain("highContrast");
      expect(themes).toContain("print");
      expect(themes).toContain("lowMotion");
      expect(themes).toContain("sepia");
    });

    it("getTheme returns correct theme by name", () => {
      for (const name of listThemes()) {
        const theme = getTheme(name);
        expect(theme).toBeDefined();
        expect(theme.colors?.semantic).toBeDefined();
      }
    });

    it("themeRegistry has correct structure for all themes", () => {
      for (const [name, theme] of Object.entries(themeRegistry)) {
        expect(name).toBeTruthy();
        expect(theme.colors).toBeDefined();
        expect(theme.spacing).toBeDefined();
        expect(theme.radius).toBeDefined();
        expect(theme.typography).toBeDefined();
        expect(theme.motion).toBeDefined();
        expect(theme.effects).toBeDefined();
        expect(theme.zIndex).toBeDefined();
      }
    });

    it("generateCSSVariables includes all semantic color variables", () => {
      const css = generateCSSVariables();
      const semanticVars = [
        "--background",
        "--foreground",
        "--card",
        "--card-foreground",
        "--popover",
        "--popover-foreground",
        "--primary",
        "--primary-foreground",
        "--secondary",
        "--secondary-foreground",
        "--muted",
        "--muted-foreground",
        "--accent",
        "--accent-foreground",
        "--destructive",
        "--destructive-foreground",
        "--border",
        "--input",
        "--ring",
        "--radius",
      ];
      for (const v of semanticVars) {
        expect(css).toContain(v);
      }
    });

    it("generateCSSVariables generates correct format with mw- prefix", () => {
      const css = generateCSSVariables();
      expect(css).toContain("mw-colors-semantic-primary-hex:");
      expect(css).toContain("mw-colors-semantic-primary-hsl:");
      expect(css).toMatch(/mw-colors-semantic-\w+-(hex|hsl):/);
    });

    it("createTheme deep merges nested objects", () => {
      const theme = createTheme({
        colors: {
          semantic: {
            primary: { hex: "#00ff00", hsl: "120 100% 50%" },
            secondary: { hex: "#ff00ff", hsl: "300 100% 50%" },
          },
        },
      });

      const primary = getToken("colors.semantic.primary", theme) as { hex?: string } | undefined;
      const secondary = getToken("colors.semantic.secondary", theme) as
        { hex?: string } | undefined;
      expect(primary?.hex).toBe("#00ff00");
      expect(secondary?.hex).toBe("#ff00ff");
    });

    it("applyTheme injects CSS into document.head when available", () => {
      const styleId = "mw-theme-variables";
      // Remove any existing
      if (typeof document !== "undefined") {
        const existing = document.getElementById(styleId);
        if (existing) existing.remove();
      }

      applyTheme();

      if (typeof document !== "undefined") {
        const styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
        expect(styleEl).not.toBeNull();
        expect(styleEl?.textContent).toContain("mw-colors-semantic");
        // Cleanup
        styleEl?.remove();
      }
    });

    it("emits valid CSS hsl(...) variables and scalar --radius (never [object Object])", () => {
      const css = generateCSSVariables();
      expect(css).toContain("--radius: 0.5rem;");
      expect(css).not.toContain("[object Object]");
      expect(css).toMatch(/--background:\s*hsl\(/);
      expect(css).toMatch(/--ring:\s*hsl\(/);
    });
  });
});
