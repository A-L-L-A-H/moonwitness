import test from "node:test";
import assert from "node:assert/strict";
import {
  createObservedOutcome,
  createTemporalRecord,
  createWitness,
  reconcileWitnessOutcome,
} from "../dist/packages/kernel/src/index.js";
import { createSemanticSnapshot } from "../dist/packages/snapshot/src/index.js";
import { planSituationRepresentation, renderRIRAsText } from "../dist/packages/rir/src/index.js";
import { inspectTemporalHistory } from "../dist/packages/inspector/src/index.js";

const actor = { id: "human:operator", kind: "human" };

function makeTransition({ id, entity, property, before, after, reversibility = "compensatable", impact = 0.6, risk = 0.4, uncertainty = 0.2 }) {
  return {
    id: `transition:${id}`,
    before: { entities: { [entity]: { [property]: before } } },
    prediction: {
      id: `prediction:${id}`,
      state: { entities: { [entity]: { [property]: after } } },
      effects: [{ id: `effect:${id}`, entity, property, from: before, to: after }],
    },
    preconditions: [],
    intent: { id: `intent:${id}`, possibilityId: `possibility:${id}`, actor: actor.id, createdAt: "2026-08-25T00:00:00Z" },
    consequence: { effects: [{ id: `effect:${id}`, entity, property, from: before, to: after }], reversibility, risk, impact, uncertainty },
  };
}
function observation(id, entity, property, value, observedAt = "2026-08-25T00:01:00Z") {
  return { id: `observation:${id}`, subject: { id: entity }, property, value, observedAt, source: `source:${id}`, reliability: 1, evidence: [{ id: `evidence:${id}`, source: `source:${id}`, observedAt }] };
}
function witnessFor(transition, observations) {
  const observed = createObservedOutcome({ id: `observed:${transition.id}`, observations, observedAt: "2026-08-25T00:01:00Z" });
  return createWitness({ id: `witness:${transition.id}`, transition, observed, actor: actor.id, happenedAt: "2026-08-25T00:01:00Z" });
}
function situationFor(id, entity, property, value) {
  return {
    id: `situation:${id}`, anchor: { id: entity, type: "subject" },
    entities: [{ id: entity, type: "subject", state: { name: entity, [property]: value } }], relations: [], observations: [], expectations: [],
    knowledge: [{ id: `knowledge:${id}`, key: `${entity}.${property}`, value, epistemic: "fact", certainty: 1 }],
    possibilities: [], now: "2026-08-25T00:03:00Z",
  };
}

test("delayed evidence reconciles outcome without rewriting historical prediction", () => {
  const transition = makeTransition({ id: "transfer", entity: "destination", property: "balance", before: 5800, after: 20000 });
  const witness = witnessFor(transition, [observation("timeout", "destination", "balance", undefined)]);
  assert.equal(witness.status, "unverified");
  const later = observation("settlement", "destination", "balance", 20000, "2026-08-25T00:03:00Z");
  const reconciliation = reconcileWitnessOutcome({ id: "reconciliation:settlement", witness, observations: [later], evaluatedAt: "2026-08-25T00:03:00Z" });
  assert.equal(reconciliation.status, "verified");
  const record = createTemporalRecord({ id: "temporal:transfer", transition, witness, reconciliations: [reconciliation] });
  assert.equal(record.prediction[0].value, 20000);
  assert.equal(record.observations[0].value, undefined);
  assert.equal(record.reconciliations[0].value, 20000);
  assert.equal(record.retry.status, "unnecessary");
  assert.ok(Object.isFrozen(record));
  assert.throws(() => { record.prediction[0].value = 1; }, TypeError);
});

test("conflicting observed outcome remains conflict and blocks retry", () => {
  const transition = makeTransition({ id: "erp-conflict", entity: "request", property: "state", before: "pending", after: "approved" });
  const witness = witnessFor(transition, [observation("actual", "request", "state", "rejected")]);
  assert.equal(witness.status, "conflicted");
  const record = createTemporalRecord({ id: "temporal:erp-conflict", transition, witness });
  assert.equal(record.retry.status, "blocked");
  assert.equal(record.retry.reason, "OUTCOME_CONFLICTED");
  assert.equal(record.retry.requiredAction, "investigate-before-retry");
});

