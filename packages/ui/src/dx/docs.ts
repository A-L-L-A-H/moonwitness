// Moonwitness DX — Auto-generate documentation from DNA tokens and skin presets

import { CUTOUT_ARTWORK_IDS } from "../artwork/cutouts";
import { BRAND_LOGO_IDS } from "../artwork/logos";
import { generateCSSVariables, listThemes, getTheme } from "../dna/registry";
import type { SkinName } from "../skin/compositions";
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

export interface SkinAtmosphereDoc {
  skin: SkinName;
  canvasPattern: string;
  surfaceGeometry: string;
  typographyVoice: string;
  iconStrokeAndCap: string;
  hardwareOrnament: string;
  mediaTreatment: string;
  motionDuration: string;
}

export interface TelemetryComponentDoc {
  symbol: string;
  category: "chart" | "atmosphere" | "composite";
  description: string;
}

export interface BrandCatalogDoc {
  logos: readonly string[];
  cutouts: readonly string[];
  domainIcons: readonly ArtworkDoc[];
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

const SKIN_ATMOSPHERE: readonly SkinAtmosphereDoc[] = [
  {
    skin: "default",
    canvasPattern: "None (clean adaptive dark/cream paper canvas)",
    surfaceGeometry: "0.5rem rounded corners, 1px solid border",
    typographyVoice: "Brush display headings (0.03em tracking), system UI body",
    iconStrokeAndCap: "1.95px stroke, round cap",
    hardwareOrnament: "lunar-bracket",
    mediaTreatment: "Neutral pass-through",
    motionDuration: "200ms",
  },
  {
    skin: "riot",
    canvasPattern: "10px halftone dot grid + diagonal edge cuts",
    surfaceGeometry: "2px sharp radius, 2px solid border, 6px yellow offset shadow",
    typographyVoice: "Uppercase street brush (0.06em tracking) with CMYK slip",
    iconStrokeAndCap: "2.3px heavy stroke, square cap",
    hardwareOrnament: "staple-tape",
    mediaTreatment: "contrast(1.18) saturate(1.25)",
    motionDuration: "120ms",
  },
  {
    skin: "editorial",
    canvasPattern: "120px column margin rules & top accent bar",
    surfaceGeometry: "6px soft radius, 1px solid border, 32px ambient drop shadow",
    typographyVoice: "Cinzel / Palatino serif display (-0.01em tracking)",
    iconStrokeAndCap: "1.4px fine stroke, round cap",
    hardwareOrnament: "editorial-rule",
    mediaTreatment: "contrast(1.04) saturate(0.92)",
    motionDuration: "320ms",
  },
  {
    skin: "technical",
    canvasPattern: "24px CAD blueprint grid",
    surfaceGeometry: "2px clipped corner chamfers, 1px dashed border + hairline inset",
    typographyVoice: "Monospace uppercase telemetry headers",
    iconStrokeAndCap: "Precision CAD stroke, square cap",
    hardwareOrnament: "corner-crosshair",
    mediaTreatment: "Neutral CAD schematic",
    motionDuration: "140ms",
  },
  {
    skin: "archive",
    canvasPattern: "28px horizontal ledger rules",
    surfaceGeometry: "3px double border with inset rule outline",
    typographyVoice: "Archival index serif & handwritten marginalia",
    iconStrokeAndCap: "1.8px archivist ink stroke",
    hardwareOrnament: "corner-staple",
    mediaTreatment: "Paper grain & sepia/duotone warmth",
    motionDuration: "260ms",
  },
  {
    skin: "transmission",
    canvasPattern: "3px broadcast phosphor scanlines",
    surfaceGeometry: "Top phosphor accent bar with signal shadow",
    typographyVoice: "Broadcast monospaced channel callouts",
    iconStrokeAndCap: "Signal waveform stroke",
    hardwareOrnament: "signal-tick",
    mediaTreatment: "Phosphor scanline & contrast emphasis",
    motionDuration: "160ms",
  },
  {
    skin: "sanctuary",
    canvasPattern: "Radial luminous vignette aura",
    surfaceGeometry: "8px octagram chamfered corner bevels",
    typographyVoice: "Cinzel ceremonial small-caps (0.14em tracking)",
    iconStrokeAndCap: "1.35px fine round astrolabe stroke",
    hardwareOrnament: "octagram-bracket",
    mediaTreatment: "Balanced ceremonial tone (aniconic safe)",
    motionDuration: "280ms",
  },
  {
    skin: "brutalist",
    canvasPattern: "45deg architectural concrete diagonal hatch",
    surfaceGeometry: "0px slab radius, 3px border, opposing offset block shadow",
    typographyVoice: "Heavy condensed uppercase slab display",
    iconStrokeAndCap: "2.6px heavy square cap",
    hardwareOrnament: "concrete-rivet",
    mediaTreatment: "High contrast structural plate",
    motionDuration: "40ms",
  },
  {
    skin: "noir",
    canvasPattern: "Darkroom film-grain stipple dot matrix",
    surfaceGeometry: "2px crisp margin border with inset frame",
    typographyVoice: "Tabular archive monospace & serif titles",
    iconStrokeAndCap: "1.6px butt-cap reticle stroke",
    hardwareOrnament: "film-sprocket",
    mediaTreatment: "Monochrome silver-gelatin grayscale(1) contrast(1.28)",
    motionDuration: "180ms",
  },
  {
    skin: "kinetic",
    canvasPattern: "-45deg vector velocity stripe field",
    surfaceGeometry: "Skewed -0.8deg polygon chamfer lifting straight on hover",
    typographyVoice: "Dynamic street brush uppercase",
    iconStrokeAndCap: "2.2px velocity round stroke",
    hardwareOrnament: "vector-chevron",
    mediaTreatment: "Saturated punch color grading",
    motionDuration: "130ms",
  },
];

const DOMAIN_ICON_DOCS: readonly ArtworkDoc[] = [
  { icon: "VpnTunnel", description: "Encrypted gateway & WireGuard tunnel diagnostics" },
  { icon: "SyslogStream", description: "Streaming log ingestion & audit records" },
  { icon: "SnmpProbe", description: "NOC device telemetry & SNMP probe nodes" },
  { icon: "StorageBucket", description: "R2 / S3 object buckets & asset persistence" },
  { icon: "RadiusKey", description: "AAA authentication & cryptographic access tokens" },
  { icon: "MtimeHorizon", description: "MoonTime temporal observatory & lunar horizon" },
  { icon: "ScriptureFolio", description: "Comparative scripture codex & corpus witness" },
  { icon: "MemoryTapeNode", description: "Tape continuity & cognitive memory recall" },
  { icon: "ArsyRelay", description: "Autonomous Arsy control-plane relay" },
  { icon: "SimpulNode", description: "Simpul Nusantara addons & federation graph" },
  { icon: "MyceliumSpore", description: "Living Mycelium agent swarm nodes" },
  { icon: "SkinPalette", description: "7-DNA × 6-skin atmosphere token switcher" },
];

const TELEMETRY_AND_COMPOSITES: readonly TelemetryComponentDoc[] = [
  {
    symbol: "Sparkline",
    category: "chart",
    description: "Compact trend line + optional baseline fill for KPI strip cells",
  },
  {
    symbol: "LineChart",
    category: "chart",
    description: "Labeled multi-point time/value SVG line plot bound to skin CSS vars",
  },
  {
    symbol: "AreaChart",
    category: "chart",
    description: "Shaded area curve using smooth SVG gradient fill from --primary/--accent",
  },
  {
    symbol: "RadialGauge",
    category: "chart",
    description: " Circular dial readout for lunar illumination, storage, or health pct",
  },
  {
    symbol: "BarChart",
    category: "chart",
    description: "Accessible categorical bar visualization inside ChartContainer",
  },
  {
    symbol: "ChartContainer",
    category: "chart",
    description: "Skinned card wrapper applying active DNA & skin border/elevation",
  },
  {
    symbol: "SkinBackdrop",
    category: "atmosphere",
    description: "Skin-aware canvas backdrop & decorative SVG/CSS texture layer",
  },
  {
    symbol: "SkinOrnament",
    category: "atmosphere",
    description: "Reads --mw-ornament per skin (staple-tape, lunar-bracket, editorial-rule)",
  },
  {
    symbol: "AutoModelView",
    category: "composite",
    description: "Metadata-driven CRUD table & form renderer respecting ACLs and _attrs",
  },
  {
    symbol: "SkinMatrixCompare",
    category: "composite",
    description: "Interactive 6-skin side-by-side live comparison workbench",
  },
  {
    symbol: "ConsoleCommandPalette",
    category: "composite",
    description: "Ctrl+K / Cmd+K quick navigation, skin switching, and light/dark toggle",
  },
];

export function generateSkinAtmosphereDocs(): SkinAtmosphereDoc[] {
  return [...SKIN_ATMOSPHERE];
}

export function generateArtworkDocs(): ArtworkDoc[] {
  return [...DOMAIN_ICON_DOCS];
}

export function generateBrandCatalogDocs(): BrandCatalogDoc {
  return {
    logos: BRAND_LOGO_IDS,
    cutouts: CUTOUT_ARTWORK_IDS,
    domainIcons: DOMAIN_ICON_DOCS,
  };
}

export function generateTelemetryDocs(): TelemetryComponentDoc[] {
  return [...TELEMETRY_AND_COMPOSITES];
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

  lines.push("");
  lines.push("## 8-Axis Skin Atmosphere");
  lines.push("");
  lines.push("| Skin | Canvas Pattern | Surface Geometry | Typography Voice | Ornament | Motion |");
  lines.push("|------|----------------|------------------|------------------|----------|--------|");
  for (const row of generateSkinAtmosphereDocs()) {
    lines.push(
      `| \`${row.skin}\` | ${row.canvasPattern} | ${row.surfaceGeometry} | ${row.typographyVoice} | ${row.hardwareOrnament} | ${row.motionDuration} |`,
    );
  }
  lines.push("");

  lines.push("## Brand Logos, Cutouts & Domain Icons");
  lines.push("");
  const catalog = generateBrandCatalogDocs();
  lines.push(
    `- **DnaBrandLogo lockups (${catalog.logos.length})**: ${catalog.logos.map((id) => `\`${id}\``).join(", ")}`,
  );
  lines.push(
    `- **CutoutArtwork SVG pieces (${catalog.cutouts.length})**: ${catalog.cutouts.map((id) => `\`${id}\``).join(", ")}`,
  );
  lines.push(
    `- **Sovereign Domain Icons (${catalog.domainIcons.length})**: ${catalog.domainIcons.map((item) => `\`${item.icon}\``).join(", ")}`,
  );
  lines.push("");

  lines.push("## Telemetry & Composite Components");
  lines.push("");
  lines.push("| Component | Category | Purpose |");
  lines.push("|-----------|----------|---------|");
  for (const comp of generateTelemetryDocs()) {
    lines.push(`| \`${comp.symbol}\` | ${comp.category} | ${comp.description} |`);
  }
  lines.push("");

  lines.push("");
  lines.push("## Architecture & Usage");
  lines.push("");
  lines.push(
    "`DNA -> Theme Resolver -> Skin Preset -> Semantic & Component Tokens -> CSS Custom Properties`",
  );
  lines.push("");
  lines.push("### Subpath Imports");
  lines.push("- `@moonwitness/ui` — Core, P0, P1, Primitive, Composite & Layout UI components");
  lines.push("- `@moonwitness/ui/tokens` — Pure SSR-safe Imperium & Master DNA color tokens");
  lines.push(
    "- `@moonwitness/ui/dna` — Canonical token engine, light/dark palettes, CSS variable generators",
  );
  lines.push(
    "- `@moonwitness/ui/skin` — Client `SkinProvider`, `SkinRoot`, `useSkin`, `useThemeMode`, `Skinned.*`",
  );
  lines.push(
    "- `@moonwitness/ui/skins/imperium.css` / `@moonwitness/ui/theme.css` / `@moonwitness/ui/base.css`",
  );
  lines.push("");
  lines.push("### Server vs Client Components");
  lines.push(
    "- Import `@moonwitness/ui/tokens`, `@moonwitness/ui/dna`, and pure layout/artwork helpers inside React Server Components without client hydration boundaries.",
  );
  lines.push(
    '- `SkinProvider`, `SkinRoot`, `Button`, `Input`, `Dialog`, `Select`, `Tabs`, `AutoModelView`, and interactive controls declare `"use client"` cleanly.',
  );
  lines.push("");
  return lines.join("\n");
}
