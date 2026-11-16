import test from "node:test";
import assert from "node:assert/strict";
import { continuity, disclosure, momentum, deriveConsequencePolicy, explainCommitment } from "../dist/packages/physics/src/index.js";

test("disclosure grows monotonically with impact irreversibility and uncertainty", () => {
  const low = disclosure({ impact: 0.1, irreversibility: 0.05, uncertainty: 0.05, evidenceDemand: 0.1 });
  const high = disclosure({ impact: 0.95, irreversibility: 1, uncertainty: 0.8, evidenceDemand: 0.9 });
  assert.ok(high.score > low.score);
  assert.ok(high.explanation.some((line) => /uncertain outcomes/i.test(line)));
});

test("continuity is stronger when identity and relations survive semantic change", () => {
  const stable = continuity({ identityStability: 1, relationStability: 0.95, semanticChange: 0.1 });
  const replacement = continuity({ identityStability: 0.1, relationStability: 0.2, semanticChange: 0.95 });
  assert.ok(stable.score > replacement.score);
});

test("momentum reflects committed executing unresolved work rather than animation", () => {
  const idle = momentum({ committed: 0, executing: 0, externalPending: 0, observationProgress: 1 });
  const pending = momentum({ committed: 1, executing: 1, externalPending: 1, observationProgress: 0.25 });
  assert.ok(pending.score > idle.score);
  assert.ok(pending.explanation.some((line) => /external/i.test(line)));
});

test("caller cannot understate irreversible high-impact commitment risk", () => {
  const consequence = {
    effects: [{ id: "effect:destroy", entity: "resource:prod", property: "state", from: "present", to: "destroyed" }],
    reversibility: "irreversible", risk: 0, impact: 0.95, uncertainty: 0.05,
  };
  const policy = deriveConsequencePolicy(consequence);
  assert.ok(policy.riskFloor >= 0.78);
  assert.ok(policy.minimumResistance >= 0.72);
  const assessment = explainCommitment(consequence, { policyRisk: 0, derivedRisk: 0 });
  assert.ok(assessment.score >= 0.72);
  assert.equal(assessment.mode, "deliberate");
  assert.ok(assessment.explanation.some((line) => /hard-to-reverse/i.test(line)));
});

test("unknown consequence effects are not treated as safe", () => {
  const consequence = { effects: [], reversibility: "reversible", risk: 0, impact: 0.6 };
  const policy = deriveConsequencePolicy(consequence);
  const assessment = explainCommitment(consequence);
  assert.ok(policy.riskFloor >= 0.55);
  assert.ok(assessment.reasons.uncertainty >= 1);
  assert.ok(assessment.score >= 0.4);
  assert.notEqual(assessment.mode, "direct");
});
