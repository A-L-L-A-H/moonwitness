import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SemanticCodecError,
  createMigrationRegistry,
  decodeRIR,
  decodeSemanticSnapshot,
} from "../dist/packages/codec/src/index.js";
import { assertRIRV0 } from "../dist/packages/rir/src/index.js";

const rirV0 = readFileSync(new URL("../fixtures/compatibility/rir-v0.json", import.meta.url), "utf8");
const snapshotV0 = readFileSync(new URL("../fixtures/compatibility/snapshot-v0.json", import.meta.url), "utf8");

test("supported canonical v0 fixtures remain readable without semantic reinterpretation", () => {
  const rir = decodeRIR(rirV0);
  const snapshot = decodeSemanticSnapshot(snapshotV0);
  assert.equal(rir.situationId, "situation:compatibility");
  assert.equal(rir.nodes[0].id, "field:root");
  assert.equal(snapshot.situationId, "situation:compatibility");
  assert.equal(snapshot.version, "0");
});

test("unsupported semantic version fails rather than silently loading as current", () => {
  const unsupported = JSON.parse(rirV0);
  unsupported.semanticVersion = "1";
  unsupported.payload.version = "1";
  assert.throws(
    () => decodeRIR(JSON.stringify(unsupported)),
    (error) => error instanceof SemanticCodecError && error.code === "UNSUPPORTED_SEMANTIC_VERSION",
  );
});

test("legacy data reaches v0 only through an explicit registered migration", () => {
  const registry = createMigrationRegistry();
  const legacy = { version: "legacy", situationId: "s", root: "field", explanation: [], nodes: [{ id: "field", kind: "field", children: [] }] };
  assert.throws(
    () => registry.migrate({ kind: "rir", from: "legacy", to: "0", value: legacy, validateTarget: assertRIRV0 }),
    (error) => error instanceof SemanticCodecError && error.code === "MIGRATION_PATH_MISSING",
  );
  registry.register({ kind: "rir", from: "legacy", to: "0", migrate(value) { return { ...value, version: "0" }; } });
  const migrated = registry.migrate({ kind: "rir", from: "legacy", to: "0", value: legacy, validateTarget: assertRIRV0 });
  assert.equal(migrated.version, "0");
});
