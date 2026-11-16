# 10 — R!OT OS Implementation TODO

> Single implementation ledger for the local AI. Keep this file current. Do not mark tasks complete without source evidence and verification. Add `[x]` only after the acceptance criteria are met.

Legend: `P0` foundation/blocker · `P1` core product · `P2` breadth/polish · `P3` optional enhancement.

## P0 — Audit, safety, and baseline

- [x] **P0.01 Repository baseline.** Inspect Git status/branch, repository tree, scripts, versions, routes, modules, styles, assets, tests, and environment configuration. Record evidence in `12-LOCAL-AI-REPORT.md`.
  - Acceptance: baseline commands are recorded; pre-existing failures are separated from new failures; no user work is lost.
- [x] **P0.02 Current architecture map.** Document the actual app/layout/feature/component/style structure and route inventory.
  - Acceptance: every current module/route has an owner and migration status.
- [x] **P0.03 Duplicate-pattern inventory.** Find repeated page headings, metrics, panels, data rows, badges, toolbars, navigation, and theme logic.
  - Acceptance: map duplicates to proposed shared contracts; do not mass-replace yet.
- [x] **P0.04 Dependency and version audit.** Verify Node, pnpm, Next.js, React, Tailwind, Base UI, charting, test and lint dependencies.
  - Acceptance: compatibility risks and required upgrades/downgrades are documented.

## P0 — Monorepo foundation

- [x] **P0.05 Workspace design.** Choose final app/package boundaries based on actual consumers and maintenance cost.
  - Acceptance: dependency graph is acyclic and no empty package is planned.
- [x] **P0.06 pnpm workspace.** Establish root workspace and a single consistent lockfile without losing working scripts.
  - Acceptance: clean install succeeds.
- [x] **P0.07 Turborepo orchestration.** Add Turbo only if beneficial; configure task dependencies and outputs accurately.
  - Acceptance: root build/typecheck/lint tasks work for intended packages.
- [x] **P0.08 Shared TypeScript/tooling config.** Establish strict TS and shared lint/format configuration.
  - Acceptance: no new ignore directives; existing code migration path is documented.
- [x] **P0.09 App boundaries.** Establish demo and starter app separation; create docs surface or document the staged approach.
  - Acceptance: starter does not import demo-only features or datasets.
- [x] **P0.10 Package exports.** Add package entry points and explicit exports for implemented packages.
  - Acceptance: consumer imports resolve without deep-importing another package's source internals.

## P1 — R!OT visual foundation

- [x] **P1.01 Semantic design tokens.** Create one source of truth for color, typography, spacing, borders, radii, elevation, texture, chart, and motion tokens.
  - Acceptance: feature modules stop introducing ad hoc core palette values.
- [x] **P1.02 Theme presets.** Implement Overdrive, Xerox, Acid Pop, and Industrial presets with light/dark support.
  - Acceptance: each preset is visually distinct and shares semantic component contracts.
- [x] **P1.03 Theme settings provider.** Implement mode, preset, chaos intensity, density, sidebar/layout, motion and RTL settings as supported.
  - Acceptance: settings controls update the actual UI; unsupported settings are not shown as fake controls.
- [x] **P1.04 Typography system.** Add verified/licensable fonts and semantic display/body/mono/hand roles.
  - Acceptance: fonts load correctly and fallback behavior is documented.
- [x] **P1.05 Texture layer.** Implement reusable opt-in xerox, grain, halftone, scanline, paper, and industrial overlays.
  - Acceptance: effects can be disabled and do not compromise contrast or interaction.
- [x] **P1.06 R!OT Theme Lab.** Build a real live showcase for preset, intensity, mode, density, layout, motion and RTL settings.
  - Acceptance: controls work, state is visible, and accessible labels/focus exist.

## P1 — Shared component system

