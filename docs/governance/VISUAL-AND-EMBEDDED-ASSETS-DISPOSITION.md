---
contract_id: "MW-GOV-DSP-001"
title: "Quarantined VISUAL-* Checkpoints & Embedded Docs Code Disposition Registry"
status: "PROPOSED"
approval_authority: "Product Owner (@bjo163)"
version: "1.0.0"
owner: "Repository Standards & Principal Architecture"
scope: "Wave 4 non-destructive inventory and disposition options for DOC-ADR-008 and GENESIS-READINESS-CHECKLIST.md"
effective_date: "2026-11-18"
last_reviewed: "2026-11-18"
derives_from:
  - "docs/governance/DOCUMENTATION-ARCHITECTURE-DECISIONS.md"
  - "docs/blueprint/DOCUMENT-CATALOG.md"
---

# Quarantined `VISUAL-*` Checkpoints & Embedded Code Disposition Registry

Per `DOC-ADR-008` (`PROPOSED`) and Section 0/Wave 4 safety rules, **zero** mirrored `VISUAL-*` files, compatibility pointers, or embedded code/workflow snapshots were deleted or relocated during the documentation implementation wave. This registry records exact counts and safe owner disposition options.

## 1. Compatibility Pointer Retained (`GENESIS-READINESS-CHECKLIST.md`)

- **Path:** [GENESIS-READINESS-CHECKLIST.md](../blueprint/GENESIS-READINESS-CHECKLIST.md)
- **Disposition Taken:** **KEPT IN PLACE (`DEPRECATED` pointer)**
- **Evidence:** [docs/blueprint/.github/workflows/blueprint-ci.yml](../blueprint/.github/workflows/blueprint-ci.yml) line 37 asserts `test -f GENESIS-READINESS-CHECKLIST.md`, and [docs/blueprint/README.md](../blueprint/README.md) + [DOCUMENT-CATALOG.md](../blueprint/DOCUMENT-CATALOG.md) retain it explicitly as a deprecated pointer to `17-genesis/GENESIS-00-EXECUTION-SPECIFICATION-V1.md`.

## 2. Mirrored `VISUAL-*` Files (`110` Total Across Two Subtrees)

Direct SHA-256 comparison across both locations on `dev`:

| Metric                                                |   Count | Paths                                                                                                                                                                             |
| ----------------------------------------------------- | ------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total `VISUAL-*` files                                | **110** | `57` in `docs/blueprint/17-genesis/` + `53` in `docs/design/moonwitness-design-system/docs/`                                                                                      |
| Exact byte-identical pairs                            |   **9** | Identical SHA-256 across both directories                                                                                                                                         |
| Diverged pairs (different SHA-256)                    |  **40** | Same filename present in both directories with non-identical content                                                                                                              |
| Only in `docs/blueprint/17-genesis/`                  |   **8** | Present exclusively in frozen blueprint Genesis folder                                                                                                                            |
| Only in `docs/design/moonwitness-design-system/docs/` |   **4** | `VISUAL-EVIDENCE-NOTE.md`, `VISUAL-ISSUE-LINKS.md`, [VISUAL-MIRROR-POLICY-V1.md](../design/moonwitness-design-system/docs/VISUAL-MIRROR-POLICY-V1.md), `VISUAL-SOURCE-QUERY-2.md` |

- **Recommendation for `@bjo163`:** Because **40** pairs diverged and **12** files exist on only one side, do **not** run a blind deduplication. Approve an explicit mirror reconciliation diff before retiring either copy (note [VISUAL-MIRROR-POLICY-V1.md](../design/moonwitness-design-system/docs/VISUAL-MIRROR-POLICY-V1.md) defines the design-system mirror policy).

## 3. Embedded Source Code, Storybook & Nested Workflows Inside `docs/`

| Subtree                                             | Observed Artifacts                                                                                                                                                                                                                                                  | Recommendation (`DOC-ADR-008`)                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/design/moonwitness-design-system/`            | `60` source/style files (`.ts`, `.tsx`, `.js`, `.jsx`, `.css`) under `src/`, `.storybook/`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, and `3` nested workflow files (`ci.yml`, `experience-qa.yml`, `storybook-pages.yml`) under `.github/workflows/` | Confirm with `@bjo163` whether to archive into `docs/legacy-harvest/` as static reference or exclude cleanly via explicit workspace ignore rules                                 |
| `docs/blueprint/.github/workflows/blueprint-ci.yml` | `1` absorbed repository workflow file (`blueprint-ci.yml`)                                                                                                                                                                                                          | Keep inert under `docs/blueprint/.github/` (`historical reference` — GitHub only executes root `.github/workflows/`) or move to an explicit historical archive path if requested |
