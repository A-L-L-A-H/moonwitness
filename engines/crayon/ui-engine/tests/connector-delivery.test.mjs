import test from "node:test";
import assert from "node:assert/strict";
import {
  createConnectorDeliveryTracker,
  ingestConnectorObservation,
} from "../dist/packages/adapter/src/index.js";

function observation(overrides = {}) {
  return {
    id: "observation:1",
    subject: { id: "entity:1", type: "resource" },
    property: "state",
    value: "ready",
    observedAt: "2026-08-25T10:00:00Z",
    source: "service:a",
    reliability: 0.9,
    evidence: [{ id: "evidence:1", source: "service:a", observedAt: "2026-08-25T10:00:00Z", reliability: 0.9 }],
    ...overrides,
  };
}

function delivery(overrides = {}) {
  return {
    version: "0",
    deliveryId: "delivery:1",
    connectorId: "connector:a",
    mode: "webhook",
    receivedAt: "2026-08-25T10:00:05Z",
    cursor: "10",
    payload: observation(),
    ...overrides,
  };
}

test("accepted delivery and accepted observation remain separate statuses", () => {
  const tracker = createConnectorDeliveryTracker("connector:a");
  const result = ingestConnectorObservation({ delivery: delivery(), tracker, policy: { requireEvidence: true } });
  assert.equal(result.delivery.accepted, true);
  assert.equal(result.observation.accepted, true);
  assert.equal(result.findings.length, 0);
  assert.equal("epistemic" in result.observation.observation, false);
});

test("transport success does not rescue an invalid observation", () => {
  const tracker = createConnectorDeliveryTracker("connector:a");
  const result = ingestConnectorObservation({
    delivery: delivery({ payload: observation({ source: "" }) }),
    tracker,
  });
  assert.equal(result.delivery.accepted, true);
  assert.equal(result.observation.accepted, false);
  assert.equal(result.findings[0].code, "OBSERVATION_REJECTED");
});

test("duplicate delivery is deterministic and cursor regression is rejected", () => {
  const tracker = createConnectorDeliveryTracker("connector:a");
  assert.equal(tracker.accept(delivery()).accepted, true);
  const duplicate = tracker.accept(delivery());
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.findings[0].code, "DUPLICATE_DELIVERY");

  const regressed = tracker.accept(delivery({ deliveryId: "delivery:2", cursor: "9" }));
  assert.equal(regressed.accepted, false);
  assert.ok(regressed.findings.some((item) => item.code === "CURSOR_REGRESSION"));
});
