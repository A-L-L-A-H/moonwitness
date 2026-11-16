# Final Cross-check — v2.3.2

## Release identity

- Application release: **2.3.2**
- Research schema: **2.0**
- API major: **v2**
- Stack: **React + Vite + TypeScript + shadcn-style UI + Tailwind → Node local API → SQLite**
- Database role: derived local read-model; canonical research JSON remains source-of-truth.

## Research/data invariants

- 25 prophet profiles
- 25/25 positive RID
- 37 curated ASMA edges
- 74 total graph edges
- 399 provenance claims
- 200 mission/event nodes
- 8 genealogy relations
- 3 claim-specific conflict cases
- four allowed source IDs only: Qur’an, Taurat, Zabur, Injil
- Bible remains witness-container terminology, not source #5

## Automated verification

### Core and research engine

`npm run test:core` → **40/40 PASS**

Coverage includes:

- source/corpus guardrails;
- context graph;
- documentation registry;
- ASMA relation guardrails;
- automatic matcher coverage and collision safety;
- Bradley–Terry preference scaffold;
- audit/uncertainty boundaries;
- scoring math and non-probability guardrails;
- 200 event nodes and genealogy constraints;
- release/schema version separation.

### Runtime/application

`npm run test:offline` → **PASS**

- API TypeScript build: PASS
- SQLite schema + `STRICT` + JSON checks: PASS
- SQLite schema fingerprint: PASS
- SQLite seed fingerprint: PASS
- SQLite integrity check: PASS
- SQLite/API integration: PASS
- React/Vite source contract: PASS
- scoring audit: PASS
- handoff contract: PASS
- documentation integrity: PASS
- offline frontend TypeScript check: PASS

### HTTP sweep

A real local Node HTTP process was started and checked across the complete profile set:

- health release/schema/profile count: PASS
- 25/25 prophet detail endpoints: PASS
- 25/25 scoped provenance endpoints: PASS
- 25/25 scoped event endpoints: PASS
- 25/25 timeline endpoints: PASS
- 25/25 relation endpoints: PASS
- scoped events total: **200**
- scoped provenance total: **399**
- leaderboards/corpus/docs/validation/scoring/source/conflict/preference/global graph endpoints: PASS
- unknown prophet/path: 404 PASS
- unsupported POST: 405 PASS
- documentation endpoint includes User Guide, Issues, and Troubleshooting: PASS

## Documentation finalization

Active documentation now includes:

- User Guide
- Install & Runbook
- Troubleshooting
- Issues & Known Limitations
- Handoff Checklist
- Architecture + diagram + DB/SQLite/UI/E2E specs
- ADR governance
- Four-Corpus + Qur’an/Taurat/Zabur/Injil + Bible-Witness concept
- provenance/evidence/uncertainty/methodology
- scoring architecture/math/audit
- API docs
- TODO/Roadmap/Changelog/Final Status

A documentation-integrity test validates registry files and `DOCS-INDEX.md` internal links.

## Known external gate

The packaging environment does not have network-resolved npm dependencies. Therefore **fresh npm install + dependency-resolved Vite build + real Playwright Chromium E2E are not claimed as executed here**.

Recipient gate:

```bash
npm run setup:e2e
npm run verify
```

Return artifact:

`handoff/HANDOFF-RESULT.json`

## Scoring boundary

- Trait Evidence, Data Confidence, Context Evidence, and World Trait Salience remain separate.
- automatic matcher output is diagnostic, not independent evidence.
- Human Preference remains uncalibrated.
- Composite remains disabled while required empirical components are uncalibrated.
- no score measures prophetic worth or calibrated metaphysical probability.

## Final status

**FINAL_HANDOFF_READY_V2_3_2**
