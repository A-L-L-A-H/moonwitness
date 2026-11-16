import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateAuthority,
} from "../dist/packages/kernel/src/index.js";

const subject = { id: "record:1", type: "record" };

const agent = {
  id: "actor:agent-1",
  kind: "agent",
  attributes: { reasoningScore: 1 },
};

const human = {
  id: "actor:human-1",
  kind: "human",
};

const service = {
  id: "actor:service-1",
  kind: "service",
};

const baseRules = [
  {
    id: "rule:agent-observe-propose",
    effect: "allow",
    actors: { ids: [agent.id] },
    capabilities: ["observe", "propose"],
    scope: { subjectTypes: ["record"] },
    reason: "May inspect and suggest changes",
  },
  {
    id: "rule:human-intend-commit",
    effect: "allow",
    actors: { ids: [human.id] },
    capabilities: ["intend", "commit"],
    scope: { subjectTypes: ["record"] },
  },
  {
    id: "rule:service-execute",
    effect: "allow",
    actors: { ids: [service.id] },
    capabilities: ["execute"],
    scope: { subjectIds: [subject.id] },
  },
];

test("agent intelligence does not imply commit authority", () => {
  const propose = evaluateAuthority({
    request: { actor: agent, capability: "propose", subject },
    rules: baseRules,
  });

  const commit = evaluateAuthority({
    request: { actor: agent, capability: "commit", subject },
    rules: baseRules,
  });

  assert.equal(propose.status, "allowed");
  assert.equal(propose.reasons[0].code, "EXPLICIT_ALLOW");
  assert.equal(commit.status, "unknown");
  assert.equal(commit.reasons[0].code, "NO_MATCHING_RULE");
});

test("explicit deny overrides a matching allow", () => {
  const decision = evaluateAuthority({
    request: { actor: human, capability: "commit", subject },
    rules: [
      ...baseRules,
      {
        id: "rule:restricted-subject",
        effect: "deny",
        actors: { ids: [human.id] },
        capabilities: ["commit"],
        scope: { subjectIds: [subject.id] },
        reason: "Protected subject requires a different authority path",
      },
    ],
  });

  assert.equal(decision.status, "denied");
  assert.equal(
    decision.reasons.some((reason) => reason.code === "EXPLICIT_DENY"),
    true,
  );
  assert.equal(
    decision.reasons.some((reason) => reason.code === "DENY_OVERRIDES_ALLOW"),
    true,
  );
});

test("scope mismatch remains unknown rather than becoming implicit allow", () => {
  const decision = evaluateAuthority({
    request: {
      actor: service,
      capability: "execute",
      subject: { id: "record:2", type: "record" },
    },
    rules: baseRules,
  });

  assert.equal(decision.status, "unknown");
  assert.deepEqual(decision.matchedRuleIds, []);
  assert.equal(decision.reasons[0].code, "NO_MATCHING_RULE");
});

test("capabilities remain independent", () => {
  const execute = evaluateAuthority({
    request: { actor: service, capability: "execute", subject },
    rules: baseRules,
  });

  const verify = evaluateAuthority({
    request: { actor: service, capability: "verify", subject },
    rules: baseRules,
  });

  assert.equal(execute.status, "allowed");
  assert.equal(verify.status, "unknown");
});
