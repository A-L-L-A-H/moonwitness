# Changelog

## v2.3.2 — Final Documentation & Handoff Release

### Added
- Final User Guide covering install, UI, scoring interpretation, API, SQLite, and handoff.
- Issues & Known Limitations with fixed/open/external/research boundaries.
- Troubleshooting guide for install, API, SQLite, Vite, and Playwright.
- Final documentation registry/index and handoff checklist cross-check.

### Fixed
- Release manifest/version inconsistencies remaining from earlier v2.3 packaging.
- Stale handoff checklist references to v2.3.0.
- Active root cleanup: historical v2.0/v2.2 validation reports moved to archive.

### Unchanged
- Research schema remains 2.0.
- API major remains v2.
- Research scoring semantics and four-corpus policy are unchanged.

## v2.3.1 — Audit Hardening Release

### Fixed
- SQLite runtime now executes canonical `apps/api/schema.sql`; JSON validity constraints and indexes are real, not documentation-only.
- Derived SQLite database re-seeds when a SHA-256 fingerprint of source inputs changes.
- Root scripts no longer contain legacy recursion/ambiguous build paths.
- Node local API serves the built React SPA same-origin.
- React async views reset stale data, abort superseded requests, and expose errors.
- Frontend normal typecheck no longer uses a broad `any` React shim.
- Native-name-root RID evidence is capped below full Qur'anic evidence unless the etymology itself is independently supported.

### Added
- prophet-scoped provenance/events/relations/timeline API routes;
- scoring audit report;
- SQLite runtime audit docs;
- v2.3 UI testing truthfulness contract.

### Unchanged
- research schema `2.0`;
- four-corpus source policy;
- prophet-worth prohibition;
- Human Preference remains uncalibrated.

## v2.2.0 — Application Stack Release
- React/Vite/TypeScript + shadcn/ui/Tailwind frontend.
- Node local API and SQLite application runtime.

## v2.1.0 — Documentation & Structure Release
- Structured documentation tree, ADRs, TODO/roadmap and Bible-witness governance.

## 2.3.1 — Final handoff packaging

- Added one-command setup/start/doctor/verify flows.
- Added Windows and POSIX install/run/verify wrappers.
- Added production Playwright config targeting Node-served React SPA on port 4310.
- Added machine-readable `handoff/HANDOFF-RESULT.json` return artifact.
- Added Install Runbook, Handoff Checklist, and E2E Handoff architecture docs.
- Archived inactive v2.2 application docs/tests/reports from the active spec surface.
- Kept research schema at 2.0; this remains an application/release hardening change.
