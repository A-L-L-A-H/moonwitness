import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { deriveRequiredRendererClaims } from "../dist/packages/conformance/src/index.js";
import { localizeRIR } from "../dist/packages/localization/src/index.js";
import { renderRIRForTerminal } from "../dist/packages/renderer-terminal/src/index.js";
import { renderRIRAsStaticHTML } from "../dist/packages/renderer-static/src/index.js";
import { renderRIRForPrint } from "../dist/packages/renderer-print/src/index.js";
import { SafeRIRView } from "../packages/renderer-web/dist/safe.js";

function fixture() {
  return {
    version: "0",
    situationId: "situation:renderers",
    root: "field:root",
    explanation: ["renderer fixture"],
    nodes: [
      { id: "field:root", kind: "field", children: ["anchor:1", "mark:k", "path:1", "mark:e", "mark:w"] },
      { id: "anchor:1", kind: "anchor", subjectId: "resource:1", entityType: "resource", label: "Production <Resource>", semanticRef: "resource:1" },
      { id: "mark:k", kind: "mark", role: "knowledge", label: "backup", value: undefined, epistemic: "unknown", semanticRef: "resource:1.backup" },
      { id: "mark:e", kind: "mark", role: "effect", label: "state", value: "removed", semanticRef: "resource:1.state" },
      { id: "path:1", kind: "path", from: "anchor:1", to: "mark:e", intent: "Remove resource", possibilityId: "possibility:remove", semanticRef: "possibility:remove", availability: "unknown", resistance: { score: 0.9, mode: "deliberate" }, consequenceMarks: ["mark:e"], requirements: { constraintIds: [], authorityCapabilities: ["commit", "intend"] } },
      { id: "mark:w", kind: "mark", role: "witness", label: "Witness", value: "partial", semanticRef: "witness:1", temporal: { phase: "witness", at: "2026-08-25T10:00:00Z", status: "partial", witnessId: "witness:1" } },
    ],
  };
}

test("Terminal renderer preserves material semantics and never grants authority", () => {
  const result = renderRIRForTerminal(fixture());
  assert.equal(result.rendererGrantsAuthority, false);
  for (const token of ["resource:1.backup", "epistemic=unknown", "availability=unknown", "authority=commit,intend", "witness=partial"]) {
    assert.match(result.text, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Static renderer is script-free, escaped, and exposes semantic metadata", () => {
  const result = renderRIRAsStaticHTML(fixture());
  assert.equal(result.rendererGrantsAuthority, false);
  assert.doesNotMatch(result.html, /<script/i);
  assert.match(result.html, /Production &lt;Resource&gt;/);
  assert.match(result.html, /data-epistemic="unknown"/);
  assert.match(result.html, /data-availability="unknown"/);
  assert.match(result.html, /authority: commit, intend/);
});

test("Print projection keeps orientation, consequence, authority, and witness as text", () => {
  const result = renderRIRForPrint(fixture());
  assert.equal(result.rendererGrantsAuthority, false);
  const text = result.sections.flatMap((section) => [section.heading, ...section.lines]).join("\n");
  assert.match(text, /Current orientation/);
  assert.match(text, /value: removed/);
  assert.match(text, /authority: commit, intend/);
  assert.match(text, /witness: partial/);
});

test("localization changes labels/intent but leaves required semantic claims invariant", () => {
  const document = fixture();
  const before = deriveRequiredRendererClaims(document);
  const localized = localizeRIR(document, { locale: "ar", direction: "rtl" }, (text) => `ترجمة:${text}`);
  const after = deriveRequiredRendererClaims(localized.document);
  assert.deepEqual(after, before);
  assert.equal(localized.direction, "rtl");
  assert.match(localized.document.nodes.find((node) => node.kind === "anchor").label, /^ترجمة:/);
});

test("Safe Web renderer exposes RTL direction without changing semantic ref", () => {
  const html = renderToStaticMarkup(React.createElement(SafeRIRView, { document: fixture(), direction: "rtl" }));
  assert.match(html, /dir="rtl"/);
  assert.match(html, /data-crayon-direction="rtl"/);
  assert.match(html, /data-semantic-ref="resource:1"/);
});

test("Web CSS includes reduced-motion, high-contrast, forced-colors, and logical RTL properties", () => {
  const css = readFileSync(new URL("../packages/renderer-web/src/styles.css", import.meta.url), "utf8");
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /prefers-contrast/);
  assert.match(css, /forced-colors/);
  assert.match(css, /border-inline-start/);
  assert.match(css, /inset-inline-start/);
});
