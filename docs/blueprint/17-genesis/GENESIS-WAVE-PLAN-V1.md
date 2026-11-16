# Genesis Wave Plan v1

Status: **FOUNDATION EXECUTION AUTHORIZED / WAVE 0 ACTIVE / CERTIFICATION PENDING**

This document defines the implementation sequence under the frozen architecture. It does not override sections `00`–`16`, the active decision registry, or the canonical readiness gate at `17-genesis/GENESIS-READINESS-CHECKLIST.md`.

## Current execution state

As of 2026-09-01:

- design freeze remains authoritative;
- Stage 1 foundation preflight is complete;
- Wave 0 foundation execution is authorized;
- Stage 2 foundation implementation evidence is incomplete;
- implementation and production certification remain pending;
- post-freeze evidence work must conform to the frozen architecture;
- any architecture change requires a new ADR and freeze update.

Existing verified Gen2 repositories must be normalized in place and must not be recreated under alternate names. Verified frontend-platform work, including the Experience Constitution and canonical icon ownership, must be preserved while Wave 0 foundation governance is completed.

## Pre-Genesis gate

Before implementation began, the following gate had to pass:

1. blueprint lint has zero blocking violations;
2. canonical contracts and OpenAPI are ratified;
3. required governance controls are ready;
4. target repositories are provisioned or approved for exact-once provisioning;
5. repository baseline CI is defined;
6. the canonical readiness gate explicitly authorizes foundation execution.

The canonical readiness gate now authorizes Foundation execution. This does **not** imply Stage 2, implementation certification, or production certification are complete.

## Wave 0 — Foundation — ACTIVE

Create or normalize only the repositories approved by `16-repositories/MASTER-REPOSITORY-MAP.yaml`.

Apply:

- current approved toolchain manifest;
- package management and lockfile policy;
- TypeScript + ESM baseline;
- repository governance;
- CI/security baseline;
- package publishing/public-export policy;
- blueprint dependency and contract gates.

Exit only when Stage 2 evidence in the canonical readiness checklist is complete.

## Wave 1 — Core contracts — BLOCKED BY WAVE 0 EXIT

Target: `moonwitness-core`.

Build the shared contract/runtime-neutral primitives required by downstream repositories. Do not absorb domain business logic merely because it is shared.

Exit gate: canonical contracts resolve, public exports are stable, and package portability tests pass.

## Wave 2 — Domain capabilities — BLOCKED BY PRIOR WAVE GATES

Independent workers may operate in parallel only within disjoint ownership boundaries:

- `moonwitness-corpus`
- `moonwitness-cosmic`
- `moonwitness-crayon`
- `moonwitness-prophetic`

Migration follows the lifecycle:

`DISCOVERED → MAPPED → EXTRACTED → IMPLEMENTED → SHADOWED → PARITY_VERIFIED → CUTOVER → DEPRECATED → ARCHIVED`.

## Wave 3 — Runtime execution — BLOCKED BY PRIOR WAVE GATES

- `moonwitness-runtime`
- `moonwitness-worker`

Implement durable research runs/jobs, state machines, events, retry/timeout/cancellation, idempotency, correlation context, provenance propagation, and execution telemetry.

## Wave 4 — Network boundary — BLOCKED BY PRIOR WAVE GATES

Target: `moonwitness-api`.

Implement the canonical HTTPS + OpenAPI surface, auth/policy, Problem Details errors, idempotency, SSE streaming, health/readiness, and compatibility adapters.

No domain capability is reimplemented here.

## Wave 5 — SDK + frontend platform — BLOCKED BY PRIOR WAVE GATES

Parallel:

- `moonwitness-sdk`
- `moonwitness-frontend-platform`

The SDK derives from the canonical API contract. The frontend platform owns design tokens, primitives, patterns, accessibility foundations, and portable UI composition. Existing verified frontend-platform artifacts are preserved and extended rather than recreated.

## Wave 6 — Applications — BLOCKED BY PRIOR WAVE GATES

Parallel where independent:

- `moonwitness-wheremythfadetolegend` — primary public Web per ADR-025;
- `moonwitness-commandcenter`;
- `moonwitness-crayon-lab`.

`moonwitness-web` remains legacy/paused and is not a new primary application target.

Applications compose packages and consume the API. They do not fork domain logic or access domain databases directly.

## Wave 7 — Cross-repo certification

Verify:

- blueprint lint;
- contract compatibility;
- dependency direction;
- package portability;
- Golden Path behavior;
- provenance integrity;
- authorization/security controls;
- observability correlation;
- performance/cost budgets;
- serverless/Docker parity;
- E2E critical paths;
- backup/restore and rollback procedures;
- migration parity and legacy decommission criteria.

## Parallelism rule

Parallel work is allowed only when:

- ownership is disjoint;
- no shared canonical contract is being edited concurrently;
- no shared migration target is being edited concurrently;
- package/version changes are coordinated;
- the decision registry is unchanged or explicitly updated through an ADR.

When a shared contract changes, serialize the contract change and then fan out consumers.
