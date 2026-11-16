# CRAYON Semantic Redaction Contract

Status: production hardening for #110.

Redaction is a derived representation policy. It does **not** change the underlying Observation, Knowledge, Witness, or evidence state and it must never be represented as epistemic `unknown` merely because a viewer is not permitted to see the value.

## Required distinction

```text
unknown            = CRAYON does not currently establish the value
redacted/withheld  = a value exists in the source view but policy withholds it here
```

A redaction marker therefore carries:

```json
{
  "redacted": true,
  "meaning": "withheld-not-unknown",
  "reason": "...",
  "classification": "..."
}
```

## Production policy

Semantic surfaces should use exact path rules with `redactPaths()`. Key-name/value guessing is not acceptable evidence that a field is sensitive.

```ts
const policy = redactPaths([
  { path: "$.evidence[0].detail.accountNumber", reason: "customer-data", classification: "restricted" }
], [
  "$.id",
  "$.evidence[0].id"
]);
```

The second argument explicitly protects semantic/provenance identity paths needed for auditability.

`redactKeys()` remains only as a convenience for non-semantic transport/debug payloads and is not the recommended production semantic policy.

## Invariants

- source values are never mutated;
- redacted fields remain present as markers rather than disappearing;
- semantic IDs/provenance can be protected explicitly;
- nested paths are supported deterministically;
- redaction is applied before diagnostics/telemetry leave the application boundary;
- permission to see a redacted value is an application policy concern, not CRAYON epistemic truth;
- Inspector/renderers must explain `withheld-not-unknown` distinctly from `unknown`.

## Remaining admission work

Main verification and explicit Inspector/Web representation of redaction markers are required before #110 is considered production-proven.
