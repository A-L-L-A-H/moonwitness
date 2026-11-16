# CRAYON Production Observability Contract

Status: experimental v0.9 production-hardening work (#124)

Observability is a **side channel**. It can explain what the runtime attempted and correlate operational traces, but it is never an Observation, Evidence, Witness, AuthorityDecision, or verification source by itself.

## Invariants

1. Telemetry never upgrades epistemic certainty.
2. Sink delivery success never means an external operation succeeded.
3. Sink failure never changes the semantic result of the operation being observed.
4. Event identity and timestamps are caller-supplied; the package does not call a hidden global clock or random ID generator.
5. Redaction happens before an event is handed to a sink.
6. Kernel has no dependency on a telemetry vendor.
7. Correlation IDs connect operational records; they do not merge their semantic identities.

## Event model

`allah-crayon-observability` currently defines semantic event version `0` with kinds:

```text
observe
propose
intend
commit
execute
verify
reconcile
render
```

Optional correlation fields:

```text
operationId
transitionId
temporalRecordId
witnessId
rendererTraceId
```

These fields let operators follow one human/system action across execution, persistence, reconciliation, and representation without pretending those records are interchangeable.

## Redaction

Attributes are intentionally constrained to telemetry-safe scalar values and scalar arrays. A redactor may keep, drop, or replace each attribute before delivery. The provided secret-key redactor is only a reference helper; applications should define domain-specific policies under #110.

Do not put raw credentials, access tokens, unredacted financial/customer payloads, or evidence documents into telemetry attributes.

## Failure behavior

`emitTelemetrySafely()` returns delivery status rather than throwing sink failures into the semantic path. A telemetry outage may reduce observability, but it must not convert `unknown` into `verified`, block an otherwise valid semantic transition, or authorize execution.

## Current implementation status

Implemented on `dev` in private `allah-crayon-observability`:

- versioned semantic event schema;
- observe/propose/intend/commit/execute/verify/reconcile/render event kinds;
- operation/transition/temporal/witness/renderer correlation IDs;
- immutable event values;
- pre-sink redaction hooks;
- safe sink delivery result where telemetry backend failure cannot fail the semantic operation;
- deterministic caller-supplied event ID/time;
- falsification tests for secret redaction and sink failure independence.

Still pending before #124 is release-proven:

- wire event emission into real execution/reconciliation paths without coupling Kernel to the package;
- domain redaction policy #110;
- performance/load behavior;
- `main` verification.
