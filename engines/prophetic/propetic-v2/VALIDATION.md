# Validation — v2.3.2 Final Documentation & Handoff Release

## Result

**PASS — offline/core/API/SQLite/docs/source-contract gates**

## Verified

- release: `2.3.2`
- research schema: `2.0`
- API major: `v2`
- core tests: `40/40 PASS`
- API build: PASS
- SQLite integrity/schema/seed fingerprints: PASS
- SQLite/API integration: PASS
- React/Vite source contract: PASS
- scoring audit: PASS
- handoff contract: PASS
- documentation integrity: PASS
- offline frontend TypeScript: PASS
- `verify:handoff`: PASS
- real HTTP sweep across 25 profiles: PASS
- scoped events: `200/200`
- scoped provenance: `399/399`
- active docs registry: `51` documents

## Environment-limited gate

Fresh dependency-resolved React/Vite build and Playwright browser E2E require npm registry access and are packaged for recipient execution:

```bash
npm run setup:e2e
npm run verify
```

The release must not be described as `FULL_BROWSER_E2E_VERIFIED` until that returned gate passes.

## Required return file

`handoff/HANDOFF-RESULT.json`
