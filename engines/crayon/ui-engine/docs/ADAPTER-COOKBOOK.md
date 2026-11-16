# CRAYON Domain Adapter Cookbook

Status: v0.9 integration guidance. The adapter workspace is experimental/private until its release gate passes.

A domain adapter translates external/domain-shaped data into a CRAYON `Situation`. It does **not** decide truth, authority, commitment, execution success, or witness verification.

## Boundary

```text
Domain API / DB / webhook / stream
            ↓
       Domain Adapter
            ↓
         Situation
            ↓
CRAYON reconciliation / authority / consequence / RIR
```

## Minimal adapter

Use `defineDomainAdapter()` with an explicit deterministic context time. Provide stable entity IDs and provenance for observations/fact knowledge.

Rules:

1. keep raw transport status outside semantic truth;
2. every `fact` from an adapter cites observation/evidence provenance;
3. do not put access tokens or secrets into entity state/evidence;
4. keep authority rules outside the adapter unless the application explicitly supplies them as separate runtime policy;
5. never create `Intent`, `CommitmentRecord`, `ExecutionLease`, `Witness`, or verification in an adapter;
6. use connector delivery IDs/cursors for dedupe, not semantic IDs as transport cursors;
7. reject malformed timestamps/reliability rather than normalizing them silently.

## Poll connector

A poller emits a `ConnectorDelivery` with mode `poll`, stable `deliveryId`, `receivedAt`, and monotonic cursor. An accepted HTTP response means delivery arrived; contained observations still pass `ingestObservation()` separately.

## Webhook connector

Verify webhook authenticity in the application/connector edge first. CRAYON ingestion records source/provenance but does not claim that source authentication alone proves a domain outcome.

## Stream connector

Persist broker offset/cursor outside semantic history. Duplicate delivery is rejected deterministically. Cursor regression is a connector error, not a domain regression.

## Reliability

Use `minimumReliability` only as an ingestion admission floor. Reliability is not probability-of-truth and must not be converted directly to `fact` certainty.

## Six reference adapters

The private adapter package contains Banking, Files, Email, ERP, DevOps, and AI reference adapters. They intentionally produce the same top-level Situation grammar even though domain vocabulary differs at the edge.

## Failure handling

Stable adapter/ingestion/connector reason codes are documented in `docs/REASON-CODES.md`. Production systems should log codes and safe correlation metadata; do not parse human explanation strings.

## Review checklist

Before admitting an adapter:

- conformance validator passes;
- no dangling relations/duplicate entity IDs;
- fact knowledge has provenance;
- no authority/verification fabrication;
- malicious low-reliability/future-dated data has tests;
- duplicate delivery/cursor behavior is deterministic;
- redaction policy covers sensitive domain data;
- six-domain universal runtime/RIR tests remain green.
