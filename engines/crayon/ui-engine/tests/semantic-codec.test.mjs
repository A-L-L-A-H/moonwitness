import test from "node:test";
import assert from "node:assert/strict";
import {
  SemanticCodecError,
  canonicalStringify,
  createMigrationRegistry,
  decodeRIR,
  decodeSemanticSnapshot,
  encodeRIR,
  encodeSemanticSnapshot,
} from "../dist/packages/codec/src/index.js";

const snapshot = {
  version: "0",
  situationId: "situation:codec",
  generatedAt: "2026-08-25T00:00:00Z",
  anchor: { id: "entity:1" },
  knowledge: [],
  possibilities: [],
  witness: [],
  history: [],
  context: [],
};

const rir = {
  version: "0",
  situationId: "situation:codec",
  root: "field:root",
  explanation: ["codec fixture"],
  nodes: [{ id: "field:root", kind: "field", children: [] }],
};

test("canonical serialization is byte-identical regardless of object insertion order", () => {
  const left = canonicalStringify({ b: 2, a: { d: 4, c: 3 } });
  const right = canonicalStringify({ a: { c: 3, d: 4 }, b: 2 });
  assert.equal(left, right);
  assert.equal(left, '{"a":{"c":3,"d":4},"b":2}');
});

test("plain canonical JSON rejects values JSON would silently drop or coerce", () => {
  assert.throws(
    () => canonicalStringify({ missing: undefined }),
    (error) => error instanceof SemanticCodecError && error.code === "UNSUPPORTED_CANONICAL_VALUE",
  );
  assert.throws(
    () => canonicalStringify({ invalid: Number.NaN }),
    (error) => error instanceof SemanticCodecError && error.code === "UNSUPPORTED_CANONICAL_VALUE",
  );
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(
    () => canonicalStringify(cyclic),
    (error) => error instanceof SemanticCodecError && error.code === "CYCLIC_CANONICAL_VALUE",
  );
});

test("Snapshot and RIR round-trip through explicit versioned envelopes", () => {
  const snapshotEncoded = encodeSemanticSnapshot(snapshot);
  const rirEncoded = encodeRIR(rir);
  assert.equal(JSON.parse(snapshotEncoded).envelopeVersion, "1");
  assert.equal(JSON.parse(rirEncoded).envelopeVersion, "1");
  assert.deepEqual(decodeSemanticSnapshot(snapshotEncoded), snapshot);
  assert.deepEqual(decodeRIR(rirEncoded), rir);
});

test("tagged envelope preserves explicit undefined without colliding with domain-shaped objects", () => {
  const withUndefined = {
    ...snapshot,
    anchor: { id: "entity:1", optional: undefined },
    unknown: [{ type: "undefined", value: undefined }],
  };
  const decoded = decodeSemanticSnapshot(encodeSemanticSnapshot(withUndefined));
  assert.equal(Object.hasOwn(decoded.anchor, "optional"), true);
  assert.equal(decoded.anchor.optional, undefined);
  assert.equal(decoded.unknown[0].type, "undefined");
  assert.equal(Object.hasOwn(decoded.unknown[0], "value"), true);
  assert.equal(decoded.unknown[0].value, undefined);
});

test("decoder remains compatible with legacy envelope v0 JSON-safe payloads", () => {
  const legacy = canonicalStringify({
    envelopeVersion: "0",
    kind: "rir",
    semanticVersion: "0",
    payload: rir,
  });
  assert.deepEqual(decodeRIR(legacy), rir);
});

test("semantic artifact encoding rejects cycles and unsupported runtime values", () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(
    () => encodeRIR({ ...rir, debug: cyclic }),
    (error) => error instanceof SemanticCodecError && error.code === "CYCLIC_CANONICAL_VALUE",
  );
  assert.throws(
    () => encodeRIR({ ...rir, invalid: 1n }),
    (error) => error instanceof SemanticCodecError && error.code === "UNSUPPORTED_CANONICAL_VALUE",
  );
});

test("envelope/payload version mismatch fails closed", () => {
  const encoded = canonicalStringify({
    envelopeVersion: "0",
    kind: "rir",
    semanticVersion: "1",
    payload: rir,
  });
  assert.throws(
    () => decodeRIR(encoded),
    (error) => error instanceof SemanticCodecError && error.code === "SEMANTIC_VERSION_MISMATCH",
  );
});

test("migration registry requires an explicit complete path and validates target", () => {
  const registry = createMigrationRegistry();
  registry.register({
    kind: "rir",
    from: "legacy-a",
    to: "legacy-b",
    migrate(value) {
      return { ...value, migratedA: true };
    },
  });
  registry.register({
    kind: "rir",
    from: "legacy-b",
    to: "0",
    migrate(value) {
      return { ...value, version: "0", migratedB: true };
    },
  });
  const migrated = registry.migrate({
    kind: "rir",
    from: "legacy-a",
    to: "0",
    value: { version: "legacy-a" },
    validateTarget(value) {
      if (value.version !== "0") throw new Error("target invalid");
    },
  });
  assert.equal(migrated.version, "0");
  assert.equal(migrated.migratedA, true);
  assert.equal(migrated.migratedB, true);
  assert.equal(Object.isFrozen(migrated), true);
});

test("missing migration path is never guessed", () => {
  const registry = createMigrationRegistry();
  assert.throws(
    () => registry.migrate({
      kind: "snapshot",
      from: "legacy",
      to: "0",
      value: { version: "legacy" },
      validateTarget() {},
    }),
    (error) => error instanceof SemanticCodecError && error.code === "MIGRATION_PATH_MISSING",
  );
});
