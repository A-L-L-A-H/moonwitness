# Application Communication Runtime

The Phase 3 client runtime is implemented in `packages/sdk` and sits above the
pure protocol kernel. It owns session state, logical execution handles,
client-initiated logical stream allocation, sequence/ACK bookkeeping, event
routing, capability support metadata, cancellation, and explicit timeout
handling.

The runtime accepts an injectable `Transport`; Phase 3 provides only
`MemoryTransport` for deterministic tests. No network transport is created by
the SDK core. A transport disconnect suspends the session and retains active
executions for a future resume implementation.

The public facade is `createAppRuntime()` with `connect`, `disconnect`, `run`,
`watch`, `cancel`, and `onEvent`. Server execution state remains authoritative;
terminal client state is only entered from an explicit local cancellation,
timeout, or server event.

## Phase 6 preparation: execution lifecycle conformance

The SDK execution transition table is constrained to the normative matrix in
`execution.md`. In particular, an execution cannot enter `WAITING` before it
is `RUNNING`, and a `WAITING` execution must resume through `RUNNING` before it
can complete. Invalid state messages are surfaced as execution errors and leave
the local execution state unchanged. This is a transport-agnostic conformance
fix; it does not implement session resume, retries, or WebTransport recovery.

## Phase 6-PREP.3: session and resume contracts

`@rocksoul/sdk` exports transport-independent session continuity contracts in
`session.ts`. A Connection is a physical attachment and may close while its
Session is `SUSPENDED`; a Session identity remains stable across replacement
connections; an Execution identity remains stable independently of both. A
Stream is a logical delivery path whose continuity is explicit through
`RESUMABLE`, `NON_RESUMABLE`, or `TERMINAL`.

The contract uses a server-authoritative `SessionGeneration` and one active
attachment. Resume validates the opaque token, principal, current generation,
revocation, and the server-supplied resume window. A stale connection cannot
mutate the newer generation. Resume only re-attaches existing work: it never
creates an Execution and never reopens a terminal Execution. Capability
availability and authorization are re-evaluated by the existing capability
resolver at the operation boundary; this session contract does not duplicate
that policy.

The implementation is a deterministic in-memory contract fixture for tests,
not a durable session ledger, replay store, cryptographic token issuer, or
transport resume implementation. Durable execution/session authority and event
replay remain future gateway work.
