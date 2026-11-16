# TODO — Open Research & Engineering Work

## v2.3.2 documentation status
- [x] User Guide finalized.
- [x] Issues & Known Limitations finalized.
- [x] Troubleshooting finalized.
- [x] Docs registry/index integrity test added.
- [x] Historical root reports moved to archive.

TODO items are not current evidence.

## P0 — Evidence integrity
- [ ] Pin exact Qur'an source edition + checksum for raw-text ingestion.
- [ ] Pin exact Taurat/Torah witness editions and licenses.
- [ ] Pin exact Zabur/Psalms witness editions with attribution metadata.
- [ ] Pin exact Injil/Gospel witness editions and language metadata.
- [ ] Add reproducible token/lemma/root pipeline from pinned corpora.

## P1 — Research calibration
- [ ] Collect real pairwise Human Preference observations.
- [ ] Publish sampling/bias protocol.
- [ ] Add Brier/log-loss/reliability reports only after labeled benchmark data exists.

## P1 — Historical uncertainty
- [ ] Expand alternative etymologies for disputed roots.
- [ ] Add chronology/location alternatives with claim-specific confidence.
- [ ] Add manuscript/transmission uncertainty per witness edition.

## P2 — Application/runtime
- [x] React + Vite + TypeScript frontend.
- [x] shadcn/ui + Tailwind design system.
- [x] Node local API.
- [x] SQLite active database and deterministic seed.
- [x] API integration tests.
- [x] UI TypeScript + feature contract tests.
- [x] Package Playwright production click-through E2E + automatic local webServer.
- [ ] Execute the packaged Playwright gate on the recipient/network-enabled machine and return `handoff/HANDOFF-RESULT.json`.
- [ ] Add pagination/filtering for large provenance/event result sets.
- [ ] Add full-text local search indexes in SQLite.
- [ ] Export research bundle as JSON/CSV without changing source-of-truth.

## Explicitly out of scope without evidence
- Ranking prophetic worth.
- Ancient nationality inferred from modern country crosswalk.
- Treating semantic candidates as revelation.
- Treating the modern Bible compilation as a fifth revealed source.

## P1 — Dependency/runtime modernization after real E2E gate
- [ ] Run dependency-resolved React/Vite build and Playwright click-through in networked CI before changing major frontend versions.
- [ ] Evaluate React 19.2, Vite 8.1, and Tailwind CSS 4.3 migration as one isolated UI-infrastructure change; do not mix it with research-score changes.
- [ ] Re-run `shadcn` CLI against `apps/web` and diff generated components/config against current component-source implementation.
- [ ] Prefer Node 24.15+ (or newer verified LTS) for `node:sqlite` release-candidate stability; retain Node 22.13 compatibility only while explicitly tested.
- [ ] Generate and commit npm lockfile in networked CI after dependency-resolved install succeeds; exact manifest pins reduce drift but do not replace integrity hashes.
- [ ] Run `npm audit`/equivalent supply-chain review after dependencies are installed; current offline audit cannot inspect transitive packages.
