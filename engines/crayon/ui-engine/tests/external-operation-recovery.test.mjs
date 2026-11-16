import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryExternalOperationRegistry } from "../dist/packages/store/src/index.js";
import { recoverExternalOperation } from "../dist/packages/store/src/recovery.js";

function identity() {
  return {
    version: "0",
    id: "operation:deploy:42",
    idempotencyKey: "idem:deploy:42",
    transitionId: "transition:deploy:42",
    intentId: "intent:deploy:42",
    createdAt: "2026-08-25T12:00:00Z",
  };
}

function temporalRecord(id, retry, witnessStatus = "partial") {
  return {
    version: "0",
    id,
    transitionId: "transition:deploy:42",
    intentId: "intent:deploy:42",
    actorId: "human:operator",
    prediction: [],
    observations: [],
    reconciliations: [],
    witness: {
      id: `witness:${id}`,
      phase: "witness",
      at: "2026-08-25T12:03:00Z",
      status: witnessStatus,
    },
    retry,
    reconciliationIds: [],
  };
}

test("restart before reservation has no dispatch authority and requires fresh validation", () => {
  const decision = recoverExternalOperation(undefined);
  assert.equal(decision.state, "no-record");
  assert.equal(decision.dispatchAllowed, false);
  assert.equal(decision.requiredAction, "start-with-fresh-validation");
});

test("restart after reservation but before dispatch cannot replay an old execution lease", async () => {
  const registry = createMemoryExternalOperationRegistry();
  const reserved = await registry.reserve(identity());
  const decision = recoverExternalOperation(reserved);
  assert.equal(decision.state, "reserved-before-dispatch");
  assert.equal(decision.dispatchAllowed, false);
  assert.equal(decision.requiredAction, "revalidate-authority-preconditions-and-create-fresh-lease");
  assert.equal("lease" in decision, false);
});

test("restart after dispatch and before observation blocks duplicate side effects", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  const dispatched = await registry.markDispatched("operation:deploy:42", "2026-08-25T12:01:00Z");
  const decision = recoverExternalOperation(dispatched);
  assert.equal(decision.state, "ambiguous-after-dispatch");
  assert.equal(decision.dispatchAllowed, false);
  assert.equal(decision.requiredAction, "reconcile-before-any-new-dispatch");
});

test("restart with unresolved observation remains blocked", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  await registry.markDispatched("operation:deploy:42", "2026-08-25T12:01:00Z");
  const record = await registry.linkTemporalRecord("operation:deploy:42", temporalRecord(
    "record:timeout",
    {
      status: "blocked",
      witnessId: "witness:record:timeout",
      reason: "OUTCOME_UNRESOLVED",
      requiredAction: "reconcile-before-retry",
    },
  ));
  const decision = recoverExternalOperation(record);
  assert.equal(decision.state, "ambiguous-after-dispatch");
  assert.equal(decision.dispatchAllowed, false);
});

test("restart with conflicted evidence requires investigation", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  await registry.markDispatched("operation:deploy:42", "2026-08-25T12:01:00Z");
  const record = await registry.linkTemporalRecord("operation:deploy:42", temporalRecord(
    "record:conflict",
    {
      status: "blocked",
      witnessId: "witness:record:conflict",
      reason: "OUTCOME_CONFLICTED",
      requiredAction: "investigate-before-retry",
    },
    "conflicted",
  ));
  const decision = recoverExternalOperation(record);
  assert.equal(decision.state, "conflicted-after-dispatch");
  assert.equal(decision.requiredAction, "investigate-before-any-new-dispatch");
});

test("delayed verified outcome survives restart and prevents retry", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  await registry.markDispatched("operation:deploy:42", "2026-08-25T12:01:00Z");
  const record = await registry.linkTemporalRecord("operation:deploy:42", temporalRecord(
    "record:verified",
    {
      status: "unnecessary",
      witnessId: "witness:record:verified",
      reason: "OUTCOME_VERIFIED",
      requiredAction: "do-not-retry",
    },
    "verified",
  ));
  const decision = recoverExternalOperation(record);
  assert.equal(decision.state, "verified-complete");
  assert.equal(decision.dispatchAllowed, false);
  assert.equal(decision.requiredAction, "do-not-retry");
});
