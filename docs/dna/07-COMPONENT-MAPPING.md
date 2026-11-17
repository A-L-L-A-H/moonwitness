---
title: "Seven DNA Component Mapping"
version: "1.3.0"
status: "approved"
last_verified: "2026-11-17"
owner: "product-design"
---

# SEVEN DNA: COMPONENT MAPPING

## Purpose

Define how the same semantic task can be expressed through seven distinct visual languages while preserving one functional contract.

## Representative component matrix

| Component / task | IMPERIUM LUMEN | LUNAR CHRONICLES | ROCKSOUL | NEXUS PARADOX | RIOT ANARCHY | MYCELIUM | SIMPUL NUSANTARA |
|---|---|---|---|---|---|---|---|
| Primary action | Electric yellow offset banner (`PrimaryAction` / `DnaButton`) | Observatory command | Chapter-entry CTA | Instrument command | Stamped graphic command | Organic node action | Check service coverage |
| Content card | Graphic editorial illustrated card (`WorldTile` / `EditorialFeature`) | Celestial object / archive record | Film still / album sleeve | Floating module | Poster cutout | Membrane / cell | Service plan or coverage result |
| Navigation | Illustrated universe bar + Nine Worlds shelf (`SiteNavigation` / `WorldExplorer`) | Orbit / constellation | Chapters / tracks | Spatial selector | Poster strip / issue index | Branching network | Coverage, plans, account |
| Dialog | Ink & brass threshold chamber | Observation chamber | Film intertitle | Cockpit overlay | Comic spread | Membrane chamber | Coverage result sheet |
| Tabs | Illustrated realm selector wings | Coordinate layers | Story arcs | System modes | Graphic issue markers | Ecosystem branches | Plan comparison, when available |
| Progress | Journey stage | Quest constellation | Chapter sequence | Actual telemetry | Editorial sequence | Growth path | Real service-order state only |
| Data table | Inscribed information plane | Observation ledger | Event chronology | Telemetry grid | Printed data sheet | Text-first network alternative | Coverage and plan details |
| Loading | Light reveal (`MotionReveal`) | Chart / orbit focus | Film dissolve | Actual calibration / scan | Print reveal | Connection / growth | Text-led service lookup |
| Empty state | Open sanctuary frame | Undiscovered region | Quiet film frame | Idle instrument | Graphic starting point | Dormant ecosystem | No result, with a retry path |

## Implementation status

This document records actual code status in `packages/ui`:

| Matrix row | Implementing API in `@moonwitness/ui` | Status |
|---|---|---|
| Entry / hero composition | `IllustratedHero` (`@moonwitness/ui/imperium`) and `PageHero` | implemented |
| World explorer & tiles | `WorldExplorer`, `WorldTile`, `WorldAtlas` (`@moonwitness/ui/imperium`) | implemented |
| Site navigation bar | `SiteNavigation`, `EcosystemNavbar`, `SkipLink` | implemented |
| Editorial & story presentation | `StorySection`, `EditorialFeature`, `SectionHeading`, `IllustrationFrame`, `ResponsiveImage` | implemented |
| Motion reveal primitive | `MotionReveal` (`@moonwitness/ui/imperium`) | implemented |
| Imperium Lumen tokens & icons | `IMPERIUM_LUMEN_TOKENS`, `CrownEmblemIcon`, `OctagramMandalaIcon`, `CrescentStarIcon`, `SearchLensIcon`, `DiamondStarOrnament` | implemented |
| Original vector scenes | `WorldArtwork` (scalable 1600 × 900 vector scenes for all seven DNA IDs) | implemented |
| Route-specific DNA | `SkinRoot`, `SkinScope` (`[data-dna]` isolated token scope) | implemented |
| Kicker / world label | `Kicker` | implemented |
| Primary and secondary action | `PrimaryAction`, `SecondaryAction`, `DnaButton`, `Button`, `LinkButton`, `Link` | implemented |
| Icon glyph | `Icon` + `@moonwitness/ui/imperium-icons` | implemented |
| Content card | `Card` family, `DnaChamber`, `DnaPortalArch` | implemented |
| Destination card | `DestinationCard`, `DestinationGrid` (static mode when a route is not open) | implemented |
| Dialog or overlay | `Dialog` on native `<dialog>` | implemented |
| Data table | `Table` family | implemented |
| Form validation | `Form`, `FormField`, `Input`, `Textarea`, `Select` | implemented |
| Status message | `StatusMessage`, `DnaBadge` | implemented |
| Loading, empty, error, offline, permission | `StatePanel` plus `error.tsx` / `loading.tsx` / `not-found.tsx` per app | implemented |
| Tabs | none (app-level interactive wings compose buttons/tablist) | specification |
| Progress | none | specification |
| World recipes per block | `[data-dna='...']` in `imperium.css` / `dna-base.css` and `[data-moonframe-skin='...']` | implemented |
| Seven-world parity showcase | `SkinLaboratory` at headquarter `/skin-lab` | implemented |

The showcase carries all nine required comparisons: hero, primary and secondary action,
navigation, content card and data section, form validation, dialog, the four states,
narrow-screen adaptation, and keyboard plus reduced-motion behaviour.

## Functional invariants

Regardless of appearance, every component must preserve:

- the same semantic action and result;
- stable accessible name, role, and state;
- keyboard interaction and visible focus;
- predictable disabled, loading, success, and error behavior;
- validation and error announcement for forms;
- responsive layout and usable touch targets;
- reduced-motion behavior;
- content that remains available without decorative media.

## Anti-duplication rule

Do not create seven copies of business logic. Prefer a component API with a skin recipe or composition adapter. Where the world genuinely requires a different composition, implement a world-specific layout on top of shared semantic primitives.

## Showcase requirement

The Skin Laboratory must present the same content and user task in all seven worlds. The comparison must include:

1. entry / hero composition;
2. primary and secondary action;
3. navigation;
4. content card and data section;
5. form validation;
6. dialog or overlay;
7. loading, empty, error, and success states;
8. narrow-screen adaptation;
9. keyboard and reduced-motion behavior.

A visual comparison is valid only when the task, content, and states are equivalent across all seven variants.
