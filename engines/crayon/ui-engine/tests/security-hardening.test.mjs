import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAuthority } from "../dist/packages/kernel/src/index.js";
import { SemanticCodecError, canonicalStringify, decodeRIR } from "../dist/packages/codec/src/index.js";
import { redactPaths, redactView, isRedactionMarker } from "../dist/packages/redaction/src/index.js";
import { validateRendererClaims } from "../dist/packages/conformance/src/index.js";

test("semantic redaction is exact-path policy, preserves identity, and never mutates source", () => {
  const source = {
    id: "record:1",
    subject: "account:A",
    token: "secret",
    nested: { password: "hidden", state: "known" },
  };
  const original = structuredClone(source);
  const result = redactView(source, redactPaths([
    { path: "$.token", reason: "credential", classification: "secret" },
    { path: "$.nested.password", reason: "credential", classification: "secret" },
    { path: "$.id", reason: "overbroad-policy", classification: "internal" },
  ], ["$.id"]));

  assert.deepEqual(source, original);
  assert.equal(result.value.id, "record:1", "protected semantic identity must survive derived view");
  assert.equal(isRedactionMarker(result.value.token), true);
  assert.equal(isRedactionMarker(result.value.nested.password), true);
  assert.equal(result.value.token.meaning, "withheld-not-unknown");
  assert.equal(result.value.nested.state, "known");
  assert.deepEqual(result.redactions.map((entry) => entry.path), ["$.token", "$.nested.password"]);
});

test("redaction does not guess same-named fields that were not explicitly classified", () => {
  const source = { primary: { value: "secret" }, secondary: { value: "public" } };
  const result = redactView(source, redactPaths([
    { path: "$.primary.value", reason: "classified-sensitive", classification: "restricted" },
  ]));
  assert.equal(isRedactionMarker(result.value.primary.value), true);
  assert.equal(result.value.secondary.value, "public");
});

test("codec rejects oversized, over-deep, and collection-abusive untrusted input before semantic interpretation", () => {
  assert.throws(
    () => decodeRIR(JSON.stringify({ envelopeVersion: "0", kind: "rir", semanticVersion: "0", payload: { version: "0", padding: "x".repeat(200) } }), { maxBytes: 80 }),
    (error) => error instanceof SemanticCodecError && error.code === "PAYLOAD_TOO_LARGE",
  );

  let nested = { value: true };
  for (let index = 0; index < 10; index += 1) nested = { nested };
  assert.throws(
    () => decodeRIR(JSON.stringify({ envelopeVersion: "0", kind: "rir", semanticVersion: "0", payload: nested }), { maxDepth: 4 }),
    (error) => error instanceof SemanticCodecError && error.code === "PAYLOAD_TOO_DEEP",
  );

  assert.throws(
    () => decodeRIR(JSON.stringify({ envelopeVersion: "0", kind: "rir", semanticVersion: "0", payload: { version: "0", nodes: new Array(20).fill(0) } }), { maxCollectionItems: 5 }),
    (error) => error instanceof SemanticCodecError && error.code === "COLLECTION_TOO_LARGE",
  );
});

test("property corpus: explicit deny always wins over allow regardless rule ordering", () => {
  const actor = { id: "human:1", kind: "human" };
  const allow = { id: "allow", effect: "allow", capabilities: ["commit"], actors: { ids: [actor.id] } };
  const deny = { id: "deny", effect: "deny", capabilities: ["commit"], actors: { ids: [actor.id] } };
  for (let seed = 1; seed <= 128; seed += 1) {
    const rules = seed % 2 === 0 ? [allow, deny] : [deny, allow];
    const decision = evaluateAuthority({ request: { actor, capability: "commit" }, rules });
    assert.equal(decision.status, "denied");
    assert.ok(decision.reasons.some((reason) => reason.code === "DENY_OVERRIDES_ALLOW" || reason.code === "EXPLICIT_DENY"));
  }
});

test("property corpus: canonical encoding is invariant to insertion order", () => {
  for (let seed = 1; seed <= 128; seed += 1) {
    const keys = ["a", "b", "c", "d"];
    const rotated = keys.slice(seed % keys.length).concat(keys.slice(0, seed % keys.length));
    const object = Object.fromEntries(rotated.map((key) => [key, key.charCodeAt(0)]));
    const canonical = canonicalStringify(object);
    assert.equal(canonical, '{"a":97,"b":98,"c":99,"d":100}');
  }
});

test("property corpus: renderer conformance cannot pass after removing a required claim", () => {
  const document = {
    version: "0", situationId: "s", root: "field", explanation: [], nodes: [
      { id: "field", kind: "field", children: ["path"] },
      { id: "path", kind: "path", from: "a", to: "b", intent: "Act", possibilityId: "p", semanticRef: "p", availability: "unknown", resistance: { score: 0.7, mode: "deliberate" }, consequenceMarks: [], requirements: { authorityCapabilities: ["commit"] } },
    ],
  };
  const required = validateRendererClaims(document, []).required;
  for (let index = 0; index < required.length; index += 1) {
    const observed = required.filter((_, candidate) => candidate !== index);
    const report = validateRendererClaims(document, observed);
    assert.equal(report.conforms, false);
    assert.ok(report.findings.some((finding) => finding.reason === "MISSING_CLAIM"));
  }
});
