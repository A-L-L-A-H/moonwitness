# Final End-to-End QA — v6.2.1

## Automated core tests
- 13/13 Node tests passed.

## Local HTTP E2E
- 8/8 checks passed.
- `/api/health` → 200
- `/api/quran/search` → 200
- `/api/research/run?topic=isa` → 200
- `/api/scoring` → 200
- `/api/identity` → 200
- `/api/graph` → 200
- `/` → 200
- missing asset → 404

## One-command fallback
`PORT=8898 node scripts/start-all.mjs --no-install` started successfully.
The returned HTML contains the `START AUTOPILOT` control.

## React/Vite installation
The environment could not install UI dependencies because the npm registry was unreachable / packages were not cached. The bundled local fallback UI was therefore used for end-to-end validation. The React/Vite source remains included.

## Screenshot
`ui_preview_v6.png` is a rendered preview of the local UI layout, including Autopilot and Scoring controls.
