# Final Cross-check — v2.3.0 Handoff

## Release identity

- Application release: **2.3.0**
- Research/data schema: **2.0**
- API major: **v2**
- Active docs status: **FINAL_HANDOFF_READY_V2_3**

## Research graph counts

- Prophet profiles: **25**
- Positive RID: **25/25**
- Total graph edges: **74**
- Curated ASMA relation edges: **37**
- Provenance claims: **399**
- Event nodes: **200**
- Genealogy relations: **8**
- Claim-specific conflict cases: **3**
- Active registered docs: **48**

## Verification executed in packaging environment

- Core TypeScript regression tests: **40/40 PASS**
- SQLite/API integration gate: **PASS**
- React/Vite source contract gate: **PASS**
- Scoring audit gate: **PASS**
- Handoff packaging contract: **PASS**
- Offline frontend TypeScript source check: **PASS**
- SQLite integrity check: **PASS**
- SQLite schema/seed fingerprint tests: **PASS**
- API scoped-route + static-server contract: **PASS**
- Offline doctor: **PASS with 2 expected warnings** (`node_modules` and built React assets unavailable in packaging environment)

## Environment limitation

The packaging environment cannot resolve `registry.npmjs.org` (`EAI_AGAIN`). Therefore it cannot honestly execute a fresh `npm install`, dependency-resolved Vite build, or real Playwright browser run.

Those gates are packaged for the recipient machine:

```bash
npm run setup:e2e
npm run verify
```

The full gate writes `handoff/HANDOFF-RESULT.json` for return audit.

## Scoring cross-check

- Trait Evidence top rank: **tie — Ibrāhīm, Muḥammad, Nūḥ, Yaḥyā = 90 / Q4**
- Data Confidence top: **Nūḥ = 99.58**
- World Trait Salience top: **Dāwūd and Yūsuf = 36.57 tie**
- Context Evidence top: **Muḥammad = 100**
- Human Preference: **UNCALIBRATED**
- Composite: **DISABLED** until preference calibration

Scoring indices are not probabilities and never represent prophetic worth, holiness, or divine rank.

## Matcher diagnostic

Trait-target internal top-1 agreement: **14/17 = 82.35%**. This is an internal diagnostic against curated trait-compatible edges, not independent scientific accuracy.

## Handoff UX

- Windows: `INSTALL-WINDOWS.cmd` → `RUN-WINDOWS.cmd` → `VERIFY-WINDOWS.cmd`
- macOS/Linux: `./INSTALL.sh` → `./RUN.sh` → `./VERIFY.sh`
- Production URL: `http://127.0.0.1:4310`
- Return artifact: `handoff/HANDOFF-RESULT.json`
