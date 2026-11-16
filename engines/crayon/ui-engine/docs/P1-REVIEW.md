# CRAYON P1 Invariant Review

**Checkpoint:** P1 — Authority, Possibility, and Execution Safety  
**Release target:** `v0.1.0-alpha.1`  
**Status:** Accepted for alpha scope

P1 extends the P0 truth model with explicit agency and a guarded execution boundary. This review freezes the invariants that must survive later representation, AI, renderer, and distributed-execution work.

## 1. Authority is capability-oriented

CRAYON authority is expressed through independent capabilities:

- `observe`
- `propose`
- `intend`
- `commit`
- `execute`
- `verify`
- `override`

No capability implies another. Actor intelligence, automation level, visibility, or proposal quality never creates additional authority.

### Accepted invariant

`intelligence != authority`

No matching authority rule returns `unknown`, never implicit allow. A matching explicit deny overrides a matching allow.

## 2. Possibility availability is derived

A domain may declare a semantic `Possibility`, but it may not declare authoritative actionability.

Availability is derived from:

1. current knowledge;
2. deterministic constraint evaluation;
3. required authority.

Possible results:

- `available`
- `unavailable`
- `unknown`

Missing knowledge or unresolved authority must not become actionable.

### Mandatory default

If an actionable possibility supplies no authority requirements, CRAYON still requires `intend` authority over the possibility subject.

## 3. Transition is prediction, not permission

A `Transition` describes a predicted state change. It is never an execution permit.

Execution preparation requires all of the following:

- transition readiness against current world state;
- transition/possibility identity and consequence binding;
- possibility availability;
- explicit commit authority;
- explicit execute authority;
- an authentic commitment record bound to actor and transition.

A raw transition, copied object, forged commitment, unknown authority decision, stale transition, mismatched possibility, or failed/unknown constraint must be rejected.

## 4. Preparation is not execution start

A prepared execution request may become stale before a side effect begins.

Therefore CRAYON uses a second boundary:

`prepareExecution -> beginExecution -> ExecutionLease`

`beginExecution` revalidates the world immediately before execution begins.

If readiness is stale:

- execution does not begin;
- the prepared request is permanently invalidated;
- callers must re-observe, re-simulate, and re-prepare;
- returning to an earlier value must not revive the old permit.

A validated request can begin execution only once.

## 5. Execution capability objects are non-forgeable in the current runtime

For the current single-process alpha runtime:

- commitment records are registered in private process-local `WeakSet` state;
- validated execution requests are registered in private process-local `WeakSet` state;
- execution leases are registered in private process-local `WeakSet` state;
- issued capability objects are deeply frozen;
- copied/plain objects do not inherit authority.

This is intentionally a single-process mechanism, not a distributed trust protocol.

## 6. Execution never returns trusted success truth

The execution boundary produces observations/evidence, not `success=true` as epistemic truth.

The loop remains:

`Prediction -> Commitment -> Execution -> Observation -> Reconciliation -> Witness`

Observed reality is reconciled later against prediction.

## 7. Adversarial scenarios covered

P1 fixtures explicitly cover:

- agent may observe/propose but cannot silently commit;
- human may intend without commit authority;
- execute authority cannot bypass the execution gate;
- verifier may verify without execute authority;
- override is explicit and narrowly scoped;
- deny overrides allow;
- missing authority remains unknown;
- explanations preserve matching rule IDs/reasons;
- raw transitions cannot become execution leases;
- copied permits cannot execute;
- forged commitments are rejected;
- stale preparation is rejected;
- post-prepare world change is caught at `beginExecution`;
- validated request is one-shot;
- transition cannot borrow a different possibility or consequence;
- execution output contains observations/evidence rather than caller-controlled success truth.

## 8. Kill criteria checked

P1 does not require kernel concepts such as:

- manager
- admin
- bank
- invoice
- email
- server
- button
- modal
- browser
- React

Authority and execution semantics remain domain/platform independent.

## 9. Known alpha limitations

P1 acceptance does **not** claim production readiness.

Deferred work includes:

- distributed/cross-process execution permit trust;
- cryptographic signing or remote attestation;
- persistence and crash recovery for leases;
- distributed ordering/idempotency semantics;
- policy version pinning and revocation during long-running execution;
- full security threat model;
- performance budgets;
- P2 consequence/risk/commitment hardening;
- cross-domain falsification beyond the current reference fixtures;
- RIR, renderer, and visual runtime.

## 10. P1 acceptance

For alpha scope, P1 is accepted if future work preserves these laws:

1. Unknown never becomes implicit allow.
2. Intelligence never becomes authority.
3. Possibility never becomes actionability without derived proof.
4. Prediction never becomes an execution permit.
5. Preparation never guarantees the world remains unchanged.
6. Execution must begin through a current, authentic, one-shot lease.
7. Execution output never declares reality without observation.

**Decision:** P1 is frozen for `v0.1.0-alpha.1` and implementation should move next to P2 consequence/commitment hardening and the first minimal representation path.