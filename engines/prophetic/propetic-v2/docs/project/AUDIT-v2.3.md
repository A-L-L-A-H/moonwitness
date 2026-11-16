# Audit & Hardening v2.3

Release **2.3.2** is a non-breaking application hardening release over research schema **2.0**.

## Audit scope

- E2E readiness and UI state transitions
- React/Vite TypeScript configuration
- Node local API routes and lifecycle
- SQLite schema, indexes, seed freshness, and integrity
- research engine regression suite
- ASMA matcher quality diagnostics
- scoring mathematics and non-probability guardrails
- release/version/documentation consistency

## Confirmed issues from v2.2

### Fixed — P0/P1

1. **Runtime SQLite schema drift** — runtime previously created tables independently from `schema.sql`, so JSON checks and indexes in the file were not guaranteed in the real database. v2.3 executes the canonical SQL schema and rebuilds the derived read-model when its database schema version changes.
2. **Stale SQLite seed** — v2.2 only seeded an empty database. v2.3 fingerprints all seed inputs with SHA-256 and re-seeds whenever source data, registries, reports, release version, or row count changes.
3. **Fragmented release scripts** — root scripts now explicitly separate core, API, web, integration, offline, E2E, and verification paths. There is no recursive `legacy:test` path.
4. **Production UI/API split** — the Node local API now serves `apps/web/dist` as the production SPA, keeping `/api/v2/*` same-origin.
5. **Misleading React typecheck** — the permissive React shim was removed from normal frontend compilation. It is isolated under `types/` and only used by an explicitly named offline typecheck.
6. **Stale UI data/error states** — async view data resets when dependencies change, requests are abortable, and all primary views expose loading/error states.
7. **Oversized global UI fetches** — prophet-scoped provenance, events, relations, and timeline endpoints were added.
8. **CORS/local host brittleness** — both `localhost:5173` and `127.0.0.1:5173` are accepted for development; production is same-origin.
9. **RID confidence overclaim** — a Qur'anic reference attached to a `native_name_root` no longer makes the historical etymology score as fully Qur'an-proven.
10. **ASMA profile cherry-pick** — Data Confidence now averages all curated ASMA relation scores instead of using only the strongest relation or an automatic-only candidate.
11. **Windows portability** — POSIX-only environment-variable and `rm -f` scripts were replaced by cross-platform Node scripts.
12. **SPA asset fallback** — missing file assets now return 404 instead of incorrectly receiving `index.html` with HTTP 200.
13. **Leaderboard field mismatch** — React now reads `context_score` for context leaderboard rows and visibly exposes Human Preference/Composite disabled states.
14. **API documentation drift** — active docs were synchronized to port 4310/runtime routes and source-edition/conflict/preference/scoring endpoints were exposed.

## Verified healthy subsystems

- core research-engine regression suite
- four-corpus source guardrails
- ASMA relation identity guardrail
- conflict isolation
- evidence-score non-probability boundary
- SQLite/API basic integration

## Environment-limited item

The current execution environment does not provide installable npm dependencies from the registry. Therefore the **real dependency-resolved Vite build and Playwright browser click-through are not claimed as executed** in this environment. The normal TypeScript config now requires real React types; `tsconfig.offline.json` is a separately labeled source-only fallback.

## Matcher diagnostic boundary

Automatic matching is a candidate generator. Agreement against the curated relation graph is reported as a diagnostic, not treated as a gold-standard accuracy metric and never treated as independent textual evidence.
