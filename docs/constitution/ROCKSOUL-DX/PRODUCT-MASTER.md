# ROCKSOUL DX — Product Master

**Repository:** `A-L-L-A-H/rocksoul-dx`  
**Product type:** **Private desktop application (desktop-first)**  
**Primary user:** Product owner only  
**Status:** DECIDED layered product direction and v0.1 visual foundation scope  
**Last reviewed:** 2026-11-15

## Product definition

ROCKSOUL DX is a personal desktop application—not a website, browser-first web app, public portal, or web dashboard wrapped in a desktop shell.

It is the owner's private desktop universe for continuity, thinking, exploration, memory, research, narrative development, creative production, and bounded execution work. The desktop interaction model is a first-class product requirement, not a deployment detail. Its experience combines GAME WORLD + LIVING ANIMATION: an explorable world that feels alive while remaining a serious tool for real work.

The owner has selected **Tauri** as the desktop framework direction. This is the only currently confirmed framework selection. Frontend framework, runtime boundaries, Rust command design, packaging, supported operating systems, update/signing strategy, and persistence architecture remain open technical decisions.

## Product promise

> A private desktop universe to preserve continuity, explore ideas, create work, research, and execute bounded projects — through distinct spaces unified by a human-controlled continuity core.

The approved product promise and first-release boundary are recorded in the [Product Scope Decision](PRODUCT-SCOPE-DECISION.md). ROCKSOUL DX is a layered product: a continuity-oriented core with distinct creative/research spaces and THE RIOT DECK execution space. The v0.1 implementation is deliberately bounded to THE THRESHOLD and navigable room shells, with THE RIOT DECK receiving the first detailed room shell.

## Product pillars

1. **Personal workspace** — a private home for active thoughts, projects, and creative work.
2. **Memory and archive** — preserve context, sources, decisions, and meaningful history.
3. **Knowledge exploration** — support research and frameworks such as RGBL / SRGBL and BASS-HUNTER without inventing definitions.
4. **Character and story universe** — manage ROCKSOUL and the wider ensemble, relationships, episodes, and canon.
5. **Human Pen and creation** — turn experience and ideas into authored work.
6. **AI assistance** — recall, organize, challenge, research, and help create while leaving authorship and decisions with the owner.
7. **Controlled publishing** — optionally prepare selected material for MoonWitness through explicit approval.

## Narrative foundations

Known terms to preserve:

- GOD PROMISE / JANJI ALLAH.
- RGBL / SRGBL.
- ROCKSOUL and the character ensemble.
- MYLUFT / MA'LŪF.
- Human Pen.
- BASS-HUNTER — Blessings, Answers, Signs & Science.
- Angel With Shotgun.
- MoonWitness as a related but independent public product.

Definitions and relationships must follow the canon/provenance contract.

## Experience direction

The approved visual direction is **THE LIVING UNIVERSE — GAME WORLD + LIVING ANIMATION**, governed by [Visual Constitution](VISUAL-CONSTITUTION.md). Its visual core is NOISE × SILENCE: cinematic spatial exploration, brutalist architecture, underground riot/grunge editorial energy, rough pencil/ink/collage, restrained industrial signals, and purposeful living motion. It must not resemble a generic SaaS dashboard or game HUD template.

These are art-direction rules, not permission to copy existing copyrighted characters, artists, or interfaces. The interface must remain usable, legible, accessible, performant, and controllable.

The experience contract must describe desktop navigation, workspace composition, window and panel behavior, keyboard interaction, file/artifact handling, and recovery states before implementation details are finalized. It must not inherit MoonWitness's public-web navigation or Master Hub's administrative control-plane assumptions.

## Privacy invariants

- Single primary user.
- Private by default.
- No automatic publication.
- Explicit export and approval.
- Clear source provenance and data lifecycle.
- No cloud dependency assumed until architecture and threat model are approved.

## Non-goals

- Public social network.
- Multi-tenant workspace.
- MoonWitness CMS clone.
- AI that claims to define the owner's identity or beliefs.
- Gamification that trivializes spiritual commitments.
- A browser-first website/dashboard disguised as the desktop product.

## Open decisions

- Detailed production workflows for Continuity Core, Archive, Studio, Signal Room, and Riot Deck beyond the v0.1 visual foundation.
- Supported operating systems and packaging/update mechanism.
- Local-first versus hybrid storage and sync.
- AI provider/model strategy and local model support.
- Plugin/extension boundary.
- Backup, encryption, and recovery design.
- Exact RGBL / SRGBL formal model.
- Canonical roles and relationships for all ensemble characters.

## v0.1 visual foundation acceptance

The first bounded implementation is the visual foundation prototype, not the full product release. It must satisfy the criteria in [Product Scope Decision](PRODUCT-SCOPE-DECISION.md) and [Visual Foundation Work Package](VISUAL-FOUNDATION-WORK-PACKAGE.md): enter through THE THRESHOLD, navigate all four labelled room shells, experience the detailed THE RIOT DECK shell, return home reliably, and preserve accessibility, reduced motion, privacy, and honest preview states.

## Longer-term product acceptance direction

As separately specified workflows are implemented, ROCKSOUL DX should enable the owner to:

- capture and retrieve private notes and source material;
- distinguish facts, dreams, observations, research, interpretations, and fiction;
- maintain a structured character/story canon;
- create and revise artifacts;
- inspect AI-assisted changes before accepting them;
- execute bounded development missions with traceable evidence and human approval;
- export a selected artifact without exposing unrelated private data.

These longer-term capabilities are not claimed as part of the v0.1 visual foundation prototype.