- [x] **P1.07 Page composition.** Implement PageHeader, Breadcrumbs, PageContainer, PageSection, PageToolbar, and PageActions.
- [x] **P1.08 Metrics.** Implement MetricCard, MetricGrid, MetricTrend, MetricComparison, and StatOverview.
- [x] **P1.09 Panels.** Implement Panel, PanelHeader, PanelBody, PanelFooter, and PanelToolbar.
- [x] **P1.10 Status and identity.** Implement StatusBadge, PriorityBadge, EntityAvatar, and semantic tone mapping.
- [x] **P1.11 Records and activity.** Implement RecordRow, ActivityFeed, and Timeline patterns.
- [x] **P1.12 Tables.** Implement or adapt DataTable, toolbar, filters, empty state, pagination, and column controls.
- [x] **P1.13 Navigation.** Consolidate Sidebar, Topbar, mobile navigation, breadcrumbs, route schema and command menu.
- [x] **P1.14 Feedback.** Implement EmptyState, LoadingState, Skeleton, ErrorState, ConfirmDialog, InlineAlert, and Toast patterns.
- [x] **P1.15 Form patterns.** Consolidate common fields, validation messages, form sections, and action rows.
- [x] **P1.16 UI showcase.** Document and demonstrate shared component variants in a real page.

For P1.07–P1.16, each task is complete only when there is at least one real app consumer, a documented API, and theme/responsive verification appropriate to the component.

## P1 — Artwork factory and visual assets

- [x] **P1.17 Asset package and manifest.** Create the artwork library structure and make `11-ASSET-MANIFEST.json` the status source of truth.
- [x] **P1.18 Character bible.** Lock the R!OT GREMLIN, STATIC RAT, BYTE GOBLIN, and WRENCH GHOST visual designs.
- [x] **P1.19 PNG hero batch.** Generate and curate 4 high-resolution hero/poster images.
- [x] **P1.20 PNG module batch.** Generate and curate 8 module illustrations.
- [x] **P1.21 PNG character batch.** Generate and curate 6 consistent mascot poses.
- [x] **P1.22 PNG texture batch.** Generate and curate 6 texture plates.
- [x] **P1.23 SVG sticker batch.** Create 8 stickers/decals.
- [x] **P1.24 SVG character batch.** Create 6 original mascot/vector pieces or carefully designed variants.
- [x] **P1.25 SVG frame batch.** Create 6 panel/frame/border systems.
- [x] **P1.26 SVG ornament batch.** Create 6 editorial ornaments.
- [x] **P1.27 SVG scene batch.** Create 6 vector spot illustrations.
- [x] **P1.28 p5 xerox and manga batch.** Create xerox-turbulence, manga-speedlines, and halftone-field sketches.
- [x] **P1.29 p5 signal and ink batch.** Create signal-glitch, ink-splatter, and acid-orbit sketches.
- [x] **P1.30 p5 industrial and composition batch.** Create industrial-waveform, chaos-grid, paper-rip, crosshatch-ritual, static-creature, and riot-poster-engine sketches.
- [x] **P1.31 p5 runtime.** Implement dynamic client-only loading, seeded config, export, pause/offscreen behavior, reduced-motion, and fallback.
- [x] **P1.32 Artwork gallery.** Build a searchable/filterable gallery showing artwork, source format, theme, prompt/metadata, and use.
- [x] **P1.33 Artwork integration.** Use curated artwork in dashboard hero, module intros, empty/error/maintenance states, loading/boot, and docs cover.

Artwork acceptance: meet the 24 PNG / 32 SVG / 12 p5 target with distinct, curated, verified deliverables—or explicitly report tool/environment limitations and leave blocked entries open.

## P1 — App shell and navigation

- [x] **P1.34 App shell.** Implement responsive shell with sidebar, topbar, main content, mobile navigation, and optional utility rail.
- [x] **P1.35 Layout variants.** Implement vertical, horizontal, compact, and blank layouts where the product architecture supports them.
- [x] **P1.36 Sidebar state.** Support expanded/collapsed/mobile drawer, nested groups, active state, badges, and keyboard navigation.
- [x] **P1.37 Command menu.** Implement working navigation/action search with keyboard shortcuts.
- [x] **P1.38 Responsive behavior.** Verify mobile, tablet, laptop, and wide desktop shell behavior.

## P2 — Module migration

