---
contract_id: "MW-GOV-ARC-006"
title: "MoonWitness Documentation Architecture Decisions"
status: "ACCEPTED"
approval_authority: "Product Owner (@bjo163)"
ratified_by: "Master Execution Directive (2026-11-18)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
scope: "Proposed architectural decisions governing the MoonWitness target documentation architecture (DOC-ADR-001 through DOC-ADR-008)"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
  - "docs/governance/DOCUMENTATION-TARGET-ARCHITECTURE.md"
  - "docs/architecture/adr-006-three-app-topology-and-trust-zones.md"
  - "docs/architecture/adr-007-rocksoul-local-execution-and-data-boundary.md"
---

# MoonWitness Documentation Architecture Decisions

`DOC-ADR-001` through `DOC-ADR-007` are **`ACCEPTED`** per the Master Execution Directive (2026-11-18). `DOC-ADR-008` remains **`PROPOSED`** pending Product Owner (`@bjo163`) disposition of quarantined `VISUAL-*` checkpoints and embedded code inside `docs/`.

---

## DOC-ADR-001 — Two-Tier Constitutional vs. Monorepo Precedence

- **Status:** `ACCEPTED`
- **Traces To:** `CONST-ADR-0001`, `CONST-ADR-0006`, [DOCUMENTATION-GOVERNANCE.md](../constitution/GOVERNANCE/DOCUMENTATION-GOVERNANCE.md)
- **Decision:** Separate **Tier 0 (`A-L-L-A-H` Ecosystem Constitutional Governance)** in `docs/constitution/` from **Tier 1 (MoonWitness Monorepo Governance)** in `AGENTS.md`, `docs/governance/`, and `docs/architecture/`. Tier 0 governs ecosystem vision, product boundaries, Low-Profile Tawhid guardrails, and canon provenance; Tier 1 governs monorepo branching, 3-app topology (`ARCH-ADR-006`), Trust Zones (`ARCH-ADR-006`/`007`), and CI gates.
- **Consequences:** Resolves historical multi-repo references inside `docs/constitution/` cleanly without diluting spiritual or product-separation invariants.

## DOC-ADR-002 — Decentralized Co-Located Workspace Ownership

- **Status:** `ACCEPTED`
- **Traces To:** `ARCH-ADR-002`, `ARCH-ADR-006`, [CONSOLIDATION-CATALOG.md](../CONSOLIDATION-CATALOG.md)
- **Decision:** Keep documentation co-located within owning workspaces (`apps/*`, `packages/*`, `services/*`, `cp/arsy`, `engines/*`, `content/chronicles/*`). Strictly forbid flattening engine, application, package, or service documentation into a central `docs/` folder.
- **Consequences:** Requires Wave 3 backfill of missing root `README.md` files in `apps/web`, `apps/api`, `services/radius`, `services/storage`, and 14 shared packages.

## DOC-ADR-003 — Seven-Series ADR Namespace Disambiguation

- **Status:** `ACCEPTED`
- **Traces To:** [DOCUMENTATION_STRUCTURE_STANDARD.md](./DOCUMENTATION_STRUCTURE_STANDARD.md) §4
- **Decision:** Retain all seven existing historical/domain ADR collections in place under explicit disambiguated prefixes (`ARCH-ADR-NNN`, `ARCH-DEC-YYYY-MM-DD`, `CONST-ADR-NNNN`, `BP-ADR-NNN`, `RES-ADR-NNN`, `ENG-<ENGINE>-ADR-NNNN`, `XV-ADR-NNNN`). Require all new monorepo-wide architectural decisions to land sequentially under `docs/architecture/adr-NNN-<slug>.md` starting at `adr-008`.
- **Consequences:** Eliminates ambiguity between identically numbered ADRs (such as five independent `ADR-001` files) without breaking historical file paths.

## DOC-ADR-004 — Non-Destructive Historical Preservation via Header Banners

- **Status:** `ACCEPTED`
- **Traces To:** [CANON-PROVENANCE-CONTRACT.md](../constitution/CONTRACTS/CANON-PROVENANCE-CONTRACT.md), [DOCUMENTATION_LIFECYCLE_CONTRACT.md](./DOCUMENTATION_LIFECYCLE_CONTRACT.md)
- **Decision:** Never delete or rewrite historical audits, frozen Gen2 blueprints, or absorbed engine `AGENTS.md` files. Reconcile outdated or superseded documents by prepending explicit status/subordination banners pointing to the active canonical authority.
- **Consequences:** Preserves full audit provenance (`ATOMIC-UI-AUDIT.md`, `RUNTIME-SERVICE-INVENTORY.md` §1–4, `docs/blueprint/`, 9 `engines/*/AGENTS.md` files) while preventing AI agents and contributors from following stale rules.

## DOC-ADR-005 — Three-Level Federated Indexing Without Competing Catalogs

