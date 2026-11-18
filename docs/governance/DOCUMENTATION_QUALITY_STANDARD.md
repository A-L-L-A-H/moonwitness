---
contract_id: "MW-GOV-DOC-004"
title: "MoonWitness Documentation Quality Standard"
status: "ACCEPTED"
approval_authority: "Product Owner (@bjo163)"
ratified_by: "Master Execution Directive (2026-11-18)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
scope: "Metadata requirements, RFC 2119 normative language, evidence/provenance classification, and canon protection across A-L-L-A-H/moonwitness"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
  - "docs/constitution/CONTRACTS/DOCUMENTATION-CONTRACT.md"
  - "docs/constitution/CONTRACTS/CANON-PROVENANCE-CONTRACT.md"
---

# MoonWitness Documentation Quality Standard

## 1. Purpose

This standard derives its authority from [DOCUMENTATION_GOVERNANCE_CONTRACT.md](./DOCUMENTATION_GOVERNANCE_CONTRACT.md) (`MW-GOV-DOC-001`) and unifies the specification writing rules from [DOCUMENTATION-CONTRACT.md](../constitution/CONTRACTS/DOCUMENTATION-CONTRACT.md) and [CANON-PROVENANCE-CONTRACT.md](../constitution/CONTRACTS/CANON-PROVENANCE-CONTRACT.md) across the entire monorepo.

---

## 2. Required Document Metadata

Every newly authored or updated **normative document** (Governance Contract, Standard, ADR, Architecture Spec, Product Master, Domain Contract, or Audit) **MUST** include either YAML frontmatter or a top-of-file metadata block declaring:

| Field                      | Requirement                                              | Allowed Format / Values                                                                                          |
| -------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `title` / H1               | **MUST**                                                 | Clear human-readable title matching the single `# Title` heading                                                 |
| `status`                   | **MUST**                                                 | One of the 8 controlled statuses in [DOCUMENTATION_LIFECYCLE_CONTRACT.md](./DOCUMENTATION_LIFECYCLE_CONTRACT.md) |
| `owner`                    | **MUST**                                                 | Named role/team from the Ownership Matrix in `MW-GOV-DOC-001` (or `TBD` if unconfirmed; never fabricated)        |
| `version`                  | **MUST** for Contracts & Standards                       | Semantic Version (`X.Y.Z`)                                                                                       |
| `last_reviewed`            | **MUST**                                                 | ISO 8601 date (`YYYY-MM-DD`)                                                                                     |
| `scope`                    | **MUST**                                                 | Explicit product, workspace, engine, or domain boundary + non-goals where relevant                               |
| `sources` / `derives_from` | **SHOULD** (or **MUST** when citing upstream/code state) | Repo-relative links, upstream repo/commit pin, or code/test paths                                                |

---

## 3. Normative Language

Normative documents **MUST** use RFC 2119 keywords unambiguously:

- **`MUST` / `REQUIRED` / `SHALL`:** Mandatory requirement; non-compliance fails review or validation.
- **`MUST NOT` / `SHALL NOT`:** Absolute prohibition.
- **`SHOULD` / `RECOMMENDED`:** Strong default expectation; deviations require a written architectural rationale.
- **`MAY` / `OPTIONAL`:** Permitted behavior without mandate.
- **`UNKNOWN`:** Insufficient primary-source or runtime evidence; **MUST** remain explicit rather than guessed.
- **`TBD`:** Human decision or value pending; **MUST NOT** be silently filled by AI agents.

---

## 4. Evidence and Epistemic Provenance Taxonomy

Every factual, architectural, or implementation claim in repository documentation **MUST** distinguish its epistemic provenance clearly. **Never infer implementation from documentation alone.**

