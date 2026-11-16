import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateTransitionReadiness,
  simulateTransition,
} from "../dist/packages/kernel/src/index.js";

function intent() {
  return {
    id: "intent:1",
    possibilityId: "possibility:1",
    actor: "user:1",
    createdAt: "2026-08-24T22:20:00+07:00",
  };
}

test("changed state makes a previously simulated transition stale", () => {
  const transition = simulateTransition({
    id: "transition:transfer",
    entities: [
      { id: "account:A", type: "account", state: { balance: 50000 } },
    ],
    intent: intent(),
    consequence: {
      effects: [
        {
          id: "effect:debit",
          entity: "account:A",
          property: "balance",
          delta: -10000,
        },
      ],
      reversibility: "compensatable",
      risk: 0.7,
      impact: 0.6,
    },
  });

  const readiness = evaluateTransitionReadiness({
    transition,
    currentEntities: [
      { id: "account:A", type: "account", state: { balance: 42000 } },
    ],
    evaluatedAt: "2026-08-24T22:21:00+07:00",
  });

  assert.equal(readiness.status, "stale");
  assert.equal(readiness.requiredAction, "reobserve-and-resimulate");
  assert.equal(readiness.failures.length, 1);
  assert.equal(readiness.failures[0].expected, 50000);
  assert.equal(readiness.failures[0].actual, 42000);
});

test("explicit version assertion detects concurrent modification", () => {
  const transition = simulateTransition({
    id: "transition:document",
    entities: [
      {
        id: "document:1",
        type: "document",
        state: { title: "Draft", version: 7 },
      },
    ],
    intent: intent(),
    consequence: {
      effects: [
        {
          id: "effect:title",
          entity: "document:1",
          property: "title",
          to: "Final",
        },
      ],
      reversibility: "reversible",
      risk: 0.1,
      impact: 0.2,
    },
    preconditions: [
      {
        id: "precondition:document-version",
        entity: "document:1",
        property: "version",
        expected: 7,
        source: "explicit",
      },
    ],
  });

  const readiness = evaluateTransitionReadiness({
    transition,
    currentEntities: [
      {
        id: "document:1",
        type: "document",
        state: { title: "Draft", version: 8 },
      },
    ],
    evaluatedAt: "2026-08-24T22:21:00+07:00",
  });

  assert.equal(readiness.status, "stale");
  assert.equal(readiness.failures[0].property, "version");
  assert.equal(readiness.failures[0].expected, 7);
  assert.equal(readiness.failures[0].actual, 8);
});

test("unchanged world remains valid for commitment", () => {
  const entities = [
    { id: "record:1", type: "record", state: { status: "draft" } },
  ];

  const transition = simulateTransition({
    id: "transition:publish",
    entities,
    intent: intent(),
    consequence: {
      effects: [
        {
          id: "effect:publish",
          entity: "record:1",
          property: "status",
          to: "published",
        },
      ],
      reversibility: "reversible",
      risk: 0.1,
      impact: 0.2,
    },
  });

  const readiness = evaluateTransitionReadiness({
    transition,
    currentEntities: entities,
    evaluatedAt: "2026-08-24T22:21:00+07:00",
  });

  assert.equal(readiness.status, "valid");
  assert.deepEqual(readiness.failures, []);
});
