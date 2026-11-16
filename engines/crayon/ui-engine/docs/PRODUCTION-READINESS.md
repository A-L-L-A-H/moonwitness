# CRAYON Production Readiness

Status: active v0.9 → v1.0 admission contract

CRAYON is not declared production-ready because a build passes or a UI looks polished. Production admission requires semantic truthfulness, execution safety, durability, renderer parity, accessibility, operability, supply-chain integrity, registry evidence, and live deployment evidence to agree.

## Production admission pillars

### 1. Semantic correctness

- prediction never becomes observed truth without evidence;
- unknown/conflicted/stale remain distinguishable;
- authority is explicit and deny-overrides-allow;
- consequence precedes commitment where resistance requires it;
- witness/reconciliation remain append-only historical truth.

### 2. Execution safety

- commitment cannot be forged by object copying;
- execution is one-shot and revalidated immediately before side effect;
- external operation identity survives timeout/restart;
- unresolved external outcomes block unsafe retries;
- crash recovery cannot replay an execution lease.

### 3. Durability

- TemporalStore is renderer/platform independent;
- journal corruption is storage failure, not semantic unknown;
- replay reconstructs temporal history without inventing success;
- canonical versioned codecs reject lossy/unsupported values;
- migrations are explicit and fail closed when meaning cannot be preserved.

### 4. Renderer conformance

Every admitted renderer must preserve critical RIR claims for semantic identity, epistemic state, availability, consequence, authority requirements, resistance, witness/reconciliation, and retry safety.

Presentation may differ. Meaning may not.

The private conformance kit and Web/Text/Agent/Voice fixtures exist; Terminal/Static/Print remain experimental projections and must preserve the same semantic claims before public admission.

### 5. Production UI

Dark Flagship and Light Companion must both satisfy:

- keyboard navigation;
- non-color-only state communication;
- semantic zoom without hiding critical meaning;
- responsive layouts without clipping critical consequence/witness data;
- reduced-motion/high-contrast/forced-colors behavior;
- deterministic screenshot/visual regression gates;
- degraded mode that exposes system limitation instead of fabricating domain outcome.

Main source `bb6e4a53159fec56cf918a37474560b84976ac14` has `living-crayon=success` and produced real Dark/Light visual evidence. Broader manual WCAG/screen-reader evidence remains a beta gate.

### 6. Operability

- structured semantic telemetry is versioned and redactable;
- telemetry failure cannot alter semantic decisions;
- correlation IDs connect operation → transition → temporal record → witness;
- observation ingestion records source, observed time, received time, evidence, and reliability without promoting transport success to truth;
- deterministic Clock/IdentityProvider contracts exist outside Kernel/renderers;
- performance budgets include semantic stages and the actual Web bundle;
- production errors are distinguishable from domain observations.

### 7. Security and supply chain

- threat model maps to executable tests;
- untrusted serialized input has byte/depth/collection/object limits;
- redaction policy prevents evidence/secret leakage;
- package manifests and internal dependencies are release-validated;
- SBOM/license inventory and package evidence are generated;
- experimental workspaces cannot enter the public release set accidentally;
- npm provenance is requested and must be proven at registry publish time.

### 8. Deployment

- `dev` has no public deployment;
- `main` is the sole verified release/deployment boundary;
- Vercel is the canonical live Lab target;
- every non-`main` Vercel Git build is skipped;
- live Lab deploys only `dist-lab/`;
- build embeds and verifies exact Git source SHA;
- immutable asset caching and security response headers are configured;
- deployment success is operational evidence, not semantic verification;
- deployment failure is not a domain outcome;
- live URL, deployment ID, release SHA, timestamp and HTTP smoke are recorded together;
- rollback must be proven from a known-good deployment.

Vercel deployment is tracked by #157/#134 and documented in `docs/VERCEL-DEPLOYMENT.md`. The connected Vercel team currently has no project, therefore no live URL is claimed yet.

## Experimental workspaces

These remain private and excluded from the eight-package public release set:

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

Usefulness does not automatically admit an experimental package to npm. Public admission requires API review, falsification, dependency-boundary review, compatibility commitment, and verified evidence.

## Current evidence gates

### Proven
- v0.9 candidate merged to `main`.
- main `living-crayon` success for source `bb6e4a5…`.
- real executable screenshot matrix committed to docs.
- Dark/Light runtime and visual proof issues #69/#70 complete.
- Vercel main-only configuration merged through PR #158.

### Still open
- npm publish currently records failure for the verified source; diagnose/re-run before registry claims.
- registry-only eight-package install + provenance evidence.
- Vercel project creation/import and first main production deployment (#157).
- live HTTP/SHA/rollback evidence (#134).
- broader manual accessibility/beta evidence.
- final v1 kill-criteria review (#120).

## Kill criteria

CRAYON must **not** be declared production-ready if any of the following remains possible:

1. a renderer hides critical uncertainty or consequence;
2. retry can duplicate an unresolved external side effect;
3. restart can silently reinterpret execution state;
4. stored history can be overwritten/reordered without detection;
5. an adapter can manufacture authority/verification;
6. an accessibility mode changes semantic meaning;
7. a production deployment can expose credentials or private source;
8. public package release can accidentally include experimental workspaces;
9. incompatible semantic data is silently accepted;
10. release evidence cannot identify exact source commit;
11. telemetry delivery changes semantic outcome or leaks protected payload;
12. ingestion accepts untraceable/policy-disallowed evidence as trustworthy input.

Production is a demonstrated property of the full Reality → Understanding → Agency → Witness loop, not a version label.
