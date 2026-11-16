# Troubleshooting — v2.3.2

## `npm install` fails

Check:

```bash
node --version
npm --version
npm ping
```

Requirements: Node >=22.13, npm >=10. If DNS/proxy blocks npm, resolve network access first.

## Port 4310 already in use

Stop the process using port 4310, then rerun:

```bash
npm start
```

## UI opens but API data fails

Check:

`http://127.0.0.1:4310/api/v2/health`

Then run:

```bash
npm run doctor
```

## SQLite looks stale

Run:

```bash
npm run db:reset
```

The application will rebuild the derived SQLite model from canonical versioned inputs.

## Vite dev mode cannot reach API

Run the root development command:

```bash
npm run dev
```

Vite should run on 5173 and proxy `/api` to 4310.

## Playwright E2E fails

First ensure Chromium is installed:

```bash
npm run e2e:install
```

Then:

```bash
npm run e2e
```

Keep `playwright-report/` for debugging.

## `HANDOFF-RESULT.json` shows browser gate unavailable

That means dependencies/browser were not available when `verify:handoff` ran. Use:

```bash
npm run setup:e2e
npm run verify
```

## Unknown or disputed research value

Do not “fix” it by guessing. Check provenance, uncertainty, alternative hypothesis, source policy, and TODO/research docs first.
