import test from "node:test";
import assert from "node:assert/strict";

import {
  beginExecution,
  createCommitmentRecord,
  createExecutionObservationBatch,
  isCommitmentRecord,
  isExecutionLease,
  isValidatedExecutionRequest,
  prepareExecution,
  simulateTransition,
} from "../dist/packages/kernel/src/index.js";

function fixture() {
  const currentEntities = [
    { id: "resource:1", type: "resource", state: { value: 1 } },
  ];

  const transition = simulateTransition({
    id: "transition:1",
    entities: currentEntities,
    intent: {
      id: "intent:1",
      possibilityId: "possibility:1",
      actor: "human:1",
      createdAt: "2026-08-24T23:00:00+07:00",
    },
    consequence: {
      effects: [
        {
          id: "effect:1",
          entity: "resource:1",
          property: "value",
          from: 1,
          to: 2,
        },
      ],
      reversibility: "reversible",
      risk: 0.1,
      impact: 0.2,
    },
  });

  const possibility = {
    id: "possibility:1",
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
    consequence: transition.consequence,
  };

  const committer = { id: "human:1", kind: "human" };
  const executor = { id: "service:1", kind: "service" };

  const knowledge = [
    {
      id: "knowledge:ready",
      key: "resource:1.state",
      value: "ready",
      epistemic: "fact",
      certainty: 1,
    },
  ];

  const authorityRules = [
    {
      id: "rule:human-agency",
      effect: "allow",
      capabilities: ["intend", "commit"],
      actors: { ids: ["human:1"] },
      scope: { subjectIds: ["resource:1"] },
    },
    {
      id: "rule:service-execute",
      effect: "allow",
      capabilities: ["execute"],
      actors: { ids: ["service:1"] },
      scope: { subjectIds: ["resource:1"] },
    },
  ];

  const assessment = {
    score: 0.2,
    mode: "visible-consequence",
    reasons: {
      risk: 0.1,
      impact: 0.2,
      irreversibility: 0.05,
      uncertainty: 0,
      authorityCost: 0,
    },
  };

  const commitment = createCommitmentRecord({
    id: "commitment:1",
    actor: committer,
    transition,
    committedAt: "2026-08-24T23:00:05+07:00",
    assessment,
  });

  return {
    currentEntities,
    transition,
    possibility,
    committer,
    executor,
    knowledge,
    authorityRules,
    assessment,
    commitment,
  };
}

function prepare(overrides = {}) {
  const base = fixture();
  return prepareExecution({
    id: "execution-request:1",
    transition: base.transition,
    possibility: base.possibility,
    currentEntities: base.currentEntities,
    knowledge: base.knowledge,
    committer: base.committer,
    executor: base.executor,
    commitment: base.commitment,
    authorityRules: base.authorityRules,
    situationId: "situation:1",
    evaluatedAt: "2026-08-24T23:00:06+07:00",
    ...overrides,
  });
}

test("validated execution request is produced only after all gates pass", () => {
  const result = prepare();

  assert.equal(result.status, "ready");
  assert.equal(isValidatedExecutionRequest(result.request), true);
  assert.equal(result.request.readiness.status, "valid");
  assert.equal(result.request.possibility.status, "available");
  assert.equal(result.request.commitAuthority.status, "allowed");
  assert.equal(result.request.executeAuthority.status, "allowed");
});

