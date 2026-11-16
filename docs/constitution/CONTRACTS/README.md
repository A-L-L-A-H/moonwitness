# Core Contracts

**Status:** DECIDED as documentation policy  
**Last reviewed:** 2026-11-15

Contracts are explicit agreements. They prevent the two products and future contributors from relying on accidental coupling or undocumented assumptions.

## Contract catalogue

| Contract | Purpose | Status |
|---|---|---|
| [Documentation contract](DOCUMENTATION-CONTRACT.md) | How specifications and decisions are written | DECIDED |
| [ROCKSOUL DX product experience contract](../ROCKSOUL-DX/PRODUCT-EXPERIENCE-CONTRACT.md) | Desktop interaction and experience invariants | PROPOSED |
| [Canon and provenance contract](CANON-PROVENANCE-CONTRACT.md) | How story, knowledge, and evidence are represented | DECIDED |
| [Privacy and data classification contract](PRIVACY-DATA-CONTRACT.md) | Private/public boundaries and handling rules | DECIDED |
| [Publishing contract](PUBLISHING-CONTRACT.md) | Explicit release of selected ROCKSOUL material to MoonWitness | PROPOSED |
| [Integration contract](INTEGRATION-CONTRACT.md) | Cross-product exchange rules | PROPOSED |
| [API contract policy](API-CONTRACT-POLICY.md) | Versioning and compatibility expectations | DECIDED policy; no API specified |

## What a contract is

A contract states:
- participants and ownership;
- purpose and scope;
- required inputs and outputs;
- invariants;
- permissions and data classification;
- errors and failure behavior;
- versioning and compatibility;
- acceptance criteria;
- status and approval.

## What a contract is not

A contract is not automatically an implementation, a database schema, an API endpoint, or a commitment to use a particular technology.

## Change rule

Breaking changes require a new major contract version or a documented migration plan. Existing implementations must not be assumed compatible until verified.
