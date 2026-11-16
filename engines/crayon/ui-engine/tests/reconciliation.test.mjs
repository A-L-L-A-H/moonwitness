import test from "node:test";
import assert from "node:assert/strict";

import {
  reconcileObservations,
} from "../dist/packages/kernel/src/index.js";

test("trusted sources that disagree produce conflicted knowledge with reasons", () => {
  const result = reconcileObservations({
    id: "knowledge:balance",
    key: "account:A.balance",
    evaluatedAt: "2026-08-24T22:15:00+07:00",
    observations: [
      {
        id: "obs:bank",
        subject: { id: "account:A" },
        property: "balance",
        value: 12401,
        observedAt: "2026-08-24T22:14:50+07:00",
        source: "bank-api",
        reliability: 0.99,
      },
      {
        id: "obs:ledger",
        subject: { id: "account:A" },
        property: "balance",
        value: 12591,
        observedAt: "2026-08-24T22:14:51+07:00",
        source: "ledger",
        reliability: 0.99,
      },
    ],
  });

  assert.equal(result.knowledge.epistemic, "conflicted");
  assert.equal(result.knowledge.value, undefined);
  assert.deepEqual(result.knowledge.observations, ["obs:bank", "obs:ledger"]);
  assert.equal(
    result.reasons.some((reason) => reason.code === "SOURCE_DISAGREEMENT"),
    true,
  );
});

test("stale observations cannot silently become current truth", () => {
  const result = reconcileObservations({
    id: "knowledge:inventory",
    key: "inventory:item-1.quantity",
    evaluatedAt: "2026-08-24T22:15:00+07:00",
    observations: [
      {
        id: "obs:stale-stock",
        subject: { id: "inventory:item-1" },
        property: "quantity",
        value: 100,
        observedAt: "2026-08-24T20:00:00+07:00",
        validUntil: "2026-08-24T21:00:00+07:00",
        source: "warehouse-cache",
        reliability: 0.99,
      },
    ],
  });

  assert.equal(result.knowledge.epistemic, "unknown");
  assert.equal(result.knowledge.value, undefined);
  assert.equal(
    result.reasons.some((reason) => reason.code === "STALE_OBSERVATION"),
    true,
  );
});

test("agreement from low reliability observations remains uncertain", () => {
  const result = reconcileObservations({
    id: "knowledge:temperature",
    key: "sensor:room.temperature",
    evaluatedAt: "2026-08-24T22:15:00+07:00",
    observations: [
      {
        id: "obs:sensor-a",
        subject: { id: "sensor:room" },
        property: "temperature",
        value: 24,
        observedAt: "2026-08-24T22:14:50+07:00",
        source: "sensor-a",
        reliability: 0.8,
      },
      {
        id: "obs:sensor-b",
        subject: { id: "sensor:room" },
        property: "temperature",
        value: 24,
        observedAt: "2026-08-24T22:14:51+07:00",
        source: "sensor-b",
        reliability: 0.8,
      },
    ],
  });

  assert.equal(result.knowledge.epistemic, "uncertain");
  assert.equal(result.knowledge.value, 24);
  assert.equal(
    result.reasons.some((reason) => reason.code === "LOW_RELIABILITY"),
    true,
  );
  assert.equal(
    result.reasons.some((reason) => reason.code === "SOURCE_AGREEMENT"),
    true,
  );
});
