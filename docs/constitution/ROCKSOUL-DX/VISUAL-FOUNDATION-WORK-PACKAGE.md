# ROCKSOUL DX — v0.1 Visual Foundation Work Package

**Status:** APPROVED FOR BOUNDED LOCAL-AI EXECUTION  
**Package ID:** RDX-VIS-20261115-01  
**Source of truth:** `A-L-L-A-H/master-docs`  
**Target repository:** `A-L-L-A-H/rocksoul-dx`  
**Target branch:** `main` (repository default; inspect current state before writing)  
**Product framework direction:** Tauri (owner-selected; implementation details remain open)  
**Execution type:** Desktop visual foundation / navigable prototype  
**Not a production release authorization**

## 1. Mission

Implement the first coherent ROCKSOUL DX desktop experience as **THE LIVING UNIVERSE**: combine a game-world sense of place with living animation, under the NOISE × SILENCE visual DNA.

The deliverable is a working desktop visual prototype, not a static mockup and not a generic SaaS dashboard.

The user journey for this package is deliberately bounded:

`Launch → THE THRESHOLD → choose a destination → enter its clearly labelled room shell → return to THE THRESHOLD.`

The first package establishes the world, navigation, visual grammar, motion, responsive desktop composition, and honest placeholder states. It does not attempt to implement every domain workflow.

## 2. Product decision for this package

The product direction is the layered ROCKSOUL desktop universe:

- A shared continuity-oriented identity and navigation grammar.
- Four distinct destinations: THE ARCHIVE, THE STUDIO, THE RIOT DECK, THE SIGNAL ROOM.
- The first release slice is the Threshold plus navigable room shells for all four destinations.
- THE RIOT DECK is the first detailed operational-room design target because it is the current execution-workbench concept. Its actual agent, Git, process, and release capabilities are outside this visual-only package unless they already exist and can be safely surfaced without changing their behavior.
- The other three rooms may be labelled preview/coming later. Do not fake working workflows.

This package resolves the visual shell scope only. It does not approve a universal personal knowledge engine, unrestricted AI agent runtime, cloud sync, publishing pipeline, or complete developer automation platform.

## 3. Mandatory source documents

Read these documents before changing code:

1. `README.md`
2. `MASTER/VISION.md`
3. `MASTER/PRODUCT-BOUNDARIES.md`
4. `ROCKSOUL-DX/PRODUCT-MASTER.md`
5. `ROCKSOUL-DX/MASTER-NARRATIVE.md`
6. `ROCKSOUL-DX/DESKTOP-PRODUCT-CONTRACT.md`
7. `ROCKSOUL-DX/PRODUCT-EXPERIENCE-CONTRACT.md`
8. `ROCKSOUL-DX/PRODUCT-SCOPE-DECISION.md`
9. `ROCKSOUL-DX/VISUAL-CONSTITUTION.md`
10. `GOVERNANCE/LOCAL-AI-EXECUTION-GATE.md`
11. `GOVERNANCE/ARCHITECTURE-DECISIONS.md)

Master Docs revision used for this package: record the exact main commit SHA at execution start. If any mandatory document changes during execution, stop and reconcile.

## 4. Repository and branch safety

- Target only `A-L-L-A-H/rocksoul-dx`.
- Start by inspecting repository status, current branch, latest commit, existing project structure, Tauri version, scripts, dependencies, tests, and current UI.
- The repository's default branch is `main`; do not assume the local checkout is clean or already on main.
- Do not touch `A-L-L-A-H/master-docs` or `A-L-L-A-H/moonwitness` during implementation.
- Do not switch branches, create branches, reset, rebase, force-push, or discard user changes without explicit authorization. If the working tree is dirty or branch differs from the expected target, inspect and report before proceeding.
- Preserve existing working functionality and conventions. Do not replace the project wholesale.
- No unrelated refactors, package upgrades, dependency churn, or lockfile regeneration without necessity and explanation.

## 5. Stack and technical constraints

- Tauri is the selected desktop framework direction (ADR-0007).
- Inspect and reuse the repository's current frontend framework, rendering setup, package manager, scripts, and component conventions.
- Do not infer or introduce React, Vue, Svelte, Next.js, a database, ORM, backend service, auth provider, cloud service, or 3D engine solely from this brief.
- Do not add WebGL/Three.js/Babylon/Unity or another heavy renderer unless the existing architecture already uses it or a measured prototype proves it necessary; prefer a performant 2D/2.5D composition, CSS transforms, SVG/canvas, or existing rendering stack.
- Do not change Tauri capabilities, filesystem permissions, shell permissions, network allowlists, CSP, signing, updater, or OS integration as part of visual work unless required and separately approved.
- Avoid new dependencies. If one is essential, explain the need, bundle impact, maintenance risk, and alternative before adding it.
- No backend, database schema, remote API, telemetry, analytics, sync, publishing, or agent execution implementation in this package.

## 6. Visual requirements

Follow `VISUAL-CONSTITUTION.md` as normative. Key requirements:

- THE THRESHOLD is the launch experience and primary spatial hub.
- The world feels explorable and alive, not a wallpaper or a dashboard.
- Combine cinematic spatial depth, brutalist architecture, underground riot/grunge editorial texture, rough pencil/ink marks, restrained industrial red/orange signals, and warm luminous highlights.
- NOISE × SILENCE: expressive environment, calm and legible work surfaces.
- Destinations must be visually distinct, labelled, accessible, and navigable:
  - THE ARCHIVE
  - THE STUDIO
  - THE RIOT DECK
  - THE SIGNAL ROOM
- Include ROCKSOUL identity and exact manifesto copy:
  - `01 — NO CLUE WHAT'S COMING.`
  - `02 — NO IDEA HOW THIS ENDS.`
  - `03 — COULD BE RIGHT. COULD BE WRONG.`
  - `04 — BUT I KNOW WHO SAID: "I'LL FINISH IT."`
