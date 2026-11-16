import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gravity } from "../dist/packages/physics/src/index.js";
import { auditRepresentation } from "../dist/packages/rir/src/index.js";

const cases = JSON.parse(readFileSync(new URL("./fixtures/gravity-calibration.json", import.meta.url), "utf8"));

test("semantic gravity ranks significant work above low-value noise across domains", () => {
  const byDomain = new Map();
  for (const item of cases) {
    assert.deepEqual(Object.keys(item.input).sort(), ["impact", "relevance", "uncertainty", "urgency"]);
    const score = gravity(item.input).score;
    const group = byDomain.get(item.domain) ?? {};
    group[item.class] = score;
    byDomain.set(item.domain, group);
  }
  for (const [domain, group] of byDomain) {
    assert.ok(group.high > group.low + 0.35, `${domain} high-significance case should clearly outweigh background noise`);
  }
});

test("representation audit rejects semantically fashionable but empty action UI", () => {
  const bad = {
    version: "0", situationId: "bad", root: "field", explanation: [],
    nodes: [
      { id: "field", kind: "field", children: ["layer"] },
      { id: "anchor", kind: "anchor", subjectId: "subject", label: "Subject" },
      { id: "future", kind: "mark", role: "future", label: "Future" },
      { id: "path", kind: "path", from: "anchor", to: "future", intent: "Do it", possibilityId: "p", availability: "available", resistance: { score: 0.8, mode: "deliberate" }, consequenceMarks: [] },
      { id: "layer", kind: "layer", depth: 0, purpose: "present", members: ["anchor", "path"] },
    ],
  };
  const audit = auditRepresentation(bad);
  assert.equal(audit.passed, false);
  assert.ok(audit.findings.some((item) => item.code === "ACTION_WITHOUT_CONSEQUENCE"));
  assert.ok(audit.findings.some((item) => item.code === "ACTION_WITHOUT_AUTHORITY_REQUIREMENT"));
  assert.ok(audit.findings.some((item) => item.code === "MATERIAL_ACTION_WITHOUT_DISCLOSURE"));
});

test("representation audit accepts a minimally truthful explainable path", () => {
  const good = {
    version: "0", situationId: "good", root: "field", explanation: [],
    nodes: [
      { id: "field", kind: "field", children: ["present", "future"] },
      { id: "anchor", kind: "anchor", subjectId: "subject", label: "Subject" },
      { id: "knowledge", kind: "mark", role: "knowledge", label: "subject.state", value: "ready", epistemic: "fact" },
      { id: "future-mark", kind: "mark", role: "future", label: "Possible future" },
      { id: "effect", kind: "mark", role: "effect", label: "subject.state", value: "changed" },
      { id: "path", kind: "path", from: "anchor", to: "future-mark", intent: "Change", possibilityId: "p", availability: "available", resistance: { score: 0.5, mode: "explicit-preview" }, consequenceMarks: ["effect"], requirements: { constraintIds: [], authorityCapabilities: ["intend"] }, physics: { disclosure: { score: 0.5, explanation: ["material consequence"] } } },
      { id: "present", kind: "layer", depth: 0, purpose: "present", members: ["anchor", "knowledge"] },
      { id: "future", kind: "layer", depth: 1, purpose: "possible-future", members: ["path", "future-mark", "effect"] },
    ],
  };
  assert.equal(auditRepresentation(good).passed, true);
});
