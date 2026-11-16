# Architecture Decision Records

Architecture decisions are binding only when their status is **ACCEPTED**. A proposal, experiment, or existing file is not automatically an accepted decision.

## ADR-0001 — Master Docs is current source of truth; app is a preview

**Status:** ACCEPTED  
**Date:** 2026-11-15

### Context and rationale

The repository contains master documentation and a small Master Hub app shell. The product owner clarified that completing the core documentation is more important than expanding the app.

### Decision and outcome

- Master Docs is the active source of truth for shared vision, product boundaries, core vocabulary, canon governance, contracts, and architecture decisions.
- `apps/master-hub` remains a visual MVP preview.
- Backend expansion, auth UX, knowledge ingestion, MCP runtime, agent execution, and deployment are deferred until core docs and contracts are reviewed and stable.
- Existing technical groundwork may remain, but must not drive product decisions or be described as a finished product.

### Consequences and follow-up

- Roadmap prioritizes documentation phases C0–C5.
- Software milestones are deferred.
- Implementation work must trace to an approved contract and bounded task.
- README and roadmap must keep implementation status honest.

## ADR-0002 — Modular monolith before microservices

**Status:** PROPOSED  
A modular monolith may suit an initial operational release. Do not commit until workload, runtime, and integration requirements are validated.

## ADR-0003 — Native work tracker owns task state

**Status:** DECIDED direction  
Master Hub is intended to own canonical projects and tasks. Git providers own source code, commits, pull requests, and CI. GitHub Issues are optional external references, not the canonical task database. Implementation remains deferred.

## ADR-0004 — MCP tools call domain services

**Status:** DECIDED principle  
MCP is a transport adapter over validated domain services shared by HTTP APIs and UI. No raw database or unrestricted shell tools. SDK and transport implementation remain PROPOSED.

## ADR-0005 — Owner-only first release

**Status:** PROPOSED  
Initial access is expected to be owner-operated, with explicitly authorized machine agents. Public registration and multi-tenant SaaS remain deferred.

## ADR-0006 — Documentation-first delivery

**Status:** ACCEPTED  
**Date:** 2026-11-15

### Decision and outcome

Immediate sequence: ecosystem vision and boundaries → ontology and canon → product masters and experience contracts → data/privacy/publishing/integration contracts → knowledge/task/API/MCP/agent contracts → security and architecture decisions → implementation backlog.

### Acceptance

A documentation phase is not complete merely because files exist. It must be reviewed for consistency, provenance, status, dependencies, and missing decisions.

## ADR-0007 — Tauri for ROCKSOUL DX desktop framework direction

**Status:** ACCEPTED — framework direction only  
**Date:** 2026-11-15

### Context and rationale

The product owner explicitly selected Tauri as the framework direction for ROCKSOUL DX. Existing product documentation had left the desktop framework undecided.

### Decision and outcome

Use Tauri as the selected desktop application framework direction for future ROCKSOUL DX implementation planning.

### Not decided by this ADR

- Frontend framework or rendering library.
- Rust command/API boundaries and IPC design.
- Database, file storage, migrations, or sync.
- Filesystem permissions and capability configuration.
- Supported operating systems and packaging targets.
- Code signing, auto-update, release channels, and rollback.
- AI provider/local model architecture.

### Consequences and follow-up

- Product documents must no longer list Electron/native toolkit/Tauri as equally open framework choices.
- Detailed implementation choices require follow-up ADRs and must satisfy the private-data and desktop experience contracts.
- No claim is made that Tauri implementation, packaging, or security acceptance has been completed.
