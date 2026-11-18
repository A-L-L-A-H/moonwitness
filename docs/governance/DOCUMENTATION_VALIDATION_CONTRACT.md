---
contract_id: "MW-GOV-DOC-005"
title: "MoonWitness Documentation Validation Contract"
status: "ACCEPTED"
approval_authority: "Product Owner (@bjo163)"
ratified_by: "Master Execution Directive (2026-11-18)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
scope: "Automated validation, human review gates, existing gatecheck integration, and zero-dependency enforcement across A-L-L-A-H/moonwitness"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md"
  - "docs/engineering/GATECHECK.md"
  - "docs/blueprint/00-constitution/BLUEPRINT-LINT-CONTRACT-V1.yaml"
---

# MoonWitness Documentation Validation Contract

## 1. Purpose and Tooling Policy

This contract derives its authority from [DOCUMENTATION_GOVERNANCE_CONTRACT.md](./DOCUMENTATION_GOVERNANCE_CONTRACT.md) (`MW-GOV-DOC-001`).

Validation **MUST** remain lightweight, deterministic, and compatible with the repository's existing engineering gates ([GATECHECK.md](../engineering/GATECHECK.md), `scripts/gatecheck.mjs`, `.github/workflows/ci.yml`):

- **Zero Unnecessary Dependencies:** Do **not** introduce new npm packages, Python toolchains, or heavy external linters when Node.js built-ins (`>=20`), Prettier (`pnpm format:check`), Git, and `scripts/gatecheck.mjs` already cover the check.
- **Unambiguous Gate States:** Every validation step reports `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE` (`scripts/gatecheck.mjs` contract). Missing prerequisites report `BLOCKED`; skipped checks **MUST NOT** be reported as `PASS`.

---

## 2. Validation Matrix: Automated vs. Human Review

Documentation rules split strictly into three enforcement tiers:

### Tier 1 — Automated Checks Enforced Today by Existing Repository Tooling

| Rule Checked                                 | Enforcing Tool / Script                                               | Scope                                                             | Blocking?                                       |
| -------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| **Markdown & YAML Formatting**               | `pnpm format:check` (`prettier --check .`)                            | All workspace `.md` and `.yaml` files outside `.prettierignore`   | Yes (`gate:quick`, `gate:local`, CI)            |
| **Whitespace & Conflict Markers**            | `git diff --check HEAD`                                               | Tracked text diffs prior to push                                  | Yes (`gate:push`)                               |
| **Tracked-File Secret Scan**                 | `stepSecretScan` in `scripts/gatecheck.mjs`                           | All tracked `.md`, `.yaml`, `.yml`, `.json`, and source files     | Yes (`gate:push`)                               |
| **Branch & Worktree Policy (`dev` only)**    | `pnpm branch:guard` (`scripts/branch-guard.mjs`) & `stepBranchPolicy` | Local branch names (`dev` / `main` persistent; ephemeral PR refs) | Yes (`gate:push`, `gate:doctor`, pre-push hook) |
| **Conventional Commits**                     | `pnpm commitlint` (`scripts/commitlint.mjs`)                          | Commit headers (`docs(<scope>): <subject>`)                       | Yes (`gate:push`, CI PRs)                       |
| **Three-App Topology Invariant (`ADR-006`)** | `stepAppTopology` in `scripts/gatecheck.mjs`                          | Verifies `apps/` contains strictly `["api", "rocksoul", "web"]`   | Yes (`gate:quick`, `gate:local`)                |

### Tier 2 — Deterministic Automatable Documentation Checks (Zero-Dependency Target Checks)

When automating documentation lint inside `scripts/` using Node.js standard modules (`node:fs`, `node:path`) without adding external dependencies, only deterministic structural checks belong in automated CI:

