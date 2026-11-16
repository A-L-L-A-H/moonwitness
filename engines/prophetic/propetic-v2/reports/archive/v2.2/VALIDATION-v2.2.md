# Validation — v2.2.0

## Research engine

- Core regression tests: **38/38 PASS**
- Scoring/leaderboard files vs v2.1: **byte-identical**
- Dataset schema: **2.0**
- Release: **2.2.0**

## Application stack

- Backend TypeScript compile: **PASS**
- SQLite seed/query: **PASS** — 25 profiles
- Local HTTP API integration: **PASS**
- Frontend strict TypeScript source typecheck: **PASS**
- React/Vite/shadcn/Tailwind feature contract: **PASS**
- Python files: **0**

## Browser E2E boundary

Playwright click-through is specified in `e2e/ui.spec.ts` but not executed in this container because the npm registry cannot be resolved and React/Vite dependencies cannot be installed here. This release does not mislabel a static contract test as browser E2E.