test("stale transition is rejected during preparation", () => {
  const result = prepare({
    currentEntities: [
      { id: "resource:1", type: "resource", state: { value: 9 } },
    ],
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.readiness.status, "stale");
  assert.equal(
    result.reasons.some((reason) => reason.code === "TRANSITION_STALE"),
    true,
  );
});

test("unknown possibility is rejected rather than treated as actionable", () => {
  const result = prepare({ knowledge: [] });

  assert.equal(result.status, "rejected");
  assert.equal(result.possibility.status, "unknown");
  assert.equal(
    result.reasons.some((reason) => reason.code === "POSSIBILITY_UNKNOWN"),
    true,
  );
});

test("missing commit authority rejects execution", () => {
  const base = fixture();
  const result = prepareExecution({
    id: "execution-request:no-commit",
    ...base,
    authorityRules: base.authorityRules.map((rule) =>
      rule.id === "rule:human-agency"
        ? { ...rule, capabilities: ["intend"] }
        : rule,
    ),
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.commitAuthority.status, "unknown");
  assert.equal(
    result.reasons.some((reason) => reason.code === "COMMIT_AUTHORITY_UNKNOWN"),
    true,
  );
});

test("explicit execute denial rejects execution", () => {
  const base = fixture();
  const result = prepareExecution({
    id: "execution-request:denied-execute",
    ...base,
    authorityRules: [
      ...base.authorityRules,
      {
        id: "rule:deny-execute",
        effect: "deny",
        capabilities: ["execute"],
        actors: { ids: ["service:1"] },
        scope: { subjectIds: ["resource:1"] },
      },
    ],
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.executeAuthority.status, "denied");
});

test("transition cannot borrow a different possibility identity", () => {
  const base = fixture();
  const result = prepareExecution({
    id: "execution-request:mismatched-id",
    ...base,
    possibility: { ...base.possibility, id: "possibility:safe-looking" },
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });

  assert.equal(result.status, "rejected");
  assert.equal(
    result.reasons.some(
      (reason) => reason.code === "TRANSITION_POSSIBILITY_MISMATCH",
    ),
    true,
  );
});

test("transition consequence must match the assessed possibility consequence", () => {
  const base = fixture();
  const result = prepareExecution({
    id: "execution-request:mismatched-consequence",
    ...base,
    possibility: {
      ...base.possibility,
      consequence: {
        ...base.possibility.consequence,
        effects: [],
        risk: 0,
        impact: 0,
      },
    },
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });

  assert.equal(result.status, "rejected");
  assert.equal(
    result.reasons.some(
      (reason) => reason.code === "TRANSITION_POSSIBILITY_MISMATCH",
    ),
    true,
  );
});

test("commitment for another actor cannot authorize execution", () => {
  const base = fixture();
  const wrongCommitment = createCommitmentRecord({
    id: "commitment:wrong-actor",
    actor: { id: "human:other", kind: "human" },
    transition: base.transition,
    committedAt: "2026-08-24T23:00:05+07:00",
    assessment: base.assessment,
  });

  const result = prepareExecution({
    id: "execution-request:wrong-actor",
    ...base,
    commitment: wrongCommitment,
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });

  assert.equal(result.status, "rejected");
  assert.equal(
    result.reasons.some((reason) => reason.code === "COMMITMENT_ACTOR_MISMATCH"),
    true,
  );
});

test("plain object cannot forge a commitment record", () => {
  const base = fixture();
  const forged = {
    id: "commitment:forged",
    actorId: base.committer.id,
    transitionId: base.transition.id,
    committedAt: "2026-08-24T23:00:05+07:00",
    assessment: base.assessment,
  };

  assert.equal(isCommitmentRecord(forged), false);

  const result = prepareExecution({
    id: "execution-request:forged-commitment",
    ...base,
    commitment: forged,
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });

  assert.equal(result.status, "rejected");
  assert.equal(
    result.reasons.some((reason) => reason.code === "INVALID_COMMITMENT_RECORD"),
    true,
  );
});

test("raw transition cannot become an execution lease", () => {
  const base = fixture();
  const start = beginExecution({
    id: "lease:raw",
    request: base.transition,
    currentEntities: base.currentEntities,
    startedAt: "2026-08-24T23:00:07+07:00",
  });

  assert.equal(start.status, "rejected");
  assert.equal(start.reason, "INVALID_EXECUTION_REQUEST");
});

test("copy of a valid execution request is not a valid execution capability", () => {
  const gate = prepare();
  assert.equal(gate.status, "ready");

  const copied = { ...gate.request };
  assert.equal(isValidatedExecutionRequest(copied), false);

  const start = beginExecution({
    id: "lease:copied",
    request: copied,
    currentEntities: fixture().currentEntities,
    startedAt: "2026-08-24T23:00:07+07:00",
  });

  assert.equal(start.status, "rejected");
  assert.equal(start.reason, "INVALID_EXECUTION_REQUEST");
});

test("validated execution request is deeply immutable at runtime", () => {
  const gate = prepare();
  assert.equal(gate.status, "ready");

  assert.equal(Object.isFrozen(gate.request), true);
  assert.equal(Object.isFrozen(gate.request.transition), true);
  assert.equal(Object.isFrozen(gate.request.commitAuthority), true);

  assert.throws(() => {
    gate.request.transition.id = "transition:tampered";
  }, TypeError);
});

test("world is revalidated immediately before execution starts", () => {
  const base = fixture();
  const gate = prepareExecution({
    id: "execution-request:revalidate",
    ...base,
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });
  assert.equal(gate.status, "ready");

  const start = beginExecution({
    id: "lease:stale-after-prepare",
    request: gate.request,
    currentEntities: [
      { id: "resource:1", type: "resource", state: { value: 99 } },
    ],
    startedAt: "2026-08-24T23:00:07+07:00",
  });

  assert.equal(start.status, "rejected");
  assert.equal(start.reason, "TRANSITION_STALE");
  assert.equal(start.readiness.status, "stale");
});

test("validated request can start execution only once", () => {
  const base = fixture();
  const gate = prepareExecution({
    id: "execution-request:once",
    ...base,
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });
  assert.equal(gate.status, "ready");

  const first = beginExecution({
    id: "lease:first",
    request: gate.request,
    currentEntities: base.currentEntities,
    startedAt: "2026-08-24T23:00:07+07:00",
  });
  assert.equal(first.status, "started");
  assert.equal(isExecutionLease(first.lease), true);

  const second = beginExecution({
    id: "lease:second",
    request: gate.request,
    currentEntities: base.currentEntities,
    startedAt: "2026-08-24T23:00:08+07:00",
  });
  assert.equal(second.status, "rejected");
  assert.equal(second.reason, "EXECUTION_ALREADY_STARTED");
});

test("observation batch requires an authentic execution lease", () => {
  assert.throws(
    () =>
      createExecutionObservationBatch({
        id: "execution-observation:forged-lease",
        lease: { id: "forged" },
        observations: [],
        observedAt: "2026-08-24T23:00:10+07:00",
      }),
    /INVALID_EXECUTION_LEASE/,
  );
});

test("execution output carries observations, never a trusted success flag", () => {
  const base = fixture();
  const gate = prepareExecution({
    id: "execution-request:observed",
    ...base,
    evaluatedAt: "2026-08-24T23:00:06+07:00",
  });
  assert.equal(gate.status, "ready");

  const start = beginExecution({
    id: "lease:observed",
    request: gate.request,
    currentEntities: base.currentEntities,
    startedAt: "2026-08-24T23:00:07+07:00",
  });
  assert.equal(start.status, "started");

  const batch = createExecutionObservationBatch({
    id: "execution-observation:1",
    lease: start.lease,
    observations: [
      {
        id: "observation:after",
        subject: { id: "resource:1" },
        property: "value",
        value: 2,
        source: "executor-observation",
        observedAt: "2026-08-24T23:00:10+07:00",
        reliability: 0.99,
      },
    ],
    observedAt: "2026-08-24T23:00:10+07:00",
    success: true,
  });

  assert.equal(batch.executionLeaseId, start.lease.id);
  assert.equal(batch.observations[0].value, 2);
  assert.equal(Object.hasOwn(batch, "success"), false);
});
