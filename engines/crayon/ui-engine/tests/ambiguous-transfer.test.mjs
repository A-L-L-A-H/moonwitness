import test from "node:test";
import assert from "node:assert/strict";

import {
  createObservedOutcome,
  createWitness,
  knowledgeFromObservation,
  reconcileObservations,
  simulateTransition,
} from "../dist/packages/kernel/src/index.js";

import {
  assessCommitment,
} from "../dist/packages/physics/src/index.js";

function transferFixture() {
  const entities = [
    { id: "account:A", type: "bank-account", state: { balance: 50000 } },
    { id: "account:B", type: "bank-account", state: { balance: 10000 } },
  ];

  const consequence = {
    effects: [
      {
        id: "effect:debit",
        entity: "account:A",
        property: "balance",
        delta: -10012,
        description: "Debit amount plus fee",
      },
      {
        id: "effect:credit",
        entity: "account:B",
        property: "balance",
        delta: 10000,
        description: "Credit destination",
      },
    ],
    reversibility: "compensatable",
    risk: 0.7,
    impact: 0.65,
    uncertainty: 0.2,
  };

  const intent = {
    id: "intent:transfer-1",
    possibilityId: "possibility:transfer",
    actor: "user:1",
    createdAt: "2026-08-24T22:08:00+07:00",
  };

  return { entities, consequence, intent };
}

test("CRAYON models a predicted transfer before commitment", () => {
  const { entities, consequence, intent } = transferFixture();

  const transition = simulateTransition({
    id: "transition:transfer-1",
    entities,
    intent,
    consequence,
  });

  assert.equal(transition.before.entities["account:A"].balance, 50000);
  assert.equal(transition.before.entities["account:B"].balance, 10000);
  assert.equal(transition.prediction.state.entities["account:A"].balance, 39988);
  assert.equal(transition.prediction.state.entities["account:B"].balance, 20000);

  const commitment = assessCommitment({ consequence });
  assert.equal(commitment.mode, "explicit-preview");
  assert.ok(commitment.score > 0.4);
});

test("CRAYON explains why destination truth remains unknown after timeout", () => {
  const debitObservation = {
    id: "obs:debit",
    subject: { id: "account:A", type: "bank-account" },
    property: "balance",
    value: 39988,
    observedAt: "2026-08-24T22:08:10+07:00",
    source: "bank-A-api",
    reliability: 0.99,
  };

  const destinationUnknown = {
    id: "obs:credit",
    subject: { id: "account:B", type: "bank-account" },
    property: "balance",
    observedAt: "2026-08-24T22:08:12+07:00",
    source: "bank-B-api-timeout",
    reliability: 0.4,
  };

  const debitKnowledge = knowledgeFromObservation(debitObservation);
  const creditReconciliation = reconcileObservations({
    id: "knowledge:credit-status",
    key: "account:B.balance",
    observations: [destinationUnknown],
    evaluatedAt: "2026-08-24T22:08:15+07:00",
  });

  assert.equal(debitKnowledge.epistemic, "fact");
  assert.equal(debitKnowledge.value, 39988);
  assert.equal(creditReconciliation.knowledge.epistemic, "unknown");
  assert.equal(creditReconciliation.knowledge.value, undefined);
  assert.equal(
    creditReconciliation.reasons.some((reason) => reason.code === "NO_VALUE"),
    true,
  );
});

test("partial witness status is derived from observation coverage", () => {
  const { entities, consequence, intent } = transferFixture();

  const transition = simulateTransition({
    id: "transition:transfer-1",
    entities,
    intent,
    consequence,
  });

  const observed = createObservedOutcome({
    id: "outcome:transfer-1",
    observedAt: "2026-08-24T22:08:15+07:00",
    observations: [
      {
        id: "obs:source-after",
        subject: { id: "account:A", type: "bank-account" },
        property: "balance",
        value: 39988,
        observedAt: "2026-08-24T22:08:10+07:00",
        source: "bank-A-api",
        reliability: 0.99,
      },
      {
        id: "obs:destination-timeout",
        subject: { id: "account:B", type: "bank-account" },
        property: "balance",
        observedAt: "2026-08-24T22:08:12+07:00",
        source: "bank-B-api-timeout",
        reliability: 0.4,
      },
    ],
  });

  const witness = createWitness({
    id: "witness:transfer-1",
    transition,
    observed,
    actor: "user:1",
    happenedAt: "2026-08-24T22:08:15+07:00",
  });

  const sourceObservation = witness.observed.observations.find(
    (observation) => observation.subject.id === "account:A",
  );
  const destinationObservation = witness.observed.observations.find(
    (observation) => observation.subject.id === "account:B",
  );

  assert.equal(witness.status, "partial");
  assert.equal(witness.prediction.state.entities["account:B"].balance, 20000);
  assert.equal(sourceObservation?.value, 39988);
  assert.equal(destinationObservation?.value, undefined);
  assert.equal(Object.hasOwn(witness, "after"), false);
});
