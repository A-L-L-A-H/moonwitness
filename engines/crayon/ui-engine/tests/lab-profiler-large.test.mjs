import test from "node:test";
import assert from "node:assert/strict";
import { inspectRepresentation } from "../dist/packages/inspector/src/index.js";
import { profilePipeline } from "../dist/packages/lab-tools/src/index.js";
import { planSituationRepresentation } from "../dist/packages/rir/src/index.js";
import { createSemanticSnapshot } from "../dist/packages/snapshot/src/index.js";

function largeSituation(count = 600) {
  const entities = Array.from({ length: count }, (_, index) => ({
    id: `resource:${index}`,
    type: "resource",
    state: { state: index === 0 ? "active" : "related", ordinal: index },
  }));
  const knowledge = Array.from({ length: count }, (_, index) => ({
    id: `knowledge:${index}`,
    key: `resource:${index}.state`,
    value: index === 0 ? "active" : "related",
    epistemic: index % 17 === 0 ? "uncertain" : "fact",
    certainty: index % 17 === 0 ? 0.72 : 1,
  }));
  return {
    id: "situation:large-profiler",
    anchor: { id: "resource:0", type: "resource" },
    entities,
    relations: entities.slice(1).map((entity) => ({ from: "resource:0", type: "related-to", to: entity.id, strength: 0.5 })),
    observations: [],
    expectations: [],
    knowledge,
    possibilities: [{
      id: "possibility:large",
      verb: "Change primary resource",
      subject: { id: "resource:0", type: "resource" },
      constraints: [{ id: "constraint:active", knowledgeKey: "resource:0.state", operator: "equals", expected: "active" }],
      authority: [{ capability: "intend" }],
      consequence: {
        effects: [{ id: "effect:state", entity: "resource:0", property: "state", from: "active", to: "changed" }],
        reversibility: "reversible",
        risk: 0.25,
        impact: 0.4,
        uncertainty: 0.1,
      },
    }],
    now: "2026-08-25T10:00:00Z",
  };
}

test("large semantic fixture profiles Snapshot → RIR → Inspector without leaking payload into diagnostics", async () => {
  const situation = largeSituation();
  const actor = { id: "human:profiler", kind: "human" };
  const authorityRules = [{
    id: "rule:intend",
    effect: "allow",
    capabilities: ["intend"],
    actors: { ids: [actor.id] },
    scope: { subjectIds: ["resource:0"] },
  }];

  let snapshot;
  let rir;
  const result = await profilePipeline([
    {
      name: "snapshot",
      run: () => {
        snapshot = createSemanticSnapshot({ situation, actor, authorityRules });
        return snapshot;
      },
    },
    {
      name: "rir",
      run: () => {
        rir = planSituationRepresentation({ situation, snapshot });
        return rir;
      },
    },
    {
      name: "inspector",
      run: () => inspectRepresentation({
        situation,
        snapshot,
        document: rir,
        nodeId: rir.nodes.find((node) => node.kind === "path")?.id,
      }),
    },
  ]);

  assert.deepEqual(result.profile.samples.map((sample) => sample.name), ["snapshot", "rir", "inspector"]);
  assert.ok(result.profile.samples.every((sample) => Number.isFinite(sample.durationMs) && sample.durationMs >= 0));
  assert.ok(Number.isFinite(result.profile.totalMs) && result.profile.totalMs >= 0);
  assert.deepEqual(Object.keys(result.profile).sort(), ["samples", "totalMs"]);
  assert.equal(JSON.stringify(result.profile).includes("resource:599"), false, "profile diagnostics must not log semantic payloads");
  assert.equal(snapshot.context.entityCount, 600);
});
