---
title: "Master DNA 01 — Imperium Lumen"
version: "2.0.0"
status: "approved"
last_verified: "2026-11-17"
owner: "product-design"
---

# 01 — IMPERIUM LUMEN

> **Governance Notice:** The previous ivory-and-gold-only architectural direction (`v1.1.0`) is **SUPERSEDED** by `v2.0.0`. The stable DNA identifier `01-imperium-lumen` is preserved for backward compatibility across `@moonwitness/ui` and consuming applications.

## EMPIRE OF THE LIGHT — THE ILLUSTRATED UNIVERSE

- **Parent identity:** A-L-L-A-H.COM / **EMPIRE OF THE LIGHT** (`apps/a-l-l-a-h`)
- **Core formula:** **PLAYFUL ILLUSTRATED UNIVERSE × REFINED USER EXPERIENCE × ACCESSIBLE DESIGN**
- **Emotional register:** Wonder, warmth, clarity, discovery, welcome across ages (children, teenagers, adults, and older visitors)
- **Experience metaphor:** Entering an illustrated universe of nine interconnected worlds through clear editorial compositions—never a generic corporate website, generic SaaS dashboard, ivory-and-gold luxury template, or blind copy of `05-riot-anarchy`.

## Design thesis

A-L-L-A-H.COM invites visitors into an illustrated universe anchored in ink black, warm paper white, electric yellow, hot pink/magenta, and deep blue. Original illustrations, illustrated fantasy worlds, graphic editorial compositions, and hand-drawn visual accents create unmistakable character while clear reading planes, readable body typography (`>= 16px`), and disciplined layout rhythm keep navigation effortless and calm.

## Composition grammar

- Anchor the threshold with a full-viewport **IllustratedHero**: original illustrated scene backdrop, graphic editorial title lockup, clear reading callout box, unmistakable primary CTA, and a grounded bottom shelf for the **Nine Worlds** (`MOONWITNESS`, `ARSY`, `HUMAN-PEN`, `SIDRA`, `ROCKSOUL DX`, `CRAYON`, `SIN CAN`, `MYTHOS`, `ANGEL WITH SHOTGUN`).
- Control color distribution: ink black and warm paper carry reading planes; electric yellow highlights primary action and active orientation; hot pink/magenta and deep blue provide expressive framing and editorial emphasis without exhausting the screen.
- Pair expressive display headlines with ordinary, highly legible sans/serif body copy (`>= 16px`) and tabular monospace for metadata.
- Frame illustrations cleanly with high-contrast scrims or opaque reading panels wherever live text sits above artwork.

## Color and typography tokens (centralized in `@moonwitness/ui`)

Authoritative tokens live in `packages/ui/src/skin/imperium.tsx` (`IMPERIUM_LUMEN_TOKENS`), `packages/ui/src/skin/dna-worlds.tsx` (`MASTER_DNA_WORLDS["01-imperium-lumen"]`), and `packages/ui/src/skins/imperium.css` (`[data-dna="01-imperium-lumen"]`).

- **Brand colors:**
  - `brand.ink`: `#08090d`
  - `brand.paper`: `#f4ecd8`
  - `brand.yellow`: `#f6d438`
  - `brand.pink`: `#ed149b`
  - `brand.blue`: `#2ea8ff`
  - `brand.white`: `#fff8e8`
- **Semantic colors:**
  - `canvas`: `#08090d`
  - `surface`: `#10121a`
  - `surfaceElevated`: `#171a26`
  - `text`: `#fff8e8`
  - `textMuted`: `#d8d0c0`
  - `border`: `#f6d438`
  - `accent`: `#f6d438`
  - `accentSecondary`: `#ed149b`
  - `accentForeground`: `#08090d`
  - `focus`: `#f6d438`
  - `success`: `#3ddc84`
  - `warning`: `#f6d438`
  - `danger`: `#ff3b3b`
- **Typography:**
  - `display`: `Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif` (playful poster headlines & lockups)
  - `editorial`: `"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif` (long-form reflections & scripture quotes)
  - `body`: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (ordinary readable body text & functional controls, `>= 16px` base)
  - `label`: `var(--font-cinzel), "Cinzel", Georgia, serif` (world titles & structured labels)
  - `technical`: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` (provenance codes, telemetry, coordinates)

## Component interpretation (from `@moonwitness/ui/imperium`)

- **SiteNavigation:** fixed opaque ink-black top bar with brand lockup (Crown emblem + wordmark + subtitle), primary world/section links (active link marked by electric yellow brush highlight), utility controls (search, radiance toggle, locale switcher, sign-in), and accessible mobile drawer.
- **IllustratedHero:** full-bleed illustrated scene with graphic editorial title lockup, paper-white callouts, yellow primary action (`PrimaryAction`), and integrated `WorldExplorer` bottom shelf.
- **WorldTile / WorldExplorer / WorldAtlas:** illustrated destination cards framing each of the Nine Worlds with unique art, index badge, legible paper/ink copy panel, and clear `EXPLORE` action.
- **StorySection / EditorialFeature / IllustrationFrame:** editorial reading planes pairing original artwork with structured text, interactive domain tools, and clean borders.
- **MotionReveal:** lightweight transform + opacity entrance/reveal wrapper that yields immediately under `prefers-reduced-motion: reduce` or `quietMode`.

## Reduced-motion and accessible fallback

- All motion uses lightweight `transform` and `opacity` transitions and respects `prefers-reduced-motion: reduce` and explicit `quietMode` toggles.
- Essential navigation, world selection, search, and interactive controls operate cleanly via keyboard (`Tab`, `Enter`, `Space`, arrow keys, `Escape`) with visible `#f6d438` focus outlines and `>= 44px` touch targets.
- Text never sits unprotected on busy artwork; dark ink or warm paper reading plates preserve WCAG AA contrast (`pnpm ui:contrast`).

## Hard exclusions (reformed)

- **Original illustrations permitted:** original, art-directed illustrations, illustrated fantasy worlds, graphic editorial compositions, and hand-drawn visual accents are **explicitly allowed** (replacing the superseded v1.1.0 blanket ban on cartoon/illustrative visuals).
- **Never depict ALLAH:** never depict ALLAH, divine form, or anthropomorphic proxy, and never claim any graphic, light effect, or world represents ALLAH.
- **No identifiable human faces:** use faceless silhouettes, back-facing figures, landscapes, architecture, objects, and symbolic illustrations rather than identifiable human faces.
- **Never imitate copyrighted works:** never copy copyrighted characters, artists, or existing manga panels.
- **Avoid violent or disturbing imagery:** keep visual storytelling welcoming across all age groups.
- **Respectful sacred references:** never use Qur'anic verses, Divine Names, or sacred text as random decorative wallpaper or background filler texture.
- **No fake telemetry:** never fabricate live metrics, operational state, or false claims of divine approval.

## Quality signature

IMPERIUM LUMEN (`01-imperium-lumen`) delivers a vibrant, joyful illustrated universe with electric yellow, hot pink, deep blue, ink black, and warm paper—governed by clean reading planes, centralized tokens in `@moonwitness/ui`, accessible typography, and static reduced-motion parity.
