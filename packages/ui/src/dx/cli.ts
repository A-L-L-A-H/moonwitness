#!/usr/bin/env node
// Moonwitness DX CLI — Token validation & skin coverage checks

import { generateTokenDocs, generateSkinDocs } from "./docs";
import { listThemes, getTheme } from "../dna/registry";
import { listPresets } from "../skin/presets";

export interface ValidationResult {
  check: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

export function validateTokenCoverage(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const themes = listThemes();
  const defaultTokens = generateTokenDocs();
  const defaultPaths = new Set(defaultTokens.map((t) => t.path));

  for (const themeName of themes) {
    const theme = getTheme(themeName);
    const themeTokenCount = countTokens(theme as unknown as Record<string, unknown>);

    if (themeName === "default") {
      results.push({
        check: `Theme: ${themeName}`,
        status: "pass",
        message: `${themeTokenCount} tokens defined`,
      });
      continue;
    }

    const missing = findMissingTokens(defaultPaths, theme as unknown as Record<string, unknown>);
    if (missing.length === 0) {
      results.push({
        check: `Theme: ${themeName}`,
        status: "pass",
        message: `All ${defaultPaths.size} default tokens covered`,
      });
    } else if (missing.length <= 5) {
      results.push({
        check: `Theme: ${themeName}`,
        status: "warn",
        message: `${missing.length} tokens missing: ${missing.join(", ")}`,
      });
    } else {
      results.push({
        check: `Theme: ${themeName}`,
        status: "fail",
        message: `${missing.length} tokens missing (first 5): ${missing.slice(0, 5).join(", ")}…`,
      });
    }
  }

  return results;
}

export function validateSkinCoverage(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const skins = listPresets();

  const requiredComponents = [
    "button",
    "card",
    "input",
    "badge",
    "eventCard",
    "kanbanColumn",
    "moduleCard",
  ];

  for (const skinName of skins) {
    const skinDocs = generateSkinDocs();
    const skinDoc = skinDocs.find((s) => s.name === skinName);

    if (!skinDoc) {
      results.push({
        check: `Skin: ${skinName}`,
        status: "fail",
        message: "Skin definition not found",
      });
      continue;
    }

    const missingComponents = requiredComponents.filter((c) => !skinDoc.components[c]);
    if (missingComponents.length === 0) {
      results.push({
        check: `Skin: ${skinName}`,
        status: "pass",
        message: `All ${requiredComponents.length} components configured`,
      });
    } else {
      results.push({
        check: `Skin: ${skinName}`,
        status: "fail",
        message: `Missing components: ${missingComponents.join(", ")}`,
      });
    }
  }

  return results;
}

export function validateAll(): ValidationResult[] {
  return [...validateTokenCoverage(), ...validateSkinCoverage()];
}

function countTokens(obj: Record<string, unknown>): number {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const colorToken = value as { hex?: string };
      if (typeof colorToken.hex === "string") {
        count++;
      } else {
        count += countTokens(value as Record<string, unknown>);
      }
    } else {
      count++;
    }
  }
  return count;
}

function findMissingTokens(defaultPaths: Set<string>, theme: Record<string, unknown>): string[] {
  const themePaths = new Set<string>();
  collectPaths(theme, "", themePaths);
  return Array.from(defaultPaths).filter((p) => !themePaths.has(p));
}

function collectPaths(obj: Record<string, unknown>, prefix: string, paths: Set<string>): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? prefix + "." + key : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const colorToken = value as { hex?: string };
      if (typeof colorToken.hex === "string") {
        paths.add(path);
      } else {
        collectPaths(value as Record<string, unknown>, path, paths);
      }
    } else {
      paths.add(path);
    }
  }
}

export function formatResults(results: ValidationResult[]): string {
  const lines: string[] = [];
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;

  lines.push(`Results: ${passed} pass, ${warned} warn, ${failed} fail`);
  lines.push("");

  for (const result of results) {
    const icon = result.status === "pass" ? "✓" : result.status === "warn" ? "⚠" : "✗";
    lines.push(`${icon} [${result.status.toUpperCase()}] ${result.check}: ${result.message}`);
  }

  return lines.join("\n");
}

if (typeof require !== "undefined" && require.main === module) {
  const results = validateAll();
  console.log(formatResults(results));
  const hasFailures = results.some((r) => r.status === "fail");
  process.exit(hasFailures ? 1 : 0);
}
