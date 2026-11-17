# UI Architecture Status (packages/ui as single authority)

Status vocabulary: SPECIFIED (documented intent) · IMPLEMENTED (code exists) · VERIFIED (an executed check passed, evidence below) · RELEASED (shipped to production; none of the items below).

## Source map

| Concern | Source path | Export | Status |
| --- | --- | --- | --- |
| Imperium Lumen tokens (brand, semantic, accessibility, typography, layout, motion) | `packages/ui/src/skin/imperium-tokens.ts` | `@moonwitness/ui/tokens` | IMPLEMENTED, VERIFIED |
| Server-safe CSS variable map | `imperiumLumenCssVariables()` in the same file | `@moonwitness/ui/tokens` | IMPLEMENTED, VERIFIED |
| Seven master DNA registry | `packages/ui/src/skin/dna-worlds.tsx` (`MASTER_DNA_WORLDS`, `SkinRoot`, `SkinScope`) | `@moonwitness/ui/skin`, `/imperium` | IMPLEMENTED, VERIFIED |
| Imperium components | `packages/ui/src/skin/imperium.tsx` | `@moonwitness/ui/imperium` | IMPLEMENTED, VERIFIED |
| Scoped DNA CSS | `packages/ui/src/skins/dna-base.css`, `imperium.css` | `@moonwitness/ui/skins/*.css` | IMPLEMENTED, VERIFIED |
| Architecture gate | `packages/ui/src/dx/architecture.test.ts` (runs in `pnpm test`, hence in `gate:push`) | n/a | IMPLEMENTED, VERIFIED |
| Per-DNA token modules for 02–06, 09 | not extracted; palettes live inline in `dna-worlds.tsx` | n/a | SPECIFIED only |

## Enforced rules (architecture.test.ts)

1. Every selector in `skins/*.css` is scoped under `[data-dna]`.
2. `imperium.css` brand/celestial variables equal `imperium-tokens.ts`; `dnaWorldCssVariables` equals `imperiumLumenCssVariables`.
3. Exactly seven DNA identities with distinct shape languages and motion grammars.
4. Apps never declare `--dna-*` / `--brand-*`.
5. `apps/a-l-l-a-h` CSS has zero palette literals; `html/body/:root` carry no literal colors.
6. No imports that bypass public exports (`@moonwitness/ui/src/...`).
7. No new component re-declaration of names owned by `@moonwitness/ui` (known list below).
8. `packages/ui` imports only its declared leaf packages, never apps.
9. Ratchet ceilings for legacy palette literals (may only decrease).

## Remaining duplication (tracked, ratcheted)

- `apps/a-l-l-a-h` TSX: 1619 Tailwind arbitrary hex literals (legacy sacred-gold palette) across 28 components.
- `apps/rocksoul` CSS: 478 hex literals; `src/design-system/tokens.css` defines a parallel token set (~110 variables) not derived from the 03-rocksoul DNA.
- `apps/web` CSS: 2 hex literals.
- Duplicate components: `rocksoul::SkipLink`, `web::SectionHeading`, `web::Gauge`.
- `apps/memory/frontend` is a separate stack that does not consume `@moonwitness/ui` (61 hex literals, 38 variables).
- `dna-worlds.tsx` palettes for 02–06, 09 and their Tailwind class strings contain literals (not yet token-sourced).

## Verification evidence (executed 2026-11-17, local)

format, ui lint, ui typecheck, ui tests (13 files, 124 tests), `ui:contrast`, a-l-l-a-h typecheck/lint/tests (49), web tests (44), builds of a-l-l-a-h, web, rocksoul-dx: all exit 0.
Not executed: Playwright E2E (`@playwright/test` is not installed in the workspace, so `apps/a-l-l-a-h/e2e` is unrun and excluded from tsconfig); CI on the pushed commit.
