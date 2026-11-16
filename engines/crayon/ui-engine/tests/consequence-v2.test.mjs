import test from "node:test";
import assert from "node:assert/strict";
import { deriveConsequenceProfile, explainCommitment } from "../dist/packages/physics/src/index.js";

const consequence = { effects: [], reversibility: "compensatable", risk: 0.35, impact: 0.62, uncertainty: 0.18 };

test("policy and derived risk are preserved separately and effective risk is conservative", () => {
  const profile = deriveConsequenceProfile(consequence, { derivedRisk: 0.48, policyRisk: 0.7, externalDependency: 0.8 });
  assert.equal(profile.declaredRisk, 0.35);
  assert.equal(profile.derivedRisk, 0.48);
  assert.equal(profile.policyRisk, 0.7);
  assert.equal(profile.effectiveRisk, 0.7);
  assert.equal(profile.externalDependency, 0.8);
});

test("commitment explanation is deterministic and carries factor provenance", () => {
  const context = { derivedRisk: 0.48, policyRisk: 0.7, externalDependency: 0.8, authorityCost: 0.2 };
  const first = explainCommitment(consequence, context);
  const second = explainCommitment(consequence, context);
  assert.deepEqual(first, second);
  assert.ok(first.score > 0.4);
  assert.equal(first.mode, "explicit-preview");
  assert.ok(first.factors.some((factor) => factor.kind === "policy-risk"));
  assert.ok(first.factors.some((factor) => factor.kind === "external-dependency"));
  assert.ok(first.explanation.every((line) => !line.includes("AI decided")));
});
