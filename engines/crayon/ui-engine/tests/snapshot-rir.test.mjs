import test from "node:test";
import assert from "node:assert/strict";
import { createSemanticSnapshot, diffSemanticSnapshots } from "../dist/packages/snapshot/src/index.js";
import { planSituationRepresentation, renderRIRAsText } from "../dist/packages/rir/src/index.js";

function fixture(balance = 50000) {
  const situation = {
    id: `situation:${balance}`,
    anchor: { id: "account:A", type: "bank-account" },
    entities: [
      { id: "account:A", type: "bank-account", state: { name: "Operations", balance } },
      { id: "account:B", type: "bank-account", state: { name: "Settlement", balance: 10000 } },
    ],
    relations: [{ from: "account:A", type: "transfers-to", to: "account:B", strength: 0.9 }],
    observations: [], expectations: [],
    knowledge: [
      { id: "knowledge:a-balance", key: "account:A.balance", value: balance, epistemic: "fact", certainty: 1 },
      { id: "knowledge:estimate", key: "transfer.arrival", value: "~10 min", epistemic: "estimate", certainty: 0.7 },
    ],
    possibilities: [{
      id: "possibility:transfer", verb: "Transfer $14,200", subject: { id: "account:A", type: "bank-account" },
      constraints: [{ id: "constraint:funds", knowledgeKey: "account:A.balance", operator: "gte", expected: 14212 }],
      authority: [{ capability: "intend" }],
      consequence: {
        effects: [
          { id: "effect:a", entity: "account:A", property: "balance", from: balance, to: balance - 14212, description: "Operations balance" },
          { id: "effect:b", entity: "account:B", property: "balance", from: 10000, to: 24200, description: "Settlement balance" },
        ],
        reversibility: "compensatable", risk: 0.55, impact: 0.68, uncertainty: 0.18,
      },
    }],
    now: "2026-08-24T23:32:00+07:00",
  };
  const actor = { id: "human:operator", kind: "human" };
  const rules = [{ id: "rule:intend", effect: "allow", capabilities: ["intend"], actors: { ids: [actor.id] }, scope: { subjectIds: ["account:A"] } }];
  return { situation, actor, rules };
}

test("semantic snapshot exposes knowledge and derived actionability without pixels", () => {
  const { situation, actor, rules } = fixture();
  const snapshot = createSemanticSnapshot({ situation, actor, authorityRules: rules, consequenceContext: { "possibility:transfer": { derivedRisk: 0.48, externalDependency: 0.7 } } });
  assert.equal(snapshot.anchor.id, "account:A");
  assert.equal(snapshot.known[0].key, "account:A.balance");
  assert.equal(snapshot.uncertain[0].key, "transfer.arrival");
  assert.equal(snapshot.possibilities[0].status, "available");
  assert.ok(snapshot.possibilities[0].resistance.score > 0.4);
});

test("RIR plans semantic primitives and the same document can render as text", () => {
  const { situation, actor, rules } = fixture();
  const snapshot = createSemanticSnapshot({ situation, actor, authorityRules: rules });
  const rir = planSituationRepresentation({ situation, snapshot });
  const kinds = new Set(rir.nodes.map((node) => node.kind));
  for (const kind of ["field", "anchor", "mark", "path", "region", "layer", "portal", "line"]) assert.equal(kinds.has(kind), true, `expected ${kind}`);
  const text = renderRIRAsText(rir);
  assert.match(text, /Operations/);
  assert.match(text, /Transfer \$14,200/);
  assert.match(text, /EFFECT/);
});

test("semantic diff records meaning changes rather than visual changes", () => {
  const a = fixture(50000); const b = fixture(42000);
  const before = createSemanticSnapshot({ situation: a.situation, actor: a.actor, authorityRules: a.rules });
  const after = createSemanticSnapshot({ situation: b.situation, actor: b.actor, authorityRules: b.rules });
  const diff = diffSemanticSnapshots(before, after);
  assert.equal(diff.knowledge.some((item) => item.key === "account:A.balance"), true);
});
