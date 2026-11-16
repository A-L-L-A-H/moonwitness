# Master Hub — Reference Architecture

**Status:** PROPOSED target architecture  
**Current priority:** Documentation and core contracts  
**Application state:** Visual MVP preview; backend and feature expansion DEFERRED

## Architecture principle
Architecture follows the approved domain model and contracts. A framework, database schema, AI SDK, or hosting provider must never become the source of product truth.

## Logical layers
1. **Governance/source:** master docs, product masters, canon records, contracts, ADRs, approvals.
2. **Domain:** product, knowledge, task, agent, approval, and audit concepts with explicit lifecycle and invariants.
3. **Application:** future UI and API adapters.
4. **Integration:** future Git provider, storage, AI model, MCP, and external service adapters.
5. **Infrastructure:** database, hosting, background jobs, secrets, observability, backups.

## Target deployment shape — not a commitment
A modular monolith may suit the first operational release. One web app could host UI, HTTP APIs, and MCP transport, subject to accepted ADRs and verified platform constraints. Do not split services without demonstrated need.

## Data ownership
- Master Docs: approved shared vision, contracts, canon indexes, architecture decisions, governance.
- Product repositories: authoritative code and product-specific implementation documents.
- Future Master Hub database: task state, agent runs, approvals, audit records, derived knowledge index.
- Git repositories: code, commits, pull requests, CI.
- ROCKSOUL DX: private desktop data; no default cloud sync.
- MoonWitness: public/restricted content under its publication policy.

## Core domain
Potential entities include workspace, project, initiative, milestone, task, dependency, comment, artifact, agent, capability, agent run, approval, knowledge source, document, chunk, citation, ingestion job, decision, canon entity, provenance record, and audit event. This list is conceptual and must be reconciled with ontology and contracts before schema is final.

## Security and AI boundary
MCP tools call validated domain services, never raw SQL. Every tool requires schema, permission, side-effect classification, idempotency, and audit. Read and write capabilities are separate. Destructive, external, publishing, and permission-changing operations require explicit human approval.

## Architecture decision gate
Before implementation expands, settle identity/access, classification/retention/export, database isolation, search/citations, task lifecycle and agent leases, MCP transport and machine credentials, AI runtime/evaluation, hosting/deployment, backups/restore, observability, and cost controls.

## Change rule
Material decisions affecting product boundaries, privacy, security, portability, or cost require an ADR with alternatives and consequences. Proposed technologies are not final decisions.