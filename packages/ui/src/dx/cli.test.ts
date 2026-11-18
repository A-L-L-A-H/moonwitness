// Moonwitness DX — Unit tests for CLI validators
import { describe, it, expect } from "vitest";
import { validateTokenCoverage, validateSkinCoverage, validateAll, formatResults } from "./cli";

describe("DX CLI Validators", () => {
  describe("validateTokenCoverage", () => {
    it("passes for default theme", () => {
      const results = validateTokenCoverage();
      const defaultResult = results.find((r) => r.check === "Theme: default");
      expect(defaultResult).toBeDefined();
      expect(defaultResult!.status).toBe("pass");
    });

    it("validates all registered themes", () => {
      const results = validateTokenCoverage();
      const themeResults = results.filter((r) => r.check.startsWith("Theme:"));
      expect(themeResults.length).toBe(5); // default, highContrast, print, lowMotion, sepia
    });
  });

  describe("validateSkinCoverage", () => {
    it("passes for all 10 skins", () => {
      const results = validateSkinCoverage();
      const skinResults = results.filter((r) => r.check.startsWith("Skin:"));
      expect(skinResults.length).toBe(10);

      for (const result of skinResults) {
        expect(result.status).toBe("pass");
        expect(result.message).toContain("7 components configured");
      }
    });

    it("checks all required components", () => {
      const results = validateSkinCoverage();
      const requiredComponents = [
        "button",
        "card",
        "input",
        "badge",
        "eventCard",
        "kanbanColumn",
        "moduleCard",
      ];

      for (const result of results.filter((r) => r.check.startsWith("Skin:"))) {
        expect(result.status).toBe("pass");
        expect(result.message).toContain(`${requiredComponents.length} components configured`);
      }
    });
  });

  describe("validateAll", () => {
    it("runs both token and skin validation", () => {
      const results = validateAll();
      const tokenResults = results.filter((r) => r.check.startsWith("Theme:"));
      const skinResults = results.filter((r) => r.check.startsWith("Skin:"));

      expect(tokenResults.length).toBe(5);
      expect(skinResults.length).toBe(10);
      expect(results.length).toBe(15);
    });
  });

  describe("formatResults", () => {
    it("formats results with correct counts", () => {
      const results = [
        { check: "Theme: default", status: "pass" as const, message: "100 tokens" },
        { check: "Skin: riot", status: "pass" as const, message: "7 components" },
        { check: "Skin: bad", status: "fail" as const, message: "missing card" },
      ];

      const output = formatResults(results);
      expect(output).toContain("2 pass");
      expect(output).toContain("0 warn");
      expect(output).toContain("1 fail");
      expect(output).toContain("✓ [PASS] Theme: default");
      expect(output).toContain("✗ [FAIL] Skin: bad");
    });
  });
});
