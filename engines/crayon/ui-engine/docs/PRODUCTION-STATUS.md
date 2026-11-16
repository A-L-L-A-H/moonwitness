# CRAYON Production Evidence Dashboard

Updated for `v0.9.0-alpha.1` after verified main visual evidence and deployment-target migration to Vercel.

This dashboard separates states that must never be conflated:

```text
IMPLEMENTED
   ≠
MERGED TO MAIN
   ≠
VERIFIED ON MAIN
   ≠
EXTERNALLY PROVEN (registry / live deployment / release artifact)
```

## Current evidence

| Boundary | State | Evidence / blocker |
| --- | --- | --- |
| v0.9 code candidate | **merged to main** | PR #122 → merge `0ba3656b8d5675127f5ad92548fcb9a60a9531b3` |
| Main verification | **proven success** | source `bb6e4a53159fec56cf918a37474560b84976ac14`; commit status `living-crayon=success` |
| Real Lab screenshots | **proven** | bot commit `0b62d1ee47c05b615276e3ea6d24fb3212231b02`; executable images + semantic visual-matrix manifest under `docs/images/` |
| Dark/Light visual proof | **proven** | Banking Dark/Light plus Deploy Dark and Banking mobile Light from the same verified source |
| npm `0.9.0-alpha.1` publish | **failed / unresolved** | verified source records `npm-publish=failure`; do not claim registry publication until successful re-run + registry smoke |
| npm registry smoke/provenance | **pending** | depends on successful publish chain |
| Cloudflare Pages | **retired** | never canonical; issue #123 closed not-planned after switch to Vercel |
| Vercel project | **pending external setup** | connected team `bjo163's projects` exists but currently contains zero projects |
| Vercel production deploy | **pending** | main-only config merged through PR #158; issue #157 tracks first live deployment evidence |
| Live URL | **not claimed** | no Vercel project/deployment exists yet |
| Durable tag / GitHub Release | **pending** | record only after publication/release evidence is coherent |

## Verified visual evidence

The screenshot refresh commit records a semantic manifest tied to source SHA `bb6e4a53159fec56cf918a37474560b84976ac14` across Banking, File, Email, ERP, Deploy, and AI. Screenshot hashes and semantic path/epistemic/witness metadata are recorded together so a visual artifact cannot silently substitute for a different semantic state.

## Vercel deployment policy

Vercel is the active live target. `vercel.json` is in `main` and enforces:

- `dist-lab/` static output only;
- exact source-SHA metadata during production build;
- provider-neutral deploy-artifact verification;
- Web performance budget before delivery;
- immutable caching for hashed assets + security response headers;
- `dev` disabled explicitly;
- every branch other than `main` skipped via `ignoreCommand`.

See `docs/VERCEL-DEPLOYMENT.md` and #157.

## v0.9 implementation state

Implementation exists for durable journal/replay/idempotency, observation ingestion, deterministic providers, canonical codecs/migrations, crash recovery, async execution, compensation, adapter/connectors, renderer conformance and additional renderers, Lab engineering tools, accessibility/visual/performance gates, redaction/resource limits, compatibility fixtures, supply-chain evidence generation, and public-package smoke/adoption helpers.

Experimental workspaces remain private and are not production API simply because their implementation exists.

## Remaining blockers before stronger release/production claims

1. diagnose and fix the actual npm publish failure;
2. prove all eight `0.9.0-alpha.1` packages + `alpha` dist-tag in npmjs.org;
3. perform fresh registry-only consumer smoke + provenance evidence;
4. create/import the Vercel project from the private repository;
5. prove first `main` production deployment with URL/deployment ID/SHA/timestamp/HTTP smoke;
6. record rollback evidence;
7. complete broader beta/manual accessibility evidence;
8. run final v1 kill-criteria review.

## Release rule

Missing external evidence remains unknown/pending. A green main build, a real screenshot, an npm package, or a live URL is never enough by itself to declare CRAYON production-ready.
