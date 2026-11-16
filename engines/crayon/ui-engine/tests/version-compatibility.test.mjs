import test from "node:test";
import assert from "node:assert/strict";
import { checkSemanticSnapshotVersion, assertSemanticSnapshotV0 } from "../dist/packages/snapshot/src/index.js";
import { checkRIRVersion, assertRIRV0 } from "../dist/packages/rir/src/index.js";

test("semantic snapshot version 0 is supported and unknown versions are explicitly rejected", () => {
  const supported = { version: "0" };
  assert.equal(checkSemanticSnapshotVersion(supported).supported, true);
  assert.doesNotThrow(() => assertSemanticSnapshotV0(supported));
  const future = checkSemanticSnapshotVersion({ version: "9" });
  assert.equal(future.supported, false);
  assert.equal(future.reason, "UNSUPPORTED_SEMANTIC_SNAPSHOT_VERSION");
  assert.throws(() => assertSemanticSnapshotV0({ version: "9" }), /UNSUPPORTED_SEMANTIC_SNAPSHOT_VERSION:9/);
});

test("RIR version 0 is supported and unknown RIR is never silently reinterpreted", () => {
  assert.equal(checkRIRVersion({ version: "0" }).supported, true);
  assert.doesNotThrow(() => assertRIRV0({ version: "0" }));
  const future = checkRIRVersion({ version: "future" });
  assert.equal(future.supported, false);
  assert.equal(future.reason, "UNSUPPORTED_RIR_VERSION");
  assert.throws(() => assertRIRV0({ version: "future" }), /UNSUPPORTED_RIR_VERSION:future/);
});
