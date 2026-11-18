---
contract_id: "MW-GOV-DOC-002"
title: "MoonWitness Documentation Structure Standard"
status: "ACCEPTED"
approval_authority: "Product Owner (@bjo163)"
ratified_by: "Master Execution Directive (2026-11-18)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
scope: "File placement, directory layout, naming conventions, ADR namespaces, and structural formatting across A-L-L-A-H/moonwitness"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
---

# MoonWitness Documentation Structure Standard

## 1. Purpose and Decentralization Principle

This standard derives its authority from [DOCUMENTATION_GOVERNANCE_CONTRACT.md](./DOCUMENTATION_GOVERNANCE_CONTRACT.md) (`MW-GOV-DOC-001`).

It defines **where** documentation lives and **how** documents are named across the `A-L-L-A-H/moonwitness` monorepo. Documentation **MUST** remain co-located with its owning domain, engine, application, package, or service rather than being forced into one top-level folder.

---

## 2. Decentralized Monorepo Location Tiers

| Tier                                                 | Path Pattern                                                                           | Permitted Document Classes                                                                                                                                                       | Ownership & Boundary Rules                                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1: Repository Root**                          | `/`                                                                                    | `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `WORK_PLAN.md`                                                                                                      | **Strictly bounded.** Do not add ad-hoc reports, audits, specs, or prompt files to repository root.                          |
| **Tier 2: Repository-Wide Governance & Engineering** | `docs/governance/`, `docs/architecture/`, `docs/engineering/`, `docs/dna/`, `docs/ui/` | Governance contracts (`MW-GOV-DOC-*`), active monorepo ADRs (`adr-NNN-*.md`), runtime inventories, operational runbooks, engineering guides, Design DNA contracts, and UI guides | Authoritative for active monorepo engineering, runtime topology, CI gates, and shared UI contracts.                          |
| **Tier 3: Constitutional & Blueprint Registries**    | `docs/constitution/`, `docs/blueprint/`                                                | Ecosystem vision, product masters, canon provenance, cross-product contracts (`docs/constitution/`), and design-frozen Gen2 reference specs (`docs/blueprint/`)                  | Preserved in their consolidated structural trees. Runtime topology conflicts defer to `docs/architecture/adr-006-*.md`.      |
| **Tier 4: Sovereign Engines**                        | `engines/<engine>/`                                                                    | Engine `README.md`, `GOVERNANCE.md`, `docs/`, `spec/`, engine-local ADRs                                                                                                         | Co-located with engine code/data. Preserves upstream modularity and domain independence.                                     |
| **Tier 5: Applications**                             | `apps/web/`, `apps/api/`, `apps/rocksoul/`                                             | App `README.md`, `docs/` (app architecture, security, development, local release notes)                                                                                          | Strictly bounded to the three `ADR-006` application workspaces.                                                              |
| **Tier 6: Packages, Services & Control Plane**       | `packages/<pkg>/`, `services/<svc>/`, `cp/arsy/`                                       | Unit `README.md`, `docs/`, unit contracts describing public surfaces, CLI flags, schemas, ports, or protocols                                                                    | Co-located with package/service implementation; never duplicated in `docs/architecture/` except via summary inventory links. |
| **Tier 7: Historical Archives & Chronicles**         | `docs/legacy-harvest/`, `content/chronicles/`, `engines/chronicle-os/`                 | Legacy harvest manifests, quarantined reference snapshots, literary episodes/chapters                                                                                            | **Read-only historical provenance.** Never store active engineering contracts or runtime decisions here.                     |

> **Active Working Plan & Research Artifacts:** Time-boxed planning specs and implementation plans created during development workflows under `docs/superpowers/specs/` and `docs/superpowers/plans/` **MUST** declare `PROPOSED` or `ACCEPTED` status and link to any resulting ADRs; they do not bypass `docs/architecture/` authority. Top-level exploratory and technical decision records under `research/` (`research/architecture-decisions.md`, `research/frontend-technology.md`, `research/motion-engineering.md`, `research/visual-rendering.md`) operate as `ACTIVE_REFERENCE` / `PROPOSED` design inputs for the Living Light sanctuary surface and **MUST NOT** override `ACCEPTED` `ARCH-ADR-*` contracts.

---

## 3. Mandatory Naming Conventions

New and newly normalized documentation **MUST** follow the naming rules below:

| Document Class                    | Naming Pattern                                                  | Casing                                                                                                             | Canonical Location(s)                                                 | Example                                         |
| --------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------- |
| **README**                        | `README.md`                                                     | Exact `README` + `.md`                                                                                             | Root of repo, app, package, engine, service, or domain directory      | `cp/arsy/README.md`                             |
| **ADR (Active Monorepo)**         | `adr-NNN-<kebab-slug>.md`                                       | Lowercase kebab-case with 3-digit zero-padded number                                                               | `docs/architecture/`                                                  | `adr-006-three-app-topology-and-trust-zones.md` |
| **Architecture Specification**    | `<TOPIC-SLUG>.md`                                               | `UPPER-KEBAB-CASE`                                                                                                 | `docs/architecture/` or `apps/<app>/docs/`                            | `RUNTIME-SERVICE-INVENTORY.md`                  |
| **Governance & Domain Contracts** | `DOCUMENTATION_<NAME>_CONTRACT.md` / `<TOPIC>-CONTRACT.md`      | `UPPER_SNAKE_CASE` in `docs/governance/`; `UPPER-KEBAB-CASE` in `docs/constitution/CONTRACTS/` & `engines/*/spec/` | `docs/governance/`, `docs/constitution/CONTRACTS/`, `engines/*/spec/` | `DOCUMENTATION_GOVERNANCE_CONTRACT.md`          |
| **Roadmaps & Work Plans**         | `<SCOPE>-ROADMAP.md` or `WORK_PLAN.md`                          | `UPPER-KEBAB-CASE` (root `WORK_PLAN.md` excepted)                                                                  | `docs/` or root `WORK_PLAN.md`                                        | `docs/ECOSYSTEM-ROADMAP.md`                     |
| **Audits**                        | `<SCOPE>-AUDIT-YYYY-MM-DD.md` or `<SCOPE>-AUDIT.md`             | `UPPER-KEBAB-CASE` with ISO date for point-in-time snapshots                                                       | `docs/architecture/`, `docs/ui/`, `docs/constitution/GOVERNANCE/`     | `DOCUMENT-AUDIT-2026-11-15.md`                  |
| **Reports**                       | `<SCOPE>-REPORT-YYYY-MM-DD.md` or `<SCOPE>-REPORT-V<N>.md`      | `UPPER-KEBAB-CASE`                                                                                                 | `docs/blueprint/`, `apps/<app>/docs/`                                 | `LOCAL_TEST_REPORT.md` (existing)               |
| **Handoffs & Work Packages**      | `<SCOPE>-HANDOFF-CONTRACT-V<N>.md` or `<SCOPE>-WORK-PACKAGE.md` | `UPPER-KEBAB-CASE`                                                                                                 | `docs/blueprint/17-genesis/`, `docs/constitution/<PRODUCT>/`          | `IMPLEMENTATION-HANDOFF-CONTRACT-V1.md`         |
| **Operational Guides & Runbooks** | `<GUIDE-NAME>.md`                                               | `UPPER-KEBAB-CASE`                                                                                                 | `docs/engineering/`, `docs/architecture/`                             | `BRANCHING.md`, `DEPLOYMENT-RUNBOOK.md`         |

Existing historical filenames inside `docs/legacy-harvest/`, `content/chronicles/`, `engines/`, and absorbed subtrees **MUST NOT** be bulk-renamed without an approved migration wave; apply these conventions to all newly created or reconciled documents.

---

## 4. ADR Namespace Disambiguation

Because consolidation brought together multiple pre-existing ADR numbering sequences, citing an ADR by bare number (e.g., `ADR-001`) is ambiguous. All cross-references **MUST** use the namespace prefix or full repo-relative path:

| Prefix                  | Authoritative Directory / Registry                                                                                                                                                                                                                          | Active Numbering Range Observed            | Status                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `ARCH-ADR-NNN`          | `docs/architecture/adr-NNN-*.md`                                                                                                                                                                                                                            | `adr-001` .. `adr-007`                     | **Active monorepo architecture ADRs**                                                  |
| `ARCH-DEC-YYYY-MM-DD`   | `docs/architecture/decisions/YYYY-MM-DD-*.md`                                                                                                                                                                                                               | `2026-11-12-riot-intelligence-baseline.md` | **Active dated architecture decision** (legacy subfolder; new ADRs use `ARCH-ADR-NNN`) |
| `CONST-ADR-NNNN`        | [docs/constitution/GOVERNANCE/ARCHITECTURE-DECISIONS.md](../constitution/GOVERNANCE/ARCHITECTURE-DECISIONS.md)                                                                                                                                              | `ADR-0001` .. `ADR-0007`                   | **Active ecosystem constitutional ADRs**                                               |
| `BP-ADR-NNN`            | `docs/blueprint/DECISION-REGISTRY.md` & `docs/blueprint/00-constitution/ADR-021..027`                                                                                                                                                                       | `ADR-001` .. `ADR-027`                     | **Frozen Gen2 blueprint ADRs**                                                         |
| `RES-ADR-NNN`           | [research/architecture-decisions.md](../../research/architecture-decisions.md)                                                                                                                                                                              | `ADR-001` .. `ADR-006`                     | **Surface-scoped design/rendering ADRs** (`A-L-L-A-H.COM` Living Light)                |
| `ENG-<ENGINE>-ADR-NNNN` | Engine-local `docs/decisions/` or `docs/adr/` (e.g., `engines/corpus-srgbl/docs/decisions/`, `engines/crayon/rocksoul-crayon/docs/web-ai-integration/decisions/`, `engines/empire-origin/allah-foundation/docs/adr/`, `engines/rocksoul-domains/aws/docs/`) | Engine-local sequences                     | **Engine-scoped provenance ADRs**                                                      |
| `XV-ADR-NNNN`           | `content/chronicles/moonwitness-xv/docs/decisions/`                                                                                                                                                                                                         | `ADR-0001` .. `ADR-0020`                   | **Historical chronicle ADRs**                                                          |

New monorepo-wide architectural decisions **MUST** be created in `docs/architecture/` using the next sequential `ARCH-ADR-NNN` identifier (`adr-008-...` onward).

---

## 5. Structural Formatting and Link Rules

1. **Single Primary Heading:** Every Markdown document **MUST** contain exactly one top-level H1 (`# Title`) heading.
2. **Repo-Relative Links Only:** Cross-references between documents in this repository **MUST** use valid repository-relative paths (`./...` or `../...`) rather than hardcoded local machine paths (`Z:\...`, `C:\...`) or external branch URLs.
3. **Formatter Alignment:** All Markdown files outside ignore patterns **MUST** pass Prettier formatting per root `.prettierrc.json` (`printWidth: 100`, double quotes in YAML/JSON frontmatter where applicable).
4. **No Empty Placeholders:** Do not commit stub directories or empty `README.md` placeholder files without declared scope and owner.
5. **Sensitive Data Hygiene:** Never commit credentials, private API endpoints, personal tokens, or machine-specific paths into documentation.
