# ROCKSOUL DX — Product Scope and v0.1 Decision

**Status:** DECIDED for layered product direction and v0.1 visual foundation scope  
**Decision owner:** Product owner  
**Decision date:** 2026-11-15  
**Specification authority:** `A-L-L-A-H/master-docs`

## 1. Decision

ROCKSOUL DX is a **layered, private desktop creative universe**. It combines a continuity-oriented personal environment with distinct creative, research, and execution spaces. The user explicitly approved combining **GAME WORLD + LIVING ANIMATION** as one experience: a world that can be explored and that feels alive, while remaining a serious tool for real work.

This resolves the previous A/B/C product-scope ambiguity in favor of **Option C — Layered ROCKSOUL desktop environment**.

### Product promise

> A private desktop universe to preserve continuity, explore ideas, create work, research, and execute bounded projects — through distinct spaces unified by a human-controlled continuity core.

The world is the experience and navigation metaphor. It is not a game requiring gameplay, and it is not a SaaS dashboard with a game skin.

## 2. Product layers

1. **Continuity Core** — preserve threads, context, sources, decisions, artifacts, and useful return points. This is a product principle and future domain capability; do not assume a database or implementation already exists.
2. **Creative / Research spaces** — THE ARCHIVE, THE STUDIO, and THE SIGNAL ROOM.
3. **Execution space** — THE RIOT DECK for bounded development missions, agent-assisted work, inspection, validation, and release decisions.

The layers share visual identity and deliberate navigation. They do not imply unrestricted shared permissions, a single undifferentiated data model, or automatic access between private domains.

## 3. v0.1 scope — bounded first release

The first implementation package is the **Visual Foundation Prototype**:

- launch into **THE THRESHOLD**;
- present the four canonical destinations as spatial landmarks;
- navigate into clearly identified room shells;
- deliver a detailed visual shell for **THE RIOT DECK**;
- show THE ARCHIVE, THE STUDIO, and THE SIGNAL ROOM as honest preview/placeholder spaces until their workflows are separately specified;
- provide a reliable return path to THE THRESHOLD;
- establish the visual system, living-motion grammar, keyboard/direct-navigation alternatives, and reduced-motion behavior.

The first package's primary user journey is:

`Launch → THE THRESHOLD → choose a destination → enter its room shell → return to THE THRESHOLD.`

This is a visual foundation and navigable prototype, not a claim that the full Continuity Core, archive, studio, research, AI agent runtime, or release automation is implemented.

## 4. Canonical destinations

- **THE THRESHOLD** — entry environment and spatial hub.
- **THE ARCHIVE** — memory, sources, notes, knowledge, and retrievable artifacts.
- **THE STUDIO** — writing, ideation, creative production, visual experimentation, and authored work.
- **THE RIOT DECK** — missions, development work, agent-assisted execution, inspection, validation, and release decisions.
- **THE SIGNAL ROOM** — research, discovery, connected ideas, and signal-oriented exploration.

These names are approved experience language. Their visual presence does not certify the underlying workflow as implemented.

## 5. Explicit v0.1 non-goals

- Full implementation of all four destination workflows.
- Production-grade agent orchestration, unrestricted shell access, or autonomous merging/releasing.
- A complete personal knowledge graph, universal memory engine, or semantic search backend.
- Cloud sync, remote storage, telemetry, analytics, or automatic publishing.
- MoonWitness CMS/admin features or a public social network.
- Multi-user collaboration or multi-tenant SaaS.
- New database, auth provider, API, MCP runtime, or backend.
- A mandatory real-time 3D engine or game engine.
- Changes to Tauri permissions, filesystem scope, CSP, signing, updater, or OS integration without separate approval.

## 6. Stable product constraints

- Product form: dedicated desktop application.
- Framework direction: Tauri, owner-selected (ADR-0007).
- Primary user: product owner only, unless explicitly changed.
- Default classification: PRIVATE.
- No automatic publication, cloud upload, or cross-product synchronization.
- Human remains author and final decision-maker.
- The product must remain usable with reduced motion and without sound.
- AI suggestions are not accepted actions until reviewed.

## 7. Technical decisions still open

Tauri is the only confirmed framework direction. The implementation agent must inspect and reuse the current repository stack. These remain open and must not be inferred from this decision:

- frontend framework and rendering approach;
- Rust command/API boundaries and IPC;
- local persistence, database, file layout, and migrations;
- supported operating systems, packaging, signing, updates, and release channels;
- AI provider/local model strategy;
- plugin/extension permissions;
- backup, encryption, restore, and deletion semantics.

## 8. Acceptance criteria for the v0.1 visual foundation

- THE THRESHOLD is the first view and unmistakably not a dashboard.
- GAME WORLD and LIVING ANIMATION are visibly combined.
- All four destinations are represented, labelled, and reachable.
- THE RIOT DECK has a coherent detailed room shell.
- Other incomplete rooms are clearly marked preview/unavailable rather than faked.
- The exact owner manifesto appears with line 04 emphasized.
- Spatial navigation has keyboard/direct-navigation alternatives.
- Reduced-motion behavior works.
- The desktop layout remains legible and usable when resized.
- No unapproved stack, backend, permission, persistence, sync, or external-service decision is introduced.
- Screenshots and a short interaction walkthrough provide evidence.

## 9. Change control

This decision authorizes the bounded visual foundation work package only. Expanding v0.1 into production agent execution, full knowledge management, cloud services, or publication requires additional workflow contracts, security review, acceptance criteria, and explicit owner approval.

See [Visual Constitution](VISUAL-CONSTITUTION.md) and [v0.1 Visual Foundation Work Package](VISUAL-FOUNDATION-WORK-PACKAGE.md).
