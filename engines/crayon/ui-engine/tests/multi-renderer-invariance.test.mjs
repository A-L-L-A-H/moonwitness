import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderRIRAsText } from "../dist/packages/rir/src/index.js";
import { renderRIRForAgent } from "../dist/packages/renderer-agent/src/index.js";
import { renderRIRForVoice } from "../dist/packages/renderer-voice/src/index.js";
import { RIRView } from "../packages/renderer-web/dist/index.js";

function fixture() {
  return {
    version: "0", situationId: "situation:invariance", root: "field:root",
    explanation: ["same meaning must survive every renderer"],
    nodes: [
      { id: "field:root", kind: "field", children: ["layer:present", "layer:future", "layer:history"] },
      { id: "anchor:resource", kind: "anchor", subjectId: "resource:prod", entityType: "resource", label: "Production Resource" },
      { id: "mark:unknown", kind: "mark", role: "knowledge", label: "resource:prod.backup", value: undefined, epistemic: "unknown" },
      { id: "mark:future", kind: "mark", role: "future", label: "Remove resource · possible future", value: ["resource:prod.state present → removed"] },
      { id: "mark:effect", kind: "mark", role: "effect", label: "resource:prod.state", value: "removed", physics: { disclosure: { score: 0.91, explanation: ["material"] } } },
      { id: "path:remove", kind: "path", from: "anchor:resource", to: "mark:future", intent: "Remove resource", possibilityId: "possibility:remove", availability: "unknown", resistance: { score: 0.82, mode: "deliberate" }, consequenceMarks: ["mark:effect"], requirements: { constraintIds: ["constraint:backup-known"], authorityCapabilities: ["commit", "intend"] }, physics: { disclosure: { score: 0.91, explanation: [] } } },
      { id: "mark:observation", kind: "mark", role: "observation", label: "resource:prod.state", value: undefined, epistemic: "unknown", temporal: { phase: "observation", at: "2026-08-25T00:01:00Z", witnessId: "witness:remove", status: "partial", evidenceIds: [] } },
      { id: "mark:witness", kind: "mark", role: "witness", label: "Witness witness:remove", value: "partial", temporal: { phase: "witness", at: "2026-08-25T00:01:00Z", witnessId: "witness:remove", status: "partial" } },
      { id: "mark:retry", kind: "mark", role: "retry", label: "Retry / reconciliation", value: { status: "blocked", reason: "OUTCOME_UNRESOLVED", requiredAction: "reconcile-before-retry" }, temporal: { phase: "witness", at: "2026-08-25T00:01:00Z", witnessId: "witness:remove", status: "partial" } },
      { id: "layer:present", kind: "layer", depth: 0, purpose: "present", members: ["anchor:resource", "mark:unknown"] },
      { id: "layer:future", kind: "layer", depth: 1, purpose: "possible-future", members: ["path:remove", "mark:future", "mark:effect"] },
      { id: "layer:history", kind: "layer", depth: 2, purpose: "history", members: ["mark:observation", "mark:witness", "mark:retry"] },
    ],
  };
}

test("Agent renderer preserves truth, requirements, consequence and witness without gaining authority", () => {
  const rendered = renderRIRForAgent(fixture());
  assert.equal(rendered.orientation.subjectId, "resource:prod");
  assert.equal(rendered.knowledge[0].epistemic, "unknown");
  assert.equal(rendered.possibilities[0].availability, "unknown");
  assert.deepEqual(rendered.possibilities[0].constraints, ["constraint:backup-known"]);
  assert.deepEqual(rendered.possibilities[0].authorityRequirements, ["commit", "intend"]);
  assert.equal(rendered.possibilities[0].consequences[0].value, "removed");
  assert.ok(rendered.history.some((event) => event.witnessStatus === "partial"));
  assert.equal(rendered.authority.rendererGrantsAuthority, false);
});

test("Voice renderer cannot omit material uncertainty, consequence, authority or witness state", () => {
  const voice = renderRIRForVoice(fixture()).text;
  assert.match(voice, /Production Resource/);
  assert.match(voice, /backup is unknown/i);
  assert.match(voice, /Remove resource is unknown/i);
  assert.match(voice, /Required authority: commit, intend/i);
  assert.match(voice, /resource:prod\.state becomes removed/i);
  assert.match(voice, /witness partial/i);
  assert.match(voice, /OUTCOME_UNRESOLVED/);
});

test("Text and Web renderers preserve the same critical semantic claims", () => {
  const document = fixture();
  const text = renderRIRAsText(document);
  const web = renderToStaticMarkup(React.createElement(RIRView, { document, detail: "compact" }));
  for (const token of ["resource:prod.backup", "unknown", "Remove resource", "partial"]) {
    assert.match(text, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    assert.match(web, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.match(web, /commitment deliberate/i);
});
