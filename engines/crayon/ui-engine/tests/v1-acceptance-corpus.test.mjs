import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSemanticSnapshot } from "../dist/packages/snapshot/src/index.js";
import { planSituationRepresentation } from "../dist/packages/rir/src/index.js";

const corpus = JSON.parse(readFileSync(new URL("../fixtures/acceptance/corpus-v0.json", import.meta.url), "utf8"));

test("canonical acceptance corpus spans six distinct domains with required invariants", () => {
  assert.deepEqual(corpus.domains.map((item) => item.id), ["banking", "files", "email", "erp", "devops", "ai"]);
  assert.ok(corpus.invariants.includes("consequence-visible"));
  assert.ok(corpus.invariants.includes("renderer-neutral-rir"));
});

test("all corpus domains use the same Snapshot → RIR pipeline and preserve semantic claims", () => {
  for (const domain of corpus.domains) {
    const entityId = `${domain.entityType}:fixture`;
    const possibilityId = `possibility:${domain.id}`;
    const situation = {
      id: `situation:${domain.id}`,
      anchor: { id: entityId, type: domain.entityType },
      entities: [{ id: entityId, type: domain.entityType, state: { state: "current" } }],
      relations: [],
      observations: [],
      expectations: [],
      knowledge: [{ id: `knowledge:${domain.id}`, key: `${entityId}.state`, value: "current", epistemic: "claim", certainty: 0.8 }],
      possibilities: [{
        id: possibilityId,
        verb: domain.verb,
        subject: { id: entityId, type: domain.entityType },
        consequence: {
          effects: [{ id: `effect:${domain.id}`, entity: entityId, property: "state", from: "current", to: "next" }],
          reversibility: domain.reversibility,
          risk: domain.risk,
          impact: domain.impact,
          uncertainty: domain.uncertainty,
        },
      }],
      now: "2026-08-25T00:00:00Z",
    };
    const snapshot = createSemanticSnapshot({ situation, actor: { id: "human:fixture", kind: "human" }, authorityRules: [], temporalRecords: [] });
    const document = planSituationRepresentation({ situation, snapshot });
    const path = document.nodes.find((node) => node.kind === "path");
    const effect = document.nodes.find((node) => node.kind === "mark" && node.role === "effect");
    assert.ok(path, `${domain.id}: path missing`);
    assert.equal(path.possibilityId, possibilityId);
    assert.equal(path.availability, snapshot.possibilities[0].status);
    assert.ok(effect, `${domain.id}: consequence mark missing`);
    assert.equal(effect.value, "next");
  }
});
