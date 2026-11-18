---
title: "ADR-009: P3 Engine Curation and Canonical Runtime Promotion"
status: "ACCEPTED"
owner: "Repository Standards & Principal Architecture"
last_reviewed: "2026-11-18"
---

# ADR-009: P3 Engine Curation and Canonical Runtime Promotion

> Implements **P3-1** from [PLATFORM-ENGINEERING-ROADMAP.md](./PLATFORM-ENGINEERING-ROADMAP.md), extending [ADR-002](./adr-002-shared-packages.md) and [CONSOLIDATION-CATALOG.md](../CONSOLIDATION-CATALOG.md).

## Context

Seventeen domain directories live under `engines/*` outside `pnpm-workspace.yaml`. Core evaluators for scripture normalization, M-Time benchmarks, Crayon RGBL, SRGBL v8, AQEL parsing, and DHGS assurance steps were previously promoted into `@moonwitness/canon` (`packages/canon`), while reusable validation/contract pieces in `engines/witness-semantic`, `engines/ontology`, and `engines/moonframe` lacked explicit canonical runtime ownership vs archive boundaries.

## Decision

1. **Canonical TS Promotion (`@moonwitness/canon` & `@moonwitness/addon-witness-research`):**
   - `validateWitnessDerivationContract` (`packages/canon/src/research-engines.ts`, promoted from `engines/witness-semantic/src/witness/validate.ts`) enforces `CANDIDATE`-only witness emissions, source record alignment, frame review eligibility, and grounded target derivation.
   - `OX_DX_CANONICAL_HIERARCHY` & `validateOntologyHierarchyContract` (`packages/canon/src/research-engines.ts`, promoted from `engines/ontology/specifications/universe-contract.json`) formalize the 49-level Universal Ontology contract in TypeScript.
   - `@moonwitness/addon-witness-research` exposes authenticated runtime routes `/api/v1/witness/ontology/zones` and `/api/v1/witness/evaluate-frame` backed directly by `@moonwitness/canon`.
2. **Design Skin Alias Curation (`@moonwitness/ui`):**
   - `MOONFRAME_SKIN_ALIAS_MAP` and `resolveMoonframeSkinAlias` (`packages/ui/src/skin/presets.ts`) map all 15 legacy `engines/moonframe` skin IDs onto the canonical 10 `@moonwitness/ui` `SkinName` presets without duplicating theme engines.
3. **Archival Boundary Preserved (`engines/*`):**
   - Standalone Rust crates (`engines/ontology/crates/*`, `engines/mtime`), Python corpora (`engines/crayon`, `engines/corpus-srgbl`), and historical UI/OS archives remain non-workspace provenance archives under `engines/*` unless explicitly promoted by a future ADR.

## Consequences

- Runtime applications and addons import exclusively from `@moonwitness/*` workspace packages; `pnpm-workspace.yaml` continues to exclude `engines/*`.
- CI and Vitest validate curated semantics, ontology invariants, and skin compatibility deterministically on every push.
