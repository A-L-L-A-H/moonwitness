import test from "node:test";
import assert from "node:assert/strict";

import {
  assessPossibility,
  evaluateConstraints,
} from "../dist/packages/kernel/src/index.js";

const actor = { id: "human:1", kind: "human" };

function possibility(overrides = {}) {
  return {
    id: "possibility:change",
    verb: "change",
    subject: { id: "resource:1", type: "resource" },
    constraints: [
      {
        id: "constraint:ready",
        knowledgeKey: "resource:1.state",
        operator: "equals",
        expected: "ready",
      },
    ],
    authority: [{ capability: "intend" }],
    consequence: {
      effects: [],
      reversibility: "reversible",
      risk: 0.1,
      impact: 0.1,
    },
    ...overrides,
  };
}

const allowIntend = [
  {
    id: "rule:allow-intend",
    effect: "allow",
    capabilities: ["intend"],
    actors: { ids: ["human:1"] },
    scope: { subjectIds: ["resource:1"] },
  },
];

const readyKnowledge = [
  {
    id: "knowledge:ready",
    key: "resource:1.state",
    value: "ready",
    epistemic: "fact",
    certainty: 1,
  },
];

test("possibility is available only when constraints and authority are established", () => {
  const result = assessPossibility({
    possibility: possibility(),
    actor,
    knowledge: readyKnowledge,
    authorityRules: allowIntend,
  });

  assert.equal(result.status, "available");
  assert.equal(result.constraints.status, "satisfied");
  assert.equal(result.authority[0].status, "allowed");
  assert.deepEqual(result.reasons, []);
});

test("failed constraint makes possibility unavailable even with authority", () => {
  const result = assessPossibility({
    possibility: possibility(),
    actor,
    knowledge: [
      {
        id: "knowledge:not-ready",
        key: "resource:1.state",
        value: "processing",
        epistemic: "fact",
        certainty: 1,
      },
    ],
    authorityRules: allowIntend,
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.constraints.status, "failed");
  assert.equal(
    result.reasons.some((reason) => reason.code === "CONSTRAINT_FAILED"),
    true,
  );
});

test("missing knowledge yields unknown rather than false availability", () => {
  const result = assessPossibility({
    possibility: possibility(),
    actor,
    knowledge: [],
    authorityRules: allowIntend,
  });

  assert.equal(result.status, "unknown");
  assert.equal(result.constraints.status, "unknown");
  assert.equal(result.constraints.checks[0].reason, "MISSING_KNOWLEDGE");
});

test("unknown authority yields unknown even when constraints are satisfied", () => {
  const result = assessPossibility({
    possibility: possibility(),
    actor,
    knowledge: readyKnowledge,
    authorityRules: [],
  });

  assert.equal(result.status, "unknown");
  assert.equal(result.authority[0].status, "unknown");
  assert.equal(
    result.reasons.some((reason) => reason.code === "AUTHORITY_UNKNOWN"),
    true,
  );
});

test("explicit authority denial makes possibility unavailable", () => {
  const result = assessPossibility({
    possibility: possibility(),
    actor,
    knowledge: readyKnowledge,
    authorityRules: [
      ...allowIntend,
      {
        id: "rule:deny-intend",
        effect: "deny",
        capabilities: ["intend"],
        actors: { ids: ["human:1"] },
        scope: { subjectIds: ["resource:1"] },
      },
    ],
  });

  assert.equal(result.status, "unavailable");
  assert.equal(result.authority[0].status, "denied");
  assert.equal(
    result.reasons.some((reason) => reason.code === "AUTHORITY_DENIED"),
    true,
  );
});

test("epistemic uncertainty is not accepted by a strict constraint by default", () => {
  const evaluation = evaluateConstraints({
    constraints: possibility().constraints,
    knowledge: [
      {
        id: "knowledge:estimate",
        key: "resource:1.state",
        value: "ready",
        epistemic: "estimate",
        certainty: 0.7,
      },
    ],
  });

  assert.equal(evaluation.status, "unknown");
  assert.equal(
    evaluation.checks[0].reason,
    "EPISTEMIC_STATE_NOT_ACCEPTED",
  );
});

test("caller-provided availability flag cannot forge an actionable possibility", () => {
  const forged = possibility({ available: true });

  const result = assessPossibility({
    possibility: forged,
    actor,
    knowledge: [],
    authorityRules: [],
  });

  assert.equal(result.status, "unknown");
});

test("omitting authority requirements cannot bypass intend authority", () => {
  const noAuthorityField = possibility({ authority: undefined });

  const unknown = assessPossibility({
    possibility: noAuthorityField,
    actor,
    knowledge: readyKnowledge,
    authorityRules: [],
  });

  assert.equal(unknown.status, "unknown");
  assert.equal(unknown.authority.length, 1);
  assert.equal(unknown.authority[0].request.capability, "intend");

  const allowed = assessPossibility({
    possibility: noAuthorityField,
    actor,
    knowledge: readyKnowledge,
    authorityRules: allowIntend,
  });

  assert.equal(allowed.status, "available");
});

test("empty authority list cannot bypass intend authority", () => {
  const result = assessPossibility({
    possibility: possibility({ authority: [] }),
    actor,
    knowledge: readyKnowledge,
    authorityRules: [],
  });

  assert.equal(result.status, "unknown");
  assert.equal(result.authority[0].request.capability, "intend");
});

test("non-intend authority requirements cannot replace intend authority", () => {
  const observeOnly = possibility({ authority: [{ capability: "observe" }] });
  const observeRule = {
    id: "rule:observe-only",
    effect: "allow",
    capabilities: ["observe"],
    actors: { ids: ["human:1"] },
    scope: { subjectIds: ["resource:1"] },
  };

  const result = assessPossibility({
    possibility: observeOnly,
    actor,
    knowledge: readyKnowledge,
    authorityRules: [observeRule],
  });

  assert.equal(result.status, "unknown");
  assert.equal(
    result.authority.some(
      (decision) =>
        decision.request.capability === "intend" && decision.status === "unknown",
    ),
    true,
  );
  assert.equal(
    result.authority.some(
      (decision) =>
        decision.request.capability === "observe" && decision.status === "allowed",
    ),
    true,
  );
});

test("missing value cannot satisfy not-equals constraint", () => {
  const evaluation = evaluateConstraints({
    constraints: [
      {
        id: "constraint:not-blocked",
        knowledgeKey: "resource:1.state",
        operator: "not-equals",
        expected: "blocked",
      },
    ],
    knowledge: [
      {
        id: "knowledge:missing-value",
        key: "resource:1.state",
        epistemic: "fact",
        certainty: 1,
      },
    ],
  });

  assert.equal(evaluation.status, "unknown");
  assert.equal(evaluation.checks[0].reason, "MISSING_VALUE");
});
