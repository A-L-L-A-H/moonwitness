# Changelog

All notable CRAYON engineering checkpoints are documented here.

CRAYON is pre-release software. A release entry records implemented scope; CI, registry, provenance, screenshot, live-deployment, or production-readiness success is never implied without separate evidence.

## [Unreleased]

No new feature family is open during the current cleanup wave. Remaining work is verification, evidence, release/deployment completion, and beta/v1 admission review.

## [0.9.0-alpha.1] — 2026-08-25

### Release meaning

**Durable Runtime + Production Hardening.**

This checkpoint turns the post-v0.8 implementation into a production-shaped engine candidate while keeping new durability/integration/tooling APIs private and experimental until beta review.

### Added — durable runtime
- renderer-independent TemporalStore reference boundary;
- append-only temporal journal and deterministic replay/restore;
- external operation identity/idempotency semantics;
- explicit observation ingestion provenance/reliability/freshness policy;
- canonical Snapshot/RIR envelope codecs + resource limits + explicit migration registry;
- crash recovery that never reconstructs an execution lease;
- async executor that treats transport completion as semantic outcome `unknown`;
- compensation as a new corrective possibility/transition rather than history rewrite;
- tamper-evident journal integrity experiment with no authenticity overclaim.

### Added — integration
- private Domain Adapter SDK + conformance kit;
- six reference domain adapters: Banking, Files, Email, ERP, DevOps, AI;
- transport-neutral observation connector contract;
- normalized reason-code catalog + automated drift check.

### Added — renderer maturity
- platform-neutral required-claim conformance kit;
- Terminal, script-free Static HTML, and Print experimental renderers;
- localization + RTL boundary preserving raw semantic identity;
- reduced-motion, high-contrast and forced-colors behavior;
- public `allah-crayon-react/safe` degraded-mode entrypoint that reports SYSTEM LIMITATION instead of fabricating domain outcome.

### Added — Lab / DX
- declarative scenario tools;
- temporal-frame replay projection;
- semantic RIR diff;
- evidence/provenance graph;
- diagnostic pipeline profiler;
- URL-addressable Lab presentation state;
- executable visual matrix + accessibility browser smoke + Web bundle budget;
- starter template, adapter cookbook, API-entrypoint drift guard, examples, package smoke.

### Added — security / compatibility / supply chain
- explicit structural redaction helper;
- deterministic adversarial/property corpus;
- serialization resource-limit tests;
- compatibility fixtures and canonical acceptance corpus;
- dependency/license/SBOM-style release inventory;
- npm provenance-enabled publisher;
- private workspace dependency versions now validated against the exact public release version.

### Release engineering
- root + eight public package manifests target `0.9.0-alpha.1`;
- private experimental workspaces remain outside the public npm release set;
- `dev` remains no-CI/no-deploy;
- `main` remains the sole verification, npm publication, screenshot, and Cloudflare Pages deployment boundary.

### Evidence still required
- successful main verification;
- real executable Dark/Light screenshot evidence;
- npm publish, `@alpha` registry resolution, fresh install, and provenance evidence;
- Cloudflare live deploy + HTTP/SHA evidence after credentials are configured;
- broader beta/manual accessibility evidence and final v1 kill-criteria review.

## [0.8.0-alpha.2] — 2026-08-25

### Release meaning
**Dark Flagship + Light Companion without semantic drift.**

### Added
- Dark Flagship default + Light Companion persisted theme.
- Keyboard-accessible theme selector.
- Theme variables isolated to renderer/Lab layers.
- Theme-boundary architecture test.
- paired executable screenshot capture pipeline.
- concept-vs-real visual evidence policy.

### Validation note
The code checkpoint landed on `main`; registry/publication evidence was intentionally not inferred.

## [0.8.0-alpha.1] — 2026-08-25

### Release meaning
Witness Loop + interaction/accessibility + multi-renderer invariance + stabilization.

### Added
- immutable prediction/observation/reconciliation/witness/retry records;
- Snapshot/RIR/Inspector witness history;
- high-impact/irreversible consequence policy hardening;
- Disclosure, Continuity, Momentum physics;
- semantic traversal/zoom and non-color-only uncertainty;
- Agent + Voice renderers and cross-renderer invariance;
- semantic specification, compatibility validators, migration policy, threat model, performance budget.

### Fixed
- token-aware RIR architecture guard removed incidental `css` substring false positives;
- Web renderer preserves raw semantic identifiers in DOM metadata.

## [0.4.0-alpha.1] — 2026-08-25

First cross-domain representation + Inspector checkpoint: gravity/distance/depth/trace, six-domain universal planner fixtures, runnable examples, package tarball smoke.

## [0.3.0-alpha.1] — 2026-08-25

First Living CRAYON checkpoint: consequence/resistance, Semantic Snapshot/diff, RIR grammar/planner, Text + React renderer, Lab, package-shaped release set.

## [0.1.0-alpha.1] — 2026-08-24

First executable truth/agency runtime: epistemics, prediction vs observation, reconciliation, authority, possibility assessment, intent/commitment, one-shot execution capability, witness/retry safety.

## [0.0.1] — 2026-08-24

Repository initialization and foundational loop: **Reality → Understanding → Agency → Witness**.
