import test from "node:test";
import assert from "node:assert/strict";
import {
  ExternalOperationRegistryError,
  createMemoryExternalOperationRegistry,
} from "../dist/packages/store/src/index.js";

function identity(overrides = {}) {
  return {
    version: "0",
    id: overrides.id ?? "operation:transfer:1",
    idempotencyKey: overrides.idempotencyKey ?? "idem:transfer:1",
    transitionId: overrides.transitionId ?? "transition:transfer:1",
    intentId: overrides.intentId ?? "intent:transfer:1",
    createdAt: overrides.createdAt ?? "2026-08-25T10:00:00Z",
  };
}

function temporalRecord(id, overrides = {}) {
  const witnessId = overrides.witness?.id ?? `witness:${id}`;
  return {
    version: "0",
    id,
    transitionId: overrides.transitionId ?? "transition:transfer:1",
    intentId: overrides.intentId ?? "intent:transfer:1",
    actorId: "human:operator",
    prediction: [],
    observations: [],
    reconciliations: [],
    witness: overrides.witness ?? {
      id: witnessId,
      phase: "witness",
      at: "2026-08-25T10:02:00Z",
      status: "unverified",
    },
    retry: overrides.retry ?? {
      status: "blocked",
      witnessId,
      reason: "OUTCOME_UNRESOLVED",
      requiredAction: "reconcile-before-retry",
    },
    reconciliationIds: overrides.reconciliationIds ?? [],
  };
}

test("unused idempotency key allows a new external operation reservation", async () => {
  const registry = createMemoryExternalOperationRegistry();
  const assessment = await registry.assessAttempt(identity());
  assert.deepEqual(assessment, {
    status: "new-operation",
    allowed: true,
    reason: "IDEMPOTENCY_KEY_UNUSED",
  });

  const reserved = await registry.reserve(identity());
  assert.equal(reserved.phase, "reserved");
  assert.equal(Object.isFrozen(reserved), true);
});

test("reserved but undispatched operation may resume the same reservation", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  const assessment = await registry.assessAttempt(identity());
  assert.equal(assessment.status, "resume-reservation");
  assert.equal(assessment.allowed, true);
  assert.equal(assessment.reason, "RESERVED_NOT_DISPATCHED");
});

test("once dispatched, a repeated attempt is blocked until an observation/reconciliation record exists", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  await registry.markDispatched("operation:transfer:1", "2026-08-25T10:01:00Z");

  const assessment = await registry.assessAttempt(identity());
  assert.deepEqual(assessment, {
    status: "blocked",
    allowed: false,
    operationId: "operation:transfer:1",
    reason: "AWAITING_OBSERVATION",
  });

  await assert.rejects(
    registry.markDispatched("operation:transfer:1", "2026-08-25T10:01:30Z"),
    (error) => error instanceof ExternalOperationRegistryError && error.code === "OPERATION_ALREADY_DISPATCHED",
  );
});

test("timeout/unresolved temporal evidence keeps the same idempotency key blocked", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  await registry.markDispatched("operation:transfer:1", "2026-08-25T10:01:00Z");
  await registry.linkTemporalRecord("operation:transfer:1", temporalRecord("record:timeout"));

  const assessment = await registry.assessAttempt(identity());
  assert.equal(assessment.status, "blocked");
  assert.equal(assessment.allowed, false);
  assert.equal(assessment.reason, "OUTCOME_UNRESOLVED");
});

test("delayed verified evidence reconnects to original operation and makes retry unnecessary", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  await registry.markDispatched("operation:transfer:1", "2026-08-25T10:01:00Z");
  await registry.linkTemporalRecord("operation:transfer:1", temporalRecord("record:timeout"));

  const witnessId = "witness:confirmed";
  await registry.linkTemporalRecord("operation:transfer:1", temporalRecord("record:confirmed", {
    witness: {
      id: witnessId,
      phase: "witness",
      at: "2026-08-25T10:06:00Z",
      status: "verified",
    },
    retry: {
      status: "unnecessary",
      witnessId,
      reason: "OUTCOME_VERIFIED",
      requiredAction: "do-not-retry",
    },
    reconciliationIds: ["reconciliation:settlement"],
  }));

  const operation = await registry.get("operation:transfer:1");
  assert.deepEqual(operation.temporalRecordIds, ["record:timeout", "record:confirmed"]);

  const assessment = await registry.assessAttempt(identity());
  assert.deepEqual(assessment, {
    status: "unnecessary",
    allowed: false,
    operationId: "operation:transfer:1",
    reason: "OUTCOME_VERIFIED",
  });
});

test("idempotency key cannot be rebound to a different transition or intent", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());

  const conflict = await registry.assessAttempt(identity({
    id: "operation:other",
    transitionId: "transition:other",
    intentId: "intent:other",
  }));
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.reason, "IDEMPOTENCY_KEY_CONFLICT");

  await assert.rejects(
    registry.reserve(identity({
      id: "operation:other",
      transitionId: "transition:other",
      intentId: "intent:other",
    })),
    (error) => error instanceof ExternalOperationRegistryError && error.code === "IDEMPOTENCY_KEY_CONFLICT",
  );
});

test("temporal evidence cannot be attached to the wrong durable external operation", async () => {
  const registry = createMemoryExternalOperationRegistry();
  await registry.reserve(identity());
  await assert.rejects(
    registry.linkTemporalRecord("operation:transfer:1", temporalRecord("record:wrong", {
      transitionId: "transition:other",
    })),
    (error) => error instanceof ExternalOperationRegistryError && error.code === "TEMPORAL_IDENTITY_MISMATCH",
  );
});
