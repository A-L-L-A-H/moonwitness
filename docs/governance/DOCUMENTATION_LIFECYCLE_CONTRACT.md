---
contract_id: "MW-GOV-DOC-003"
title: "MoonWitness Documentation Lifecycle Contract"
status: "ACCEPTED"
approval_authority: "Product Owner (@bjo163)"
ratified_by: "Master Execution Directive (2026-11-18)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
scope: "Controlled documentation lifecycle statuses, legacy vocabulary reconciliation, transition evidence, and change governance across A-L-L-A-H/moonwitness"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
---

# MoonWitness Documentation Lifecycle Contract

## 1. Purpose and Core Invariant

This contract derives its authority from [DOCUMENTATION_GOVERNANCE_CONTRACT.md](./DOCUMENTATION_GOVERNANCE_CONTRACT.md) (`MW-GOV-DOC-001`).

**Core Lifecycle Invariant:** A document's existence does **not** establish that it is approved, and an approved specification does **not** establish that software is implemented. Specification approval (`ACCEPTED`) and implementation verification (`IMPLEMENTED`) are separate gates backed by distinct evidence.

---

## 2. Controlled Lifecycle Statuses

Every normative document (contract, standard, ADR, architecture spec, design spec, or roadmap) **MUST** carry exactly one of the following eight controlled lifecycle statuses:

| Status                  | Normative Meaning                                                                                                                                   | Binding Force                                                            | Allowed In Active Guidance?                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| `DRAFT`                 | Work-in-progress authoring or unreviewed exploratory notes.                                                                                         | Non-binding. May change without notice.                                  | No (authoring only).                                  |
| `PROPOSED`              | Complete specification, ADR, or plan submitted for architectural or owner review.                                                                   | Non-binding until ratified.                                              | Only as a clearly labeled proposal.                   |
| `ACCEPTED`              | Explicitly ratified by the Product Owner or designated Principal Architecture authority.                                                            | **Binding** for design, contracts, and implementation work packages.     | Yes (canonical authority).                            |
| `PARTIALLY_IMPLEMENTED` | Normative specification is `ACCEPTED`, and some clauses are verified in source code on `dev`, while other clauses remain pending or deferred.       | **Binding**; implemented clauses verified, remaining clauses still open. | Yes, with explicit implemented vs. pending breakdown. |
| `IMPLEMENTED`           | All normative clauses of an `ACCEPTED` specification are verified in source code on `dev`/`main` with passing tests/gates and commit/path evidence. | **Binding** and runtime-verified.                                        | Yes (verified current state).                         |
| `SUPERSEDED`            | Replaced by a newer `ACCEPTED` or `IMPLEMENTED` specification/ADR. Retained in-repo for provenance.                                                 | Historical only; **not** active authority.                               | No — must point to superseding doc.                   |
| `ARCHIVED`              | Retired historical record, point-in-time audit, or legacy-harvest snapshot preserved as read-only provenance.                                       | Historical only; immutable.                                              | No — provenance reference only.                       |
| `REJECTED`              | Proposed specification or ADR explicitly declined after architectural or owner review.                                                              | Non-binding; retained to prevent re-litigating declined options.         | No — historical rationale only.                       |

---

## 3. Legacy Status Vocabulary Reconciliation

Absorbed governance layers use pre-existing status keywords. Existing historical documents do **not** require mass rewriting; interpret and map legacy statuses to the eight canonical statuses as follows:

| Legacy Vocabulary                                                 | Source Layer(s)                                                                                     | Canonical Lifecycle Mapping           | Notes                                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `DECIDED` / `approved`                                            | `docs/constitution/`, `docs/dna/00-ENGINE-CONTRACT.md`                                              | `ACCEPTED`                            | Specification ratified; does not imply runtime implementation.                                                                  |
| `LOCKED` / `DESIGN_COMPLETE`                                      | `docs/blueprint/DECISION-REGISTRY.md`, `BLUEPRINT-READINESS-DEFINITIONS-V1.md`                      | `ACCEPTED`                            | Design-frozen architectural contract; runtime implementation governed by `ADR-006`.                                             |
| `PARTIAL` / `in_progress`                                         | `docs/constitution/`, `docs/dna/`                                                                   | `PARTIALLY_IMPLEMENTED`               | Must enumerate which parts have code evidence vs. remain unimplemented.                                                         |
| `EVIDENCE_PENDING`                                                | `docs/blueprint/00-constitution/BLUEPRINT-READINESS-DEFINITIONS-V1.md`                              | `ACCEPTED` or `PARTIALLY_IMPLEMENTED` | Design accepted; executable test/CI/runtime evidence not yet captured.                                                          |
| `IMPLEMENTATION_CERTIFIED` / `verified` / `released` / `deployed` | `docs/blueprint/`, `engines/empire-origin/allah-com/DOCUMENTATION_CONTRACT.md`                      | `IMPLEMENTED`                         | Valid only when backed by repository paths, commit SHA, and passing test/CI evidence.                                           |
| `DEFERRED`                                                        | `docs/constitution/`                                                                                | `PROPOSED` (deferred wave)            | Intentionally postponed; requires explicit re-scheduling or work package to activate.                                           |
| `UNVERIFIED` / `UNKNOWN` / `DISPUTED` / `SOURCE-FOUND`            | `docs/constitution/CONTRACTS/CANON-PROVENANCE-CONTRACT.md`, `docs/MASTER-CANON-CROSS-REPO-CODEX.md` | **Orthogonal Epistemic Marker**       | Expresses evidence certainty per [DOCUMENTATION_QUALITY_STANDARD.md](./DOCUMENTATION_QUALITY_STANDARD.md), not lifecycle state. |

