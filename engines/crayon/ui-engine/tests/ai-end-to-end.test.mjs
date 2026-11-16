import test from "node:test";
import assert from "node:assert/strict";
import {
  beginExecution,
  createCommitmentRecord,
  createExecutionObservationBatch,
  createObservedOutcome,
  createTemporalRecord,
  createWitness,
  evaluateAuthority,
  prepareExecution,
  simulateTransition,
} from "../dist/packages/kernel/src/index.js";

const agent = { id: "agent:builder", kind: "agent" };
const human = { id: "human:reviewer", kind: "human" };
const service = { id: "service:executor", kind: "service" };
const rules = [
  { id: "agent-reason", effect: "allow", capabilities: ["observe", "propose"], actors: { ids: [agent.id] } },
  { id: "human-agency", effect: "allow", capabilities: ["intend", "commit"], actors: { ids: [human.id] }, scope: { situationIds: ["situation:ai"] } },
  { id: "service-execution", effect: "allow", capabilities: ["execute"], actors: { ids: [service.id] }, scope: { situationIds: ["situation:ai"] } },
];

test("AI proposal requires human commitment and evidence-derived service outcome", () => {
  const subject = { id: "change:42", type: "proposed-change" };
  const entities = [{ id: subject.id, type: subject.type, state: { state: "proposed" } }];
  const consequence = { effects: [{ id: "effect:apply", entity: subject.id, property: "state", from: "proposed", to: "applied" }], reversibility: "reversible", risk: 0.3, impact: 0.5, uncertainty: 0.2 };
  const possibility = { id: "possibility:accept", verb: "Accept proposed change", subject, consequence };
  const intent = { id: "intent:accept", possibilityId: possibility.id, actor: human.id, createdAt: "2026-08-25T00:00:00Z" };
  const transition = simulateTransition({ id: "transition:accept", entities, intent, consequence });

  assert.equal(evaluateAuthority({ request: { actor: agent, capability: "commit", subject, situationId: "situation:ai" }, rules }).status, "unknown");
  const commitment = createCommitmentRecord({ id: "commitment:accept", actor: human, transition, committedAt: "2026-08-25T00:00:30Z", assessment: { score: 0.5, mode: "explicit-preview", reasons: { risk: 0.3, impact: 0.5, irreversibility: 0.05, uncertainty: 0.2, authorityCost: 0 } } });
  const prepared = prepareExecution({ id: "request:accept", transition, possibility, currentEntities: entities, knowledge: [], committer: human, executor: service, commitment, authorityRules: rules, situationId: "situation:ai", evaluatedAt: "2026-08-25T00:00:40Z" });
  assert.equal(prepared.status, "ready");
  const started = beginExecution({ id: "lease:accept", request: prepared.request, currentEntities: entities, startedAt: "2026-08-25T00:00:50Z" });
  assert.equal(started.status, "started");
  const batch = createExecutionObservationBatch({
    id: "batch:accept", lease: started.lease, observedAt: "2026-08-25T00:01:00Z",
    observations: [{ id: "observation:actual", subject, property: "state", value: "applied-with-warning", observedAt: "2026-08-25T00:01:00Z", source: service.id, reliability: 1 }],
  });
  const observed = createObservedOutcome({ id: "observed:accept", observations: batch.observations, observedAt: batch.observedAt });
  const witness = createWitness({ id: "witness:accept", transition, observed, actor: service.id, happenedAt: batch.observedAt });
  assert.equal(witness.status, "conflicted");
  const record = createTemporalRecord({ id: "temporal:accept", transition, witness });
  assert.equal(record.prediction[0].value, "applied");
  assert.equal(record.observations[0].value, "applied-with-warning");
  assert.equal(record.retry.requiredAction, "investigate-before-retry");
});
