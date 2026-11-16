# CRAYON Task Ledger

This ledger is ordered by semantic dependency, not visual excitement. Historical post-v0.4 execution is indexed in issue #62; the next v0.9 → v1.0 wave is indexed in issue #121. Active development happens on `dev`; verification and release automation run on `main`.

## Released foundations

### P0 — Truth / epistemics ✅
- Observation / expectation / knowledge model.
- Prediction separated from observed outcome.
- Evidence-derived witness verification.
- Explainable reconciliation and temporal validity.
- Preconditions / stale-transition detection.
- Retry safety for ambiguous outcomes.
- Architecture guard against UI/platform leakage.

### P1 — Authority / possibility / execution ✅
- Independent observe / propose / intend / commit / execute / verify / override capabilities.
- Deterministic constraints and derived possibility availability.
- Explicit intend requirement.
- Human/agent authority falsification.
- Validated execution boundary and commitment binding.
- Deep-frozen one-shot permit, start-time revalidation, authentic ExecutionLease.

### v0.3 — First Living CRAYON ✅
- Explainable consequence/resistance.
- Semantic Snapshot + semantic diff.
- RIR: Field / Mark / Line / Region / Path / Anchor / Portal / Layer.
- Text renderer + React renderer + Lab.
- npm workspace packaging and fresh-tarball smoke.

### v0.4.0-alpha.1 — Cross-domain + Inspector ✅ code checkpoint
- Gravity / distance / depth / trace physics.
- `allah-crayon-inspector` package.
- Banking / File / Email / ERP / DevOps / AI universal-planner fixtures.
- 69/69 Node tests on final candidate.
- Production Lab build, runnable examples, package tarballs and fresh-install smoke.

## Current production checkpoint — v0.9.0-alpha.1

### Verified `main` evidence

Evidence source: `bb6e4a53159fec56cf918a37474560b84976ac14`.

- [x] `living-crayon = success`.
- [x] semantic/regression/falsification/security/compatibility gates passed for the verified source.
- [x] Lab production build completed.
- [x] accessibility browser smoke completed as part of the successful main workflow.
- [x] real Dark/Light screenshots committed by bot commit `0b62d1ee47c05b615276e3ea6d24fb3212231b02`.
- [x] semantic visual-matrix manifest records Banking/File/Email/ERP/Deploy/AI evidence with source SHA + screenshot hashes.

### Release transport follow-up
- [x] PR #159 merged to `main` at `0e79e421796da1c46016a6203dca462bef248c6a`.
- [x] npm publish moved from self-hosted to GitHub-hosted `ubuntu-latest`.
- [x] npm provenance is explicitly disabled while this GitHub source repository remains private; npm does not support provenance generation for private source repositories.
- [x] SBOM/checksum/supply-chain evidence remains enabled independently of provenance.
- [ ] latest `main` verification after PR #159 must complete successfully.
- [ ] corrected downstream npm publish must succeed.
- [ ] all eight `0.9.0-alpha.1` packages + `alpha` dist-tags verified from npmjs.org.
- [ ] fresh registry-only consumer install/import smoke succeeds.

## Deployment policy — Vercel

- [x] Cloudflare Pages retired; #123 closed not-planned.
- [x] Vercel is the canonical live target (#157).
- [x] `vercel.json` merged to `main` through PR #158.
- [x] deployed artifact is `dist-lab/` only.
- [x] production build embeds and verifies exact `VERCEL_GIT_COMMIT_SHA`.
- [x] Web performance budget runs before delivery.
- [x] immutable hashed-asset cache + response security headers configured.
- [x] `dev` explicitly disabled from Vercel deployment.
- [x] every non-`main` branch skipped by `ignoreCommand`.
- [x] Vercel account/team connection is available in-chat.
- [ ] create/import canonical Vercel project `allah-crayon-ui-engine` linked to private GitHub repo.
- [ ] first production deployment from `main` must record URL, deployment ID, exact SHA, timestamp and live HTTP smoke.
- [ ] #134 rollback evidence after a first known-good Vercel production deployment.

## v0.9 durable/runtime production implementation
- [x] TemporalStore + append-only journal + deterministic replay/restore.
- [x] external operation identity/idempotency + ambiguous retry blocking.
- [x] crash-recovery contract: restart never recreates an execution lease.
- [x] observation ingestion with explicit provenance/receivedAt/reliability rules.
- [x] injectable clock/identity provider boundary.
- [x] private adapter SDK + conformance + reference domain adapters.
- [x] versioned codecs/migration/resource-limit scaffolding.
- [x] compensation + async executor boundary.
- [x] runtime observability side-channel + redaction hooks.
- [x] renderer conformance kit + experimental Terminal/Static/Print renderers.
- [x] SafeRIRView degraded mode integrated into Lab.
- [x] accessibility browser smoke + visual matrix + Web bundle budget.
- [x] developer starter/cookbook/reason-code/API-entrypoint checks.
- [x] supply-chain evidence generation and acceptance scaffolding.

## Public npm release set — `0.9.0-alpha.1`

```text
allah-crayon-kernel
allah-crayon-physics
allah-crayon-snapshot
allah-crayon-rir
allah-crayon-inspector
allah-crayon-agent
allah-crayon-voice
allah-crayon-react
```

## Private experimental workspaces — not published

```text
allah-crayon-store
allah-crayon-adapter
allah-crayon-codec
allah-crayon-conformance
allah-crayon-runtime
allah-crayon-observability
allah-crayon-localization
allah-crayon-terminal
allah-crayon-static
allah-crayon-print
allah-crayon-lab-tools
allah-crayon-redaction
```

## Production blockers / final admission
- [ ] Vercel canonical project + first verified `main` production deployment.
- [ ] npm registry publication + registry-only consumer proof.
- [ ] durable git tag / GitHub Release evidence (#61).
- [ ] broader beta/manual accessibility evidence (#128/#117).
- [ ] compatibility matrix + API freeze/deprecation evidence (#115/#116/#118/#129).
- [ ] final canonical acceptance corpus (#119).
- [ ] final v1 kill-criteria review (#120).

## Release principle

Implementation may complete before external evidence. A green main build, real screenshot, npm package, or live deployment is never individually sufficient to claim production readiness. Production is admitted only when semantic safety, execution/durability, accessibility, compatibility, package integrity, registry evidence, and live deployment evidence agree. Unknown state is never written as success.
