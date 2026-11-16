# Final Cross-check — v2.2.0

## Active stack

**React + Vite + TypeScript + shadcn/ui + Tailwind → Node.js local API → SQLite**

## Verified

- 38/38 research/scoring regression tests PASS.
- Leaderboards and relation-score JSON are unchanged byte-for-byte from v2.1.
- SQLite database created and queried successfully with Node 22 `node:sqlite`.
- API health reports release 2.2.0, database SQLite, and 25 prophet profiles.
- All local API view routes smoke-tested successfully.
- React UI source exposes Profile, Provenance, Timeline & Relations, Leaderboards, Four Corpus, Architecture & Docs.
- Frontend strict TypeScript source typecheck PASS.
- shadcn/ui repository convention present via `components.json` + `components/ui/*`.
- Tailwind configuration and theme variables present.
- Research schema stays 2.0; scoring semantics did not change.

## Not claimed

- A real dependency-resolved Vite production build was not executed in this container because npm registry DNS is unavailable.
- Real browser click-through Playwright execution was not performed here; the E2E spec is included for networked CI.
