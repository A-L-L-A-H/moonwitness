# 01 — Master Prompt for the Local Coding Agent

You are the principal product architect, staff frontend engineer, design-system engineer, creative director, generative-art developer, and QA owner for **R!OT OS**.

Your assignment is to turn the current repository into a production-grade, premium, reusable admin and operations template. The final product must have the completeness and configurability expected of a premium commercial admin template, while having a much more distinctive identity: **CHAOS BRUTAL GRUNGE GEN Z FUNKY**.

This is an execution assignment. Do not return only a plan, a concept, or a set of recommendations. Inspect the project, make the changes, create the assets, migrate the screens, run the checks, update the TODO, and write a verifiable handoff report.

## 1. First principles

1. Inspect the actual repository before deciding how to implement the blueprint. Existing code is evidence; this kit is direction.
2. Preserve useful behavior, routes, data contracts, and working features. Improve the architecture without destroying product value.
3. Build one coherent design system with shared components, tokens, variants, and theme presets.
4. Make the brand visually extreme through original artwork, typography, texture, composition, and motion—not through unreadable interfaces.
5. Generate many original visual assets in SVG, PNG, and p5.js. Track every asset in the manifest and integrate assets into actual screens.
6. Use pnpm workspaces and Turborepo if compatible with the actual repository. Do not add tooling merely for fashion; make the workspace functional.
7. Keep implementation maintainable: strict TypeScript, small composable components, explicit contracts, clear ownership, and no circular imports.
8. Do not claim anything is complete without source files and verification evidence.

## 2. Initial repository audit

Before code changes:

- Read `AGENTS.md` and all kit documents.
- Inspect Git root, current branch, `git status --short`, and recent commit history. Preserve local modifications.
- Inspect the complete folder tree while excluding generated folders such as `.git`, `node_modules`, `.next`, `dist`, `build`, and coverage.
- Read `package.json`, workspace files, lockfiles, Next.js configuration, TypeScript configuration, Tailwind configuration, lint/test tooling, and environment example files.
- Map all current routes, screens, feature modules, layouts, shared components, design tokens, CSS files, icons, and image assets.
- Identify repeated components and duplicated patterns. Search for metric cards, page headings, panels, tables, record rows, status indicators, toolbars, navigation, and settings controls.
- Run existing available baseline checks before changing code. Capture failures; do not silently classify pre-existing failures as new ones.
- Record the actual state and incompatibilities in `.riot-ai/12-LOCAL-AI-REPORT.md`.

Do not assume that the repository still has the exact structure described in earlier conversation. Verify it.

## 3. Target product

Build **R!OT OS** as a premium admin and operations template with:

- A polished application shell and configurable navigation.
- Multiple dashboard and operational module examples.
- Vertical, horizontal, compact, and blank layout variants where appropriate.
- Reusable UI components and consistent data-display patterns.
- Light/dark/system themes, multiple R!OT visual presets, RTL support, density settings, and responsive behavior.
- Strong documentation and a live component/theme showcase.
- An original artwork library: PNG, SVG, CSS patterns, and p5.js sketches.
- A clean starter app that can be reused without importing demo-only data or screens.

Do not invent real backends or integrations. Use realistic seeded demo data with a clear demo-data boundary. Keep API contracts ready for future backend adapters.

## 4. Monorepo implementation

Follow `.riot-ai/04-MONOREPO-ARCHITECTURE.md`. Audit first, then implement a working workspace. Use the smallest package set that cleanly separates genuine reusable responsibilities. The target architecture is a blueprint, not permission to create empty packages.

Required architectural properties:

- `apps/demo` demonstrates the template and its application modules.
- `apps/starter` is a clean consumer starting point.
- `apps/docs` documents setup, layouts, theming, components, and customization. If a separate docs app is disproportionate, implement a clearly navigable docs area within the chosen app and document the trade-off.
- Shared packages have explicit exports and TypeScript contracts.
- Apps consume packages through package names, not relative cross-app imports.
- Feature-specific screens stay in feature modules until there is a proven cross-app reuse need.
- Design tokens have one source of truth and are exposed to CSS and TypeScript through a controlled API.
- Workspace build/typecheck/lint commands operate across the intended packages.

## 5. Visual identity: no generic template output

Follow `.riot-ai/03-DESIGN-DNA.md` exactly. The interface must visibly combine:

- CHAOS BRUTAL: oversized type, hard edges, visible outlines, off-grid composition, assertive hierarchy, offset ink shadows.
- GRUNGE: xerox grain, halftone, torn paper, print imperfections, tape, ink stamps, distressed texture.
- GEN Z FUNKY: absurd but smart microcopy, unexpected color clashes, stickers, playful motion, visual punch.
- INDUSTRIAL: control-deck structure, technical labels, serial numbers, grid systems, monospace metadata, high-precision information hierarchy.
- ARTWORK-FIRST: original characters, illustrations, posters, collages, generative textures, animated signals, and decorative vector systems.

Do not make the whole interface chaotic at the same intensity. Use the chaos-intensity system. Keep a clear visual hierarchy, readable data, and predictable controls.

## 6. Artwork production is mandatory

Follow `.riot-ai/06-ARTWORK-FACTORY.md`, `.riot-ai/07-ARTWORK-PROMPT-LIBRARY.md`, and `.riot-ai/11-ASSET-MANIFEST.json`.

Create original artwork in these formats:

- **SVG:** hand-authored or procedurally generated vector artwork, stickers, frames, badges, dividers, icons, mascots, and illustrations. SVG must be clean, responsive, reusable, and optimized.
- **PNG:** generated high-resolution hero artwork, comic/editorial spot illustrations, transparent stickers/characters, and texture plates. Use the available image-generation capability when present. Store the exact prompt and generation notes alongside each generated batch.
- **p5.js:** original procedural sketches for xerox turbulence, halftone fields, manga speed lines, signal interference, ink splatter, acid orbits, industrial waveforms, chaotic grids, and similar R!OT effects. Sketches must be seedable, responsive, exportable, and safe to load in a browser.

The target minimums are listed in the artwork factory and asset manifest. Do not satisfy a quota by duplicating one image, recoloring an icon set, or producing empty files. Each asset must have a distinct purpose and be used in the app or documented as part of the library.

If image generation is unavailable, do not claim PNGs were generated. Complete the SVG and p5.js deliverables that can be built locally, record the limitation, and leave exact PNG tasks open with production-ready prompts.

## 7. Shared component system

Follow `.riot-ai/05-COMPONENT-AND-UX-SYSTEM.md`.

Before creating a new component, search for an existing shared equivalent. Consolidate duplicated patterns into typed components with variants and slots. Migrate current screens to use those components. Do not create a central component that accepts dozens of unrelated booleans or hides all layout decisions.

Minimum shared patterns:

- PageHeader, PageBreadcrumb, PageContainer, PageSection, PageToolbar, PageActions.
- MetricCard, MetricGrid, MetricTrend, MetricComparison, StatOverview.
- Panel, PanelHeader, PanelBody, PanelFooter, PanelToolbar.
- DataTable, DataTableToolbar, DataTableEmpty, DataTablePagination, DataTableColumnVisibility.
- RecordRow, EntityAvatar, StatusBadge, PriorityBadge, ActivityFeed, Timeline.
- SearchCommand, FilterBar, Tabs, segmented controls, menus, tooltips, popovers.
- EmptyState, LoadingState, ErrorState, Skeleton, ConfirmDialog, Toast.
- AppShell, Sidebar, Topbar, MobileNavigation, BreadcrumbNavigation, ThemeSettingsPanel.

Use existing Base UI / component primitives where they are already sound. Do not replace working accessible primitives with a hand-built imitation for styling reasons.

## 8. Migrate the existing application

- Inventory every existing app module and classify its patterns.
- Build shared foundations first, then migrate modules in bounded groups.
- Preserve route paths and existing functionality unless a route is demonstrably broken or redundant; record any intentional route change.
- Replace duplicated page headers, metric structures, panels, data rows, badges, and navigation with the shared system.
- Ensure module-specific visual identity comes from theme tokens, data, composition, and typed variants—not duplicated CSS.
- Keep demo data in a dedicated layer. Do not mix mock data into reusable UI packages.
- Add realistic loading, empty, error, and success states.

## 9. Premium-template completeness

The finished demo should show, at minimum, the following categories, adapted to the existing product scope:

- Dashboards: analytics, operations, project/workspace overview, and at least one distinctive R!OT command center.
- Apps: projects/tasks, CRM or customer operations, chat/communications, calendar/scheduling, files/media, and a meaningful operational module from the existing codebase.
- Data: tables, detail views, filters, saved views, activity, charts, and export affordances where genuinely implemented.
- Pages: authentication examples, account/profile, settings, pricing/plan, onboarding, help/FAQ, 404, 500, maintenance, and blank states.
- Design system: typography, color, spacing, elevation, radii, themes, density, RTL, component variants, icons, artwork, and motion.

Prioritize real quality over fake breadth. If a page is included as an example, make the core interactions work and label demo data honestly.

## 10. Code quality and accessibility

- Strict TypeScript; no `any` escape hatch.
- Semantic HTML and correct labels.
- Keyboard-operable navigation, controls, dialogs, menus, and data tables.
- Visible focus indicators in every theme.
- WCAG-aware contrast, especially for muted text and small labels.
- `prefers-reduced-motion` support and a runtime motion preference.
- Responsive layouts from narrow mobile to large desktop.
- Avoid layout shift, giant client bundles, eager loading of all artwork, and unbounded animations.
- Lazy-load heavy artwork and p5.js sketches; supply static SVG/PNG fallback.
- Do not use CSS filters or image textures on every node if this harms performance.

## 11. Execution and task management

Use `.riot-ai/10-TODO.md` as the single project task ledger. Complete tasks in order by priority. You may parallelize independent work only after shared contracts are frozen and file ownership is clear. Do not allow multiple agents to edit the same foundation files simultaneously.

For each task:

1. State the intended change in one sentence.
2. Identify the files and dependencies involved.
3. Implement the smallest coherent slice.
4. Run relevant checks.
5. Review the diff for accidental scope expansion.
6. Update TODO with evidence and remaining caveats.

Do not mark tasks done merely because a subagent reports completion. Inspect the files and run checks yourself.

## 12. Completion report

At the end, update `.riot-ai/12-LOCAL-AI-REPORT.md` with:

- Repository baseline and actual architecture.
- Implemented monorepo structure and packages.
- Shared components added and duplicate patterns removed.
- Existing modules migrated.
- Artwork counts by PNG/SVG/p5.js, file locations, and manifest status.
- Theme presets, modes, density, RTL, and motion settings completed.
- Commands run and pass/fail output summaries.
- Known issues and tasks left open.
- Exact next actions.

A beautiful screenshot is not proof of a complete template. The source, architecture, accessibility, interactions, tests, and assets must all be real.

**Final directive:** make it loud, weird, sharp, funny, original, and premium. Make the codebase boringly reliable. Chaos on the canvas; discipline underneath.
