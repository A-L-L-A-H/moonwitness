import { createSemanticSnapshot } from "allah-crayon-snapshot";
import { planSituationRepresentation } from "allah-crayon-rir";
import { inspectAllPaths } from "allah-crayon-inspector";

const actor = { id: "human:operator", kind: "human" };
const situation = {
  id: "example:approval",
  anchor: { id: "request:42", type: "request" },
  entities: [{ id: "request:42", type: "request", state: { name: "Access request", status: "pending" } }],
  relations: [], observations: [], expectations: [],
  knowledge: [{ id: "knowledge:status", key: "request:42.status", value: "pending", epistemic: "fact", certainty: 1 }],
  possibilities: [{
    id: "possibility:approve",
    verb: "Approve request",
    subject: { id: "request:42", type: "request" },
    constraints: [{ id: "constraint:pending", knowledgeKey: "request:42.status", operator: "equals", expected: "pending" }],
    authority: [{ capability: "intend" }],
    consequence: {
      effects: [{ id: "effect:status", entity: "request:42", property: "status", from: "pending", to: "approved" }],
      reversibility: "reversible", risk: 0.18, impact: 0.3, uncertainty: 0.04,
    },
  }],
  now: new Date().toISOString(),
};
const authorityRules = [{ id: "rule:intend", effect: "allow", capabilities: ["intend"], actors: { ids: [actor.id] }, scope: { subjectIds: ["request:42"] } }];
const snapshot = createSemanticSnapshot({ situation, actor, authorityRules });
const document = planSituationRepresentation({ situation, snapshot });
console.log(JSON.stringify(inspectAllPaths({ situation, snapshot, document }), null, 2));
