# Decision Log

This log records decisions that materially affect product boundaries, canon handling, architecture, and contracts.

## 2026-11-15 — D-001: Separate ROCKSOUL DX and MoonWitness

**Status:** DECIDED

- ROCKSOUL DX is a private desktop application for the product owner.
- Repository: `A-L-L-A-H/rocksoul-dx`.
- MoonWitness is a public-facing web product.
- Repository: `A-L-L-A-H/moonwitness`.
- The products retain separate product identities, audiences, and roadmaps.

## 2026-11-15 — D-002: Establish master-docs as documentation source of truth

**Status:** DECIDED

- Repository: `A-L-L-A-H/master-docs`.
- Holds ecosystem vision, shared canon records, product masters, core contracts, decisions, and cross-product integration specifications.
- Does not replace application repositories or claim to contain their implementation.

## 2026-11-15 — D-003: Private-by-default publishing boundary

**Status:** DECIDED principle; implementation PROPOSED

- ROCKSOUL DX material is private by default.
- No automatic publishing or unrestricted synchronization to MoonWitness.
- A future bridge must use explicit selection, preview, approval, validation, and receipt.

## 2026-11-15 — D-004: Preserve canon provenance and unknowns

**Status:** DECIDED

- Preserve exact terms such as GOD PROMISE / JANJI ALLAH and RGBL / SRGBL.
- Do not invent RGBL/SRGBL expansions or unverified character roles.
- Distinguish canon, source-found material, proposals, disputed details, and unknowns.

## 2026-11-15 — D-005: Repository implementation status must be evidence-based

**Status:** DECIDED

- Implementation claims require repository, branch, commit, and/or test evidence.
- A roadmap item is not an implemented feature.
- A successful CI run is not proof of production readiness.

## Open decisions

- Final technical architecture and storage strategy for ROCKSOUL DX.
- Formal definitions and source records for RGBL / SRGBL.
- Complete character biographies, visual references, relationships, and chronology.
- Shadow / ARSY product and access boundaries in MoonWitness.
- Whether and how to implement the controlled publishing bridge.


## 2026-11-15 — D-006: Tauri selected as ROCKSOUL DX desktop framework direction

**Status:** DECIDED — framework direction only

- The owner selected Tauri for ROCKSOUL DX.
- This does not select a frontend framework, database, local file layout, IPC command architecture, packaging/signing process, update mechanism, or supported OS matrix.
- These details require separate ADRs based on the product workflow, privacy model, and release requirements.
- Tauri selection does not prove that the current product repository has a complete or release-ready Tauri implementation.

## 2026-11-15 — D-007: ROCKSOUL DX layered universe and v0.1 visual foundation

**Status:** DECIDED — product direction and bounded visual foundation scope

- The owner approved combining GAME WORLD + LIVING ANIMATION into one explorable, living desktop experience.
- The product is a layered private desktop universe: continuity-oriented core; creative/research spaces; and the execution space THE RIOT DECK.
- THE THRESHOLD is the primary entry and spatial hub.
- Canonical destinations: THE ARCHIVE, THE STUDIO, THE RIOT DECK, THE SIGNAL ROOM.
- v0.1 is a visual foundation prototype with navigable room shells. THE RIOT DECK receives the first detailed room shell; other rooms must be labelled preview until their workflows are specified.
- The exact four-line manifesto is governed by ROCKSOUL-DX/VISUAL-CONSTITUTION.md.
- This decision does not select a frontend framework, 3D engine, database, backend, AI provider, storage architecture, or expanded Tauri permissions.

See [Product Scope Decision](../ROCKSOUL-DX/PRODUCT-SCOPE-DECISION.md), [Visual Constitution](../ROCKSOUL-DX/VISUAL-CONSTITUTION.md), and [Visual Foundation Work Package](../ROCKSOUL-DX/VISUAL-FOUNDATION-WORK-PACKAGE.md).
