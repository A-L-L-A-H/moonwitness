// Moonwitness DX — Auto-generate documentation from DNA tokens and skin presets

import { generateCSSVariables, listThemes, getTheme } from "../dna/registry";
import { skinPresets, listPresets } from "../skin/presets";

export interface TokenDoc {
  category: string;
  path: string;
  value: string;
  type: "color" | "string" | "number" | "boolean" | "object";
}

export interface SkinDoc {
  name: string;
  label: string;
  description: string;
  effects: string[];
  components: Record<string, string>;
}

export interface ArtworkDoc {
  icon: string;
  description: string;
}

export function generateTokenDocs(): TokenDoc[] {
  const docs: TokenDoc[] = [];
  const theme = getTheme("default");

  for (const [category, categoryValue] of Object.entries(theme)) {
    if (typeof categoryValue !== "object" || categoryValue === null) continue;
    collectTokenDocs(categoryValue as Record<string, unknown>, category, docs);
  }

  return docs;
}

function collectTokenDocs(obj: Record<string, unknown>, prefix: string, docs: TokenDoc[]): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix + "." + key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const colorToken = value as { hex?: string };
      if (typeof colorToken.hex === "string") {
        docs.push({
          category: prefix,
          path,
          value: colorToken.hex,
          type: "color",
        });
      } else {
        collectTokenDocs(value as Record<string, unknown>, path, docs);
      }
    } else if (typeof value === "string") {
      docs.push({ category: prefix, path, value, type: "string" });
    } else if (typeof value === "number") {
      docs.push({ category: prefix, path, value: String(value), type: "number" });
    } else if (typeof value === "boolean") {
      docs.push({ category: prefix, path, value: String(value), type: "boolean" });
    }
  }
}

export function generateSkinDocs(): SkinDoc[] {
  return listPresets().map((name) => {
    const preset = skinPresets[name];
    return {
      name: preset.name,
      label: preset.label,
      description: preset.description,
      effects: preset.effects ? preset.effects.split(" ").filter(Boolean) : [],
      components: {
        button: `${preset.button.variant}/${preset.button.skin}`,
        card: `${preset.card.variant}/${preset.card.skin}`,
        input: preset.input.skin,
        badge: `${preset.badge.variant}/${preset.badge.skin}`,
        eventCard: `${preset.eventCard.skin} (density: ${preset.eventCard.density})`,
        kanbanColumn: `${preset.kanbanColumn.skin} (compact: ${preset.kanbanColumn.compact})`,
        moduleCard: `${preset.moduleCard.skin} (size: ${preset.moduleCard.size}, elevated: ${preset.moduleCard.elevated})`,
      },
    };
  });
}

export function generateThemeCSSDocs(): Record<string, string> {
  const themes = listThemes();
  const result: Record<string, string> = {};
  for (const themeName of themes) {
    result[themeName] = generateCSSVariables(getTheme(themeName));
  }
  return result;
}

export function generateEffectsDocs(): Record<string, string[]> {
  return {
    halftone: ["dotSize", "spacing", "opacity", "color"],
    grain: ["opacity", "blendMode", "size"],
    cmykSlip: ["offset", "cyan", "magenta"],
    duotone: ["gradient", "blendMode", "opacity"],
    tape: ["width", "height", "opacity", "blur"],
    sticker: ["clipPath", "rotation"],
    brushUnderline: ["height", "color", "position"],
  };
}

export function generateDocsMarkdown(): string {
  const lines: string[] = [];

  lines.push("# Moonwitness Design System Documentation");
  lines.push("");

  // Themes
  lines.push("## Themes");
  lines.push("");
  for (const themeName of listThemes()) {
    lines.push(`### ${themeName}`);
    lines.push("");
    const tokens = generateTokenDocs();
    const categoryTokens = tokens.filter((t) => t.category === "colors.semantic");
    for (const token of categoryTokens.slice(0, 5)) {
      lines.push(`- \`${token.path}\`: ${token.value}`);
    }
    lines.push("");
  }

  // Skins
  lines.push("## Skins");
  lines.push("");
  for (const skin of generateSkinDocs()) {
    lines.push(`### ${skin.label} (${skin.name})`);
    lines.push("");
    lines.push(skin.description);
    lines.push("");
    lines.push(`Effects: ${skin.effects.join(", ") || "(none)"}`);
    lines.push("");
    for (const [component, config] of Object.entries(skin.components)) {
      lines.push(`- **${component}**: ${config}`);
    }
    lines.push("");
  }

  // Tokens
  lines.push("## Token Reference");
  lines.push("");
  const allTokens = generateTokenDocs();
  const categories = new Map<string, TokenDoc[]>();
  for (const token of allTokens) {
    const group = categories.get(token.category) || [];
    group.push(token);
    categories.set(token.category, group);
  }

  for (const [category, tokens] of categories) {
    lines.push(`### ${category}`);
    lines.push("");
    lines.push("| Path | Value | Type |");
    lines.push("|------|-------|------|");
    for (const token of tokens) {
      lines.push(`| \`${token.path}\` | ${token.value} | ${token.type} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
