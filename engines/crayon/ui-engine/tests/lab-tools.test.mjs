import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvidenceGraph,
  createTemporalFrames,
  defineDeclarativeScenario,
  diffRIRSemantics,
  filterEvidenceGraph,
  profilePipeline,
  projectTemporalFrame,
} from "../dist/packages/lab-tools/src/index.js";

const temporalRecord = {
  version: "0",
  id: "record:1",
  transitionId: "transition:1",
  intentId: "intent:1",
  actorId: "human:1",
  prediction: [{ id: "fact:p", phase: "prediction", at: "2026-08-25T10:00:00Z", entity: "entity:1", property: "state", value: "next", epistemic: "estimate", sourceIds: ["prediction:1"], evidenceIds: [] }],
  observations: [{ id: "fact:o", phase: "observation", at: "2026-08-25T10:01:00Z", entity: "entity:1", property: "state", value: undefined, epistemic: "unknown", sourceIds: ["observation:1", "service:a"], evidenceIds: ["evidence:1"] }],
  reconciliations: [{ id: "fact:r", phase: "reconciliation", at: "2026-08-25T10:02:00Z", entity: "entity:1", property: "state", value: "next", epistemic: "fact", sourceIds: ["reconciliation:1"], evidenceIds: ["evidence:2"] }],
  witness: { id: "witness:1", phase: "witness", at: "2026-08-25T10:02:01Z", status: "verified" },
  retry: { status: "unnecessary", witnessId: "witness:1", reason: "OUTCOME_VERIFIED", requiredAction: "do-not-retry" },
  reconciliationIds: ["reconciliation:1"],
};

const situation = {
  id: "scenario:lab",
  anchor: { id: "entity:1", type: "resource" },
  entities: [{ id: "entity:1", type: "resource", state: { state: "current" } }],
  relations: [], observations: [], expectations: [], knowledge: [], possibilities: [],
  now: "2026-08-25T10:00:00Z",
};

test("declarative scenario is validated and immutable", () => {
  const scenario = defineDeclarativeScenario({ version: "0", id: "scenario:lab", label: "Lab", question: "What changed?", actor: { id: "human:1", kind: "human" }, authorityRules: [], situation, temporalRecords: [temporalRecord] });
  assert.equal(scenario.id, "scenario:lab");
  assert.equal(Object.isFrozen(scenario), true);
});

test("time travel never exposes future facts, witness, retry, or evidence before their timestamp", () => {
  const frame = projectTemporalFrame([temporalRecord], "2026-08-25T10:01:30Z");
  assert.deepEqual(frame.facts.map((fact) => fact.id), ["fact:p", "fact:o"]);
  assert.deepEqual(frame.evidenceIds, ["evidence:1"]);
  assert.ok(frame.sourceIds.includes("service:a"));
  assert.equal(frame.witness.length, 0);
  assert.equal(frame.retry.length, 0);

  const frames = createTemporalFrames([temporalRecord]);
  assert.ok(frames.length >= 4);
  assert.equal(frames.at(-1).witness[0].status, "verified");
  assert.equal(frames.at(-1).retry[0].assessment.reason, "OUTCOME_VERIFIED");
});

test("semantic diff ignores translated labels but explains actionability changes", () => {
  const before = { version: "0", situationId: "s", root: "field", explanation: [], nodes: [{ id: "field", kind: "field", children: ["path"] }, { id: "path", kind: "path", from: "a", to: "b", intent: "Act", possibilityId: "p", availability: "unknown", resistance: { score: 0.5, mode: "preview" }, consequenceMarks: [] }] };
  const relabeled = structuredClone(before); relabeled.nodes[1].intent = "Aksi";
  assert.deepEqual(diffRIRSemantics(before, relabeled), []);
  const changed = structuredClone(before); changed.nodes[1].availability = "available";
  const diff = diffRIRSemantics(before, changed);
  assert.equal(diff[0].status, "changed");
  assert.ok(diff[0].explanation.includes("semantic field availability changed"));
});

test("evidence graph preserves knowledge, observation, evidence, source and witness links", () => {
  const graph = buildEvidenceGraph([temporalRecord], [{
    id: "knowledge:1",
    key: "entity:1.state",
    epistemic: "conflicted",
    observations: ["fact:o"],
    evidence: [{ id: "evidence:k", source: "source:k", observedAt: "2026-08-25T10:01:00Z" }],
  }]);
  assert.ok(graph.nodes.some((node) => node.id === "evidence:1" && node.kind === "evidence"));
  assert.ok(graph.nodes.some((node) => node.id === "fact:o" && node.kind === "observation"));
  assert.ok(graph.nodes.some((node) => node.kind === "knowledge" && node.epistemic === "conflicted" && node.critical));
  assert.ok(graph.nodes.some((node) => node.id === "witness:1" && node.kind === "witness"));
  assert.ok(graph.edges.some((edge) => edge.from === "fact:o" && edge.to === "evidence:1" && edge.relation === "supported-by"));

  const filtered = filterEvidenceGraph(graph, { kinds: ["observation"] });
  assert.ok(filtered.nodes.some((node) => node.id === "fact:o"));
  assert.ok(filtered.nodes.some((node) => node.id === "witness:1"), "critical witness must survive semantic filtering");
  assert.ok(filtered.nodes.some((node) => node.id === "evidence:1"), "critical evidence must survive semantic filtering");
});

test("profiler is side-channel measurement and deterministic with injected monotonic clock", async () => {
  const ticks = [0, 1, 3, 4, 7, 9];
  let index = 0;
  const result = await profilePipeline([
    { name: "snapshot", run: () => "a" },
    { name: "rir", run: () => "b" },
  ], () => ticks[index++]);
  assert.deepEqual(result.values, ["a", "b"]);
  assert.deepEqual(result.profile.samples, [{ name: "snapshot", durationMs: 2 }, { name: "rir", durationMs: 3 }]);
  assert.equal(result.profile.totalMs, 9);
});
