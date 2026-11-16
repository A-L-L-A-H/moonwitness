# CRAYON Observation Ingestion Boundary

Status: experimental v0.9 trust-boundary work (#79)

External transport success is not epistemic truth. The ingestion boundary only decides whether an incoming `Observation` is structurally and operationally admissible; reconciliation decides what knowledge can later be derived from observations.

## Required provenance

An ingested observation carries:

- stable observation ID;
- subject ID + property;
- source identity;
- `observedAt`;
- explicit ingestion `receivedAt`;
- optional `validUntil`;
- optional reliability in `0..1`;
- optional Evidence records with their own stable ID, source, time, and reliability.

A production policy may require explicit evidence and a minimum reliability threshold.

## Time rules

- malformed timestamps are rejected;
- observations/evidence too far in the future relative to `receivedAt` are rejected using explicit clock-skew policy;
- `validUntil` cannot precede `observedAt`;
- already-expired observations may still be accepted as immutable historical observations and are reported as `stale`;
- stale does not mean false, and transport freshness does not mean fact.

## Determinism

Duplicate Evidence IDs inside one observation are rejected with a stable reason code. The same input + ingestion policy produces the same validation report.

## No truth promotion

`ingestObservation()` returns an immutable copy of the accepted Observation plus its ingestion report. It does not emit `Knowledge`, does not set `epistemic: fact`, and does not verify a Witness. Those remain separate CRAYON semantic steps.

## Current reason codes

```text
INVALID_OBSERVATION_ID
INVALID_SUBJECT_ID
INVALID_PROPERTY
INVALID_OBSERVED_AT
OBSERVED_AT_IN_FUTURE
INVALID_VALID_UNTIL
VALID_UNTIL_BEFORE_OBSERVED_AT
MISSING_SOURCE
INVALID_RELIABILITY
LOW_RELIABILITY
MISSING_EVIDENCE
INVALID_EVIDENCE_ID
DUPLICATE_EVIDENCE_ID
MISSING_EVIDENCE_SOURCE
INVALID_EVIDENCE_TIME
EVIDENCE_TIME_IN_FUTURE
```

## Current implementation status

Implemented on `dev`:

- explicit `receivedAt` policy;
- configurable future-clock skew;
- configurable minimum reliability;
- optional mandatory evidence;
- deterministic duplicate-evidence rejection;
- stale-history acceptance without truth promotion;
- falsification tests for missing source, malformed reliability, future observations, duplicate evidence, and low reliability.

Still pending before #79 is release-proven:

- export/API-shape review for the private adapter workspace;
- connector-stream integration (#89);
- broader malicious-source corpus;
- `main` verification.
