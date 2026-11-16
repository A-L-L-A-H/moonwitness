import test from "node:test";
import assert from "node:assert/strict";
import {
  TemporalStoreError,
  createMemoryTemporalStore,
  createTemporalJournal,
  replayTemporalJournal,
  restoreTemporalJournal,
  verifyTemporalJournal,
} from "../dist/packages/store/src/index.js";

function temporalRecord(id, overrides = {}) {
  const witnessId = overrides.witness?.id ?? `witness:${id}`;
  return {
    version: "0",
    id,
    transitionId: overrides.transitionId ?? "transition:shared",
    intentId: overrides.intentId ?? "intent:shared",
    actorId: overrides.actorId ?? "human:operator",
    prediction: overrides.prediction ?? [],
    observations: overrides.observations ?? [],
    reconciliations: overrides.reconciliations ?? [],
    witness: overrides.witness ?? {
      id: witnessId,
      phase: "witness",
      at: "2026-08-25T00:01:00Z",
      status: "unverified",
    },
    retry: overrides.retry ?? {
      status: "blocked",
      witnessId,
      reason: "OUTCOME_UNRESOLVED",
      requiredAction: "reconcile-before-retry",
    },
    reconciliationIds: overrides.reconciliationIds ?? [],
  };
}

test("TemporalStore keeps immutable append-only records and supports semantic queries", async () => {
  const store = createMemoryTemporalStore();
  const original = temporalRecord("record:one");
  await store.append(original);

  original.transitionId = "transition:mutated-after-append";
  const stored = await store.get("record:one");
  assert.equal(stored.transitionId, "transition:shared");
  assert.equal(Object.isFrozen(stored), true);
  assert.equal(Object.isFrozen(stored.witness), true);

  await store.append(temporalRecord("record:two", {
    transitionId: "transition:other",
    intentId: "intent:other",
    actorId: "service:executor",
  }));

  assert.deepEqual((await store.list({ transitionId: "transition:shared" })).map((record) => record.id), ["record:one"]);
  assert.deepEqual((await store.list({ actorId: "service:executor" })).map((record) => record.id), ["record:two"]);
});

test("TemporalStore rejects duplicate identity instead of rewriting history", async () => {
  const store = createMemoryTemporalStore();
  await store.append(temporalRecord("record:duplicate"));

  await assert.rejects(
    store.append(temporalRecord("record:duplicate", { transitionId: "transition:replacement" })),
    (error) => error instanceof TemporalStoreError && error.code === "DUPLICATE_RECORD_ID",
  );

  const stored = await store.get("record:duplicate");
  assert.equal(stored.transitionId, "transition:shared");
});

test("later evidence appends a new temporal record and does not rewrite the earlier record", async () => {
  const store = createMemoryTemporalStore();
  await store.append(temporalRecord("record:before-reconciliation"));
  await store.append(temporalRecord("record:after-reconciliation", {
    reconciliations: [{
      id: "fact:reconciled",
      phase: "reconciliation",
      at: "2026-08-25T00:05:00Z",
      entity: "destination",
      property: "balance",
      value: 20000,
      epistemic: "fact",
      sourceIds: ["reconciliation:1"],
      evidenceIds: ["evidence:settlement"],
    }],
    reconciliationIds: ["reconciliation:1"],
  }));

  const history = await store.list({ transitionId: "transition:shared" });
  assert.equal(history.length, 2);
  assert.equal(history[0].reconciliations.length, 0);
  assert.equal(history[1].reconciliations.length, 1);
  assert.equal(history[1].reconciliations[0].value, 20000);
});

test("TemporalJournal exposes explicit append order and verifies valid history", async () => {
  const journal = createTemporalJournal();
  const first = await journal.append(temporalRecord("record:a"));
  const second = await journal.append(temporalRecord("record:b"));

  assert.equal(first.sequence, 0);
  assert.equal(second.sequence, 1);
  assert.equal(Object.isFrozen(first), true);
  assert.deepEqual(await journal.verify(), { valid: true, count: 2, lastSequence: 1 });
});

