import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { deriveSemanticTraversal, projectRIRDetail, renderRIRAsText } from "../dist/packages/rir/src/index.js";
import { RIRView, deriveCommitmentInteraction } from "../packages/renderer-web/dist/index.js";

function documentFixture() {
  return {
    version: "0", situationId: "situation:a11y", root: "field:root", explanation: [],
    nodes: [
      { id: "field:root", kind: "field", children: ["layer:present", "layer:future", "layer:history"] },
      { id: "anchor:subject", kind: "anchor", subjectId: "subject:1", label: "Subject 1", semanticRef: "subject:1" },
      { id: "mark:fact", kind: "mark", role: "knowledge", label: "subject:1.health", value: "good", epistemic: "fact", salience: 0.3 },
      { id: "mark:unknown", kind: "mark", role: "knowledge", label: "subject:1.settlement", value: undefined, epistemic: "unknown", salience: 0.2 },
      { id: "mark:future", kind: "mark", role: "future", label: "Apply · possible future", value: ["state changes"] },
      { id: "mark:effect", kind: "mark", role: "effect", label: "subject:1.state", value: "changed", physics: { disclosure: { score: 0.8, explanation: [] } } },
      { id: "path:apply", kind: "path", from: "anchor:subject", to: "mark:future", intent: "Apply", possibilityId: "possibility:apply", availability: "available", resistance: { score: 0.74, mode: "deliberate" }, consequenceMarks: ["mark:effect"], salience: 0.9, physics: { disclosure: { score: 0.8, explanation: [] } } },
      { id: "mark:witness", kind: "mark", role: "witness", label: "Witness w1", value: "partial", temporal: { phase: "witness", at: "2026-08-25T00:00:00Z", witnessId: "w1", status: "partial" } },
      { id: "layer:present", kind: "layer", depth: 0, purpose: "present", members: ["anchor:subject", "mark:fact", "mark:unknown"] },
      { id: "layer:future", kind: "layer", depth: 1, purpose: "possible-future", members: ["path:apply", "mark:future", "mark:effect"] },
      { id: "layer:history", kind: "layer", depth: 2, purpose: "history", members: ["mark:witness"] },
    ],
  };
}

test("semantic traversal prioritizes orientation and actionable meaning over incidental detail", () => {
  const traversal = deriveSemanticTraversal(documentFixture());
  assert.equal(traversal[0].nodeId, "anchor:subject");
  assert.ok(traversal.findIndex((entry) => entry.nodeId === "path:apply") < traversal.findIndex((entry) => entry.nodeId === "mark:fact"));
  assert.ok(traversal.some((entry) => entry.nodeId === "mark:unknown"));
});

test("compact semantic zoom cannot hide unknown truth, witness state, or material consequence", () => {
  const compact = projectRIRDetail(documentFixture(), "compact");
  const ids = new Set(compact.nodes.map((node) => node.id));
  assert.ok(ids.has("anchor:subject"));
  assert.ok(ids.has("mark:unknown"));
  assert.ok(ids.has("mark:witness"));
  assert.ok(ids.has("path:apply"));
  assert.ok(ids.has("mark:effect"));
});

test("commitment interaction cannot be downgraded by styling", () => {
  const path = documentFixture().nodes.find((node) => node.kind === "path");
  assert.equal(deriveCommitmentInteraction(path), "deliberate");
});

test("web and text representations expose uncertainty and witness semantics without color-only meaning", () => {
  const document = documentFixture();
  const html = renderToStaticMarkup(React.createElement(RIRView, { document, detail: "compact" }));
  assert.match(html, /epistemic state unknown/i);
  assert.match(html, /commitment deliberate/i);
  assert.match(html, /WITNESS TRACE/);
  assert.match(html, /witness: partial/i);
  const text = renderRIRAsText(document);
  assert.match(text, /WITNESS/i);
});
