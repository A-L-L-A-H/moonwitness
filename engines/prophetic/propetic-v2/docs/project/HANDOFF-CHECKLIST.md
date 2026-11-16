# Handoff Checklist — v2.3.2

## Before handing off

- [x] Release version = `2.3.2`
- [x] Research schema remains `2.0`
- [x] API major remains `v2`
- [x] Frontend = React + Vite + TypeScript + shadcn-style source components + Tailwind
- [x] Backend = Node.js local API
- [x] Database = SQLite derived read-model
- [x] Canonical SQL schema executed by runtime
- [x] DB schema fingerprint implemented
- [x] seed fingerprint implemented
- [x] production Node server serves built SPA
- [x] scoped prophet API endpoints implemented
- [x] scoped-events hotfix regression included
- [x] Playwright production E2E config included
- [x] Windows install/run/verify wrappers included
- [x] macOS/Linux install/run/verify wrappers included
- [x] machine-readable handoff result implemented
- [x] User Guide included
- [x] Issues & Known Limitations included
- [x] Troubleshooting included
- [x] Architecture + Four-Corpus + Bible-Witness docs indexed
- [x] TODO/Roadmap/Changelog active and versioned
- [x] scoring audit separates matcher diagnostics from textual evidence
- [x] Human Preference remains uncalibrated

## Recipient test

1. Run `INSTALL-WINDOWS.cmd` or `./INSTALL.sh`.
2. Run `RUN-WINDOWS.cmd` or `./RUN.sh`.
3. Confirm UI loads on `http://127.0.0.1:4310`.
4. Click all six primary tabs.
5. Search/select Mūsā and at least one other profile.
6. Confirm `/api/v2/health` returns release `2.3.2`, schema `2.0`, and 25 profiles.
7. Run `VERIFY-WINDOWS.cmd` or `./VERIFY.sh`.
8. Return `handoff/HANDOFF-RESULT.json`.
9. If E2E fails, also return `playwright-report/` or terminal output.

## PASS criteria

- core/API/SQLite = PASS
- React typecheck = PASS
- Vite production build = PASS
- browser E2E = PASS
- doctor = PASS
- API health = release `2.3.2`, 25 profiles
- scoped events = 8 per profile / 200 total
- scoped provenance total = 399
- unsupported method returns 405
- missing API/resource returns 404

## Research boundaries that must remain unchanged

- score ≠ prophetic worth;
- Human Preference remains uncalibrated without observations;
- modern geography ≠ ancient nationality;
- Bible witness container ≠ fifth revealed source;
- supplementary evidence ≠ Qur’anic evidence.
