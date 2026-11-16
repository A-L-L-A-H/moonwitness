# 08 — Migration and Execution Playbook

## Phase zero: safety and baseline

- Inspect Git status and preserve all changes.
- Identify repository manager, runtime version, lockfile, actual package scripts, and dependency state.
- Run baseline lint/typecheck/test/build commands that exist.
- Record pre-existing failures separately from new regressions.
- Build a route/module inventory and duplicate-pattern inventory.

## Migration inventory

For each existing route or module, record:

- route path and page owner
- data source (live/API/demo/static)
- components used
- duplicated patterns
- interactions that must survive
- special responsive behavior
- assets and styles currently used
- intended shared components
- migration status and verification

## Safe sequence

### A. Workspace foundation

1. Choose the target structure after inspection.
2. Add pnpm workspace and Turbo only when supported.
3. Establish shared TypeScript, lint, and format config.
4. Move or create the demo app with a working route and build.
5. Establish explicit package exports and dependency direction.
6. Verify a clean install and workspace build before extracting many components.

### B. Theme foundation

1. Inventory all current CSS variables, Tailwind tokens, theme classes, and inline color literals.
2. Define semantic token names and presets.
3. Provide light/dark/system mode.
4. Add density, chaos intensity, RTL, and motion preferences as centralized settings where implemented.
5. Add a theme lab to exercise combinations.
6. Validate contrast and focus colors in every preset/mode.

### C. Shared components

1. Extract PageHeader and page layout primitives.
2. Extract metric patterns.
3. Extract panel patterns.
4. Extract status/priority/identity patterns.
5. Extract common record rows and activity patterns.
6. Extract navigation shell and menu schema.
7. Extract table patterns and filters.
8. Extract feedback states.
9. Document/showcase variants.

For each extraction, migrate at least one real consumer before expanding the abstraction.

### D. Artwork and graphics

1. Add asset package and manifest.
2. Create typography/graphic primitives and reusable sticker/frame components.
3. Generate/create initial art batches and curate.
4. Implement p5 sketch runtime and static fallbacks.
5. Add an artwork gallery and use art in dashboard, module intros, empty/error states, and boot/loading moments.
6. Measure bundle impact and remove eager loading of optional heavy art.

### E. Module migration

Group modules by shared patterns and complexity. Migrate one bounded group per commit-sized slice. Do not let parallel agents edit global CSS, package manifests, shared navigation, or the same route files simultaneously.

Suggested grouping (adapt to actual modules):

- Group 1: dashboard and mission/control screens.
- Group 2: customer operations, sales, and communications.
- Group 3: accounting/finance and work/HR.
- Group 4: ISP/telco and infrastructure.
- Group 5: intelligence, creative, science, and specialist modules.

### F. Premium-template catalog

Once the foundation is stable, fill the gaps in app examples, settings, auth, account, onboarding, pricing, error pages, docs, and starter app. Prefer a few complete examples over many dead-end routes.

## Parallel agent strategy

Parallelize only when shared interfaces are stable. Assign work by explicit file ownership:

- Agent A: tokens/theme package only.
- Agent B: artwork library/p5 sketches only.
- Agent C: documentation/content only.
- Agent D: one or more feature folders only, using frozen component APIs.
- Coordinator: root manifests, shared component APIs, navigation, integration, conflict resolution, and quality gates.

Never assign two agents to edit the same component, global stylesheet, package manifest, route registry, or lockfile simultaneously. Have the coordinator review and test all merged work.

## Change discipline

- Work in small, reviewable changes.
- Do not replace an entire file if a smaller targeted change is possible.
- Do not delete the old implementation until the replacement works and has been compared.
- Keep route names and navigation stable unless a deliberate change is documented.
- For a visual change, check before/after at mobile and desktop widths and light/dark mode.
- For data behavior, confirm sorting/filtering/pagination/action semantics rather than only checking appearance.
- Avoid adding dependencies when native CSS, the current component primitive, or a small utility already solves the need.

## Progress reporting

Update `.riot-ai/10-TODO.md` as each task is completed. Put concise evidence beside the task: source location, check run, and result. Put longer context in `.riot-ai/12-LOCAL-AI-REPORT.md`.

Do not keep a task checked if a required asset, consumer, test, or verification is missing. Use `[~]` for in progress and `[!]` for blocked only if the chosen tooling supports that convention; otherwise retain `[ ]` and explain the block.
