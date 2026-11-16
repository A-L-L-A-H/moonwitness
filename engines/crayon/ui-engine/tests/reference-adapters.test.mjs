import test from "node:test";
import assert from "node:assert/strict";
import {
  bankingReferenceAdapter,
  fileReferenceAdapter,
  emailReferenceAdapter,
  erpReferenceAdapter,
  devopsReferenceAdapter,
  aiReferenceAdapter,
  runDomainAdapterConformance,
} from "../dist/packages/adapter/src/index.js";

const now = "2026-08-25T10:00:00Z";
const fixtures = [
  [bankingReferenceAdapter, { accountId: "account:a", balance: 12000, transferAmount: 1000, destinationId: "account:b" }],
  [fileReferenceAdapter, { path: "/archive", exists: true, recursive: true }],
  [emailReferenceAdapter, { messageId: "m1", draft: true, recipient: "ops@example.com" }],
  [erpReferenceAdapter, { requestId: "r1", stage: "manager", approved: false }],
  [devopsReferenceAdapter, { serviceId: "api", version: "1.0.0", targetVersion: "1.1.0", healthy: true }],
  [aiReferenceAdapter, { proposalId: "p1", proposedAction: "restart-service", humanCommitted: false }],
];

test("six reference domains conform to the same Situation contract", () => {
  for (const [adapter, input] of fixtures) {
    const result = runDomainAdapterConformance({ adapter, input, context: { now } });
    assert.equal(result.report.valid, true, `${adapter.id} must conform`);
    assert.equal(result.situation.entities.length, 1);
    assert.equal(result.situation.possibilities.length, 1);
    assert.equal(result.situation.knowledge[0].epistemic, "fact");
    assert.equal(result.situation.knowledge[0].observations.length, 1);
  }
});

test("reference adapters expose domain vocabulary only at the adapter boundary", () => {
  const situations = fixtures.map(([adapter, input]) => adapter.adapt(input, { now }));
  const shapes = situations.map((situation) => Object.keys(situation).sort().join(","));
  assert.equal(new Set(shapes).size, 1);
});