test("journal verification distinguishes incomplete, out-of-sequence, and duplicate history", () => {
  const record = temporalRecord("record:verify");

  const incomplete = verifyTemporalJournal([{ version: "0", sequence: 0 }]);
  assert.equal(incomplete.valid, false);
  assert.equal(incomplete.reason, "INCOMPLETE_ENTRY");

  const outOfSequence = verifyTemporalJournal([{ version: "0", sequence: 2, record }]);
  assert.equal(outOfSequence.valid, false);
  assert.equal(outOfSequence.reason, "SEQUENCE_MISMATCH");

  const duplicate = verifyTemporalJournal([
    { version: "0", sequence: 0, record },
    { version: "0", sequence: 1, record },
  ]);
  assert.equal(duplicate.valid, false);
  assert.equal(duplicate.reason, "DUPLICATE_RECORD_ID");
});

test("replay after restart preserves unresolved outcome instead of inferring success", () => {
  const unresolved = temporalRecord("record:timeout");
  const replay = replayTemporalJournal([{ version: "0", sequence: 0, record: unresolved }]);

  assert.equal(replay.valid, true);
  assert.equal(replay.transitions.length, 1);
  assert.equal(replay.transitions[0].latestRecordId, "record:timeout");
  assert.equal(replay.transitions[0].witnessStatus, "unverified");
  assert.equal(replay.transitions[0].retry.status, "blocked");
  assert.equal(replay.transitions[0].retry.reason, "OUTCOME_UNRESOLVED");
});

test("later reconciliation changes only the latest replay projection while preserving earlier record identity", () => {
  const unresolved = temporalRecord("record:timeout");
  const witnessId = "witness:confirmed";
  const confirmed = temporalRecord("record:confirmed", {
    witness: {
      id: witnessId,
      phase: "witness",
      at: "2026-08-25T00:06:00Z",
      status: "verified",
    },
    retry: {
      status: "unnecessary",
      witnessId,
      reason: "OUTCOME_VERIFIED",
      requiredAction: "do-not-retry",
    },
    reconciliationIds: ["reconciliation:settlement"],
  });

  const replay = replayTemporalJournal([
    { version: "0", sequence: 0, record: unresolved },
    { version: "0", sequence: 1, record: confirmed },
  ]);

  assert.equal(replay.valid, true);
  assert.deepEqual(replay.transitions[0].recordIds, ["record:timeout", "record:confirmed"]);
  assert.equal(replay.transitions[0].latestRecordId, "record:confirmed");
  assert.equal(replay.transitions[0].witnessStatus, "verified");
  assert.equal(replay.transitions[0].retry.status, "unnecessary");
});

test("restore reconstructs a valid in-memory journal and refuses corrupt history", async () => {
  const records = [temporalRecord("record:restore-a"), temporalRecord("record:restore-b")];
  const restored = await restoreTemporalJournal([
    { version: "0", sequence: 0, record: records[0] },
    { version: "0", sequence: 1, record: records[1] },
  ]);

  assert.equal(restored.restored, true);
  assert.deepEqual((await restored.journal.entries()).map((entry) => entry.record.id), ["record:restore-a", "record:restore-b"]);
  assert.equal(restored.replay.recordCount, 2);

  const corrupt = await restoreTemporalJournal([{ version: "0", sequence: 4, record: records[0] }]);
  assert.equal(corrupt.restored, false);
  assert.equal(corrupt.replay.verification.reason, "SEQUENCE_MISMATCH");
});

test("TemporalStore rejects incomplete records as storage errors, not semantic outcomes", async () => {
  const store = createMemoryTemporalStore();
  await assert.rejects(
    store.append({ version: "0", id: "record:broken" }),
    (error) => error instanceof TemporalStoreError && error.code === "INVALID_RECORD",
  );
  assert.deepEqual(await store.list(), []);
});
