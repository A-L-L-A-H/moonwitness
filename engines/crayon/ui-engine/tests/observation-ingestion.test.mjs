import test from "node:test";
import assert from "node:assert/strict";
import { ingestObservation } from "../dist/packages/adapter/src/ingestion.js";

function observation(overrides = {}) {
  return {
    id: "observation:temperature:1",
    subject: { id: "sensor:warehouse", type: "sensor" },
    property: "temperature",
    value: 8.4,
    observedAt: "2026-08-25T11:00:00Z",
    validUntil: "2026-08-25T11:05:00Z",
    source: "sensor-gateway:a",
    reliability: 0.94,
    evidence: [{
      id: "evidence:packet:1",
      source: "sensor-gateway:a",
      observedAt: "2026-08-25T11:00:00Z",
      reliability: 0.94,
    }],
    ...overrides,
  };
}

test("ingestion accepts explicit provenance without deriving knowledge or truth", () => {
  const result = ingestObservation(observation(), {
    receivedAt: "2026-08-25T11:01:00Z",
    requireEvidence: true,
    minimumReliability: 0.8,
  });
  assert.equal(result.accepted, true);
  assert.equal(result.report.receivedAt, "2026-08-25T11:01:00Z");
  assert.equal(result.report.freshness, "current");
  assert.equal(result.observation.source, "sensor-gateway:a");
  assert.equal(result.observation.evidence[0].id, "evidence:packet:1");
  assert.equal("epistemic" in result.observation, false);
  assert.ok(Object.isFrozen(result.observation));
});

test("stale observations remain admissible history and are explicitly marked stale", () => {
  const result = ingestObservation(observation({ validUntil: "2026-08-25T11:00:30Z" }), {
    receivedAt: "2026-08-25T11:10:00Z",
  });
  assert.equal(result.accepted, true);
  assert.equal(result.report.freshness, "stale");
});

test("missing provenance and invalid reliability are rejected", () => {
  const result = ingestObservation(observation({ source: "", reliability: 1.2 }), {
    receivedAt: "2026-08-25T11:01:00Z",
  });
  assert.equal(result.accepted, false);
  assert.ok(result.report.issues.some((item) => item.code === "MISSING_SOURCE"));
  assert.ok(result.report.issues.some((item) => item.code === "INVALID_RELIABILITY"));
});

test("future observations beyond explicit clock skew are rejected", () => {
  const result = ingestObservation(observation({ observedAt: "2026-08-25T11:05:00Z" }), {
    receivedAt: "2026-08-25T11:00:00Z",
    maxFutureSkewMs: 30_000,
  });
  assert.equal(result.accepted, false);
  assert.ok(result.report.issues.some((item) => item.code === "OBSERVED_AT_IN_FUTURE"));
});

test("evidence policy can require explicit evidence independently of observation source", () => {
  const result = ingestObservation(observation({ evidence: [] }), {
    receivedAt: "2026-08-25T11:01:00Z",
    requireEvidence: true,
  });
  assert.equal(result.accepted, false);
  assert.ok(result.report.issues.some((item) => item.code === "MISSING_EVIDENCE"));
});

test("duplicate evidence identity is rejected deterministically", () => {
  const duplicate = {
    id: "evidence:packet:1",
    source: "sensor-gateway:a",
    observedAt: "2026-08-25T11:00:00Z",
    reliability: 0.94,
  };
  const result = ingestObservation(observation({ evidence: [duplicate, { ...duplicate }] }), {
    receivedAt: "2026-08-25T11:01:00Z",
  });
  assert.equal(result.accepted, false);
  assert.deepEqual(
    result.report.issues.filter((item) => item.code === "DUPLICATE_EVIDENCE_ID").map((item) => item.path),
    ["observation.evidence[1].id"],
  );
});

test("production policy can reject low or unstated source reliability without upgrading truth", () => {
  const low = ingestObservation(observation({ reliability: 0.2 }), {
    receivedAt: "2026-08-25T11:01:00Z",
    minimumReliability: 0.8,
  });
  assert.equal(low.accepted, false);
  assert.ok(low.report.issues.some((item) => item.code === "LOW_RELIABILITY"));

  const missing = ingestObservation(observation({ reliability: undefined }), {
    receivedAt: "2026-08-25T11:01:00Z",
    minimumReliability: 0.8,
  });
  assert.equal(missing.accepted, false);
  assert.ok(missing.report.issues.some((item) => item.code === "LOW_RELIABILITY"));
});
