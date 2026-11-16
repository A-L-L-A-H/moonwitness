# ADR-023 — Canonical Contract Wire Naming and Envelope

Status: LOCKED
Date: 2026-08-30

## Context

Wave 1 core implementation found two blocking contract contradictions:

1. `03-contracts/schemas/event-envelope.schema.json` used camelCase fields (`id`, `type`, `version`, `occurredAt`, `producer`, `correlationId`, `causationId`, `payload`) while `02-domain/EVENT-TAXONOMY-V1.yaml` required different snake_case fields and additional semantics (`event_id`, `event_type`, `schema_version`, `occurred_at`, `producer_capability_id`, `subject`, `correlation_id`, `trace_id`).
2. `03-contracts/schemas/problem.schema.json` did not permit `retryable`, while `03-contracts/ERROR-TAXONOMY-V1.yaml` required machine-readable retryability.

These contradictions made the canonical shared contract layer non-executable.

## Decision

The canonical JSON wire representation uses **camelCase**.

### Canonical event envelope

Required fields:

- `id`
- `type`
- `version`
- `occurredAt`
- `producerCapabilityId`
- `subject`
- `correlationId`
- `traceId`
- `payload`

Optional field:

- `causationId`

The event taxonomy's snake_case names are retired as wire-field definitions and remain only as historical terminology where referenced by old evidence. New consumers MUST use the canonical camelCase schema fields.

### Canonical Problem Details

Required fields remain:

- `type`
- `title`
- `status`
- `code`
- `retryable`

Optional fields:

- `detail`
- `instance`
- `correlationId`

`retryable` is required and boolean because clients, SDKs, workers, and observability need deterministic machine-readable retry behavior.

## Compatibility

This decision is a contract correction before Gen2 public implementation. No production Gen2 consumer exists yet. Legacy snake_case field names are not supported as parallel canonical fields.

When a future legacy adapter must translate an old representation, the translation happens at the adapter boundary and does not change the canonical core contract.

## Ownership

Canonical ownership remains:

- `moonwitness-core` for the shared contract implementation.
- `03-contracts/schemas/` for canonical wire schemas in the blueprint.

## Migration / rollback

If a future requirement demonstrates that camelCase is incompatible with a mandatory external standard, create a new ADR with explicit impact and compatibility analysis. Do not introduce undocumented aliases.

## Consequences

- Wave 1 core can implement one unambiguous event envelope.
- Problem Details has deterministic retryability.
- OpenAPI/SDK generation can consume one canonical JSON shape.
- Domain terminology and wire naming no longer conflict.

## Affected artifacts

- `03-contracts/schemas/event-envelope.schema.json`
- `02-domain/EVENT-TAXONOMY-V1.yaml`
- `03-contracts/schemas/problem.schema.json`
- `03-contracts/ERROR-TAXONOMY-V1.yaml`
- `03-contracts/CONTRACT-REGISTRY.yaml`
- design freeze record
