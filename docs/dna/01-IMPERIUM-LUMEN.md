---
title: "Master DNA 01 — Imperium Lumen"
version: "1.1.0"
status: "approved"
last_verified: "2026-11-15"
owner: "product-design"
---

# 01 — IMPERIUM LUMEN

## The Empire of Light

- **Parent identity:** A-L-L-A-H.COM / **EMPIRE OF THE LIGHT** (`apps/gate/` · `apps/dock/`)
- **Core formula:** Sacred monumentalism (abstract) × impossible architectural structures × celestial directional light × immense spatial depth
- **Emotional register:** Awe, monumental scale, serenity, orientation, purposeful discovery
- **Experience metaphor:** Entering and traversing an immense, timeless world through a coherent architectural gateway — never a conventional SaaS website, corporate dashboard, gaming website, or ordinary religious site.

## Design thesis

The interface should feel like crossing into an extraordinary architectural world, not scrolling a generic landing template or boxed card wall. Monumental proportion, impossible architectural silhouettes, celestial lighting ("Light Has a Source"), immense spatial depth, and extraordinary negative space establish presence immediately. Light acts as a spatial material that reveals geometry and destination hierarchy; it is never decorative neon glow or continuous heavy bloom.

## Composition grammar

- Use monumental axial compositions, long architectural perspectives, framed horizons, impossible arched thresholds, and nested spatial depth.
- Establish one dominant spatial gesture per viewport; avoid collages of competing focal objects or repeated equal-weight card grids.
- Use asymmetry only when anchored by architectural mass, axial symmetry lines, or extraordinary negative space.
- Frame destination changes as spatial passage between chambers or horizons (`Establish -> Focus -> Resolve`), not generic fade-in card lists.
- Preserve crystal-clear DOM reading planes: typography and interactive controls never fight background illustration for contrast or legibility.
- Silence and negative space are primary structural materials.

## Shape and material language

- **Architecture:** monolithic, impossible geometry (cantilevered cosmic spans, concentric celestial rings, stepped obsidian thresholds), layered and mathematically precise.
- **Surfaces:** matte carved obsidian stone, lunar slate (`#20242B`), luminous ivory ceramic (`#F4F1E9`), and restrained hairline antique gold metal (`#C5A15A`).
- **Edges & depth:** clean architectural bevels, 1px hairline seams, deep recessed portals, foreground/midground/atmosphere separation, and calibrated surface occlusion.
- **Responsive light & materials:** light shifts subtly along hairline bevels and focal portals in response to cursor focus, keyboard focus, or scroll position without constant animation loops or heavy GPU blur filters.

## Color and typography direction (runtime-aligned)

- **Canvas & Surfaces:** Obsidian `#090A0D` · Lunar Slate `#20242B` · Elevated Surface `#2A2F37`.
- **Foreground:** Luminous Ivory `#F4F1E9` · Moon Dust `#C4C0B5` / `#D9D4C8`.
- **Restrained Metallic Accent:** Antique / Moon Gold `#C5A15A` (architectural seals, hairline rules, focus cues; never flood fills).
- **Narrative Accent:** Selective Crimson `#8E2635` (editorial/narrative emphasis only, never general button chrome).
- **Display & Headings:** `Cormorant Garamond`, `"Times New Roman"`, serif — monumental editorial contrast with disciplined tracking.
- **Body & Labels:** `Inter`, Helvetica, sans-serif — crisp clarity across dense reading planes.
- **Technical & Numeric:** `"Cascadia Code"`, monospace — metadata, timestamps, provenances, and measured coordinates.

## Navigation and living interaction choreography

- **Entrance sequence:** staged `Establish -> Focus -> Resolve` reveal (horizon/portal settles -> axial typography focuses -> primary gate seals resolve), always interruptible so controls accept input immediately.
- **Spatial destination transitions:** progressive View Transitions API portal bridges between gateways, falling back cleanly to instant semantic state swaps.
- **Camera, depth & parallax:** restrained pointer/scroll depth shifts across 3–4 calibrated foreground/world/atmosphere layers (`transform`/`opacity` only, zero layout thrashing).
- **Scroll choreography:** chapter-like vertical traversal using CSS scroll-driven rules or progressive motion bindings where supported; static layout parity preserved when unsupported.
- **Interactive architectural elements:** primary actions behave as architectural seals (`Button variant="gold"`), destinations present bespoke spatial forms, and dialogs open as contained threshold chambers with focus trapping and Escape return.
- **Acoustic presence (opt-in):** resonant Web Audio API harmonic intervals (`packages/ui/src/sfx/audio.ts`) muted by default, activated strictly by user gesture, and never required to understand state.

## Component interpretation

- **Button:** architectural seal or framed command (`variant="gold"` reserved for primary passage).
- **Card:** recessed architectural bay (`RawContainer` with hairline border and quiet elevation).
- **Navigation:** sequence of gates, horizons, and named ecosystem worlds.
- **Dialog:** threshold chamber with explicit close/return focus guarantees.
- **Tabs:** adjoining architectural wings or spatial index views.
- **Data display:** engraved/inscribed plane with verified provenance and mono numeric markers.
- **Empty state:** serene quiet chamber offering one real next destination.

## Signature entry experience

A single monumental celestial horizon and arched portal establish immediate scale over mirror-obsidian space. The `A-L-L-A-H.COM — EMPIRE OF THE LIGHT` lockup sits cleanly inside the central axis without overlapping interactive controls, leading directly into the ecosystem worlds and an unmistakable primary entrance CTA.

## Reduced-motion and accessible fallback

- All camera travel, depth parallax, light sweeps, View Transitions, and optional WebGL/WebGPU spatial shaders are optional progressive enhancements gated behind `prefers-reduced-motion: no-preference`, capability detection, and `VisualEffectsProvider` pause controls.
- Under `prefers-reduced-motion: reduce` or paused effects, pages render immediately in their resolved static state with full contrast, semantic landmarks, keyboard navigation, and accessible list/table fallbacks for every spatial map.

## Hard exclusions

- Never depict ALLAH, divine form, divine body, face, or anthropomorphic proxy claiming to represent ALLAH.
- Never claim that light, architecture, a portal, geometry, or any visual object represents ALLAH.
- Never use Qur'anic text or sacred names as decorative textures, wallpaper patterns, random glyphs, or aesthetic filler.
- No cartoon illustrations, generic religious stock imagery, generic SaaS dashboard layouts, excessive gold glow/bloom, cheap sci-fi cyberpunk effects, random purposeless particles, or overloaded compositions.
- Do not sacrifice navigation clarity, LCP speed, or WCAG contrast for visual spectacle.
- Do not falsely imply that UI progression measures faith, salvation, or divine favor.

## Quality signature

IMPERIUM LUMEN remains unmistakable even in monochrome wireframe or reduced-motion static fallback through monumental scale, axial proportion, negative space, calibrated celestial lighting, and architectural restraint.
