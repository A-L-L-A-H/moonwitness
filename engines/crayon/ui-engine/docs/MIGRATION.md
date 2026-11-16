# CRAYON Migration Policy

CRAYON alpha APIs may change, but semantic meaning must not drift silently.

## Compatibility classes

1. **Representation-compatible** — presentation changes while Snapshot/RIR meaning remains the same. No semantic migration required.
2. **Additive semantic** — new optional fields/signals are added without changing existing meaning. Consumers may ignore fields they do not understand only when the specification marks them optional and non-critical.
3. **Breaking semantic** — an existing field changes meaning, required truth is removed, or authority/consequence/witness semantics change. This requires a new semantic/RIR version or an explicit migration.

## Required behavior

- Snapshot and RIR consumers must check the embedded version before interpretation.
- Unsupported versions must fail explicitly with a version reason.
- Migration must preserve provenance and historical witness identity.
- Migration must never convert unknown/conflicted information into fact merely to satisfy a newer schema.
- Migration must never create authority, commitment, verification, or evidence that did not exist in the source record.
- Lossy migration must identify what was lost and must not present the result as semantically equivalent.

## Alpha package compatibility

All public packages in one CRAYON release use the exact same release version. Internal CRAYON package dependencies use the exact same version rather than ranges during alpha to prevent mixed semantic runtimes.

Before beta, public API review will classify APIs as freeze candidates or explicitly unstable. Breaking alpha changes still require CHANGELOG migration notes.

## Fixture policy

The repository keeps representative prior-version Snapshot/RIR fixtures. Release verification must either:

- load them under their supported version semantics, or
- reject them with an explicit unsupported-version reason.

Silent reinterpretation is a release-blocking failure.
