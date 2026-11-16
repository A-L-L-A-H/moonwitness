# CRAYON Durability Contract

Status: experimental v0.9 contract

CRAYON durability exists to preserve semantic history across process lifetime. Persistence must not become a second source of truth and must not allow storage success to masquerade as observed reality.

## Dependency boundary

```text
Kernel TemporalRecord
        ↓
TemporalStore port
        ↓
reference / external storage adapter
```

The Kernel does not import the store package and does not know about filesystems, databases, browser storage, queues, or renderer state.

`allah-crayon-store` is currently private/experimental. It is intentionally excluded from the public npm release set until replay/recovery and external adapter contracts survive falsification.

## Append-only rule

A temporal record identity is immutable once appended.

- an existing record ID cannot be replaced;
- later evidence is represented by another record/reconciliation, not mutation of historical prediction/observation;
- storage errors are storage errors, not semantic outcome states;
- an incomplete/corrupt journal entry is not equivalent to a valid CRAYON `unknown` outcome.

## Memory reference adapter

`createMemoryTemporalStore()` provides a deterministic reference implementation for contract testing. It:

- clones and deep-freezes records at append time;
- preserves append order;
- supports filtering by transition, intent, and actor identity;
- rejects duplicate record IDs with `DUPLICATE_RECORD_ID`;
- rejects incomplete records with `INVALID_RECORD`.

It is not a production database implementation.

## Temporal journal

`createTemporalJournal()` adds explicit zero-based append sequence over a store. `verifyTemporalJournal()` can distinguish:

- `INCOMPLETE_ENTRY` — missing/unsupported journal data;
- `SEQUENCE_MISMATCH` — declared order does not match append order;
- `DUPLICATE_RECORD_ID` — historical identity appears twice.

A valid journal proves only that the reference structural ordering rules hold. It does **not** prove source authenticity, cryptographic integrity, or non-repudiation.

## Replay and restart

`replayTemporalJournal()` reconstructs a deterministic transition projection from validated journal order. It never derives a new semantic outcome from persistence success.

For each transition replay exposes:

- all historical record IDs in append order;
- distinct intent IDs observed for the transition;
- the latest record identity;
- the latest persisted witness status;
- the latest persisted retry assessment;
- latest reconciliation IDs.

If the most recent stored record still says `OUTCOME_UNRESOLVED`, replay after restart remains blocked. It is not promoted to success merely because the process restarted or the journal loaded successfully.

`restoreTemporalJournal()` rebuilds the reference in-memory journal only after structural verification succeeds. Invalid sequence/incomplete/duplicate history returns a failed restore result instead of partially loading history.

## Remaining work

Tracked separately:

- #78 external operation identity/idempotency;
- #79 observation ingestion/provenance;
- #80 deterministic clock/identity providers;
- #81 canonical codecs;
- #82 migrations;
- #85 tamper-evident integrity-chain experiment.

#77 replay/recovery implementation is present on `dev`; its issue remains open until the main verification boundary executes the new tests.

The durability layer may become public only after these contracts make durable replay at least as truthful as process-local execution.
