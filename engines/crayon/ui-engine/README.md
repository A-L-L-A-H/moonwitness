# ALLAH-CRAYON-UI-ENGINE

CRAYON is a platform-agnostic Human–System Representation Runtime.

> **Reality → Understanding → Agency → Witness → Reality**

CRAYON represents what is known, what is uncertain, what can be done, what the consequence is, who has authority, and what was actually witnessed. Meaning precedes appearance.

## Current checkpoint

**Release candidate: `v0.9.0-alpha.1` — Durable Runtime + Production Hardening.**

This wave keeps the eight-package public semantic/runtime surface aligned while adding private experimental production workspaces for durability, adapters/connectors, canonical codecs/migrations, runtime execution/recovery, observability, renderer conformance/expansion, localization, redaction, and Lab engineering tools.

The experimental workspaces are deliberately **not** in the npm public release set yet. They exist to harden the engine without prematurely freezing APIs.

```text
Domain reality / external systems
        ↓
Adapter + observation ingestion
        ↓
Situation
        ↓
Kernel → Physics → Snapshot → RIR
        ↓
Inspector + renderer conformance
        ↓
Web / Text / Agent / Voice
Terminal / Static / Print (experimental)
        ↓
Intent → Commitment → ExecutionLease
        ↓
External operation + idempotency identity
        ↓
Observation → Reconciliation → Witness
        ↓
Append-only temporal store / replay
        ↓
Reality
```

CRAYON remains alpha software. `v0.9.0-alpha.1` is a production-hardening candidate, **not a production-ready claim**. See `docs/PRODUCTION-READINESS.md`.

## What v0.9 adds

### Durable truth and external execution

- renderer-independent `TemporalStore` reference boundary;
- append-only temporal journal + deterministic replay;
- external operation identity/idempotency semantics;
- crash recovery that never resurrects an execution lease;
- observation ingestion with explicit received/source/evidence/reliability policy;
- canonical Snapshot/RIR envelopes + explicit migration registry;
- compensation modeled as a new corrective possibility, never history rewrite;
- async executor that authenticates a Kernel `ExecutionLease` but never reports transport completion as semantic success;
- tamper-evident journal integrity experiment without authenticity overclaim.

### Integration

- private Domain Adapter SDK and conformance validator;
- Banking, Files, Email, ERP, DevOps, and AI reference adapters;
- transport-neutral connector envelope for polling/webhook/queue/stream delivery;
- normalized reason-code catalog and drift check.

### Renderer maturity

- reusable required-claim conformance kit;
- Terminal renderer;
- script-free Static HTML renderer;
- Print projection;
- localization boundary preserving raw semantic identity;
- RTL/bidirectional conformance;
- reduced-motion, high-contrast, forced-colors CSS behavior;
- `allah-crayon-react/safe` degraded mode: renderer/system failures are represented as **SYSTEM LIMITATION**, never domain outcome.

### Lab / DX / operations

- declarative scenario tooling;
- temporal-frame replay projection;
- semantic RIR diff;
- evidence/provenance graph;
- diagnostic-only pipeline profiler;
- URL-addressable scenario/theme/detail/Inspector state;
- executable screenshot matrix;
- main-only browser accessibility smoke;
- Web bundle/asset performance budget;
- create-CRAYON starter template + adapter cookbook;
- API entrypoint drift checks and packed-package smoke;
- structural redaction, adversarial/property corpus, codec resource limits;
- supply-chain/SBOM-style release inventory;
- compatibility fixtures + canonical v1 acceptance corpus.

## Visual proof: concept vs executable UI

CRAYON keeps visual planning and executable proof separate.

### EXPECTATION / CONCEPT

Generated showcase boards are design-planning artifacts. They explore target composition and atmosphere. They are **not executable proof**.

See `docs/SHOWCASE-CONCEPTS.md` and `docs/VISUAL-THEME-CONTRACT.md`.

### REAL LAB BUILD

The images below are generated only by successful `main` verification from the real Lab build.

#### Banking — Dark Flagship

![CRAYON Lab Banking Dark Flagship](docs/images/crayon-lab-banking-desktop-dark.png)

#### Banking — Light Companion

![CRAYON Lab Banking Light Companion](docs/images/crayon-lab-banking-desktop-light.png)

#### Partial deployment — Dark Flagship

![CRAYON Lab Deploy Dark Flagship](docs/images/crayon-lab-deploy-desktop-dark.png)

#### Banking mobile — Light Companion

![CRAYON Lab Banking mobile Light Companion](docs/images/crayon-lab-banking-mobile-light.png)

If an image is missing, that proof gate has not completed. Missing evidence is never written as success.

## Repository / deployment flow

Only two operational branches are used:

```text
dev  → fast implementation; no automatic CI; no public deployment
main → verification + visual proof + npm release + live deployment boundary
```

```text
dev
 ↓ merge
main
 ↓
living-crayon
 ├ release/version/workspace guards
 ├ strict TypeScript
 ├ semantic + falsification + security + compatibility tests
 ├ semantic + Web performance budgets
 ├ Lab production build
 ├ accessibility browser smoke
 ├ npm pack/install smoke
 └ executable Dark/Light screenshot proof
 ↓ success
 ├ publish-npm-alpha → real npmjs.org smoke
 └ deploy-cloudflare-pages → exact verified main SHA
```

