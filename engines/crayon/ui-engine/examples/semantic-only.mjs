import { createSemanticSnapshot } from "allah-crayon-snapshot";
import { planSituationRepresentation, renderRIRAsText } from "allah-crayon-rir";

const actor = { id: "human:operator", kind: "human" };
const situation = {
  id: "example:document-review",
  anchor: { id: "document:42", type: "document" },
  entities: [{ id: "document:42", type: "document", state: { name: "Release notes", status: "draft" } }],
  relations: [], observations: [], expectations: [],
  knowledge: [{ id: "knowledge:status", key: "document:42.status", value: "draft", epistemic: "fact", certainty: 1 }],
  possibilities: [{
    id: "possibility:publish",
    verb: "Publish document",
    subject: { id: "document:42", type: "document" },
    constraints: [{ id: "constraint:draft", knowledgeKey: "document:42.status", operator: "equals", expected: "draft" }],
    authority: [{ capability: "intend" }],
    consequence: {
      effects: [{ id: "effect:status", entity: "document:42", property: "status", from: "draft", to: "published" }],
      reversibility: "compensatable", risk: 0.25, impact: 0.45, uncertainty: 0.05,
    },
  }],
  now: new Date().toISOString(),
};
const authorityRules = [{ id: "rule:intend", effect: "allow", capabilities: ["intend"], actors: { ids: [actor.id] }, scope: { subjectIds: ["document:42"] } }];
const snapshot = createSemanticSnapshot({ situation, actor, authorityRules });
const document = planSituationRepresentation({ situation, snapshot });
console.log(renderRIRAsText(document));
