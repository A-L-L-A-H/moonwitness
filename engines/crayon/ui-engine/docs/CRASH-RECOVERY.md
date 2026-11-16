# CRAYON Crash-Safe External Operation Recovery

Status: experimental production-hardening work (#125)

A process restart destroys process-local execution authority. Durable operation identity may survive; an `ExecutionLease` must not.

## Recovery states

```text
no durable record
  → start with fresh validation

reserved, not dispatched
  → identity may be reused
  → fresh authority + precondition validation required
  → fresh one-shot lease required

dispatched, no established outcome
  → block duplicate dispatch
  → reconcile first

dispatched, conflicting outcome
  → block duplicate dispatch
  → investigate/reconcile first

verified outcome
  → preserve completion
  → do not retry
```

`recoverExternalOperation()` intentionally returns `dispatchAllowed: false` for every recovered state. Recovery tells the outer runtime what must happen next; it never reconstructs process-local execution capability.

## Identity

The durable `ExternalOperationIdentity` preserves:

- operation ID;
- idempotency key;
- transition ID;
- intent ID;
- creation timestamp.

This identity allows later evidence to reconnect to the original attempt without turning a timeout into failure or success.

## Falsification

`tests/external-operation-recovery.test.mjs` covers process restart:

1. before reservation;
2. after reservation but before dispatch;
3. after dispatch before observation;
4. after unresolved evidence;
5. after conflicting evidence;
6. after delayed verified evidence.

The tests assert that no recovered state contains/replays a lease and that ambiguous/conflicted post-dispatch states remain blocked.

## Remaining work

Before #125 is release-proven:

- connect recovery decisions to durable serialized registry restoration rather than in-memory records only;
- integrate fresh Kernel authority/precondition checks in an outer asynchronous executor (#84);
- add process-kill integration fixtures;
- main verification.
