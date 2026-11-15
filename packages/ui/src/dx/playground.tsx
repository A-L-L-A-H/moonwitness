"use client";

import React from "react";
import { SkinProvider, useSkin } from "../skin/index";
import { skinPresets, listPresets, type SkinName } from "../skin";

/* ── Skin Playground ────────────────────────────────────────────── */

export interface SkinPlaygroundProps {
  defaultSkin?: SkinName;
  className?: string;
}

export function SkinPlayground({ defaultSkin = "default", className }: SkinPlaygroundProps) {
  return (
    <SkinProvider defaultSkin={defaultSkin}>
      <div
        className={className}
        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}
      >
        <SkinSelector />
        <ComponentMatrix />
      </div>
    </SkinProvider>
  );
}

/* ── Skin Selector Bar ──────────────────────────────────────────── */

function SkinSelector() {
  const { skin, setSkin } = useSkin();
  const presets = listPresets();

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "monospace", fontSize: 13, alignSelf: "center", marginRight: 8 }}>
        Skin:
      </span>
      {presets.map((name) => (
        <button
          key={name}
          onClick={() => setSkin(name)}
          style={{
            padding: "4px 12px",
            borderRadius: 4,
            border: skin === name ? "2px solid #ff2d78" : "1px solid #333",
            background: skin === name ? "#ff2d7820" : "#1a1a1e",
            color: skin === name ? "#ff2d78" : "#ccc",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          {skinPresets[name].label}
        </button>
      ))}
    </div>
  );
}

/* ── Component Matrix ───────────────────────────────────────────── */

function ComponentMatrix() {
  const { skin } = useSkin();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      <Section title="Buttons">
        <ButtonShowcase skin={skin} />
      </Section>
      <Section title="Cards">
        <CardShowcase skin={skin} />
      </Section>
      <Section title="Inputs">
        <InputShowcase skin={skin} />
      </Section>
      <Section title="Badges">
        <BadgeShowcase skin={skin} />
      </Section>
      <Section title="Progress">
        <ProgressShowcase skin={skin} />
      </Section>
      <Section title="Effects">
        <EffectsShowcase skin={skin} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #333", borderRadius: 6, overflow: "hidden" }}>
      <div
        style={{
          background: "#1a1a1e",
          padding: "8px 12px",
          borderBottom: "1px solid #333",
          fontFamily: "monospace",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#888",
        }}
      >
        {title}
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Showcases ──────────────────────────────────────────────────── */

function ButtonShowcase({ skin }: { skin: SkinName }) {
  const preset = skinPresets[skin];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button
        style={{
          padding: "6px 14px",
          borderRadius: 4,
          border: "1px solid #ff2d78",
          background: "#ff2d78",
          color: "#fff",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        {preset.button.variant} / {preset.button.skin}
      </button>
      <button
        style={{
          padding: "6px 14px",
          borderRadius: 4,
          border: "1px solid #333",
          background: "transparent",
          color: "#ccc",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Outline
      </button>
      <button
        style={{
          padding: "6px 14px",
          borderRadius: 4,
          border: "none",
          background: "transparent",
          color: "#888",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Ghost
      </button>
    </div>
  );
}

function CardShowcase({ skin }: { skin: SkinName }) {
  const preset = skinPresets[skin];
  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: 6,
        padding: 12,
        background: skin === "editorial" ? "transparent" : "#14141c",
      }}
    >
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888", marginBottom: 4 }}>
        {preset.card.variant} / {preset.card.skin}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Card Title</div>
      <div style={{ fontSize: 12, color: "#aaa" }}>Card description content goes here.</div>
    </div>
  );
}

function InputShowcase({ skin: _skin }: { skin: SkinName }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <input
        type="text"
        placeholder="Text input…"
        style={{
          padding: "6px 10px",
          borderRadius: 4,
          border: "1px solid #444",
          background: "#0b0b10",
          color: "#f5f3ee",
          fontSize: 13,
        }}
      />
      <input
        type="text"
        placeholder="Disabled"
        disabled
        style={{
          padding: "6px 10px",
          borderRadius: 4,
          border: "1px solid #333",
          background: "#111",
          color: "#555",
          fontSize: 13,
        }}
      />
    </div>
  );
}

function BadgeShowcase({ skin }: { skin: SkinName }) {
  const preset = skinPresets[skin];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid #ff2d78",
          background: "#ff2d7820",
          color: "#ff2d78",
          fontSize: 11,
          fontFamily: "monospace",
        }}
      >
        {preset.badge.variant}
      </span>
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid #2ea8ff",
          background: "#2ea8ff20",
          color: "#2ea8ff",
          fontSize: 11,
          fontFamily: "monospace",
        }}
      >
        info
      </span>
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid #d4a517",
          background: "#d4a51720",
          color: "#d4a517",
          fontSize: 11,
          fontFamily: "monospace",
        }}
      >
        warning
      </span>
    </div>
  );
}

function ProgressShowcase({ skin: _skin }: { skin: SkinName }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[25, 50, 75, 100].map((value) => (
        <div key={value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: "#222",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${value}%`,
                height: "100%",
                background: value === 100 ? "#2ea8ff" : "#ff2d78",
                borderRadius: 4,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888", minWidth: 32 }}>
            {value}%
          </span>
        </div>
      ))}
    </div>
  );
}

function EffectsShowcase({ skin }: { skin: SkinName }) {
  const preset = skinPresets[skin];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>
        Active: {preset.effects || "(none)"}
      </div>
      <div
        style={{
          height: 48,
          borderRadius: 4,
          background:
            skin === "riot"
              ? "repeating-linear-gradient(45deg, #ff2d7820, #ff2d7820 2px, transparent 2px, transparent 8px)"
              : skin === "transmission"
                ? "repeating-linear-gradient(0deg, #2ea8ff10, #2ea8ff10 1px, transparent 1px, transparent 4px)"
                : "#1a1a1e",
          border: "1px dashed #444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: 11,
          fontFamily: "monospace",
        }}
      >
        effect preview
      </div>
    </div>
  );
}
