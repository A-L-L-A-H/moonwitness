import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSemanticSnapshot } from "../dist/packages/snapshot/src/index.js";
import { planSituationRepresentation, renderRIRAsText } from "../dist/packages/rir/src/index.js";
import { inspectRepresentation } from "../dist/packages/inspector/src/index.js";

const actor = { id: "human:reviewer", kind: "human" };

const scenarios = [
  scenario({
    id: "file-delete", anchorId: "file:report", anchorType: "file", label: "Quarterly Report", relatedId: "folder:archive", relation: "contained-in",
    knowledgeKey: "file:report.status", knowledgeValue: "active", verb: "Move to trash", nextValue: "trashed",
    reversibility: "temporarily-reversible", risk: 0.22, impact: 0.38, uncertainty: 0.02,
  }),
  scenario({
    id: "email-send", anchorId: "message:draft", anchorType: "message", label: "Launch update", relatedId: "recipient:team", relation: "addressed-to",
    knowledgeKey: "message:draft.status", knowledgeValue: "draft", verb: "Send message", nextValue: "sent",
    reversibility: "irreversible", risk: 0.48, impact: 0.62, uncertainty: 0.05, externalDependency: 0.55,
  }),
  scenario({
    id: "erp-approval", anchorId: "order:po-42", anchorType: "purchase-order", label: "PO-42", relatedId: "vendor:acme", relation: "ordered-from",
    knowledgeKey: "order:po-42.status", knowledgeValue: "pending", verb: "Approve order", nextValue: "approved",
    reversibility: "compensatable", risk: 0.42, impact: 0.58, uncertainty: 0.08,
  }),
  scenario({
    id: "devops-deploy", anchorId: "service:api", anchorType: "service", label: "Public API", relatedId: "environment:prod", relation: "deployed-to",
    knowledgeKey: "service:api.health", knowledgeValue: "green", verb: "Deploy v42", nextValue: "v42",
    reversibility: "compensatable", risk: 0.72, impact: 0.84, uncertainty: 0.28, externalDependency: 0.82,
  }),
  scenario({
    id: "ai-proposal", anchorId: "change:42", anchorType: "proposed-change", label: "Generated refactor", relatedId: "agent:builder", relation: "proposed-by",
    knowledgeKey: "change:42.reviewState", knowledgeValue: "proposed", verb: "Accept proposed change", nextValue: "accepted",
    reversibility: "reversible", risk: 0.32, impact: 0.46, uncertainty: 0.3,
  }),
];

for (const item of scenarios) {
  test(`${item.name} uses the universal snapshot → RIR → inspector grammar`, () => {
    const snapshot = createSemanticSnapshot({
      situation: item.situation,
      actor,
      authorityRules: item.rules,
      consequenceContext: { [item.possibilityId]: { externalDependency: item.externalDependency } },
    });
    assert.equal(snapshot.possibilities[0].status, "available");
    const document = planSituationRepresentation({ situation: item.situation, snapshot });
    const path = document.nodes.find((node) => node.kind === "path");
    assert.ok(path, "expected a semantic path");
    assert.ok(path.physics?.gravity, "path must carry explainable gravity");
    assert.ok(path.physics?.trace, "path must carry explainable trace demand");
    const inspection = inspectRepresentation({ situation: item.situation, snapshot, document, nodeId: path.id });
    assert.equal(inspection.semantic.possibility?.id, item.possibilityId);
    assert.equal(inspection.semantic.possibility?.status, "available");
    assert.match(inspection.representation.reasons.join(" "), /derived from constraints and authority/i);
    assert.match(renderRIRAsText(document), new RegExp(escapeRegex(item.verb)));
  });
}

test("RIR planner contains no domain-specific branching", () => {
  const source = readFileSync(new URL("../packages/rir/src/planner.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\b(bank|banking|email|deploy|devops|erp|invoice|purchase-order|proposed-change)\b/i);
});

function scenario(input) {
  const possibilityId = `possibility:${input.id}`;
  const situation = {
    id: `situation:${input.id}`,
    anchor: { id: input.anchorId, type: input.anchorType },
    entities: [
      { id: input.anchorId, type: input.anchorType, state: { name: input.label, status: input.knowledgeValue } },
      { id: input.relatedId, type: "related-subject", state: { name: input.relatedId } },
    ],
    relations: [{ from: input.anchorId, type: input.relation, to: input.relatedId, strength: 0.86 }],
    observations: [], expectations: [],
    knowledge: [{ id: `knowledge:${input.id}`, key: input.knowledgeKey, value: input.knowledgeValue, epistemic: "fact", certainty: 1 }],
    possibilities: [{
      id: possibilityId,
      verb: input.verb,
      subject: { id: input.anchorId, type: input.anchorType },
      constraints: [{ id: `constraint:${input.id}`, knowledgeKey: input.knowledgeKey, operator: "equals", expected: input.knowledgeValue }],
      authority: [{ capability: "intend" }],
      consequence: {
        effects: [{ id: `effect:${input.id}`, entity: input.anchorId, property: "status", from: input.knowledgeValue, to: input.nextValue, description: `${input.label} state` }],
        reversibility: input.reversibility,
        risk: input.risk,
        impact: input.impact,
        uncertainty: input.uncertainty,
      },
    }],
    now: "2026-08-25T00:31:00+07:00",
  };
  const rules = [{
    id: `rule:${input.id}:intend`, effect: "allow", capabilities: ["intend"], actors: { ids: [actor.id] }, scope: { subjectIds: [input.anchorId] }, reason: "Human reviewer may intend this scenario action.",
  }];
  return { name: input.id, situation, rules, possibilityId, verb: input.verb, externalDependency: input.externalDependency ?? 0 };
}

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