---

## 4. Lifecycle Transition Matrix

All status transitions **MUST** satisfy the authority and evidence rules below:

| From Status                                          | To Status               | Trigger / Condition                                                   | Approving Authority                               | Mandatory Evidence Required                                                                                              |
| ---------------------------------------------------- | ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| _(New)_                                              | `DRAFT`                 | Initial document authoring                                            | Any contributor or AI agent                       | Valid structure, declared `Owner` (`TBD` if unknown), scope defined.                                                     |
| `DRAFT`                                              | `PROPOSED`              | Author considers spec/ADR complete and internally consistent          | Document Author / Engine Lead                     | Complete required sections, zero placeholder `TODO` gaps in normative clauses, Prettier/link check clean.                |
| `PROPOSED`                                           | `ACCEPTED`              | Specification reviewed against upstream vision, trust zones, and ADRs | Product Owner (`@bjo163`) or Principal Architect  | Explicit PR approval / owner confirmation; no unresolved conflicts with `ACCEPTED` ADRs.                                 |
| `PROPOSED`                                           | `REJECTED`              | Proposal declined during architecture or owner review                 | Product Owner or Principal Architect              | Recorded rationale explaining why rejected and alternatives chosen.                                                      |
| `ACCEPTED`                                           | `PARTIALLY_IMPLEMENTED` | Subset of normative requirements implemented and tested               | Application / Package Maintainer + CI             | Verified source paths on `dev`, commit SHA, and passing tests for implemented subset; remaining scope listed explicitly. |
| `ACCEPTED` or `PARTIALLY_IMPLEMENTED`                | `IMPLEMENTED`           | All normative requirements verified in runtime code                   | Application / Engine Lead + Passing Quality Gates | Verified source paths, `dev` commit SHA, passing `pnpm gate:local` (or scoped CI/test logs), and no unverified waivers.  |
| `ACCEPTED` / `PARTIALLY_IMPLEMENTED` / `IMPLEMENTED` | `SUPERSEDED`            | New `ACCEPTED` specification or ADR replaces prior design             | Product Owner or Principal Architect              | New document exists at `ACCEPTED`+; bidirectional links (`Supersedes` in new doc, `Superseded by` banner in old doc).    |
| `ACCEPTED` / `IMPLEMENTED` / `SUPERSEDED`            | `ARCHIVED`              | Scope retired or converted to read-only historical provenance         | Repository Maintainer / Owner                     | Archival header with date, reason, and pointer to active replacement (if any).                                           |
| `DRAFT` / `PROPOSED`                                 | `ARCHIVED`              | Stale proposal retired without acceptance                             | Repository Maintainer                             | Archival note recording reason; never silently deleted if referenced by prior decisions or PRs.                          |

### Forbidden Transitions

1. **`DRAFT` -> `IMPLEMENTED` (or `ACCEPTED` skipped):** Normative behavior cannot jump directly to `IMPLEMENTED` without an `ACCEPTED` specification or ADR.
2. **Code-Only Silent Rewrite:** Implementation code **MUST NOT** silently redefine an `ACCEPTED` contract; update or supersede the specification via review.
3. **Un-Archiving / Un-Superseding In Place:** A `SUPERSEDED` or `ARCHIVED` document **MUST NOT** be silently flipped back to `ACCEPTED`. Author a new revision or ADR referencing the history.
4. **Silent Deletion of Provenance:** Never delete `ACCEPTED`, `IMPLEMENTED`, `SUPERSEDED`, `REJECTED`, or `ARCHIVED` records to hide past decisions or contradictions.

---

## 5. Change Governance Rules

| Action                            | When Permitted                                                                                                                                                                                                 | Review Requirement                                                                         | Mandatory Follow-Up                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Edit in Place (Non-Normative)** | Typo fixes, broken relative link repair, formatting normalization, or appending verified implementation evidence to `ACCEPTED`/`PARTIALLY_IMPLEMENTED` docs.                                                   | Standard PR review on `dev`.                                                               | Update `last_reviewed` date; run `DOCUMENTATION_VALIDATION_CONTRACT.md` checks.                         |
| **Edit in Place (Normative)**     | Allowed freely on `DRAFT` or `PROPOSED` docs. Allowed on `ACCEPTED` contracts only for backward-compatible clarifications that do **not** break invariants, APIs, trust zones, or canon.                       | Explicit maintainer/architect review; bump contract `version` (SemVer `MINOR` or `PATCH`). | Update dependent docs and catalogs in the same change set.                                              |
| **Replace / Supersede**           | Breaking architectural changes, topology shifts, trust-zone adjustments, or replacing a `LOCKED` / `ACCEPTED` ADR.                                                                                             | Mandatory Product Owner / Principal Architect approval + new `ARCH-ADR-NNN`.               | Mark prior ADR `SUPERSEDED by <path>`; preserve prior rationale verbatim; update indexes.               |
| **Move / Merge**                  | Reconciling duplicate active specs only when approved by an explicit consolidation plan. Forbidden on `docs/legacy-harvest/`, `docs/constitution/`, `docs/blueprint/`, or `engines/*` without a wave decision. | Explicit architectural review.                                                             | Update all inbound relative links, `DOCUMENT-INDEX.md`, or catalogs in the same commit.                 |
| **Archive**                       | Decommissioning retired specs, completed wave snapshots, or obsolete operational plans.                                                                                                                        | Maintainer approval.                                                                       | Add `ARCHIVED` status header, date, and pointer to active authority; keep file readable for provenance. |
