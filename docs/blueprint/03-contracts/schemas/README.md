# Canonical Schemas

JSON Schema 2020-12 is the wire-contract source for shared machine-readable entities.

Initial canonical schemas:

- `research-run.schema.json`
- `evidence.schema.json`
- `provenance.schema.json`
- `problem.schema.json`

Rules:

- Stable external names; never expose database table names.
- Breaking changes require a new compatibility version and ADR.
- Schemas are consumed by OpenAPI, contract tests, generated SDKs, and validation tooling.
- TypeScript types are derived/implemented from the canonical contract; they are not a second source of truth.
