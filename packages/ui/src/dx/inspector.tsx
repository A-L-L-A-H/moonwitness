"use client";

import React, { useState, useCallback } from "react";
import { generateCSSVariables, listThemes, getTheme, type ThemeName } from "../dna/registry";
import { skinPresets, listPresets, type SkinName } from "../skin";

/* ── Token Inspector ────────────────────────────────────────────── */

export interface TokenInspectorProps {
  initialTheme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
}

const THEMES = listThemes();
const SKINS = listPresets();

export function TokenInspector({ initialTheme = "default", onThemeChange }: TokenInspectorProps) {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);
  const [skin, setSkin] = useState<SkinName>("default");
  const [copied, setCopied] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["colors.semantic"]));

  const handleThemeChange = useCallback(
    (next: ThemeName) => {
      setTheme(next);
      onThemeChange?.(next);
    },
    [onThemeChange],
  );

  const cssOutput = generateCSSVariables(getTheme(theme));

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
    <div
      className="mw-dx-inspector"
      style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "monospace" }}
    >
      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Theme:{" "}
          <select value={theme} onChange={(e) => handleThemeChange(e.target.value as ThemeName)}>
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Skin:{" "}
          <select value={skin} onChange={(e) => setSkin(e.target.value as SkinName)}>
            {SKINS.map((s) => (
              <option key={s} value={s}>
                {skinPresets[s].label} — {skinPresets[s].description}
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleCopy}>{copied ? "✓ Copied" : "Copy CSS Variables"}</button>
      </div>

      {/* Token Tree */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 4,
          padding: 12,
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0" }}>Tokens ({theme})</h4>
        {flattened.map((group) => (
          <div key={group.category}>
            <button
              style={{
                fontWeight: "bold",
                textAlign: "left",
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
              }}
              onClick={() => togglePath(group.category)}
            >
              {expandedPaths.has(group.category) ? "▼" : "▶"} {group.category}
            </button>
            {expandedPaths.has(group.category) && (
              <div style={{ paddingLeft: 16 }}>
                {group.items.map((item) => (
                  <div key={item.path} style={{ display: "flex", gap: 8, padding: "2px 0" }}>
                    <code style={{ color: "#7aa2f7" }}>{item.path}</code>
                    <span style={{ color: "#9ece6a" }}>{item.value}</span>
                    {item.swatch && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          backgroundColor: item.swatch,
                          border: "1px solid #555",
                          borderRadius: 2,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CSS Output Preview */}
      <div>
        <h4 style={{ margin: "0 0 8px 0" }}>Generated CSS Variables</h4>
        <pre
          style={{
            background: "#1a1a2e",
            color: "#e0e0e0",
            padding: 12,
            borderRadius: 4,
            overflow: "auto",
            maxHeight: 300,
            fontSize: 11,
          }}
        >
          {cssOutput}
        </pre>
      </div>

      {/* Skin Preset Info */}
      <div style={{ border: "1px solid #333", borderRadius: 4, padding: 12 }}>
        <h4 style={{ margin: "0 0 8px 0" }}>Skin Preset: {skinPresets[skin].label}</h4>
        <dl
          style={{
            margin: 0,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "4px 12px",
            fontSize: 12,
          }}
        >
          <dt>Description:</dt>
          <dd style={{ margin: 0 }}>{skinPresets[skin].description}</dd>
          <dt>Button:</dt>
          <dd style={{ margin: 0 }}>
            variant={skinPresets[skin].button.variant} skin={skinPresets[skin].button.skin}
          </dd>
          <dt>Card:</dt>
          <dd style={{ margin: 0 }}>
            variant={skinPresets[skin].card.variant} skin={skinPresets[skin].card.skin}
          </dd>
          <dt>Input:</dt>
          <dd style={{ margin: 0 }}>skin={skinPresets[skin].input.skin}</dd>
          <dt>Effects:</dt>
          <dd style={{ margin: 0 }}>{skinPresets[skin].effects || "(none)"}</dd>
        </dl>
      </div>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

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
    const path = prefix + "." + key;
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
