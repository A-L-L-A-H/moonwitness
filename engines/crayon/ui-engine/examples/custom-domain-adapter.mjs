import { defineDomainAdapter } from "../dist/packages/adapter/src/index.js";
import { createSemanticSnapshot } from "allah-crayon-snapshot";
import { planSituationRepresentation, renderRIRAsText } from "allah-crayon-rir";

const adapter = defineDomainAdapter({
  id: "adapter:warehouse-robot",
  adapt(input, context) {
    const observationId = "observation:robot-battery";
    return {
      id: "situation:warehouse-robot",
      anchor: { id: "robot:7", type: "robot" },
      entities: [
        { id: "robot:7", type: "robot", state: { battery: input.battery, task: input.task } },
        { id: "station:charge", type: "station", state: { available: true } },
      ],
      relations: [{ from: "robot:7", type: "near", to: "station:charge", strength: 0.8 }],
      observations: [{
        id: observationId,
        subject: { id: "robot:7", type: "robot" },
        property: "battery",
        value: input.battery,
        observedAt: context.now,
        source: "robot-telemetry",
        reliability: 0.98,
      }],
      expectations: [],
      knowledge: [{
        id: "knowledge:robot-battery",
        key: "robot:7.battery",
        value: input.battery,
        epistemic: "fact",
        observations: [observationId],
      }],
      possibilities: [{
        id: "possibility:charge",
        verb: "Move to charging station",
        subject: { id: "robot:7", type: "robot" },
        constraints: [{
          id: "constraint:battery-low",
          knowledgeKey: "robot:7.battery",
          operator: "lt",
          expected: 25,
          acceptedEpistemic: ["fact", "derived"],
        }],
        authority: [{ capability: "intend", subject: { id: "robot:7", type: "robot" } }],
        consequence: {
          effects: [{ id: "effect:robot-task", entity: "robot:7", property: "task", from: input.task, to: "charging" }],
          reversibility: "reversible",
          risk: 0.08,
          impact: 0.2,
          uncertainty: 0.04,
        },
      }],
      now: context.now,
    };
  },
});

const now = "2026-08-25T10:00:00Z";
const situation = adapter.adapt({ battery: 18, task: "picking" }, { now });
const actor = { id: "human:supervisor", kind: "human" };
const authorityRules = [{
  id: "rule:supervisor-intend",
  effect: "allow",
  capabilities: ["intend"],
  actors: { ids: [actor.id] },
  scope: { subjectIds: ["robot:7"] },
}];

const snapshot = createSemanticSnapshot({ situation, actor, authorityRules });
const document = planSituationRepresentation({ situation, snapshot });
console.log(renderRIRAsText(document));
