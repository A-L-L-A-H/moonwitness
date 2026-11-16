import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveRequiredRendererClaims,
  validateRendererClaims,
} from "../dist/packages/conformance/src/index.js";

function fixture() {
  return {
    version: "0",
    situationId: "situation:conformance",
    root: "field:root",
    explanation: ["renderer conformance fixture"],
    nodes: [
      { id: "field:root", kind: "field", children: ["anchor:subject", "mark:knowledge", "mark:effect", "path:act", "mark:witness", "mark:retry"] },
      { id: "anchor:subject", kind: "anchor", subjectId: "subject:1", semanticRef: "subject:1", label: "Subject" },
      { id: "mark:knowledge", kind: "mark", role: "knowledge", semanticRef: "subject:1.state", label: "state", value: undefined, epistemic: "unknown" },
      { id: "mark:effect", kind: "mark", role: "effect", semanticRef: "subject:1.state", label: "state", value: "changed" },
      { id: "path:act", kind: "path", semanticRef: "possibility:act", from: "anchor:subject", to: "mark:effect", intent: "Act", possibilityId: "possibility:act", availability: "unknown", resistance: { score: 0.8, mode: "deliberate" }, consequenceMarks: ["mark:effect"], requirements: { constraintIds: ["constraint:state-known"], authorityCapabilities: ["intend", "commit"] } },
      { id: "mark:witness", kind: "mark", role: "witness", semanticRef: "witness:act", label: "Witness", value: "partial" },
      { id: "mark:retry", kind: "mark", role: "retry", semanticRef: "witness:act", label: "Retry", value: { status: "blocked", reason: "OUTCOME_UNRESOLVED" } },
    ],
  };
}

test("canonical renderer claim set contains critical semantic invariants", () => {
  const claims = deriveRequiredRendererClaims(fixture());
  assert.ok(claims.some((claim) => claim.kind === "semantic-ref" && claim.value === "subject:1"));
  assert.ok(claims.some((claim) => claim.kind === "epistemic" && claim.value === "unknown"));
  assert.ok(claims.some((claim) => claim.kind === "availability" && claim.value === "unknown"));
  assert.ok(claims.some((claim) => claim.kind === "consequence" && claim.value === "changed"));
  assert.ok(claims.some((claim) => claim.kind === "authority" && claim.value === "commit"));
  assert.ok(claims.some((claim) => claim.kind === "resistance" && claim.value === "deliberate:0.8"));
  assert.ok(claims.some((claim) => claim.kind === "witness" && claim.value === "partial"));
  assert.ok(claims.some((claim) => claim.kind === "retry" && claim.value.includes("OUTCOME_UNRESOLVED")));
});

test("renderer conformance passes only when all critical claims survive", () => {
  const document = fixture();
  const claims = deriveRequiredRendererClaims(document);
  assert.equal(validateRendererClaims(document, claims).conforms, true);

  const missingWitness = claims.filter((claim) => claim.kind !== "witness");
  const report = validateRendererClaims(document, missingWitness);
  assert.equal(report.conforms, false);
  assert.ok(report.findings.some((finding) => finding.reason === "MISSING_CLAIM" && finding.claimId.includes("witness")));
});

test("renderer claiming authority fails conformance even when presentation claims are complete", () => {
  const document = fixture();
  const claims = deriveRequiredRendererClaims(document);
  const report = validateRendererClaims(document, claims, { rendererGrantsAuthority: true });
  assert.equal(report.conforms, false);
  assert.ok(report.findings.some((finding) => finding.reason === "UNEXPECTED_AUTHORITY_GRANT"));
});
