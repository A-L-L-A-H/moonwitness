# UI Testing v2.2

The v2.2 UI exposes six primary interactive views:

1. Profile
2. Provenance
3. Timeline & Relations
4. Leaderboards
5. Four Corpus
6. Architecture & Docs

## Automated tests in this release

- strict TypeScript source typecheck
- React/Vite/shadcn/Tailwind contract test
- SQLite integration test
- local HTTP API route smoke test
- legacy research/scoring regression suite

## Browser E2E

A Playwright-style E2E specification is provided in `e2e/ui.spec.ts`. It is intended for a dependency-enabled CI/runtime. The current build environment cannot resolve the npm registry, therefore dependency-resolved Vite execution and browser automation are not falsely reported as executed here.
