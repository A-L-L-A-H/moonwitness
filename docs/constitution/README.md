# A-L-L-A-H Master Docs & Hub

> The governed source of truth for the A-L-L-A-H ecosystem. The Master Hub app is a visual MVP preview; the core documentation is the current priority.

This repository is **docs-first**. Root documentation defines shared vision, canon, product boundaries, domain vocabulary, contracts, architecture, and governance. `apps/master-hub` remains a viewable MVP shell, not the current development focus.

## Current priority

1. Preserve ecosystem boundaries, canon, privacy, and provenance.
2. Keep Master Docs authoritative for shared product decisions and contracts.
3. Execute the approved ROCKSOUL DX v0.1 visual foundation package in its owning repository.
4. Continue separate workflow, security, and architecture contracts before expanding beyond the visual prototype.
5. Keep Master Hub feature expansion deferred.

## Product map

| Product | Repository | Product form | Boundary |
|---|---|---|---|
| ROCKSOUL DX | `A-L-L-A-H/rocksoul-dx` | **Tauri desktop application** | Private layered creative universe; v0.1 visual foundation is bounded to THE THRESHOLD and navigable destination shells |
| MoonWitness | `A-L-L-A-H/moonwitness` | Web application | Public-facing stories, witnessing, research, archive, and publication |
| Master Hub | `A-L-L-A-H/master-docs` | Documentation authority; future private control plane | Shared specifications, governance, and future governed coordination |

**ROCKSOUL DX is a desktop product—not a website, web dashboard, MoonWitness admin panel, or browser-first SaaS.** The owner approved a layered living universe combining GAME WORLD + LIVING ANIMATION, with THE THRESHOLD as entry and four spatial destinations. The v0.1 visual foundation is specified in [Visual Constitution](ROCKSOUL-DX/VISUAL-CONSTITUTION.md) and [Visual Foundation Work Package](ROCKSOUL-DX/VISUAL-FOUNDATION-WORK-PACKAGE.md). Tauri is the selected desktop framework direction; frontend, rendering, database, and runtime details remain open.

These products are related but do not share unrestricted data, identity, UI, or runtime.

## Start here

1. [Master vision](MASTER/VISION.md)
2. [Product boundaries](MASTER/PRODUCT-BOUNDARIES.md)
3. [Foundation charter](CORE/FOUNDATION-CHARTER.md)
4. [Core principles](CORE/PRINCIPLES.md)
5. [Core domain model](CORE/DOMAIN-MODEL.md)
6. [ROCKSOUL master narrative](ROCKSOUL-DX/MASTER-NARRATIVE.md)
7. [ROCKSOUL DX product master](ROCKSOUL-DX/PRODUCT-MASTER.md)
8. [ROCKSOUL DX desktop product contract](ROCKSOUL-DX/DESKTOP-PRODUCT-CONTRACT.md)
9. [ROCKSOUL DX product experience contract](ROCKSOUL-DX/PRODUCT-EXPERIENCE-CONTRACT.md)
10. [ROCKSOUL DX product scope decision](ROCKSOUL-DX/PRODUCT-SCOPE-DECISION.md)
11. [ROCKSOUL DX Visual Constitution](ROCKSOUL-DX/VISUAL-CONSTITUTION.md)
12. [ROCKSOUL DX v0.1 Visual Foundation Work Package](ROCKSOUL-DX/VISUAL-FOUNDATION-WORK-PACKAGE.md)
13. [Product master](PLATFORM/PRODUCT-MASTER.md)
14. [Platform architecture](PLATFORM/ARCHITECTURE.md)
15. [Documentation governance](GOVERNANCE/DOCUMENTATION-GOVERNANCE.md)
16. [Document audit](GOVERNANCE/DOCUMENT-AUDIT-2026-11-15.md)
17. [Document index and dependency map](GOVERNANCE/DOCUMENT-INDEX.md)
18. [Local AI execution gate](GOVERNANCE/LOCAL-AI-EXECUTION-GATE.md)
19. [Work tracker contract](TASKS/WORK-TRACKER-CONTRACT.md)
20. [Knowledge base contract](KNOWLEDGE/KNOWLEDGE-BASE-CONTRACT.md)
21. [MCP contract](MCP/MCP-SERVER-CONTRACT.md)
22. [API standards](API/API-STANDARDS.md)
23. [Security model](SECURITY/THREAT-MODEL.md)
24. [Contract index](CONTRACTS/README.md)
25. [Architecture decisions](GOVERNANCE/ARCHITECTURE-DECISIONS.md)
26. [Foundation roadmap](ROADMAP/FOUNDATION-ROADMAP.md)

## Repository map

- `MASTER/` — ecosystem vision and product boundaries.
- `CORE/` — shared foundations, ontology, and domain vocabulary.
- `CONTRACTS/` — agreements between products, systems, and contributors.
- `CANON/` — narrative, spiritual, character, and knowledge canon with provenance, including the [ROCKSOUL core canon index](CANON/ROCKSOUL-CORE-CANON.md).
- `ROCKSOUL-DX/`, `MOONWITNESS/` — product masters and product-specific contracts.
- `PLATFORM/` — Master Hub product and architecture.
- `TASKS/`, `KNOWLEDGE/`, `MCP/`, `API/`, `SECURITY/`, `INTEGRATION/` — system contracts.
- `GOVERNANCE/` — decisions and change control.
- `ROADMAP/` — documentation and implementation gates.
- `apps/master-hub/` — visual MVP preview; feature development deferred.

## System boundaries

- Master Docs is authoritative for approved shared vision, contracts, canon indexes, architecture decisions, and governance.
- Product repositories remain authoritative for their code and product-specific source documents.
- A future Master Hub database may own tasks, agent runs, approvals, audit records, and derived knowledge indexes.
- Git repositories own code, commits, pull requests, and CI—not canonical ecosystem task state.
- Source documents remain authoritative at origin; an index is only a cited, revisioned projection.
- ROCKSOUL DX is a private desktop application. Its personal data is private by default and is never ingested, synced, or published by default.
- MoonWitness public content may be indexed under its publishing and attribution rules.

## Status vocabulary

- **DECIDED** — explicitly agreed by the product owner.
- **PROPOSED** — awaiting approval.
- **IMPLEMENTED** — verified in the owning repository or environment.
- **PARTIAL** — some implementation exists; completion is not established.
- **UNVERIFIED** — evidence is insufficient.
- **DEFERRED** — intentionally postponed.
- **SUPERSEDED** — replaced by a newer decision; retained for history.

A document's existence does not mean its contents are implemented. A checked implementation item requires evidence.

## Current delivery state

- ROCKSOUL DX product scope and v0.1 visual foundation work package: documented and approved for bounded local-AI execution.
- Markdown CI: configured; current-head pass status remains unverified.
- Broader core/product/contract work: ongoing; the visual work package does not certify full product or infrastructure readiness.
- Master Hub visual shell: present as a viewable MVP.
- Supabase schema and initial API groundwork: present, but not current focus.
- Vercel deployment: not verified; project creation previously blocked by permissions.
- Knowledge ingestion, full task UI, MCP runtime, and agent execution: deferred.

**Working direction:** execute only the approved ROCKSOUL DX visual foundation package. Keep unrelated infrastructure and broader product workflows deferred until their contracts and technical decisions are approved.
