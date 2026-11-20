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

- `apps/rocksoul/src`: **0 palette hex literals** in the current architecture-gate scope for CSS and TSX. The previous count of 456 is a stale historical snapshot and is not the current measured state.
- `apps/memory/frontend`: separate standalone dashboard that does not consume `@moonwitness/ui`; it remains outside the `apps/*/src` scanner entries described below.

### Measurement contract

The authoritative measurement is `packages/ui/src/dx/architecture.test.ts`, not a manually copied historical count:

- `appSources("rocksoul", [".css"])` scans CSS recursively under `apps/rocksoul/src`; CSS comments are stripped before counting hex literals.
- `appSources("rocksoul", [".tsx"])` scans TSX recursively under the same `src` root, excludes `.test.tsx` files, strips JS comments, and counts six-digit palette literals.
- `STRICT_TOKEN_APPS = ["web", "rocksoul", "edge"]` requires zero CSS and TSX palette literals for ROCKSOUL.
- `LEGACY_HEX_CEILINGS.rocksoul = 0` independently keeps the CSS ratchet at zero.
- Run with `pnpm --filter @moonwitness/ui test`; this executes the architecture test as part of the package Vitest suite.

### Current CI evidence (2026-11-20)

The architecture gate passed on PR #680 head `61601470926211e208729752ecd7affe38ae1971` in [GitHub Actions run 44630740449](https://github.com/A-L-L-A-H/moonwitness/actions/runs/44630740449), job **Verify (lint, typecheck, test, build)**. The log records `src/dx/architecture.test.ts` as 33/33 passing and `packages/ui` as 25 test files / 208 tests passing. This is CI evidence for that commit, not a claim that the documentation PR has been merged or released.

## Verification evidence (historical local run, 2026-11-17)

format, ui lint, ui typecheck, ui tests, `ui:contrast`, a-l-l-a-h typecheck/lint/tests, web tests, builds of a-l-l-a-h, web, rocksoul-dx, and `gate:push` (16/16 checks): all exit 0.
Not executed: Playwright E2E (`@playwright/test` is not installed in the workspace, so `apps/a-l-l-a-h/e2e` is unrun and excluded from tsconfig).


---

## Wave 0 Document Classification (`MW-0006`)

- **Classification:** Partially Superseded Historical UI Snapshot (`dev` @ `acdc72a`).
- **Superseded Parts:** Any implication that individual Nine Worlds require separate app workspaces outside `apps/web`.
- **Current Authority:** [ADR-006: Three-App Topology & Trust Zones](../architecture/adr-006-three-app-topology-and-trust-zones.md) (`apps/web`, `apps/api`, `apps/rocksoul` only).
