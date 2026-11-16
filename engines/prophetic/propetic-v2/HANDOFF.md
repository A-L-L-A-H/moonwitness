# Prophet Research Engine v2.3.2 — Final Handoff

This repository is packaged for local handoff testing.

## Windows — easiest path

1. Install **Node.js 22.16+** (npm 10+). Node 24 LTS is also acceptable after local verification.
2. Extract the ZIP to a normal writable folder.
3. Double-click **`INSTALL-WINDOWS.cmd`**.
   - installs npm workspaces
   - builds core + API + React/Vite UI
   - synchronizes SQLite
   - installs Playwright Chromium for browser E2E
4. Double-click **`RUN-WINDOWS.cmd`**.
5. Open **http://127.0.0.1:4310** if it does not open automatically.
6. Double-click **`VERIFY-WINDOWS.cmd`**.
7. Send back **`handoff/HANDOFF-RESULT.json`**. If E2E fails, also send `playwright-report/` or a screenshot/terminal log.

## macOS / Linux

```bash
./INSTALL.sh
./RUN.sh
# in another terminal
./VERIFY.sh
```

## npm equivalents

```bash
npm run setup:e2e   # install + build + SQLite + Chromium
npm start           # production Node API + built React UI
npm run verify      # full core/API/SQLite/React/Vite/Playwright gate
```

Faster non-browser verification:

```bash
npm run verify:handoff
```

## Expected full-gate result

`handoff/HANDOFF-RESULT.json` should show:

```json
{
  "release": "2.3.2",
  "research_schema": "2.0",
  "gates": {
    "mode": "FULL_DEPENDENCY_BROWSER_E2E",
    "core_api_sqlite": "PASS",
    "react_typecheck": "PASS",
    "vite_build": "PASS",
    "browser_e2e": "PASS",
    "doctor": "PASS"
  }
}
```

## Important research boundary

Scores are evidence/research indices, not rankings of prophetic worth. Human Preference remains uncalibrated until real external observations exist.
