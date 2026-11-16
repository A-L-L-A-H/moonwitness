# CRAYON Canonical Codec Contract

Status: experimental production-hardening boundary (`allah-crayon-codec`, #81/#82/#112/#129/#144).

CRAYON persistence must not silently change semantic values just because JSON has weaker value semantics than JavaScript. Serialization is an explicit boundary outside Kernel, Snapshot, and RIR.

## Ownership

`allah-crayon-codec` is the single experimental codec boundary. Snapshot and RIR remain semantic packages and do not own persistence formats.

## Envelope versions

### Envelope v0 — legacy experimental compatibility

Envelope v0 stores a JSON-safe payload directly. Decoder support remains so existing experimental fixtures are not silently reinterpreted.

### Envelope v1 — canonical tagged values

New writes use envelope v1. Every payload value is encoded as a typed node:

```text
undefined
null
boolean
number
string
array
object
```

Objects become sorted `[key, node]` entries. This gives three important properties:

1. explicit `undefined` survives round-trip instead of disappearing;
2. object insertion order cannot change serialized bytes;
3. ordinary domain objects cannot collide with codec tags because the entire value tree is encoded, rather than reserving a magic user-visible object key.

## Fail-closed values

The canonical writer rejects values that cannot be represented without ambiguity or silent loss:

- cyclic object graphs;
- `NaN`, `Infinity`, `-Infinity`;
- `bigint`;
- functions;
- symbols;
- non-plain object/class instances.

Plain `canonicalStringify()` is deliberately stricter than `JSON.stringify`: values such as `undefined` that JSON would silently drop are rejected. Semantic artifact writers use the tagged v1 envelope when those values must be preserved.

## Resource limits

Decoding enforces configurable limits for:

- serialized byte size;
- nesting depth;
- total collection items;
- total object keys.

Resource-limit failures are storage/input failures. They must not be represented as domain uncertainty or as an observed outcome.

## Version truthfulness

The envelope semantic version must equal `payload.version`. Snapshot/RIR version validators then decide whether the semantic version is supported. Unsupported data is rejected; it is never interpreted as the current version by convenience.

## Migration

`createMigrationRegistry()` requires an explicit migration path. Missing paths are never guessed. Every migrated output must pass an explicit target validator before it is returned.

Migration is allowed to refuse data when truth, provenance, witness history, authority requirements, or other normative meaning cannot be preserved.

## Reason codes

Key codec reason codes include:

```text
INVALID_JSON
UNSUPPORTED_ENVELOPE_VERSION
UNSUPPORTED_ARTIFACT_KIND
KIND_MISMATCH
SEMANTIC_VERSION_MISMATCH
UNSUPPORTED_SEMANTIC_VERSION
PAYLOAD_TOO_LARGE
PAYLOAD_TOO_DEEP
COLLECTION_TOO_LARGE
OBJECT_TOO_LARGE
UNSUPPORTED_CANONICAL_VALUE
CYCLIC_CANONICAL_VALUE
INVALID_CANONICAL_NODE
MIGRATION_PATH_MISSING
MIGRATION_OUTPUT_INVALID
```

## Production admission

This package remains private/experimental. It is not admitted to the public npm release set until compatibility fixtures, abuse/resource-limit falsification, main verification, and migration policy evidence agree.
