# A-L-L-A-H.COM — EMPIRE OF THE LIGHT: Design System & Architecture Note

> **Governance Update (`01-imperium-lumen` v2.0.0):** The previous `SACRED MINIMALISM × CINEMATIC IMMERSION × INFINITE LIGHT` gold-only / 5-world direction is **SUPERSEDED** by **EMPIRE OF THE LIGHT — THE ILLUSTRATED UNIVERSE** (`PLAYFUL ILLUSTRATED UNIVERSE × REFINED USER EXPERIENCE × ACCESSIBLE DESIGN`).

## 1. Centralized Ownership

- **Tokens, Skins & Presentation Components (`packages/ui`):**
  - Brand & semantic tokens (`IMPERIUM_LUMEN_TOKENS`, `MASTER_DNA_WORLDS["01-imperium-lumen"]`) live in `packages/ui/src/skin/dna-worlds.tsx` and `packages/ui/src/skin/imperium.tsx`.
  - Scoped CSS lives in `packages/ui/src/skins/imperium.css` under `[data-dna="01-imperium-lumen"]` so sibling skins in `apps/web` (`02-lunar-chronicles`, `05-riot-anarchy`, `06-mycelium`) remain strictly isolated.
  - Reusable components (`SiteNavigation`, `IllustratedHero`, `WorldExplorer`, `WorldTile`, `WorldAtlas`, `StorySection`, `EditorialFeature`, `SectionHeading`, `IllustrationFrame`, `ResponsiveImage`, `PrimaryAction`, `SecondaryAction`, `MotionReveal`, `CrownEmblemIcon`) are imported from `@moonwitness/ui/imperium`.
- **Compatibility Alias (`apps/a-l-l-a-h/src/data/design-tokens.ts`):** Re-exports directly from `@moonwitness/ui/imperium` with zero duplicated token definitions.
- **Domain Registry (`packages/canon` & `apps/a-l-l-a-h/src/data/empire-registry.ts`):** Defines the reconciled **Nine Worlds**:
  1. `MOONWITNESS` — Stories · Knowledge · Archive
  2. `ARSY` — Radio · Technology · Infrastructure (distinct from `cp/arsy` host control plane)
  3. `HUMAN-PEN` — Think · Write · Create · Share (reconciles QALAM & Manusia Pulpen)
  4. `SIDRA` — Connect · Explore · Learn
  5. `ROCKSOUL DX` — Play · Create · Dream
  6. `CRAYON` — Biar Hidup Lebih Berwarna! (`SRGBL v8` canon explorer)
  7. `SIN CAN` — Reflect · Question · Understand (`SIN CAN BE BETTER HUMAN` reflection arc)
  8. `MYTHOS` — Explore · Discover · Remember (`MFTL` & `Case 001: Jerusalem 70 CE`)
  9. `ANGEL WITH SHOTGUN` — Law · Justice · Society (`AWS` 6-gate normative scope)

## 2. Reformed Visual Covenant (`SACRED_VISUAL_COVENANT`)

- Original, art-directed illustrations, illustrated fantasy worlds, graphic editorial compositions, and hand-drawn accents are **allowed**.
- **Preserved safeguards:** zero depictions of ALLAH; no identifiable human faces (faceless silhouettes, back-facing travelers, landscapes, architecture, and symbolic objects used instead); no copyrighted character/manga imitation; no violent/disturbing imagery; no sacred text as random background texture.
- Full keyboard focus (`#f6d438` outline), `>= 44px` touch targets, `>= 16px` readable body text, and `prefers-reduced-motion: reduce` support.
