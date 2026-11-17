# MoonWitness Design Constitution

## North star

MoonWitness UI is a **cinematic observatory instrument**: ancient observatory × forensic evidence machine × celestial instrument × cinematic archive × modern interaction system.

It is not a generic dark SaaS dashboard and it is not a game HUD skin.

## Priority order

1. information integrity
2. visual hierarchy / fidelity
3. component reusability
4. accessibility
5. responsiveness
6. motion
7. decoration

## Signature rules

- one dominant instrument per viewport
- purposeful asymmetry and breathing zones
- data integrated into rails, apertures, lattices, spines and orreries
- generic cards/tables remain utility surfaces, never the identity
- semantic state colors must have meaning; avoid rainbow decoration
- main brand accent is themeable and must not be hard-coded in consumers
- raw brand colors belong in tokens, not application components
- every interactive primitive must expose focus/disabled/loading/error behavior where applicable
- reduced motion must remain usable

## Canonical MoonWitness primitives

Use signature components before reaching for a generic dashboard equivalent when the data semantics fit:

| Generic pattern | MoonWitness signature |
| --- | --- |
| KPI donut | `TruthAperture` / `MetricRail` |
| relation diagram | `CausalityLattice` |
| generic timeline cards | `TemporalOrrery` / `ChronologyTrack` |
| evidence card stack | `EvidenceSpine` / `WitnessThread` / `ObservationShard` |
| generic map card | `MapRift` |
| sidebar-only navigation | `MissionRail` + contextual command surfaces |
| search bar | `ArchiveGate` |
| source confidence progress | `ReliabilityPrism` |

## Causality guardrail

When displaying temporal/geographic relationships, preserve a strict separation between measurement and causal finding.

Canonical sentence:

> Temporal/geographic proximity does not establish causation.

Distance, ΔT and proximity scores are measurements/discovery aids. They are not causal verdicts.

## Product boundaries & monorepo ownership

1. **Design tokens (`packages/ui`):** `@moonwitness/ui` owns all semantic and brand tokens (`MASTER_DNA_WORLDS`, `IMPERIUM_LUMEN_TOKENS`, `DNATokens`, CSS variables). Applications must never duplicate authoritative palette, typography, spacing, or motion tokens.
2. **Themes and skins (`packages/ui`):** `@moonwitness/ui` owns `SkinRoot`, `SkinScope`, `useDnaWorld`, and scoped skin CSS (`packages/ui/src/skins/imperium.css`, `dna-base.css`).
3. **Reusable components (`packages/ui`):** `@moonwitness/ui` owns shared layout, navigation, illustration frames, hero, world explorer, and action primitives.
4. **Artwork and static assets (`packages/assets` & app public art):** `packages/assets` owns shared visual asset packs, fonts, and manifests; app-specific artwork serves app composition slots.
5. **Domain and world data (`packages/canon` & app registries):** `@moonwitness/canon` owns shared domain identifiers (`WorldIdentifier`) and canonical structures; each app owns its product experience, routes, state, and public registry copy.
6. **App independence (`apps/a-l-l-a-h` vs `apps/web`):** `apps/a-l-l-a-h` runs under `01-imperium-lumen` (Empire of the Light — The Illustrated Universe) while `apps/web` maintains its independent MoonWitness identity (`02-lunar-chronicles` / `05-riot-anarchy` / `06-mycelium`). Skin CSS is strictly scoped to `[data-dna="..."]` so neither leaks into global `body` or `:root`.
7. **Testing:** Run `pnpm --filter @moonwitness/ui test`, `pnpm ui:contrast`, application unit tests, `typecheck`, `lint`, and Playwright/headless visual verification across desktop, tablet, mobile, keyboard navigation, and reduced-motion modes.

A consumer must not duplicate a reusable primitive merely to change its accent color; use semantic themes/tokens instead.
