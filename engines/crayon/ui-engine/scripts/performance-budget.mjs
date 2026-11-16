import { performance } from "node:perf_hooks";
import { createSemanticSnapshot } from "../packages/snapshot/dist/index.js";
import { planSituationRepresentation } from "../packages/rir/dist/index.js";
import { inspectAllPaths } from "../packages/inspector/dist/index.js";

const actor = { id: "human:benchmark", kind: "human" };
const rules = [{ id: "benchmark:intend", effect: "allow", capabilities: ["intend"], actors: { ids: [actor.id] } }];

function makeSituation(size) {
  const entities = Array.from({ length: size }, (_, index) => ({ id: `entity:${index}`, type: "benchmark-subject", state: { name: `Subject ${index}`, value: index } }));
  return {
    id: `benchmark:${size}`,
    anchor: { id: "entity:0", type: "benchmark-subject" },
    entities,
    relations: entities.slice(1).map((entity, index) => ({ from: "entity:0", type: "related", to: entity.id, strength: 1 / (index + 2) })),
    observations: [], expectations: [],
    knowledge: entities.map((entity, index) => ({ id: `knowledge:${index}`, key: `${entity.id}.value`, value: index, epistemic: "fact", certainty: 1 })),
    possibilities: entities.slice(0, Math.max(1, Math.floor(size / 5))).map((entity, index) => ({
      id: `possibility:${index}`, verb: `Change ${index}`, subject: { id: entity.id, type: entity.type },
      consequence: { effects: [{ id: `effect:${index}`, entity: entity.id, property: "value", from: index, to: index + 1 }], reversibility: "reversible", risk: 0.1, impact: Math.min(1, index / size), uncertainty: 0.05 },
    })),
    now: "2026-08-25T00:00:00Z",
  };
}

function measure(size, iterations) {
  const situation = makeSituation(size);
  const start = performance.now();
  let nodeCount = 0;
  for (let i = 0; i < iterations; i++) {
    const snapshot = createSemanticSnapshot({ situation, actor, authorityRules: rules });
    const document = planSituationRepresentation({ situation, snapshot });
    inspectAllPaths({ situation, snapshot, document });
    nodeCount = document.nodes.length;
  }
  return { size, nodeCount, ms: (performance.now() - start) / iterations };
}

// Warm up JIT and module paths before measuring.
measure(20, 2);
const small = measure(25, 5);
const medium = measure(125, 3);
const large = measure(500, 2);

const results = { small, medium, large };
console.log(JSON.stringify(results, null, 2));

// Budgets are intentionally generous for heterogeneous self-hosted runners.
if (small.ms > 100) throw new Error(`Small situation exceeded 100ms budget: ${small.ms.toFixed(1)}ms`);
if (medium.ms > 500) throw new Error(`Medium situation exceeded 500ms budget: ${medium.ms.toFixed(1)}ms`);
if (large.ms > 2500) throw new Error(`Large situation exceeded 2500ms budget: ${large.ms.toFixed(1)}ms`);
const scale = large.size / medium.size;
const timeRatio = large.ms / Math.max(1, medium.ms);
if (timeRatio > scale * 3.5) throw new Error(`Potential superlinear regression: ${scale.toFixed(1)}x input caused ${timeRatio.toFixed(1)}x latency`);
console.log("CRAYON performance budgets passed");
