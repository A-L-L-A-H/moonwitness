# Install & Runbook — v2.3.2

## Supported local runtime

- Node.js: **>=22.13**; repository was offline-tested on **22.16.0**.
- npm: **>=10**.
- OS: Windows, macOS, Linux.
- App URL: `http://127.0.0.1:4310`.
- Database: `data/sqlite/prophet-research-v2.3.sqlite`.

## Fresh install

### Full test-ready install

```bash
npm run setup:e2e
```

This performs:

1. `npm install --no-fund`
2. core TypeScript build
3. Node API build
4. real React/Vite frontend build
5. SQLite synchronization from canonical source data
6. Playwright Chromium installation
7. final setup artifact checks

### Lighter install without browser download

```bash
npm run setup
```

## Run production-local app

```bash
npm start
```

The Node server serves both:

- `/api/v2/*`
- the built React SPA

from the same origin on port 4310.

## Development mode

```bash
npm run dev
```

- API: `127.0.0.1:4310`
- Vite: `127.0.0.1:5173`
- Vite proxies `/api` to the local API.

## Verification

Full dependency + browser gate:

```bash
npm run verify
```

Core/API/SQLite handoff gate without browser:

```bash
npm run verify:handoff
```

Environment inspection:

```bash
npm run doctor
```

## Database reset

```bash
npm run db:reset
```

SQLite is a **derived read-model**. Canonical research JSON remains the research source-of-truth. Seed and SQL-schema SHA-256 fingerprints force automatic resynchronization when source inputs change.

## Return artifact

After verification, return:

- `handoff/HANDOFF-RESULT.json`
- failing `playwright-report/` when applicable
- the modified repository ZIP when code/data was changed