| Check ID      | Automated Rule                                                                                                                                                | Target Scope                                             | Failure Behavior                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `DOC-CHK-001` | Required metadata keys (`title`/`# `, `status`, `owner`, `last_reviewed`, and `version` for contracts) present.                                               | `docs/governance/*.md`, new `docs/architecture/adr-*.md` | `FAIL` if missing on governed active files.         |
| `DOC-CHK-002` | `status` value matches the 8-state allowlist (`DRAFT`, `PROPOSED`, `ACCEPTED`, `PARTIALLY_IMPLEMENTED`, `IMPLEMENTED`, `SUPERSEDED`, `ARCHIVED`, `REJECTED`). | `docs/governance/*.md` & new normative specs             | `FAIL` on invalid status token.                     |
| `DOC-CHK-003` | Repo-relative Markdown links (`./...`, `../...`) resolve to existing files or directories.                                                                    | `docs/governance/*.md`, `AGENTS.md`, `README.md`         | `FAIL` on broken local link targets.                |
| `DOC-CHK-004` | Single `#` H1 heading per normative document (ignoring fenced code blocks).                                                                                   | `docs/governance/*.md`, `docs/architecture/*.md`         | `FAIL` on missing or multiple H1 headings.          |
| `DOC-CHK-005` | Blueprint YAML ownership & acyclic dependency assertions defined in `BLUEPRINT-LINT-CONTRACT-V1.yaml`.                                                        | `docs/blueprint/**` (when blueprint changes)             | `FAIL` on duplicate capability/contract/data owner. |
| `DOC-CHK-006` | Reject known quarantined placeholder SHAs and hallucinated repo strings listed in `MASTER-CANON-CROSS-REPO-CODEX.md` §VII.1.                                  | Active `docs/**` outside historical audit logs           | `FAIL` if newly introduced in active docs.          |

### Tier 3 — Mandatory Human / Architectural Review Gates (Non-Automatable)

Static linters cannot verify truth, semantic consistency, or product intent. The following gates **MUST** be reviewed by a human maintainer or Principal Architect:

1. **Lifecycle Ratification (`PROPOSED` -> `ACCEPTED`):** Verifying that new ADRs, contracts, or scope changes align with Ecosystem Vision, Product Boundaries, and Trust Zones (`ADR-006`, `ADR-007`).
2. **Implementation Evidence Audit (`PARTIALLY_IMPLEMENTED` / `IMPLEMENTED`):** Confirming that cited source files, tests, and runtime endpoints genuinely satisfy the normative contract requirements rather than empty stubs or mocked responses.
3. **Canon & Sacred Guardrail Ratification:** Promoting `SOURCE-FOUND` or `PROPOSED` canon records to `CONFIRMED`, resolving `RGBL/SRGBL` or `BASS-HUNTER` primary definitions, and reviewing religious/narrative boundary compliance.
4. **Conflict Resolution:** Resolving competing specs (e.g., World Patch `#014`, legacy vs. active branch instructions in `CONTRIBUTING.md`, `25 Bidang Amanah` promotion).
5. **Cross-Zone Privacy & Security Changes:** Any documentation change affecting `Zone A` (VPS/Cloud), `Zone B` (`apps/rocksoul`), or `Zone C` (`services/memory`) data isolation.

---

## 3. Standard Verification Commands for Documentation Changes

Before committing or opening a PR for any documentation change on `dev`, authors and AI agents **MUST** execute and report exact outputs for:

```sh
pnpm format:check            # or targeted: npx prettier --check <changed-md-files>
git diff --check             # detect whitespace errors or merge conflict markers
pnpm branch:guard            # confirm branch is dev and no extra local branches exist
```

When a documentation change also updates implementation status to `IMPLEMENTED` or touches `AGENTS.md` / `docs/architecture/` / `docs/engineering/`, authors **MUST** additionally run `pnpm gate:quick` (or `pnpm gate:local` before promotion) and record the verified command results.

---

## 4. Non-Compliance and Escalation

- Documentation PRs failing Tier 1 checks **MUST NOT** merge to `dev`.
- If an AI agent detects a conflict between an active code path and an `ACCEPTED` contract, or encounters missing owner confirmation required for a Tier 3 gate, it **MUST** report the check as `BLOCKED` (naming the exact unresolved decision) rather than guessing or weakening the gate.