test("partial distributed outcome is not collapsed into success/failure", () => {
  const transition = {
    ...makeTransition({ id: "distributed", entity: "node:a", property: "version", before: "v41", after: "v42" }),
    prediction: {
      id: "prediction:distributed",
      state: { entities: { "node:a": { version: "v42" }, "node:b": { version: "v42" } } },
      effects: [
        { id: "effect:a", entity: "node:a", property: "version", from: "v41", to: "v42" },
        { id: "effect:b", entity: "node:b", property: "version", from: "v41", to: "v42" },
      ],
    },
  };
  transition.consequence.effects = structuredClone(transition.prediction.effects);
  const witness = witnessFor(transition, [observation("node-a", "node:a", "version", "v42")]);
  assert.equal(witness.status, "partial");
  const record = createTemporalRecord({ id: "temporal:distributed", transition, witness });
  assert.equal(record.retry.status, "blocked");
  assert.equal(record.retry.reason, "OUTCOME_UNRESOLVED");
});

const domainFailures = [
  { id: "recursive-delete", entity: "tree:documents", property: "recoverability", before: "restorable", after: "expired", reversibility: "temporarily-reversible" },
  { id: "irreversible-send", entity: "message:42", property: "delivery", before: "draft", after: "sent", reversibility: "irreversible" },
  { id: "approval-chain", entity: "approval:stage-b", property: "state", before: "waiting", after: "approved", reversibility: "compensatable" },
  { id: "partial-rollout", entity: "fleet:prod", property: "version", before: "v41", after: "v42", reversibility: "compensatable" },
  { id: "agent-change", entity: "change:42", property: "state", before: "proposed", after: "applied", reversibility: "reversible" },
];

for (const item of domainFailures) {
  test(`${item.id} projects through the same temporal Snapshot → RIR → Inspector grammar`, () => {
    const transition = makeTransition({ ...item, impact: 0.8, risk: 0.55 });
    const witness = witnessFor(transition, [observation(`${item.id}:actual`, item.entity, item.property, item.after)]);
    const record = createTemporalRecord({ id: `temporal:${item.id}`, transition, witness });
    const situation = situationFor(item.id, item.entity, item.property, item.after);
    const snapshot = createSemanticSnapshot({ situation, actor, authorityRules: [], temporalRecords: [record] });
    assert.equal(snapshot.history.length, 1);
    const document = planSituationRepresentation({ situation, snapshot });
    assert.ok(document.nodes.some((node) => node.kind === "layer" && node.purpose === "history"));
    assert.match(renderRIRAsText(document), /HISTORY/);
    const history = inspectTemporalHistory(snapshot);
    assert.equal(history[0].witnessStatus, "verified");
    assert.equal(history[0].events[0].key, `${item.entity}.${item.property}`);
  });
}

test("corrective follow-up is a new record and never rewrites original irreversible send", () => {
  const send = makeTransition({ id: "send", entity: "message:42", property: "delivery", before: "draft", after: "sent", reversibility: "irreversible", impact: 0.75 });
  const sendWitness = witnessFor(send, [observation("sent", "message:42", "delivery", "sent")]);
  const correction = makeTransition({ id: "correction", entity: "message:43", property: "delivery", before: "draft", after: "sent", reversibility: "irreversible", impact: 0.55 });
  const correctionWitness = witnessFor(correction, [observation("correction-sent", "message:43", "delivery", "sent")]);
  const first = createTemporalRecord({ id: "temporal:send", transition: send, witness: sendWitness });
  const second = createTemporalRecord({ id: "temporal:correction", transition: correction, witness: correctionWitness });
  assert.equal(first.prediction[0].value, "sent");
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.transitionId, second.transitionId);
});
