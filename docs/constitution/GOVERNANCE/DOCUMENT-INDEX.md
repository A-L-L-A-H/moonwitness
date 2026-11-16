# Master Documentation Index and Dependency Map

**Status:** DECIDED navigation policy; content inventory reviewed 2026-11-15  
**Authority:** `A-L-L-A-H/master-docs`

## Authority hierarchy

1. **Master vision and product boundaries** — define ecosystem direction and ownership.
2. **Core charter, principles, and domain model** — define shared meaning and invariants.
3. **Canon records** — preserve owner-established names, story material, spiritual references, and provenance.
4. **Product masters and experience contracts** — define each product's promise, audience, workflows, and experience.
5. **Normative contracts** — define data, privacy, publishing, integration, API, task, knowledge, and agent behavior.
6. **Accepted ADRs and decision log** — record binding technical/product decisions and their consequences.
7. **Roadmap** — sequences work but does not override any authority above.
8. **Product repositories** — authoritative for code and implementation evidence, not for silently changing cross-product policy.

## Master and core

| Document | Authority / purpose | Depends on |
|---|---|---|
| [Master Vision](../MASTER/VISION.md) | Ecosystem north star | Owner decisions |
| [Product Boundaries](../MASTER/PRODUCT-BOUNDARIES.md) | Product and repository ownership | Master Vision |
| [Foundation Charter](../CORE/FOUNDATION-CHARTER.md) | Meaning-before-code sequence | Vision, boundaries |
| [Core Principles](../CORE/PRINCIPLES.md) | Shared invariants | Charter |
| [Domain Model](../CORE/DOMAIN-MODEL.md) | Shared entity and epistemic vocabulary | Charter, canon |
| [Architecture Principles](../CORE/ARCHITECTURE-PRINCIPLES.md) | Technology-neutral constraints | Core model, contracts |

## Product masters

| Document | Product authority | Dependencies |
|---|---|---|
| [ROCKSOUL DX Product Master](../ROCKSOUL-DX/PRODUCT-MASTER.md) | Private desktop product scope | Vision, boundaries, canon |
| [ROCKSOUL DX Desktop Contract](../ROCKSOUL-DX/DESKTOP-PRODUCT-CONTRACT.md) | Desktop and privacy invariants | Product Master, security |
| [ROCKSOUL DX Master Narrative](../ROCKSOUL-DX/MASTER-NARRATIVE.md) | Owner phrases and proposed philosophy | Canon, owner approval |
| [ROCKSOUL DX Experience Contract](../ROCKSOUL-DX/PRODUCT-EXPERIENCE-CONTRACT.md) | Desktop experience qualities | Product scope, desktop contract |
| [ROCKSOUL DX Scope Decision](../ROCKSOUL-DX/PRODUCT-SCOPE-DECISION.md) | Approved layered product direction and v0.1 boundary | Product Master, owner decision |
| [ROCKSOUL DX Visual Constitution](../ROCKSOUL-DX/VISUAL-CONSTITUTION.md) | Normative world, art direction, navigation, motion, accessibility, and anti-patterns | Product scope, desktop contract |
| [ROCKSOUL DX Visual Foundation Work Package](../ROCKSOUL-DX/VISUAL-FOUNDATION-WORK-PACKAGE.md) | Bounded local-AI execution package RDX-VIS-20261115-01 | Visual Constitution, Local AI Execution Gate |
| [MoonWitness Product Master](../MOONWITNESS/PRODUCT-MASTER.md) | Public web product scope | Vision, boundaries, publishing |
| [Master Hub Product Master](../PLATFORM/PRODUCT-MASTER.md) | Shared governance/control-plane direction | Master Docs, core contracts |
| [Master Hub Architecture](../PLATFORM/ARCHITECTURE.md) | Proposed technical shape | Domain model, contracts, ADRs |

## Canon and knowledge