- **Status:** `ACCEPTED`
- **Traces To:** [DOCUMENTATION-INDEXING-STRATEGY.md](./DOCUMENTATION-INDEXING-STRATEGY.md)
- **Decision:** Enforce a single non-overlapping federated index hierarchy: Level 0 (`README.md`, `AGENTS.md`) -> Level 1 domain hubs (`DOCUMENTATION_GOVERNANCE_CONTRACT.md`, `engineering-foundation.md`, `docs/constitution/GOVERNANCE/DOCUMENT-INDEX.md`, `CONSOLIDATION-CATALOG.md`, `docs/blueprint/DOCUMENT-CATALOG.md`, `docs/legacy-harvest/ARCHIVE-MANIFEST.md`) -> Level 2 workspace `README.md` files.
- **Consequences:** Guarantees `<= 2` hop discovery and prevents duplicate competing repository catalogs.

## DOC-ADR-006 — Strict Separation of Specification Approval from Runtime Evidence

- **Status:** `ACCEPTED`
- **Traces To:** `CONST-ADR-0006`, [BLUEPRINT-READINESS-DEFINITIONS-V1.md](../blueprint/00-constitution/BLUEPRINT-READINESS-DEFINITIONS-V1.md)
- **Decision:** Enforce the 8 canonical lifecycle states (`DRAFT`, `PROPOSED`, `ACCEPTED`, `PARTIALLY_IMPLEMENTED`, `IMPLEMENTED`, `SUPERSEDED`, `ARCHIVED`, `REJECTED`) alongside 6 orthogonal epistemic classes (`EVIDENCE:IMPLEMENTATION` .. `EVIDENCE:UNKNOWN_OR_UNVERIFIED`). A specification cannot advance to `IMPLEMENTED` without verified source paths, `dev` commit SHA, and passing test/gate output.
- **Consequences:** Eliminates false completion claims derived from roadmap checkboxes or design-freeze documents.

## DOC-ADR-007 — Zero-Dependency Documentation Gate Inside `scripts/gatecheck.mjs`

- **Status:** `ACCEPTED`
- **Traces To:** [engineering-foundation.md](../architecture/engineering-foundation.md), [GATECHECK.md](../engineering/GATECHECK.md)
- **Decision:** Implement automated documentation validation (`DOC-VAL-001..010`) in `scripts/doc-check.mjs` using only Node.js built-ins and Prettier, integrated directly into `scripts/gatecheck.mjs` and `.github/workflows/ci.yml` rather than installing third-party Markdown lint toolchains or creating extra CI workflows.
- **Consequences:** Keeps CI fast, deterministic, and consistent with the repository's minimal-dependency rule.

## DOC-ADR-008 — Quarantine & Disposition Gate for Mirrored `VISUAL-*` Checkpoints & Embedded Code

- **Status:** `PROPOSED`
- **Traces To:** [DOCUMENTATION-AUDIT-REPORT.md](./DOCUMENTATION-AUDIT-REPORT.md) §2.4
- **Decision:** Isolate and require explicit owner disposition (Wave 4) for the 110 duplicated `VISUAL-*` `.md`/`.yaml` checkpoint files mirrored across `docs/blueprint/17-genesis/` and `docs/design/moonwitness-design-system/docs/`, as well as embedded `.tsx`/`.storybook`/`.github/workflows/` code inside `docs/design/moonwitness-design-system/` and `docs/blueprint/.github/`.
- **Consequences:** Prevents non-active workflow files and stale TSX snapshots inside `docs/` from polluting documentation validation or runtime search.

---

## Unresolved Human Decisions Requiring Owner Confirmation

1. Ratification of `DOC-ADR-001..007` and `MW-GOV-DOC-001..005` is **complete (`ACCEPTED`, 2026-11-18)**. `DOC-ADR-008` remains `PROPOSED` for physical relocation/deletion decisions.
2. [WORK_PLAN.md](../../WORK_PLAN.md) was non-destructively converted to clean UTF-8 (original corrupted UTF-16LE bytes preserved in Git `2bd0debb`); the 3 pre-existing working-tree-deleted root `.md` files (`LOCAL-AI-MASTER-PROMPT.md`, `MOONWITNESS-AUDIT-REPORT-2026-11-18.md`, `MOONWITNESS-GRAND-PLAN-LOCAL-AI.md`) remain uncommitted for owner review.
3. Physical deletion, archival, or code extraction of the 110 mirrored `VISUAL-*` checkpoints and embedded `.tsx`/`.storybook`/`.github/workflows/` code under `docs/design/moonwitness-design-system/` and `docs/blueprint/.github/` awaits explicit Product Owner (`@bjo163`) authorization.
4. Code-verified reconciliation of [00-ENGINE-CONTRACT.md](../dna/00-ENGINE-CONTRACT.md) against [packages/ui/package.json](../../packages/ui/package.json) (`20` `@radix-ui/react-*` packages) completed in Wave 1 without altering runtime dependencies.
5. Ecosystem/theological canon decisions (`RGBL/SRGBL`, `BASS-HUNTER`, World Patch `#014`, `25 Bidang Amanah`) remain exclusively with Product Owner (`@bjo163`).