| Epistemic Class                                                    | Definition                                                                                                            | Required Citation / Evidence                                                                                                                              | Prohibited Inference                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Verified Implementation** (`EVIDENCE:IMPLEMENTATION`)            | Behavior or structure proven to exist and pass checks in active workspace code.                                       | Exact file path(s) in `apps/*`, `packages/*`, `services/*`, or `cp/arsy`, branch (`dev`), commit SHA, and executed test/gate output (`PASS`).             | Never infer from roadmap checkboxes, blueprint YAMLs, UI placeholders, or unrun scripts.      |
| **Planned Implementation** (`EVIDENCE:PLANNED`)                    | Scheduled or prioritized work authorized by an `ACCEPTED` direction but not yet implemented/verified.                 | Reference to `WORK_PLAN.md`, `ECOSYSTEM-ROADMAP.md`, or work-package ID + upstream `ACCEPTED` ADR/Contract.                                               | Never report planned tasks as shipped or production-ready.                                    |
| **Proposed Architecture** (`EVIDENCE:PROPOSED`)                    | Candidate design, RFC, or draft ADR awaiting owner or architecture approval.                                          | Link to the `PROPOSED` ADR, `docs/superpowers/specs/*`, or draft YAML.                                                                                    | Never enforce or cite as binding `ACCEPTED` policy.                                           |
| **Historical Audit** (`EVIDENCE:HISTORICAL_AUDIT`)                 | Point-in-time assessment of code, docs, visuals, or repos captured at a specific commit/date.                         | Audit date, audited repository/branch/commit SHA, and explicit scope boundaries.                                                                          | Never present a past audit as continuous certification for later commits.                     |
| **Research Hypothesis** (`EVIDENCE:RESEARCH_HYPOTHESIS`)           | Experimental mathematical, linguistic, astronomical, or ethical model under active R&D.                               | Engine path (`engines/mtime`, `engines/crayon`, `engines/corpus-srgbl`, `engines/witness-semantic`, `docs/blueprint/08-ai/*`) + falsification/eval notes. | Never elevate an unratified research heuristic to established canon or production guarantees. |
| **Unknown or Unverified Claim** (`EVIDENCE:UNKNOWN_OR_UNVERIFIED`) | Claims lacking primary-source verification, disputed records, dreams, coincidences, fiction, or unrecovered archives. | Explicit `UNKNOWN`, `DISPUTED`, or `SOURCE-FOUND` marker noting the exact missing source.                                                                 | Never fabricate definitions, acronym expansions, commit SHAs, or causal history to fill gaps. |

---

## 5. Canon and Sacred Guardrails Compliance

Consistent with [CANON-PROVENANCE-CONTRACT.md](../constitution/CONTRACTS/CANON-PROVENANCE-CONTRACT.md) and [MASTER-CANON-CROSS-REPO-CODEX.md](../MASTER-CANON-CROSS-REPO-CODEX.md):

1. **Exact Owner Wording:** Preserve verbatim owner terms and manifestos (e.g., `GOD PROMISE / JANJI ALLAH`, `RGBL / SRGBL`, `BASS-HUNTER`, `NOISE × SILENCE`, and the exact 4-line ROCKSOUL manifesto).
2. **Preserve Variants & Conflicts Side by Side:** Never silently merge or erase competing spellings (`Walter-Whiter` / `WalterWhite` / `WHALTERWHITE`, `MOH` / `MOH571` / `DOGS FROM UNIVERSE`) or unresolved conflicts (World Patch `#014`: `FAMILY WITHOUT FEAR` vs. `THE WRONG WAY — HELLROAD`).
3. **Low-Profile Tawhid & Creator–Human Boundary:** Documentation and UI specifications **MUST NOT** depict ALLAH, claim divine or prophetic authority for software/AI outputs, rank religions, or use Qur'anic verses/sacred names as decorative filler textures.
4. **Quarantined References:** Do not cite known fabricated or hallucinated repository paths/SHAs quarantined in [MASTER-CANON-CROSS-REPO-CODEX.md](../MASTER-CANON-CROSS-REPO-CODEX.md) §VII.1 or attribute quarantined third-party clones ([CONSOLIDATION-CATALOG.md](../CONSOLIDATION-CATALOG.md) §2) as original ecosystem canon.

---

## 6. Prohibited Documentation Anti-Patterns

1. **Copy-Paste Specification Drift:** Duplicating long normative tables or rules across multiple files instead of linking to the Single Source of Truth.
2. **Fake Green Verification:** Reporting skipped, unrun, or mocked checks as `PASS` or `IMPLEMENTED`.
3. **Silent TODO / Placeholder Specs:** Leaving `TODO`, `TBD`, or blank placeholders inside `ACCEPTED` contracts without an explicit open-question or `UNKNOWN` entry.
4. **Secret or Private Infrastructure Leakage:** Recording credentials, tokens, private host credentials, or unredacted personal data in Markdown or YAML files.
5. **Conflating Trust Zones:** Documenting `apps/rocksoul` (Zone B) or `services/memory` (Zone C) as automatically replicating or exposing private data to `apps/web`/`apps/api` (Zone A).
