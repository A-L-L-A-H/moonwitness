# UI Architecture Status (packages/ui as single authority)

Status vocabulary: SPECIFIED (documented intent) · IMPLEMENTED (code exists) · VERIFIED (an executed check passed, evidence below) · RELEASED (shipped to production; none of the items below).

## Source map

| Concern | Source path | Export | Status |
| --- | --- | --- | --- |
| Imperium Lumen tokens (brand, semantic, accessibility, typography, layout, motion) | `packages/ui/src/skin/imperium-tokens.ts` | `@moonwitness/ui/tokens` | IMPLEMENTED, VERIFIED |
| All 7 Master DNA palettes (`MASTER_DNA_PALETTES`) | `packages/ui/src/skin/imperium-tokens.ts` | `@moonwitness/ui/tokens` | IMPLEMENTED, VERIFIED |
| Server-safe CSS variable map | `imperiumLumenCssVariables()` in `imperium-tokens.ts` | `@moonwitness/ui/tokens` | IMPLEMENTED, VERIFIED |
| Seven master DNA registry (`MASTER_DNA_WORLDS`, `SkinRoot`, `SkinScope`) | `packages/ui/src/skin/dna-worlds.tsx` | `@moonwitness/ui/skin`, `/imperium` | IMPLEMENTED, VERIFIED |
| Imperium components | `packages/ui/src/skin/imperium.tsx` | `@moonwitness/ui/imperium` | IMPLEMENTED, VERIFIED |
| Scoped DNA CSS | `packages/ui/src/skins/dna-base.css`, `imperium.css` | `@moonwitness/ui/skins/*.css` | IMPLEMENTED, VERIFIED |
| Architecture gate | `packages/ui/src/dx/architecture.test.ts` (runs in `pnpm test`, hence in `gate:push`) | n/a | IMPLEMENTED, VERIFIED |

## Enforced rules (architecture.test.ts)

1. Every selector in `skins/*.css` is scoped under `[data-dna]`.
2. `imperium.css` brand/celestial variables equal `imperium-tokens.ts`; `dnaWorldCssVariables` equals `imperiumLumenCssVariables`.
3. Exactly seven DNA identities with distinct shape languages, motion grammars, and palettes sourced from `MASTER_DNA_PALETTES` (`dna-worlds.tsx` has zero hex literals).
4. Apps never declare `--dna-*` / `--brand-*`.
5. `apps/a-l-l-a-h` CSS and TSX have zero palette hex literals; `apps/web` CSS has zero palette hex literals; `html/body/:root` carry no literal colors.
6. No imports bypass public exports (`@moonwitness/ui/src/...`).
7. Zero component re-declarations of names owned by `@moonwitness/ui` across all apps (`KNOWN_COMPONENT_DUPLICATES = []`).
8. `packages/ui` imports only its declared leaf packages, never apps.
9. Ratchet ceiling for remaining legacy CSS palette literals in `apps/rocksoul` (may only decrease).

## Remaining duplication (tracked, ratcheted)

- `apps/rocksoul` CSS palette literals: **0 under the current architecture scanner** (reviewed 2026-11-20 against `dev` commit `645bd36ea580cb1feee78c2916451dac9715cc11`). The earlier count of 456 is a historical snapshot and is no longer current.
- `apps/memory/frontend`: separate standalone dashboard that does not consume `@moonwitness/ui`.

### Measurement contract

The current count is not a repository-wide count of every hexadecimal string. It is produced by `packages/ui/src/dx/architecture.test.ts`:

- The scanner walks `apps/rocksoul/src` for CSS files, excluding the directories in `IGNORED_DIRS` and test files.
- It removes CSS comments, then counts 3- or 6-digit hex color literals with `HEX_LITERAL`.
- `rocksoul` is also in `STRICT_TOKEN_APPS`, so CSS and TSX palette literals must be zero; `LEGACY_HEX_CEILINGS.rocksoul` is independently set to zero.
- Re-run with `pnpm --filter @moonwitness/ui test -- src/dx/architecture.test.ts` (or as part of the workspace `pnpm test` / `pnpm gate:local`). Do not compare the old 456 figure to a differently scoped scan.

### Other tracked duplication

- `apps/memory/frontend` remains a separate standalone dashboard and does not consume `@moonwitness/ui`; it is not included in the `apps/rocksoul` palette-literal count.

## Verification evidence

The 2026-11-17 local verification record below is historical evidence for that checkout; it is not a claim that those commands were rerun on the 2026-11-20 `dev` snapshot.

format, ui lint, ui typecheck, ui tests, `ui:contrast`, a-l-l-a-h typecheck/lint/tests, web tests, builds of a-l-l-a-h, web, rocksoul-dx, and `gate:push` (16/16 checks): all exit 0.
Not executed: Playwright E2E (`@playwright/test` is not installed in the workspace, so `apps/a-l-l-a-h/e2e` is unrun and excluded from tsconfig).


---

## Wave 0 Document Classification (`MW-0006`)

- **Classification:** Partially Superseded Historical UI Snapshot (`dev` @ `acdc72a`).
- **Superseded Parts:** Any implication that individual Nine Worlds require separate app workspaces outside `apps/web`.
- **Current Authority:** [ADR-006: Three-App Topology & Trust Zones](../architecture/adr-006-three-app-topology-and-trust-zones.md) (`apps/web`, `apps/api`, `apps/rocksoul` only).
