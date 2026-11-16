import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { inspectRepresentation } from "../dist/packages/inspector/src/index.js";
import { RIRView } from "../packages/renderer-web/dist/index.js";

const marker = {
  redacted: true,
  meaning: "withheld-not-unknown",
  reason: "customer-data",
  classification: "restricted",
};

function document() {
  return {
    version: "0",
    situationId: "situation:redaction",
    root: "field:root",
    explanation: ["redaction is a representation policy, not epistemic uncertainty"],
    nodes: [
      { id: "field:root", kind: "field", children: ["layer:present"] },
      { id: "anchor:account", kind: "anchor", subjectId: "account:1", entityType: "account", label: "Account" },
      { id: "mark:secret", kind: "mark", role: "knowledge", label: "account:1.secret", semanticRef: "account:1.secret", value: marker, epistemic: "fact" },
      { id: "layer:present", kind: "layer", depth: 0, purpose: "present", members: ["anchor:account", "mark:secret"] },
    ],
  };
}

function snapshot() {
  return {
    version: "0",
    situationId: "situation:redaction",
    anchor: { id: "account:1", type: "account" },
    known: [{ key: "account:1.secret", value: marker, epistemic: "fact", certainty: 1 }],
    uncertain: [],
    conflicted: [],
    unknown: [],
    possibilities: [],
    history: [{
      id: "record:1",
      transitionId: "transition:1",
      intentId: "intent:1",
      actorId: "human:1",
      prediction: [],
      observations: [{
        id: "fact:secret",
        phase: "observation",
        at: "2026-08-25T10:00:00Z",
        entity: "account:1",
        property: "secret",
        value: marker,
        epistemic: "fact",
        sourceIds: ["source:trusted"],
        evidenceIds: ["evidence:secret"],
      }],
      reconciliations: [],
      witness: { id: "witness:1", phase: "witness", at: "2026-08-25T10:00:01Z", status: "verified" },
      retry: { status: "unnecessary", witnessId: "witness:1", reason: "OUTCOME_VERIFIED", requiredAction: "do-not-retry" },
      reconciliationIds: [],
    }],
  };
}

const situation = {
  id: "situation:redaction",
  anchor: { id: "account:1", type: "account" },
  entities: [{ id: "account:1", type: "account", state: {} }],
  relations: [], observations: [], expectations: [], knowledge: [], possibilities: [],
  now: "2026-08-25T10:00:02Z",
};

test("Inspector explicitly explains redacted knowledge as withheld, not unknown", () => {
  const report = inspectRepresentation({
    situation,
    snapshot: snapshot(),
    document: document(),
    nodeId: "mark:secret",
  });
  assert.equal(report.semantic.knowledge.visibility, "redacted");
  assert.equal(report.semantic.knowledge.epistemic, "fact");
  assert.equal(report.semantic.knowledge.redaction.meaning, "withheld-not-unknown");
  assert.ok(report.representation.reasons.some((reason) => /withheld by representation policy/i.test(reason)));
  assert.ok(report.representation.reasons.some((reason) => /not epistemic unknown/i.test(reason)));
});

test("Inspector keeps redacted temporal event identity/provenance while withholding its value", () => {
  const report = inspectRepresentation({ situation, snapshot: snapshot(), document: document(), nodeId: "mark:secret" });
  const event = report.temporal.records[0].events[0];
  assert.equal(event.visibility, "redacted");
  assert.equal(event.value, undefined);
  assert.deepEqual(event.sourceIds, ["source:trusted"]);
  assert.deepEqual(event.evidenceIds, ["evidence:secret"]);
});

test("Web renderer presents withheld status as text and never serializes the hidden payload", () => {
  const html = renderToStaticMarkup(React.createElement(RIRView, { document: document(), detail: "standard" }));
  assert.match(html, /withheld \(restricted\)/i);
  assert.match(html, /withheld by representation policy · not unknown/i);
  assert.match(html, /data-redacted="true"/);
  assert.doesNotMatch(html, /customer-data/);
  assert.doesNotMatch(html, /"redacted":true/);
});
