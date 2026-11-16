# P0 Kernel Invariant Review

**Status:** Passed for P0 scope

**Branch:** `feat/kernel-v0.1`

**Validation:** TypeScript compilation succeeds and the local Node test suite passes 14/14 tests as of 2026-08-24.

## Purpose

P0 exists to establish semantic correctness before authority, execution, representation, or visual work begins.

The review asks a single question: can the current kernel confuse prediction, observation, verification, or historical truth?

## Invariant results

### 1. Prediction is not truth — PASS

A simulated transition produces `PredictedOutcome`. It is never stored as an observed post-execution state.

### 2. Verification is derived, not declared — PASS

`ObservedOutcome` contains observations but no caller-controlled verification status.

`Witness.status` is derived by reconciling observations against predicted effect targets.

A runtime test deliberately passes a forged `status: "verified"` property with zero observations. The property is ignored and the resulting witness remains `unverified`.

### 3. Unknown, uncertainty, and conflict remain explicit — PASS

Reconciliation returns structured epistemic state and reason codes instead of silently fabricating a current value.

Covered reasons include missing observations/values, stale data, low reliability, source agreement, and source disagreement.

### 4. Stale predictions are detectable before execution — PASS FOR KERNEL SCOPE

Transitions carry state preconditions derived from the simulation snapshot and may include explicit assertions such as entity version.

`evaluateTransitionReadiness()` returns `stale` with expected/actual values and requires `reobserve-and-resimulate`.

**Next-phase constraint:** when the execution boundary is introduced, it MUST require a valid readiness result. P1/P2 must not expose an executor path that accepts a raw unchecked `Transition`.

### 5. Ambiguous execution blocks duplicate retry — PASS

A partial/unverified/conflicted witness blocks retry until reconciliation.

Later observations may create an immutable `WitnessReconciliation` without rewriting the historical witness.

### 6. Historical truth is append-only — PASS

Later evidence does not mutate what CRAYON knew at the time the original witness was created.

The original witness and later reconciliation are separate records.

### 7. Kernel architecture boundary is executable — PASS

Tests scan `packages/kernel/src` and reject representative UI/platform/domain leakage and upward-layer dependencies.

The guard itself is tested against a deliberately prohibited fixture.

## Known limitations accepted beyond P0

These are not reasons to reopen P0, but they constrain later phases:

1. No execution boundary exists yet. Future executor APIs must require a validated transition/readiness token rather than raw transition data.
2. Reconciliation reliability thresholds are currently kernel constants. Policy configuration belongs to a later policy/authority design review.
3. The ontology has only been stress-tested deeply against the first banking-style scenario. Cross-domain falsification remains mandatory before representation work.
4. Security, persistence, distributed ordering, cryptographic witness integrity, and performance are future stabilization concerns.

## Freeze decision

P0 semantic correctness is accepted as the current foundation for P1.

This does **not** mean the entire Kernel v0.1 API is stable or public. It means the truth/observation/prediction/witness invariants are strong enough to proceed to authority and constraints without returning to visual design.

## Next phase

P1 — Authority and constraints:

- capability model: observe / propose / intend / commit / execute / verify / override;
- deterministic constraint evaluation;
- explainable unavailable possibilities;
- explicit human vs agent authority boundaries;
- executor boundary design that consumes validated transition readiness.
