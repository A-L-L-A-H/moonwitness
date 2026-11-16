# Issues & Known Limitations — v2.3.2

This document distinguishes **fixed defects**, **open engineering work**, **research limitations**, and **external verification gates**.

## Fixed in the v2.3 line

- SQLite runtime/schema drift: fixed by executing canonical `apps/api/schema.sql`.
- stale SQLite seed: fixed with source-data fingerprinting.
- stale SQLite schema: fixed with schema fingerprinting.
- scoped `/prophets/:id/events` returning zero for array-backed event data: fixed in v2.3.1; regression requires 8 events per profile.
- SPA missing-asset fallback returning HTML/200: fixed; missing asset requests return 404.
- API documentation/runtime drift: active docs synchronized to port 4310 and current routes.
- Windows POSIX-only scripts: replaced with Node-based cross-platform launch/reset helpers.
- permissive React shim being described as strict production typecheck: fixed; offline shim is separately labeled.
- ASMA Data Confidence cherry-picking the single strongest edge: fixed; curated relation quality is aggregated.
- RID etymology overclaim: native-name etymology can no longer inherit full Qur’anic certainty from name attestation alone.

## Open engineering items

These are tracked in `TODO.md` and do not invalidate the current read-only research explorer.

- pagination/filtering for large provenance/event sets;
- SQLite FTS-backed local text search;
- JSON/CSV research export;
- dependency lockfile after a network-resolved install;
- dependency/supply-chain audit after installation;
- possible framework/runtime modernization only after full browser E2E.

## External verification gate

The packaging environment could not resolve the npm registry. Therefore the following must be executed on a network-enabled recipient machine before claiming **FULL_BROWSER_E2E_VERIFIED**:

```bash
npm run setup:e2e
npm run verify
```

Expected return artifact:

`handoff/HANDOFF-RESULT.json`

## Research limitations

### Raw corpus ingestion
Exact full-text source editions/checksums for all four corpus families are not yet pinned and ingested end-to-end. Current provenance is curated/versioned research data, not a claim of exhaustive raw-corpus parsing.

### Human Preference
Human Preference remains uncalibrated because real pairwise respondent data has not been collected.

### Probability calibration
Research scores are not calibrated probabilities. Independent labeled benchmark data is required before Brier/log-loss/reliability calibration can be claimed.

### Historical identity and etymology
Several name roots, chronology points, locations, or identity crosswalks remain disputed/unknown. The engine intentionally records uncertainty instead of forcing symmetry.

### Bible witness boundary
`Bible` is a modern witness-container/library label in this project, not a fifth revealed source. Taurat, Zabur, and Injil remain separate source concepts with extant textual witnesses kept distinct.

## Operational limitations

- API v2 is read-only by design.
- SQLite is local and single-node; it is not a hosted multi-user database.
- GPT Hosted Companion is a preview/companion UI and does not run the persistent local Node + SQLite runtime.
- no authentication/authorization layer is required for the current localhost-only read-only API; do not expose it publicly without a separate security review.

## Severity policy

- **P0:** evidence integrity / data corruption / false source attribution.
- **P1:** wrong runtime behavior, scoring distortion, stale database, or misleading UI/API output.
- **P2:** usability, performance, documentation, export/search improvements.

Any newly discovered P0/P1 issue should block a new final release until fixed or explicitly documented as a release blocker.