Cloudflare Pages is intentionally `main`-only. The GitHub repository remains private; only built `dist-lab/` is deployed. First live deployment still requires the repository secrets documented in `docs/CLOUDFLARE-PAGES.md`.

## Public npm packages — `v0.9.0-alpha.1`

| Package | Responsibility |
| --- | --- |
| `allah-crayon-kernel` | truth, epistemics, agency, authority, transition, execution capability, witness |
| `allah-crayon-physics` | consequence/resistance + gravity/distance/depth/trace/disclosure/continuity/momentum |
| `allah-crayon-snapshot` | renderer-independent snapshot/history/diff/version boundary |
| `allah-crayon-rir` | platform-neutral Representation IR + deterministic planner/traversal/zoom |
| `allah-crayon-inspector` | renderer-independent explainability/evidence chronology |
| `allah-crayon-agent` | deterministic machine-readable projection; grants no authority |
| `allah-crayon-voice` | deterministic spoken/text projection from RIR |
| `allah-crayon-react` | accessible React renderer + `./safe` degraded-mode entrypoint |

Install after registry proof is green:

```bash
npm install allah-crayon-kernel@alpha
npm install allah-crayon-physics@alpha
npm install allah-crayon-snapshot@alpha
npm install allah-crayon-rir@alpha
npm install allah-crayon-inspector@alpha
npm install allah-crayon-agent@alpha
npm install allah-crayon-voice@alpha
npm install allah-crayon-react@alpha react react-dom
```

React:

```tsx
import { RIRView } from "allah-crayon-react";
import { SafeRIRView } from "allah-crayon-react/safe";
import "allah-crayon-react/styles.css";

<RIRView document={rir} detail="standard" />
<SafeRIRView document={untrustedOrOptionalRir} detail="standard" />
```

## Private experimental workspaces

These are part of the v0.9 hardening repository but **not published**:

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

They may change before beta. Their dependency on public CRAYON packages must match the exact root release version; `verify:release-set` enforces this.

## Current semantic guarantees

- prediction is never observed truth;
- transport success is never semantic verification;
- later evidence appends history rather than rewriting it;
- unresolved/conflicted external outcomes block unsafe retry;
- authority is explicit and deny-overrides-allow;
- agent/renderer capability never implies execution authority;
- execution requires an authentic one-shot lease and start-time revalidation;
- process restart never reconstructs a prior execution lease;
- high-impact/irreversible/unknown consequences cannot be downgraded by caller-declared low risk;
- compact representation cannot hide critical uncertainty/consequence/authority/witness meaning;
- raw semantic refs survive human formatting/localization;
- unsupported Snapshot/RIR versions fail explicitly;
- semantic theme state does not exist in Kernel/Physics/Snapshot/RIR;
- telemetry is a side channel and cannot become evidence by itself;
- redaction withholds values explicitly without fabricating epistemic `unknown`.

## Cross-domain acceptance

The same semantic grammar is exercised across:

```text
Banking  → ambiguous settlement + idempotent retry safety
Files    → recursive delete / restore-window stress
Email    → irreversible send + corrective follow-up
ERP      → multi-stage authority conflict
DevOps   → partial deployment / rollback / reconciliation
AI       → proposal → human commitment → service execution
```

Kernel/RIR are forbidden from branching on those domain names.

## CRAYON Lab

`apps/lab` is the executable representation microscope. It exposes Situation → Snapshot → Physics → RIR → Inspector → Web/Text/Agent/Voice → Witness Trace, semantic zoom, Dark Flagship / Light Companion, URL-addressable presentation state, safe degraded representation, and production screenshot/accessibility gates.

Local commands:

```bash
npm run dev:lab
npm run verify
npm run accessibility:lab   # after a production Lab build + browser availability
npm run capture:matrix      # executable visual matrix
npm run create:crayon       # external starter template
```

## Architecture rule

The semantic Kernel must not know React, CSS, browser, theme, pixel, hover, card, modal, or domain vocabulary.

```text
Domain Adapter / Observation Connector
    ↓
CRAYON Kernel
    ↓
Physics
    ↓
Semantic Snapshot
    ↓
RIR
    ├ Inspector
    ├ Web / Safe Web
    ├ Text
    ├ Agent
    ├ Voice
    ├ Terminal (experimental)
    ├ Static HTML (experimental)
    └ Print (experimental)
```

See `ROADMAP.md`, `TASKS.md`, `CHANGELOG.md`, `docs/PRODUCTION-READINESS.md`, `docs/DURABILITY-CONTRACT.md`, `docs/ADAPTER-CONTRACT.md`, `docs/OBSERVATION-INGESTION.md`, `docs/OBSERVABILITY.md`, `docs/SECURITY-THREAT-MODEL.md`, `docs/PUBLIC-API.md`, `docs/MIGRATION.md`, `docs/REASON-CODES.md`, `docs/ACCESSIBILITY.md`, `docs/WEB-PERFORMANCE.md`, and `docs/CLOUDFLARE-PAGES.md`.

## Remaining alpha evidence

CRAYON is not called production-ready until the relevant `main` verification, npm registry/provenance, executable screenshots, live deployment/health proof, and beta/manual accessibility evidence exist. See `TASKS.md` for the exact remaining proof gates.
