import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { assessDecisionRobustness, compareOrdinalScores, validateOrdinalScoreRecord } from "../dist/index.js";
import { repositoryIdentity as coreRepositoryIdentity } from "@arsybelovedlabs/moonwitness-core";

test("foundation package declares ESM and a public export", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  assert.equal(manifest.type, "module");
  assert.ok(manifest.exports["."]);
  assert.match(manifest.engines.node, /^24\./);
});

test("implements the versioned deterministic CRAYON ordinal scoring fixture", async () => {
  const fixture = JSON.parse(await readFile(new URL("./fixtures/ordinal-scoring-v1.json", import.meta.url)));
  assert.equal(fixture.datasetStatus, "synthetic-development-only-not-empirical");
  const result = compareOrdinalScores(fixture.records);
  assert.equal(result.byArm.rgbl.means.traceability, fixture.expected.rgblTraceabilityMean);
  assert.equal(
    result.descriptiveDifferences.find((item) => item.left === "rgbl" && item.right === "free" && item.dimension === "traceability")?.difference,
    fixture.expected.rgblVsFreeTraceabilityDifference,
  );
  assert.equal(result.interpretation, fixture.expected.interpretation);
});

test("rejects fractional, out-of-range, and incomplete ordinal records deterministically", () => {
  const errors = validateOrdinalScoreRecord({
    studyId: "", caseId: "case-1", evaluatorId: "e1", arm: "rgbl",
    scores: { traceability: 2.5, inferentialRestraint: 5, uncertaintyHonesty: 3, conflictPreservation: 2, decisionProportionality: 1, usefulness: 0 },
  });
  assert.deepEqual(errors, [
    "studyId must be non-empty",
    "traceability must be an integer between 0 and 4",
    "inferentialRestraint must be an integer between 0 and 4",
  ]);
});

test("consumes the published Core public export", () => {
  assert.equal(coreRepositoryIdentity, "moonwitness-core");
});

test("implements the versioned deterministic CRAYON decision robustness fixture", async () => {
  const fixture = JSON.parse(await readFile(new URL("./fixtures/decision-robustness-v1.json", import.meta.url)));
  assert.equal(fixture.datasetStatus, "synthetic-development-only-not-empirical");
  assert.equal(fixture.legacyEvidence.commit, "085ce7077607c2ce1213f124496b97ba0fad707e");
  for (const item of fixture.cases) {
    const report = assessDecisionRobustness(item.scenarios, item.context);
    assert.equal(report.classification, item.expected.classification, item.id);
    assert.equal(report.recommendation, item.expected.recommendation, item.id);
    assert.equal(report.consensusRatio, item.expected.consensusRatio, item.id);
    assert.equal(report.interpretation, "stability-across-declared-scenarios-not-correctness", item.id);
  }
});

test("blocks a declared live scenario without a decision key", () => {
  const report = assessDecisionRobustness([
    { id: "incomplete", label: "Incomplete", status: "live", rationale: "No direction." },
  ], { risk: "critical", reversibility: "irreversible" });
  assert.equal(report.classification, "blocked");
  assert.equal(report.recommendation, "stop-high-consequence-action");
  assert.equal(report.distinctLiveDecisions, 0);
});
