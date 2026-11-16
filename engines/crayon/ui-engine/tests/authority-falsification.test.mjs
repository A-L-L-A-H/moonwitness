import test from "node:test";
import assert from "node:assert/strict";

import {
  beginExecution,
  evaluateAuthority,
  simulateTransition,
} from "../dist/packages/kernel/src/index.js";

const protectedSubject = { id: "subject:protected", type: "resource" };
const otherSubject = { id: "subject:other", type: "resource" };

const agent = { id: "actor:agent", kind: "agent" };
const human = { id: "actor:human", kind: "human" };
const executor = { id: "actor:executor", kind: "service" };
const verifier = { id: "actor:verifier", kind: "service" };
const overrideActor = { id: "actor:override", kind: "human" };

const rules = [
  {
    id: "rule:agent-observe-propose",
    effect: "allow",
    actors: { ids: [agent.id] },
    capabilities: ["observe", "propose"],
    scope: { subjectTypes: ["resource"] },
    reason: "Agent may inspect and prepare proposals only",
  },
  {
    id: "rule:human-intend",
    effect: "allow",
    actors: { ids: [human.id] },
    capabilities: ["intend"],
    scope: { subjectIds: [protectedSubject.id] },
    reason: "Human may form intent for this subject",
  },
  {
    id: "rule:executor-execute",
    effect: "allow",
    actors: { ids: [executor.id] },
    capabilities: ["execute"],
    scope: { subjectIds: [protectedSubject.id] },
    reason: "Service is delegated execution only",
  },
  {
    id: "rule:verifier-verify",
    effect: "allow",
    actors: { ids: [verifier.id] },
    capabilities: ["verify"],
    scope: { subjectIds: [protectedSubject.id] },
    reason: "Verifier may attest observed outcome only",
  },
  {
    id: "rule:scoped-override",
    effect: "allow",
    actors: { ids: [overrideActor.id] },
    capabilities: ["override"],
    scope: {
      subjectIds: [protectedSubject.id],
      situationIds: ["situation:exception"],
    },
    reason: "Explicit exceptional override for one subject and situation",
  },
];

function authority(actor, capability, subject = protectedSubject, situationId) {
  return evaluateAuthority({
    request: { actor, capability, subject, situationId },
    rules,
  });
}

test("agent may observe and propose but cannot commit", () => {
  assert.equal(authority(agent, "observe").status, "allowed");
  assert.equal(authority(agent, "propose").status, "allowed");
  assert.equal(authority(agent, "commit").status, "unknown");
});

test("human intent authority does not imply commit authority", () => {
  assert.equal(authority(human, "intend").status, "allowed");
  assert.equal(authority(human, "commit").status, "unknown");
});

test("execution capability does not allow a raw transition to start", () => {
  assert.equal(authority(executor, "execute").status, "allowed");

  const currentEntities = [
    { id: protectedSubject.id, type: "resource", state: { value: 1 } },
  ];
  const transition = simulateTransition({
    id: "transition:raw",
    entities: currentEntities,
    intent: {
      id: "intent:raw",
      possibilityId: "possibility:raw",
      actor: human.id,
      createdAt: "2026-08-24T23:15:00+07:00",
    },
    consequence: {
      effects: [
        {
          id: "effect:raw",
          entity: protectedSubject.id,
          property: "value",
          from: 1,
          to: 2,
        },
      ],
      reversibility: "reversible",
      risk: 0.1,
      impact: 0.1,
    },
  });

  const start = beginExecution({
    id: "lease:raw",
    request: transition,
    currentEntities,
    startedAt: "2026-08-24T23:15:01+07:00",
  });

  assert.equal(start.status, "rejected");
  assert.equal(start.reason, "INVALID_EXECUTION_REQUEST");
});

test("verifier can verify without receiving execute capability", () => {
  assert.equal(authority(verifier, "verify").status, "allowed");
  assert.equal(authority(verifier, "execute").status, "unknown");
});

test("override is explicit and remains narrowly scoped", () => {
  const allowed = authority(
    overrideActor,
    "override",
    protectedSubject,
    "situation:exception",
  );
  const wrongSituation = authority(
    overrideActor,
    "override",
    protectedSubject,
    "situation:normal",
  );
  const wrongSubject = authority(
    overrideActor,
    "override",
    otherSubject,
    "situation:exception",
  );

  assert.equal(allowed.status, "allowed");
  assert.equal(wrongSituation.status, "unknown");
  assert.equal(wrongSubject.status, "unknown");
});

test("explicit deny wins over allow and explanation identifies both paths", () => {
  const decision = evaluateAuthority({
    request: {
      actor: overrideActor,
      capability: "override",
      subject: protectedSubject,
      situationId: "situation:exception",
    },
    rules: [
      ...rules,
      {
        id: "rule:emergency-freeze",
        effect: "deny",
        actors: { ids: [overrideActor.id] },
        capabilities: ["override"],
        scope: {
          subjectIds: [protectedSubject.id],
          situationIds: ["situation:exception"],
        },
        reason: "Emergency freeze prohibits override",
      },
    ],
  });

  assert.equal(decision.status, "denied");
  assert.equal(decision.matchedRuleIds.includes("rule:scoped-override"), true);
  assert.equal(decision.matchedRuleIds.includes("rule:emergency-freeze"), true);
  assert.equal(
    decision.reasons.some((reason) => reason.code === "EXPLICIT_DENY"),
    true,
  );
  assert.equal(
    decision.reasons.some((reason) => reason.code === "DENY_OVERRIDES_ALLOW"),
    true,
  );
});

test("unknown authority is never promoted to allow", () => {
  const unknown = evaluateAuthority({
    request: {
      actor: { id: "actor:unknown", kind: "agent" },
      capability: "commit",
      subject: protectedSubject,
    },
    rules,
  });

  assert.equal(unknown.status, "unknown");
  assert.deepEqual(unknown.matchedRuleIds, []);
  assert.equal(unknown.reasons[0].code, "NO_MATCHING_RULE");
});

test("authority explanation preserves the grant that produced an allow", () => {
  const decision = authority(agent, "propose");

  assert.equal(decision.status, "allowed");
  assert.equal(decision.matchedRuleIds.includes("rule:agent-observe-propose"), true);
  assert.equal(decision.reasons[0].code, "EXPLICIT_ALLOW");
  assert.equal(decision.reasons[0].ruleId, "rule:agent-observe-propose");
  assert.equal(
    decision.reasons[0].detail.reason,
    "Agent may inspect and prepare proposals only",
  );
});
