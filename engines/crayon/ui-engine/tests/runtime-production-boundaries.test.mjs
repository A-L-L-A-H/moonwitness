import test from "node:test";
import assert from "node:assert/strict";
import {
  beginExecution,
  createCommitmentRecord,
  prepareExecution,
  simulateTransition,
} from "../packages/kernel/dist/index.js";
import {
  buildTemporalIntegrityChain,
  verifyTemporalIntegrityChain,
} from "../dist/packages/store/src/index.js";
import {
  createAsyncExecutor,
  defineCompensation,
} from "../dist/packages/runtime/src/index.js";

function executionFixture() {
  const currentEntities = [{ id: "resource:1", type: "resource", state: { value: 1 } }];
  const transition = simulateTransition({
    id: "transition:1",
    entities: currentEntities,
    intent: { id: "intent:1", possibilityId: "possibility:1", actor: "human:1", createdAt: "2026-08-25T10:00:00Z" },
    consequence: {
      effects: [{ id: "effect:1", entity: "resource:1", property: "value", from: 1, to: 2 }],
      reversibility: "reversible",
      risk: 0.1,
      impact: 0.2,
    },
  });
  const possibility = {
    id: "possibility:1",
    verb: "change",
    subject: { id: "resource:1", type: "resource" },
    constraints: [{ id: "constraint:ready", knowledgeKey: "resource:1.state", operator: "equals", expected: "ready" }],
    authority: [{ capability: "intend" }],
    consequence: transition.consequence,
  };
  const committer = { id: "human:1", kind: "human" };
  const executor = { id: "service:1", kind: "service" };
  const knowledge = [{ id: "knowledge:ready", key: "resource:1.state", value: "ready", epistemic: "fact", certainty: 1 }];
  const authorityRules = [
    { id: "rule:human", effect: "allow", capabilities: ["intend", "commit"], actors: { ids: ["human:1"] }, scope: { subjectIds: ["resource:1"] } },
    { id: "rule:service", effect: "allow", capabilities: ["execute"], actors: { ids: ["service:1"] }, scope: { subjectIds: ["resource:1"] } },
  ];
  const commitment = createCommitmentRecord({
    id: "commitment:1",
    actor: committer,
    transition,
    committedAt: "2026-08-25T10:00:01Z",
    assessment: { score: 0.2, mode: "visible-consequence", reasons: { risk: 0.1, impact: 0.2, irreversibility: 0.05, uncertainty: 0, authorityCost: 0 } },
  });
  const prepared = prepareExecution({
    id: "request:1",
    transition,
    possibility,
    currentEntities,
    knowledge,
    committer,
    executor,
    commitment,
    authorityRules,
    situationId: "situation:1",
    evaluatedAt: "2026-08-25T10:00:02Z",
  });
  assert.equal(prepared.status, "ready");
  const started = beginExecution({ id: "lease:1", request: prepared.request, currentEntities, startedAt: "2026-08-25T10:00:03Z" });
  assert.equal(started.status, "started");
  return { transition, possibility, lease: started.lease };
}

function temporalRecord(id = "record:1") {
  return {
    version: "0",
    id,
    transitionId: "transition:1",
    intentId: "intent:1",
    actorId: "human:1",
    prediction: [],
    observations: [],
    reconciliations: [],
    witness: { id: `witness:${id}`, phase: "witness", at: "2026-08-25T10:01:00Z", status: "unverified" },
    retry: { status: "blocked", witnessId: `witness:${id}`, reason: "OUTCOME_UNRESOLVED", requiredAction: "reconcile-before-retry" },
    reconciliationIds: [],
  };
}

test("async executor accepts only an authentic one-shot lease and transport completion remains outcome unknown", async () => {
  const { lease } = executionFixture();
  const executor = createAsyncExecutor();
  const result = await executor.dispatch({
    lease,
    context: { operationId: "operation:1", idempotencyKey: "idem:1", transitionId: "transition:1", intentId: "intent:1" },
    dispatchedAt: "2026-08-25T10:00:04Z",
    async perform() { return { transportReference: "queue:123" }; },
  });
  assert.equal(result.status, "dispatched");
  assert.equal(result.outcome, "unknown");
  assert.equal(result.receipt.transportReference, "queue:123");

  const replay = await executor.dispatch({
    lease,
    context: { operationId: "operation:1", idempotencyKey: "idem:1", transitionId: "transition:1", intentId: "intent:1" },
    dispatchedAt: "2026-08-25T10:00:05Z",
    async perform() {},
  });
  assert.deepEqual(replay, { status: "rejected", reason: "INVALID_EXECUTION_LEASE" });
});

test("transport error is not represented as domain failure", async () => {
  const { lease } = executionFixture();
  const result = await createAsyncExecutor().dispatch({
    lease,
    context: { operationId: "operation:2", idempotencyKey: "idem:2", transitionId: "transition:1", intentId: "intent:1" },
    dispatchedAt: "2026-08-25T10:00:04Z",
    async perform() { throw new Error("timeout"); },
  });
  assert.equal(result.status, "transport-error");
  assert.equal(result.outcome, "unknown");
});

test("compensation is a distinct possibility linked to original effects and never rewrites the original transition", () => {
  const { transition } = executionFixture();
  const corrective = {
    id: "possibility:correct",
    verb: "correct",
    subject: { id: "resource:1", type: "resource" },
    consequence: {
      effects: [{ id: "effect:correct", entity: "resource:1", property: "value", from: 2, to: 1 }],
      reversibility: "reversible",
      risk: 0.2,
      impact: 0.2,
    },
  };
  const original = structuredClone(transition);
  const plan = defineCompensation({ id: "compensation:1", original: transition, correctivePossibility: corrective, rationale: "Correct the prior change with a newly assessed action." });
  assert.equal(plan.correctivePossibility.id, "possibility:correct");
  assert.deepEqual(plan.originalEffectIds, ["effect:1"]);
  assert.deepEqual(transition, original);
});

test("temporal integrity chain detects content tampering and reordering without claiming authenticity", () => {
  const records = [temporalRecord("record:1"), temporalRecord("record:2")];
  const links = buildTemporalIntegrityChain(records);
  assert.deepEqual(verifyTemporalIntegrityChain(records, links), { valid: true, count: 2, headDigest: links[1].digest });
  const tampered = structuredClone(records);
  tampered[0].actorId = "attacker";
  assert.equal(verifyTemporalIntegrityChain(tampered, links).valid, false);
  assert.equal(verifyTemporalIntegrityChain([...records].reverse(), links).valid, false);
});
