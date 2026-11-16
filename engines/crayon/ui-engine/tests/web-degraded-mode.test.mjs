import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SafeRIRView, validateWebRIRInput } from "../packages/renderer-web/dist/safe.js";

test("malformed RIR is represented as a system limitation, not a domain outcome", () => {
  const malformed = {
    version: "0",
    situationId: "situation:still-known",
    root: "field:missing",
    nodes: [],
  };
  const validation = validateWebRIRInput(malformed);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "ROOT_NODE_MISSING"));

  const html = renderToStaticMarkup(React.createElement(SafeRIRView, { document: malformed }));
  assert.match(html, /SYSTEM LIMITATION/i);
  assert.match(html, /Representation unavailable/i);
  assert.match(html, /not evidence that the domain action failed or succeeded/i);
  assert.match(html, /data-semantic-ref="situation:still-known"/i);
});

test("unsupported RIR version fails closed instead of being silently reinterpreted", () => {
  const validation = validateWebRIRInput({
    version: "999",
    situationId: "situation:future",
    root: "field:root",
    nodes: [{ id: "field:root", kind: "field", children: [] }],
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "UNSUPPORTED_VERSION"));
});
