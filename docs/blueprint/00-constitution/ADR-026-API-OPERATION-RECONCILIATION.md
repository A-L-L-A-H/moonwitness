# ADR-026 — Canonical API Operation Reconciliation

Status: **APPROVED / IMPLEMENTATION-ALIGNED**
Date: 2026-09-01

## Decision

Reconcile the design-frozen API catalog, canonical OpenAPI document, and already-certified `moonwitness-api` runtime without introducing a second network boundary.

Two additive HTTP operations are explicitly adopted into the canonical `/v1` contract:

1. `GET /v1/readiness` — bounded dependency-readiness status using the same `{ status: ok | degraded }` wire shape as health. It is unauthenticated operational metadata and does not expose provider internals.
2. `POST /v1/research-runs/{researchRunId}/cancel` — idempotent cancellation command for a canonical ResearchRun. It is authorized at the deployment boundary, requires `Idempotency-Key`, and is valid only according to the locked ResearchRun state machine.

The existing design-locked operations for workflows, jobs, evidence, knowledge, analysis, and metadata remain unchanged in ownership and semantics. `06-api/openapi/openapi.yaml` is normalized to cover the complete operation catalog and to use canonical contract schemas or explicit OpenAPI components.

## Context

`06-api/API-OPERATION-CATALOG-V1.yaml` already design-locks a broader operation set than the previous `openapi.yaml`, while `06-api/OPENAPI-CONTRACT-COVERAGE-MATRIX-V1.yaml` marked catalog-to-OpenAPI parity as pending. The certified API runtime already implements and tests the broader set plus readiness and ResearchRun cancellation.

Readiness was a stated W0-08 acceptance requirement. ResearchRun cancellation semantics are already locked in `02-domain/STATE-MACHINES-V1.yaml` for CREATED/QUEUED/RUNNING states. The missing work is therefore public-contract reconciliation and explicit change control, not invention of new domain behavior.

## Impact

- No repository ownership changes.
- No database ownership or storage boundary changes.
- No new capability owner.
- No new protocol; HTTPS + OpenAPI remains the single canonical network door.
- SDK generation may now derive from one complete canonical OpenAPI artifact rather than hand-maintained duplicate API models.

## Migration

1. Add the two adopted operations to the operation catalog.
2. Normalize canonical OpenAPI to the full catalog.
3. Add executable catalog-to-OpenAPI method/path parity to Blueprint Integrity.
4. Treat `moonwitness-api` runtime OpenAPI as implementation evidence and converge it toward the Blueprint projection when future differences are found.
5. Generate/mirror SDK contract types from the canonical Blueprint OpenAPI with provenance and determinism checks.

## Rollback

If either additive operation proves unsuitable, deprecate it through the API lifecycle policy and a corrective ADR. Do not silently remove an operation from only one of catalog, OpenAPI, runtime, or SDK.

## Affected repositories

- `moonwitness-blueprint`
- `moonwitness-api`
- `moonwitness-sdk`

## Compatibility risk

Low. Both operations are additive and already implemented in the certified API runtime. The primary risk is future contract drift; executable parity validation is required to prevent recurrence.
