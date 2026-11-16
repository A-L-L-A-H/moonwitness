import test from "node:test";
import assert from "node:assert/strict";

import {
  assessRetrySafety,
  createObservedOutcome,
  createWitness,
  reconcileWitnessOutcome,
  simulateTransition,
} from "../dist/packages/kernel/src/index.js";

function buildTransition() {
  const entities = [
    { id: "account:A", type: "account", state: { balance: 50000 } },
    { id: "account:B", type: "account", state: { balance: 10000 } },
  ];

  return simulateTransition({
    id: "transition:transfer-retry",
    entities,
    intent: {
      id: "intent:transfer-retry",
      possibilityId: "possibility:transfer",
      actor: "user:1",
      createdAt: "2026-08-24T22:30:00+07:00",
    },
    consequence: {
      effects: [
        {
          id: "effect:debit",
          entity: "account:A",
          property: "balance",
          delta: -10012,
        },
        {
          id: "effect:credit",
          entity: "account:B",
          property: "balance",
          delta: 10000,
        },
      ],
      reversibility: "compensatable",
      risk: 0.7,
      impact: 0.65,
      uncertainty: 0.4,
    },
  });
}

function buildPartialTransferWitness() {
  const transition = buildTransition();

  const observed = createObservedOutcome({
    id: "outcome:transfer-retry",
    observedAt: "2026-08-24T22:30:15+07:00",
    observations: [
      {
        id: "obs:source-debited",
        subject: { id: "account:A" },
        property: "balance",
        value: 39988,
        observedAt: "2026-08-24T22:30:10+07:00",
        source: "bank-A-api",
        reliability: 0.99,
      },
      {
        id: "obs:destination-timeout",
        subject: { id: "account:B" },
        property: "balance",
        observedAt: "2026-08-24T22:30:12+07:00",
        source: "bank-B-api-timeout",
        reliability: 0.4,
      },
    ],
  });

  return createWitness({
    id: "witness:transfer-retry",
    transition,
    observed,
    actor: "user:1",
    happenedAt: "2026-08-24T22:30:15+07:00",
  });
}

test("caller cannot forge verified status without evidence", () => {
  const transition = buildTransition();

  const observed = createObservedOutcome({
    id: "outcome:forged",
    status: "verified",
    observedAt: "2026-08-24T22:30:15+07:00",
    observations: [],
  });

  assert.equal(Object.hasOwn(observed, "status"), false);

  const witness = createWitness({
    id: "witness:forged",
    transition,
    observed,
    actor: "user:1",
    happenedAt: "2026-08-24T22:30:15+07:00",
  });

  assert.equal(witness.status, "unverified");
});

test("retry is blocked while prior transfer outcome remains unresolved", () => {
  const witness = buildPartialTransferWitness();
  const retry = assessRetrySafety({ witness });

  assert.equal(witness.status, "partial");
  assert.equal(retry.status, "blocked");
  assert.equal(retry.reason, "OUTCOME_UNRESOLVED");
  assert.equal(retry.requiredAction, "reconcile-before-retry");
});

test("later observations reconcile outcome without rewriting historical witness", () => {
  const witness = buildPartialTransferWitness();
  const historicalWitness = structuredClone(witness);

  const reconciliation = reconcileWitnessOutcome({
    id: "reconciliation:transfer-retry",
    witness,
    evaluatedAt: "2026-08-24T22:35:00+07:00",
    observations: [
      {
        id: "obs:source-confirmed-later",
        subject: { id: "account:A" },
        property: "balance",
        value: 39988,
        observedAt: "2026-08-24T22:34:50+07:00",
        source: "bank-A-api",
        reliability: 0.99,
      },
      {
        id: "obs:destination-confirmed-later",
        subject: { id: "account:B" },
        property: "balance",
        value: 20000,
        observedAt: "2026-08-24T22:34:52+07:00",
        source: "bank-B-api",
        reliability: 0.99,
      },
    ],
  });

  assert.equal(reconciliation.status, "verified");
  assert.equal(
    reconciliation.checks.every((check) => check.matchesPrediction === true),
    true,
  );

  assert.deepEqual(witness, historicalWitness);
  assert.equal(witness.status, "partial");
  assert.equal(
    witness.observed.observations.find(
      (observation) => observation.subject.id === "account:B",
    )?.value,
    undefined,
  );

  const retry = assessRetrySafety({ witness, reconciliation });
  assert.equal(retry.status, "unnecessary");
  assert.equal(retry.reason, "OUTCOME_VERIFIED");
  assert.equal(retry.requiredAction, "do-not-retry");
});
