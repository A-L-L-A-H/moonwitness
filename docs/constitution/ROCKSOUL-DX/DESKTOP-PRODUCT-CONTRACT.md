# ROCKSOUL DX — Desktop Product Contract

> **Historical contract notice:** This document is retained as product provenance. Technical choices described as open are reconciled against the checked-out implementation by `apps/rocksoul/docs/reconciliation-v2/BASELINE-EVIDENCE.md`; the runtime authority remains ADR-006 and `RUNTIME-SERVICE-INVENTORY.md`.

**Status:** DECIDED product form and boundaries; detailed interaction and technical choices PROPOSED  
**Owner:** Product owner  
**Owning repository:** `A-L-L-A-H/rocksoul-dx`  
**Specification authority:** `A-L-L-A-H/master-docs`

## 1. Product form — DECIDED

ROCKSOUL DX is a **desktop application**. This is a product-level decision, not a temporary packaging choice.

It is not:

- a public website;
- a browser-first web application;
- a MoonWitness admin/CMS panel;
- a Master Hub dashboard;
- a multi-tenant SaaS product by default;
- a web dashboard merely wrapped and relabeled as desktop.

The owner has selected Tauri as the desktop framework direction. The implementation strategy beyond that framework selection remains open.

## 2. Product role

ROCKSOUL DX is the owner's private desktop universe for continuity, creative work, research, and bounded execution. Its product structure is layered: a continuity-oriented core with distinct spaces for creation, research, and execution. The canonical experience locations are THE THRESHOLD, THE ARCHIVE, THE STUDIO, THE RIOT DECK, and THE SIGNAL ROOM.

The v0.1 implementation scope is the visual foundation: THE THRESHOLD, navigable room shells, and a detailed THE RIOT DECK room shell. This does not certify full archive, studio, research, continuity, or agent workflows as implemented.

## 3. Desktop experience requirements

The product must be designed around desktop use and follow the [Visual Constitution](VISUAL-CONSTITUTION.md). The experience specification must address:

- a persistent workspace suitable for extended creative/research sessions;
- deliberate navigation among workspace areas without turning every area into a generic dashboard;
- keyboard-first shortcuts for frequent actions, with discoverable alternatives;
- flexible panels/windows where useful, without sacrificing a coherent information hierarchy;
- direct handling of files and authored artifacts where supported by the selected runtime;
- clear unsaved-change, autosave, recovery, and conflict states;
- readable typography and usable density across supported desktop display sizes;
- accessible focus, keyboard navigation, contrast, and reduced-motion behavior;
- safe confirmation and preview for destructive, external, or publication actions.

These are experience requirements, not a commitment to a specific UI framework or windowing model.

## 4. Privacy and data invariants

- Private by default.
- No automatic publication to MoonWitness.
- No automatic ingestion into Master Hub.
- No cloud sync or remote dependency is assumed until explicitly designed and approved.
- Export is selective: the owner chooses the exact artifact/assets and destination.
- Export must preserve provenance and required context, and must not include unrelated private data.
- AI access to local/private material must be visible, scoped, and controlled by the owner.
- Backups, encryption, recovery, retention, and deletion behavior require an explicit security/data lifecycle design.

## 5. Relationship to other products

| Product | Role | Relationship |
|---|---|---|
| ROCKSOUL DX | Private desktop creative universe | Source workspace for private personal material and bounded execution |
| MoonWitness | Public-facing web storytelling and publication | Receives only selected, approved publication material |
| Master Docs / future Master Hub | Shared documentation authority and governed coordination | Holds approved shared definitions/contracts; does not mirror private workspace by default |

Shared concepts or canon do not imply shared database, login, runtime, UI, or unrestricted access.

## 6. Technical decisions intentionally open

Tauri is the selected desktop framework direction (see ADR-0007). The following decisions remain open and must be evaluated before implementation is committed:

- frontend framework, runtime boundaries, Rust command/API design, and whether/how web technologies are used internally;
- supported operating systems and distribution/packaging;
- local storage format, database, file layout, and migration strategy;
- offline behavior and any optional sync model;
- local versus remote AI execution and provider abstraction;
- plugin/extension permissions and isolation;
- backup, encryption, restore, and crash recovery;
- update strategy, signing, and release channel;
- interoperability/export formats and versioning.

No technology choice should weaken the desktop product boundary or private-by-default invariants.

## 7. Release acceptance gates

A release may be called a ROCKSOUL DX desktop release only when:

- it launches and operates as a dedicated desktop application on its declared supported OS;
- core workflows do not require the user to operate it as a website;
- private material remains private unless the owner initiates an approved export;
- data recovery and backup behavior are documented for the release;
- destructive and external actions have clear user control;
- the shipped capabilities are evidenced in the owning repository and release artifacts.

## 8. Change control

Changes to the product form, primary audience, privacy defaults, publication boundary, or cross-product data flow require explicit product-owner approval and an ADR. Implementation convenience is not sufficient reason to turn ROCKSOUL DX into a web product.