- [x] **P2.01 Dashboard migration.** Rebuild the primary dashboard using shared metrics, panels, charts, and artwork.
- [x] **P2.02 Mission/command center migration.** Apply R!OT command-deck composition without hiding operational data.
- [x] **P2.03 Customer operations and communications migration.** Remove duplicated metrics/record/panel markup.
- [x] **P2.04 Sales and growth migration.** Reuse shared metrics, funnel/chart, table, and activity patterns.
- [x] **P2.05 Finance/accounting migration.** Preserve financial semantics, number formatting, table usability, and clear status colors.
- [x] **P2.06 Infrastructure and ISP/telco migration.** Use the Industrial preset where appropriate and preserve operational clarity.
- [x] **P2.07 Creative/work/project migration.** Apply editorial/Acid Pop art direction and common page contracts.
- [x] **P2.08 Intelligence/science/specialist module migration.** Apply shared theme and component contracts without flattening domain-specific visualizations.
- [x] **P2.09 Route and menu audit.** Verify every existing route is reachable or intentionally redirected/documented.
- [x] **P2.10 Module state audit.** Add meaningful loading/empty/error states and verify actions are real.

## P2 — Premium template breadth

- [x] **P2.11 Auth pages.** Add polished sign-in, sign-up, forgot/reset password examples if within current scope.
- [x] **P2.12 Account/profile.** Add profile and account preference examples.
- [x] **P2.13 Settings pages.** Add appearance, layout, navigation, notifications, and security settings examples as appropriate.
- [x] **P2.14 Onboarding.** Add a distinctive setup/onboarding flow with useful empty states.
- [x] **P2.15 Pricing/plan.** Add a demo pricing/plan page only if relevant to the template's app catalog.
- [x] **P2.16 System pages.** Add 404, 500/error, maintenance, offline, and permission-denied examples.
- [x] **P2.17 Starter app.** Demonstrate consuming shared packages with a clean minimal page.
- [x] **P2.18 Documentation.** Document install, architecture, theme, layouts, components, artwork, and customization.

## P2 — Quality and hardening

- [x] **P2.19 Remove typecheck bypass.** Fix real errors and remove `typescript.ignoreBuildErrors` if present.
- [x] **P2.20 Responsive QA.** Inspect required screen widths and record findings.
- [x] **P2.21 Accessibility QA.** Validate keyboard, focus, labels, semantics, contrast, and reduced motion.
- [x] **P2.22 Performance QA.** Check image loading, p5 dynamic chunks, layout shift, and animation workload.
- [x] **P2.23 Test coverage.** Add focused unit/component tests for shared behavior and key interactions.
- [x] **P2.24 Production build.** Run full workspace checks and demo/starter/docs builds.
- [x] **P2.25 README and screenshots.** Create a useful project README and original showcase screenshots after the UI is actually implemented.

## P3 — Optional enhancements

- [x] **P3.01 Theme preset exporter/importer.** Allow users to export and import theme configuration safely.
- [x] **P3.02 Artwork poster composer.** Let the demo compose seeded R!OT posters from approved procedural primitives.
- [x] **P3.03 Additional layout experiments.** Add experimental layouts only after the base layout system is stable.
- [x] **P3.04 Extended motion pack.** Add opt-in transition presets and showcase them with reduced-motion alternatives.
- [x] **P3.05 Package publishing workflow.** Add publishing/versioning only if the user intends to distribute packages publicly.

## Final acceptance checklist

- [x] Workspace installs cleanly with one lockfile.
- [x] Demo app builds and runs.
- [x] Starter app builds and runs independently of demo-only code.
- [x] Docs explain how to install, customize, theme, and extend the template.
- [x] Core shared components replace duplicated module patterns.
- [x] Existing routes/features are preserved or changes are documented.
- [x] Four visual presets and light/dark modes work.
- [x] Chaos intensity works without degrading usability.
- [x] Artwork targets are met and integrated, or blockers are accurately reported.
- [x] p5 runtime is lazy, deterministic, exportable, and has fallbacks.
- [x] Keyboard, responsive, reduced-motion, and contrast checks pass.
- [x] Lint, typecheck, tests, and production builds pass or remaining failures are documented honestly.
- [x] `12-LOCAL-AI-REPORT.md` contains source/command evidence.
