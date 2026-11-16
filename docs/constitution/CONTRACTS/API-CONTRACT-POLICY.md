# API and Schema Contract Policy

**Status:** DECIDED policy  
**Version:** 1.0.0

## Scope

Applies to future APIs, events, import/export formats, and cross-product schemas documented in this repository.

## Versioning

Use semantic contract versions:

- MAJOR: incompatible change.
- MINOR: backward-compatible capability or optional field addition.
- PATCH: clarification or correction that does not change behavior.

Every payload must identify its contract or schema version.

## Compatibility

- Consumers must reject or safely quarantine unsupported major versions.
- Producers must not remove or change the meaning of a field within a major version.
- Unknown optional fields should be safely ignored where practical.
- Required fields and enum values must be documented.
- Deprecations require a notice and migration window appropriate to the consumer.

## Validation and security

- Validate all untrusted input at the boundary.
- Do not trust client-supplied identity, role, approval, or privacy classification without server-side authorization.
- Do not include secrets in payload examples.
- Minimize personal data.
- Define rate, size, and attachment limits for implemented endpoints.

## Error model

Future contracts should define stable machine-readable error codes, human-readable messages, retryability, and correlation identifiers. Never return private internal stack traces to public clients.

## Implementation truth

A documented contract does not prove an endpoint exists. Link the implementation and tests when they are available.
