# Master Hub — Product Master

**Status:** DECIDED direction; detailed capabilities remain PROPOSED  
**Repository:** `A-L-L-A-H/master-docs`  
**Application:** `apps/master-hub` (visual MVP preview; feature work deferred)

## Purpose

Master Hub is the governed knowledge and work-control plane for the A-L-L-A-H ecosystem. Its first responsibility is to preserve an approved source of truth across products, contracts, canon, and decisions. Its future responsibility is to make that foundation usable by humans and authorized AI agents.

Master Hub is not where product identity or canon is invented by software. Authority remains in reviewed documentation and owner-approved records.

**Master Hub is not ROCKSOUL DX.** Master Hub is a documentation/control-plane concept with a future web-oriented hub surface; ROCKSOUL DX is a separate private desktop application. Their interfaces, storage, permissions, and runtime must not be conflated.

## Product promise

**One trusted foundation. Traceable knowledge. Accountable work. Human authority remains final.**

## Product surfaces — target, not all implemented

1. **Master Docs** — authoritative vision, product masters, canon indexes, contracts, ADRs, and governance.
2. **Knowledge Library** — future retrieval over approved documents with revisions and citations.
3. **Workboard** — future native task management for humans and agents, not a GitHub Issues mirror.
4. **Agent Control** — future scoped agent registry, runs, evidence, approvals, and audit.
5. **API** — future versioned HTTP interface.
6. **MCP Server** — future typed tools exposing approved domain operations.
7. **Operations** — future health, sync, ingestion, and deployment diagnostics.

## Current scope

- Documentation is the current source of truth and active work surface.
- The app remains a visual MVP shell to preview the direction.
- No additional backend, UI modules, auth flows, ingestion, MCP runtime, or agent execution until core docs and contracts pass review.
- Existing technical groundwork must not drive product decisions or be described as a finished product.

## Non-goals

- Not a public social network or general-purpose chatbot.
- Not a replacement for ROCKSOUL DX or MoonWitness.
- Not the private desktop creation environment owned by ROCKSOUL DX.
- Not a replacement for Git hosting, source control, CI, or pull requests.
- Not an automatic publisher or cloud mirror of private ROCKSOUL data.
- Not a shared runtime/database for the two products.
- Not an autonomous authority that can approve its own high-impact actions.
- Not a GitHub Issues clone as canonical task model.

## Ownership and data boundaries

Master Docs owns approved shared specifications and governance. Product repositories remain authoritative for implementation and product-specific materials. A future Hub database may own task state, agent runs, approvals, audit records, and derived knowledge indexes.

Private ROCKSOUL content is excluded unless the owner explicitly selects and authorizes an export. MoonWitness content may be indexed according to its publishing and attribution rules.

## Initial user model

Owner-operated first. Trusted agents may be added only with explicit scopes and revocation. Multi-tenant SaaS, public sign-up, billing, and broad team administration are out of scope until separately approved.

## Core success criteria

- Product boundaries and responsibilities are unambiguous.
- Important terms and canon have traceable definitions and provenance.
- Evidence, reports, observations, dreams, research, interpretation, and fiction remain distinguishable.
- Every contract states permissions, lifecycle, errors, versioning, and acceptance criteria.
- Architecture decisions follow contracts and record trade-offs.
- A local AI agent can execute a future implementation task without inventing missing product rules.