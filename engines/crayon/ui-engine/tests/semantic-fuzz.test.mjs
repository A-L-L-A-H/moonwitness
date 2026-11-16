import test from "node:test";
import assert from "node:assert/strict";
import {
  assessRetrySafety,
  createTemporalRecord,
  evaluateAuthority,
} from "../dist/packages/kernel/src/index.js";

function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function witness(status, overrides = {}) {
  return {
    id: overrides.id ?? `witness:${status}`,
    actor: "human:1",
    intentId: "intent:1",
    transitionId: "transition:1",
    status,
    before: { entities: { "entity:1": { state: "before" } } },
    prediction: {
      id: "prediction:1",
      state: { entities: { "entity:1": { state: overrides.predicted ?? "predicted" } } },
      effects: [{ id: "effect:1", entity: "entity:1", property: "state", to: overrides.predicted ?? "predicted" }],
    },
    observed: {
      id: "observed:1",
      observations: [{
        id: "observation:1",
        subject: { id: "entity:1", type: "resource" },
        property: "state",
        value: overrides.observed,
        observedAt: "2026-08-25T10:01:00Z",
        source: "source:1",
      }],
      observedAt: "2026-08-25T10:01:00Z",
    },
    happenedAt: "2026-08-25T10:01:01Z",
  };
}

function transition(predicted) {
  return {
    id: "transition:1",
    before: { entities: { "entity:1": { state: "before" } } },
    prediction: {
      id: "prediction:1",
      state: { entities: { "entity:1": { state: predicted } } },
      effects: [{ id: "effect:1", entity: "entity:1", property: "state", to: predicted }],
    },
    preconditions: [],
    intent: {
      id: "intent:1",
      possibilityId: "possibility:1",
      actor: "human:1",
      createdAt: "2026-08-25T10:00:00Z",
    },
    consequence: { effects: [], reversibility: "reversible", risk: 0, impact: 0 },
  };
}

test("seeded fuzz: explicit deny wins regardless generated rule ordering/noise", () => {
  for (let seed = 1; seed <= 256; seed += 1) {
    const random = rng(seed);
    const actor = { id: "human:target", kind: "human" };
    const allow = { id: `allow:${seed}`, effect: "allow", capabilities: ["commit"], actors: { ids: [actor.id] } };
    const deny = { id: `deny:${seed}`, effect: "deny", capabilities: ["commit"], actors: { ids: [actor.id] } };
    const noise = Array.from({ length: Math.floor(random() * 8) }, (_, index) => ({
      id: `noise:${seed}:${index}`,
      effect: random() > 0.5 ? "allow" : "deny",
      capabilities: [random() > 0.5 ? "observe" : "propose"],
      actors: { ids: [`other:${index}`] },
    }));
    const rules = shuffle([allow, deny, ...noise], random);
    const decision = evaluateAuthority({ request: { actor, capability: "commit" }, rules });
    assert.equal(decision.status, "denied", `seed=${seed}`);
  }
});

test("seeded fuzz: unresolved/partial witness can never authorize retry", () => {
  const statuses = ["unverified", "partial"];
  for (let seed = 1; seed <= 256; seed += 1) {
    const random = rng(seed);
    const status = statuses[Math.floor(random() * statuses.length)];
    const result = assessRetrySafety({ witness: witness(status, { id: `witness:${seed}` }) });
    assert.equal(result.status, "blocked", `seed=${seed}`);
    assert.equal(result.reason, "OUTCOME_UNRESOLVED", `seed=${seed}`);
  }
});

test("seeded fuzz: conflicted witness always blocks retry and verified is only unnecessary", () => {
  for (let seed = 1; seed <= 128; seed += 1) {
    const conflicted = assessRetrySafety({ witness: witness("conflicted", { id: `witness:c:${seed}` }) });
    assert.deepEqual(
      { status: conflicted.status, reason: conflicted.reason },
      { status: "blocked", reason: "OUTCOME_CONFLICTED" },
      `seed=${seed}`,
    );
    const verified = assessRetrySafety({ witness: witness("verified", { id: `witness:v:${seed}` }) });
    assert.deepEqual(
      { status: verified.status, reason: verified.reason },
      { status: "unnecessary", reason: "OUTCOME_VERIFIED" },
      `seed=${seed}`,
    );
  }
});

test("seeded fuzz: prediction remains prediction and cannot be overwritten by arbitrary observation", () => {
  for (let seed = 1; seed <= 192; seed += 1) {
    const random = rng(seed);
    const predicted = `predicted:${Math.floor(random() * 10_000)}`;
    const observed = `observed:${Math.floor(random() * 10_000)}`;
    const tx = transition(predicted);
    const w = witness("partial", { id: `witness:${seed}`, predicted, observed });
    const record = createTemporalRecord({ id: `record:${seed}`, transition: tx, witness: w });
    assert.equal(record.prediction[0].phase, "prediction", `seed=${seed}`);
    assert.equal(record.prediction[0].value, predicted, `seed=${seed}`);
    assert.equal(record.observations[0].phase, "observation", `seed=${seed}`);
    assert.equal(record.observations[0].value, observed, `seed=${seed}`);
    assert.notStrictEqual(record.prediction[0], record.observations[0], `seed=${seed}`);
    assert.equal(Object.isFrozen(record), true, `seed=${seed}`);
  }
});

test("seeded fuzz: caller mutation after TemporalRecord creation cannot rewrite history", () => {
  for (let seed = 1; seed <= 128; seed += 1) {
    const predicted = `p:${seed}`;
    const observed = `o:${seed}`;
    const tx = transition(predicted);
    const w = witness("partial", { id: `witness:${seed}`, predicted, observed });
    const record = createTemporalRecord({ id: `record:${seed}`, transition: tx, witness: w });
    tx.prediction.state.entities["entity:1"].state = "MUTATED";
    w.observed.observations[0].value = "MUTATED";
    assert.equal(record.prediction[0].value, predicted, `seed=${seed}`);
    assert.equal(record.observations[0].value, observed, `seed=${seed}`);
  }
});