- Emphasize line 04 without changing any wording or punctuation.
- Include the command entry label: `WHAT ARE WE MAKING TODAY?`
- Keep utility/status controls minimal and discoverable.
- Provide a clear route back to THE THRESHOLD from every room.
- Use purposeful ambient motion and transitions; support reduced motion and keep sound off by default.
- Provide direct/keyboard navigation as an alternative to spatial navigation.
- Never use fake statistics, fabricated recent activity, false agent statuses, or pretend-complete features.

## 7. Required screens / states

At minimum implement:
1. **THE THRESHOLD** — fully art-directed entry environment with the four spatial destinations and manifesto.
2. **THE RIOT DECK** — first detailed room shell, showing the visual direction for an execution environment without claiming unimplemented agent/Git capabilities.
3. **THE ARCHIVE** — room identity and clearly marked preview state if no real archive workflow exists.
4. **THE STUDIO** — room identity and clearly marked preview state if no real studio workflow exists.
5. **THE SIGNAL ROOM** — room identity and clearly marked preview state if no real research workflow exists.
6. **Reduced-motion state** — demonstrate the calm alternative to ambient motion and spatial transitions.
7. **Small-window/resized state** — demonstrate that the desktop composition remains usable.

Use real content only when it exists. Use clearly labelled sample/demo content otherwise.

## 8. Execution plan and parallelization

Work in ordered phases. Parallelize only after inspecting the codebase and assigning non-overlapping ownership.

- Phase A — Reconnaissance: inspect app, architecture, current UI, tests, and risks. Produce a short implementation map.
- Phase B — Visual foundation: establish tokens, typography, surface/texture rules, spatial scene composition, and reusable primitives in existing stack.
- Phase C — Threshold: implement the launch world, manifesto, destination markers, command entry, and accessible navigation.
- Phase D — Room shells: implement destination navigation and distinct room identities; prioritize detailed Riot Deck shell; mark other rooms honestly as previews.
- Phase E — Living motion: implement restrained ambient and transition motion, reduced-motion mode, optional sound control only if existing architecture supports it without adding permission risk.
- Phase F — Validation: run existing lint, typecheck, tests, build, and Tauri checks available in repository; inspect console/runtime errors and resized layouts; capture screenshots.

Parallel agents may work on asset exploration, visual review, and isolated components only if file ownership is separate. One integrator owns shared tokens, app shell, navigation, and final merge. No two agents may edit the same file concurrently. If no safe parallel boundaries exist, execute sequentially.

## 9. Acceptance criteria

The work package is accepted only when:

- [ ] App launches through the existing Tauri workflow.
- [ ] The first view is THE THRESHOLD, not a generic dashboard.
- [ ] All four destinations are visibly represented and reachable.
- [ ] Every room provides a reliable return path.
- [ ] THE RIOT DECK has a coherent, detailed room shell.
- [ ] Other incomplete room workflows are visibly marked preview/unavailable rather than faked.
- [ ] The exact four-line manifesto appears with line 04 emphasized.
- [ ] Spatial interaction has keyboard/direct-navigation alternatives and visible focus.
- [ ] Reduced-motion behavior works and is demonstrable.
- [ ] Ambient motion is restrained and does not impair readability or performance.
- [ ] Layout survives supported desktop window sizes and resizing.
- [ ] No fabricated data, fake agent execution, or fake completion is presented as real.
- [ ] No unapproved stack, backend, permission, persistence, sync, or external service decision is introduced.
- [ ] Existing lint/typecheck/test/build commands pass, or failures are clearly reported with evidence and classification.
- [ ] Screenshots and a short interaction walkthrough are attached to the completion report.
- [ ] Final diff is reviewed for scope, privacy, accessibility, and dependency changes.

## 10. Stop conditions

Stop and report before proceeding if:
- the repository is not the named target or current changes would be overwritten;
- the project cannot be launched or its existing architecture is unclear;
- the existing stack conflicts with the brief;
- implementation requires a new framework, database, backend, remote service, or elevated Tauri permission;
- a destination requires inventing product behavior or private data;
- the manifesto or canon source conflicts;
- validation reveals a security/privacy issue or destructive migration;
- a requested change exceeds the visual shell scope.

Do not silently resolve these blockers by inventing a decision.

## 11. Required completion report

Report:
- repository, branch, starting and final commit SHA;
- Master Docs source revision;
- files changed and purpose;
- screens and interactions implemented;
- exact validation commands and results;
- screenshots / walkthrough evidence;
- dependency and bundle changes;
- accessibility and reduced-motion checks;
- privacy/security impact;
- known limitations and deferred workflows;
- whether human review is still required.

Do not call this a production release. It is the v0.1 visual foundation prototype unless a separate release gate is satisfied.
