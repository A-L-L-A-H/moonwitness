"use client";

import React, { useCallback, useMemo, useState } from "react";
import { generateCSSVariables, getTheme, listThemes, type ThemeName } from "../dna/registry";
import {
  canonicalTokensToCssVariables,
  resolveCanonicalTokens,
  type CanonicalThemeMode,
} from "../dna/canonical";
import { MASTER_DNA_IDS, MASTER_DNA_WORLDS, type MasterDnaId } from "../skin/dna-worlds";
import { listPresets, skinPresets, type SkinName } from "../skin";

export interface TokenInspectorProps {
  initialTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
}

const THEMES = listThemes();
const SKINS = listPresets();

export function TokenInspector({ initialTheme = "default", onThemeChange }: TokenInspectorProps) {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  const [skin, setSkin] = useState<SkinName>("default");
  const [dnaId, setDnaId] = useState<MasterDnaId>("05-riot-anarchy");
  const [mode, setMode] = useState<CanonicalThemeMode>("dark");
  const [copied, setCopied] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["colors.semantic"]));

  const handleThemeChange = useCallback(
    (next: ThemeName) => {
      setTheme(next);
      onThemeChange?.(next);
    },
    [onThemeChange],
  );

  const resolvedCanonical = useMemo(
    () => resolveCanonicalTokens({ dnaId, skin, mode }),
    [dnaId, skin, mode],
  );
  const canonicalVars = useMemo(
    () => canonicalTokensToCssVariables(resolvedCanonical),
    [resolvedCanonical],
  );
  const cssOutput = useMemo(() => {
    const legacyBlock = generateCSSVariables(getTheme(theme));
    const canonicalLines = Object.entries(canonicalVars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");
    return `${legacyBlock}\n\n[data-dna="${dnaId}"][data-skin="${skin}"][data-theme="${mode}"] {\n${canonicalLines}\n}`;
  }, [theme, canonicalVars, dnaId, skin, mode]);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(cssOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [cssOutput]);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const themeTokens = getTheme(theme);
  const flattened = flattenForDisplay(themeTokens as unknown as Record<string, unknown>);

  return (
    <div className="mw-dx-inspector flex flex-col gap-4 font-mono text-[var(--foreground)]">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs">
          <span>DNA:</span>
          <select
            aria-label="Inspector DNA"
            value={dnaId}
            onChange={(e) => setDnaId(e.target.value as MasterDnaId)}
            className="min-h-9 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
          >
            {MASTER_DNA_IDS.map((id) => (
              <option key={id} value={id}>
                {MASTER_DNA_WORLDS[id].name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span>Mode:</span>
          <select
            aria-label="Inspector Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as CanonicalThemeMode)}
            className="min-h-9 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
          >
            <option value="dark">dark</option>
            <option value="light">light</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span>Preset:</span>
          <select
            aria-label="Inspector Theme"
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as ThemeName)}
            className="min-h-9 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span>Skin:</span>
          <select
            aria-label="Inspector Skin"
            value={skin}
            onChange={(e) => setSkin(e.target.value as SkinName)}
            className="min-h-9 border border-[var(--border)] bg-[var(--background)] px-2 text-xs text-[var(--foreground)]"
          >
            {SKINS.map((s) => (
              <option key={s} value={s}>
                {skinPresets[s].label} — {skinPresets[s].description}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-9 border border-[var(--border)] bg-[var(--card)] px-3 text-xs hover:bg-[var(--muted)]"
        >
          {copied ? "✓ Copied" : "Copy CSS Variables"}
        </button>
      </div>

      {/* Token Tree */}
      <div className="max-h-96 overflow-auto rounded-[var(--mw-card-radius,0.375rem)] border border-[var(--border)] bg-[var(--card)] p-3">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider">Tokens ({theme})</h4>
        {flattened.map((group) => (
          <div key={group.category} className="mb-1">
            <button
              type="button"
              onClick={() => togglePath(group.category)}
              className="cursor-pointer border-0 bg-transparent p-0 text-left text-xs font-bold text-[var(--foreground)]"
            >
              {expandedPaths.has(group.category) ? "▼" : "▶"} {group.category}
            </button>
            {expandedPaths.has(group.category) ? (
              <div className="pl-4">
                {group.items.map((item) => (
                  <div key={item.path} className="flex items-center gap-2 py-0.5 text-xs">
                    <code className="text-[var(--blue)]">{item.path}</code>
                    <span className="text-[var(--green)]">{item.value}</span>
                    {item.swatch ? (
                      <span
                        aria-hidden="true"
                        className="inline-block h-3 w-3 rounded-sm border border-[var(--border)]"
                        style={{ backgroundColor: item.swatch }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* CSS Output Preview */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider">Generated CSS Variables</h4>
        <pre className="max-h-72 overflow-auto rounded-[var(--mw-card-radius,0.375rem)] border border-[var(--border)] bg-[var(--background)] p-3 text-[11px] text-[var(--foreground)]">
          {cssOutput}
        </pre>
      </div>

      {/* Skin Preset Info */}
      <div className="rounded-[var(--mw-card-radius,0.375rem)] border border-[var(--border)] bg-[var(--card)] p-3">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider">
          Skin Preset: {skinPresets[skin].label}
        </h4>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-[var(--muted-foreground)]">Description:</dt>
          <dd className="m-0">{skinPresets[skin].description}</dd>
          <dt className="text-[var(--muted-foreground)]">Button:</dt>
          <dd className="m-0">
            variant={skinPresets[skin].button.variant} skin={skinPresets[skin].button.skin}
          </dd>
          <dt className="text-[var(--muted-foreground)]">Card:</dt>
          <dd className="m-0">
            variant={skinPresets[skin].card.variant} skin={skinPresets[skin].card.skin}
          </dd>
          <dt className="text-[var(--muted-foreground)]">Effects:</dt>
          <dd className="m-0">{skinPresets[skin].effects || "(none)"}</dd>
        </dl>
      </div>
    </div>
  );
}

interface DisplayItem {
  path: string;
  value: string;
  swatch?: string;
}

interface DisplayGroup {
  category: string;
  items: DisplayItem[];
}

function flattenForDisplay(theme: Record<string, unknown>): DisplayGroup[] {
  const groups: DisplayGroup[] = [];
  for (const [category, categoryValue] of Object.entries(theme)) {
    if (typeof categoryValue !== "object" || categoryValue === null) continue;
    const items: DisplayItem[] = [];
    collectItems(categoryValue as Record<string, unknown>, category, items);
    if (items.length > 0) groups.push({ category, items });
  }
  return groups;
}

function collectItems(obj: Record<string, unknown>, prefix: string, items: DisplayItem[]): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = `${prefix}.${key}`;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const colorToken = value as { hex?: string };
      if (typeof colorToken.hex === "string") {
        items.push({ path, value: colorToken.hex, swatch: colorToken.hex });
      } else {
        collectItems(value as Record<string, unknown>, path, items);
      }
    } else {
      items.push({ path, value: String(value) });
    }
  }
}