| Document | Purpose |
|---|---|
| [Canon Registry](../CANON/README.md) | Canon status and source discipline |
| [GOD PROMISE / JANJI ALLAH](../CANON/GOD-PROMISE.md) | Spiritual foundation and handling rules |
| [RGBL / SRGBL](../CANON/RGBL-SRGBL.md) | Preserved unresolved knowledge framework |
| [BASS-HUNTER](../CANON/BASS-HUNTER.md) | Owner-supplied expansion and epistemic boundaries |
| [Character Register](../CANON/CHARACTER-REGISTER.md) | Known identities and unresolved roles |
| [ROCKSOUL Core Canon](../CANON/ROCKSOUL-CORE-CANON.md) | Consolidated names, variants, and recovery leads |
| [Knowledge Base Contract](../KNOWLEDGE/KNOWLEDGE-BASE-CONTRACT.md) | Source ingestion and retrieval rules |

## Contracts and governance

| Document | Purpose |
|---|---|
| [Contract Catalogue](../CONTRACTS/README.md) | Contract index and status |
| [Documentation Contract](../CONTRACTS/DOCUMENTATION-CONTRACT.md) | Specification writing rules |
| [Canon and Provenance Contract](../CONTRACTS/CANON-PROVENANCE-CONTRACT.md) | Canon and evidence integrity |
| [Privacy and Data Contract](../CONTRACTS/PRIVACY-DATA-CONTRACT.md) | Data classes and privacy invariants |
| [Publishing Contract](../CONTRACTS/PUBLISHING-CONTRACT.md) | Explicit publication flow |
| [Integration Contract](../CONTRACTS/INTEGRATION-CONTRACT.md) | Cross-product exchange |
| [API Contract Policy](../CONTRACTS/API-CONTRACT-POLICY.md) | Versioning and compatibility |
| [HTTP API Standards](../API/API-STANDARDS.md) | API conventions |
| [Work Tracker Contract](../TASKS/WORK-TRACKER-CONTRACT.md) | Task lifecycle and agent work |
| [MCP Server Contract](../MCP/MCP-SERVER-CONTRACT.md) | Typed agent tools and permissions |
| [Agent Operating Model](../MCP/AGENT-OPERATING-MODEL.md) | Roles, execution, and stop conditions |
| [Security Threat Model](../SECURITY/THREAT-MODEL.md) | Master Hub trust boundaries and threats |
| [Documentation Governance](DOCUMENTATION-GOVERNANCE.md) | Change and review process |
| [Architecture Decisions](ARCHITECTURE-DECISIONS.md) | Accepted and proposed ADRs |
| [Decision Log](DECISION-LOG.md) | Product-owner decisions |
| [Document Audit](DOCUMENT-AUDIT-2026-11-15.md) | Current consistency findings |
| [Local AI Execution Gate](LOCAL-AI-EXECUTION-GATE.md) | Preconditions for local coding-agent escalation | Product scope, contracts, security |

## Execution order

`VISION → BOUNDARIES → CORE / CANON → PRODUCT MASTERS → EXPERIENCE CONTRACTS → DATA / PRIVACY → INTEGRATION / API / TASK / KNOWLEDGE / MCP → SECURITY / ADRs → ROADMAP → IMPLEMENTATION PROMPTS`

This order is a dependency guide, not a requirement that all documents be completed in one linear pass. A dependent contract cannot be finalized while its upstream product decision remains unresolved.

## Status interpretation

- **DECIDED** means an owner decision or policy has been recorded.
- **PROPOSED** means the content is a draft or recommendation awaiting approval.
- **IMPLEMENTED** requires evidence in the owning product repository.
- **UNKNOWN** is a valid state when source evidence is insufficient.
- A checked box or an existing document is not proof of implementation.

## Current blockers

1. Production workflow and data contracts for Continuity Core and each ROCKSOUL destination.
2. Primary-source recovery for RGBL / SRGBL and unresolved historical canon.
3. Product-specific privacy/data lifecycle and security acceptance.
4. Final architecture choices beyond the selected Tauri framework direction.
5. Consistency, link, lint, and CI evidence for the final documentation baseline.
