import test from "node:test";
import assert from "node:assert/strict";
import {
  DomainAdapterError,
  defineDomainAdapter,
  runDomainAdapterConformance,
  validateAdaptedSituation,
} from "../dist/packages/adapter/src/index.js";

function validSituation(now = "2026-08-25T10:00:00Z") {
  return {
    id: "situation:custom",
    anchor: { id: "entity:account" },
    entities: [
      { id: "entity:account", type: "account", state: { balance: 50000 } },
      { id: "entity:destination", type: "account", state: { balance: 5800 } },
    ],
    relations: [{ from: "entity:account", type: "connected-to", to: "entity:destination", strength: 0.8 }],
    observations: [{
      id: "observation:balance",
      subject: { id: "entity:account" },
      property: "balance",
      value: 50000,
      observedAt: now,
      source: "ledger:primary",
      reliability: 1,
      evidence: [{ id: "evidence:ledger", source: "ledger:primary", observedAt: now, reliability: 1 }],
    }],
    expectations: [],
    knowledge: [{
      id: "knowledge:balance",
      key: "entity:account.balance",
      value: 50000,
      epistemic: "fact",
      observations: ["observation:balance"],
    }],
    possibilities: [{
      id: "possibility:transfer",
      verb: "transfer",
      subject: { id: "entity:account" },
      authority: [{ capability: "intend", subject: { id: "entity:account" } }],
      consequence: {
        effects: [{ id: "effect:debit", entity: "entity:account", property: "balance", from: 50000, to: 40000 }],
        reversibility: "compensatable",
        risk: 0.4,
        impact: 0.5,
        uncertainty: 0.2,
      },
    }],
    now,
  };
}

test("domain adapter returns immutable validated Situation and cannot return authority decisions", () => {
  const adapter = defineDomainAdapter({
    id: "adapter:custom",
    adapt(input, context) {
      const situation = validSituation(context.now);
      situation.entities[0].state.balance = input.balance;
      situation.observations[0].value = input.balance;
      situation.knowledge[0].value = input.balance;
      return situation;
    },
  });

  const situation = adapter.adapt({ balance: 42000 }, { now: "2026-08-25T10:00:00Z" });
  assert.equal(situation.entities[0].state.balance, 42000);
  assert.equal(Object.isFrozen(situation), true);
  assert.equal(Object.isFrozen(situation.entities), true);
  assert.equal("authorityDecision" in situation, false);
  assert.equal("witness" in situation, false);
});

test("adapter-produced facts require provenance", () => {
  const situation = validSituation();
  situation.knowledge[0].observations = [];
  const report = validateAdaptedSituation(situation);
  assert.equal(report.valid, false);
  assert.equal(report.issues.some((item) => item.code === "FACT_WITHOUT_PROVENANCE"), true);
});

test("adapter conformance detects invalid reliability and dangling relations", () => {
  const situation = validSituation();
  situation.observations[0].reliability = 2;
  situation.relations.push({ from: "entity:missing", type: "ghost", to: "entity:account" });
  const report = validateAdaptedSituation(situation);
  assert.equal(report.valid, false);
  assert.equal(report.issues.some((item) => item.code === "INVALID_RELIABILITY"), true);
  assert.equal(report.issues.some((item) => item.code === "DANGLING_RELATION"), true);
});

test("defineDomainAdapter rejects invalid deterministic context time", () => {
  const adapter = defineDomainAdapter({ id: "adapter:time", adapt: () => validSituation() });
  assert.throws(
    () => adapter.adapt({}, { now: "not-a-time" }),
    (error) => error instanceof DomainAdapterError && error.issues.some((item) => item.code === "INVALID_CONTEXT_TIME"),
  );
});

test("conformance report distinguishes adapter exception from semantic validation failures", () => {
  const result = runDomainAdapterConformance({
    adapter: { id: "adapter:throws", adapt: () => { throw new Error("transport data unavailable"); } },
    input: {},
    context: { now: "2026-08-25T10:00:00Z" },
  });
  assert.equal(result.report.valid, false);
  assert.equal(result.report.issues[0].code, "ADAPTER_EXCEPTION");
});

test("wrapper rejects malformed situation rather than normalizing it into truth", () => {
  const adapter = defineDomainAdapter({
    id: "adapter:malformed",
    adapt: () => ({ ...validSituation(), anchor: { id: "entity:not-present" } }),
  });
  assert.throws(
    () => adapter.adapt({}, { now: "2026-08-25T10:00:00Z" }),
    (error) => error instanceof DomainAdapterError && error.issues.some((item) => item.code === "ANCHOR_ENTITY_MISSING"),
  );
});
