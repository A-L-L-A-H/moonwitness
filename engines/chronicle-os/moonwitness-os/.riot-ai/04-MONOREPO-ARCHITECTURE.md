# 04 — Monorepo Architecture Blueprint

## Architecture objective

Create a real, maintainable monorepo that supports a premium demo, a clean starter, documentation, and reusable packages. Use **pnpm workspaces** and **Turborepo** when the inspected repository and toolchain support them. Preserve the current Next.js/React/TypeScript/Tailwind stack if it is healthy; verify exact versions before changing anything.

## Target tree

```text
repository/
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── apps/
│   ├── demo/                    # Full R!OT showcase and module demos
│   ├── starter/                 # Clean consumer app, no demo-only coupling
│   └── docs/                    # Documentation site (or equivalent documented docs surface)
├── packages/
│   ├── core/                    # Runtime-independent contracts and shared app primitives
│   ├── ui/                      # Accessible base and composed UI components
│   ├── theme/                   # Tokens, presets, theme provider, density, RTL settings
│   ├── layouts/                 # App shells and reusable page compositions
│   ├── navigation/              # Typed nav model, sidebar, topbar, breadcrumbs, command menu
│   ├── charts/                  # Chart wrappers, theme adapters, chart tokens
│   ├── forms/                   # Form fields, validation adapters and form patterns
│   ├── graphics/                # Artwork components, SVG helpers, visual effects, p5 runtime
│   ├── artwork/                 # Original source assets, prompts, metadata, manifests
│   ├── motion/                  # Motion primitives and interaction presets
│   ├── hooks/                   # Cross-app reusable hooks
│   ├── utils/                   # Cross-app pure utilities
│   ├── types/                   # Shared stable contracts only when genuinely shared
│   └── config/                  # Shared lint, TypeScript, and formatting configuration
├── docs/                        # Architecture notes, recipes, migration notes if needed
├── scripts/                     # Asset validation, workspace checks, generation/export helpers
└── .riot-ai/                    # This execution kit and AI progress report
```

This is a target map, not a mandate to create all 15 packages before consumers exist. Merge or omit a package if its responsibility is too small or duplicates an existing package. Never create an empty package just to match the tree.

## Responsibility and dependency boundaries

| Package | Owns | Must not own |
|---|---|---|
| `core` | Stable runtime contracts, app-level primitives, typed IDs/result patterns where useful | Screens, demo data, CSS theme values |
| `ui` | Accessible generic primitives and composed UI patterns | Product-specific business rules, module data |
| `theme` | Semantic tokens, presets, ThemeProvider, appearance settings | Page-specific styles |
| `layouts` | App shells, page frames, responsive layout compositions | Feature business logic |
| `navigation` | Navigation schema, sidebar, topbar, breadcrumbs, command navigation | Feature data fetching |
| `charts` | Chart adapters, shared chart components, chart formatting and tokens | Hard-coded module datasets |
| `forms` | Form controls, validation wiring/adapters, reusable form layouts | Backend-specific API logic |
| `graphics` | SVG/PNG/p5 presentation components, textures and visual effects | Raw business UI primitives |
| `artwork` | Original assets, source prompts, metadata, license/provenance notes | React runtime components |
| `motion` | Reusable motion presets, transitions and reduced-motion helpers | Product page orchestration |
| `hooks` | Cross-feature hooks with actual multiple consumers | Feature-specific data hooks unless justified |
| `utils` | Pure helpers with multiple consumers | React components and global mutable state |
| `types` | Stable cross-package contracts | Duplicate types that already belong to an owning package |
| `config` | Shared tooling configs | Runtime application code |

## Dependency direction

Keep a directed acyclic graph. A typical safe direction is:

```text
utils / types / config
        ↓
core / theme / artwork
        ↓
ui / forms / charts / graphics / motion
        ↓
navigation / layouts
        ↓
apps (demo, starter, docs)
```

The exact graph may vary after audit. Rules:

- Packages must not import source files from apps.
- `apps/demo` must not be a dependency of `apps/starter` or packages.
- Feature modules remain inside their consuming app unless two or more consumers truly need them.
- No circular dependency. Validate with an existing or small script/tool if useful.
- Import through documented package exports; avoid deep imports into another package's `src` internals.
- Use explicit package `exports` and build configuration compatible with Next.js and workspace tooling.

## Feature structure inside an app

```text
apps/demo/src/
├── app/                         # Routes and route-level composition
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── data/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── isp-telco/
│   ├── customer-ops/
│   ├── accounting-finance/
│   ├── sales-growth/
│   └── ...
├── providers/                   # App composition of package providers
└── config/                      # Demo app config, not shared package config
```

Follow the actual product modules discovered in the repository. Do not rename or remove feature routes merely to match this example.

## Workspace conventions

- Root scripts should orchestrate workspace tasks and remain understandable.
- Use pnpm's workspace protocol for internal package dependencies.
- Keep a single lockfile at the workspace root.
- Pin or consistently manage Node and pnpm versions using existing repository conventions (`engines`, `packageManager`, `.node-version`, etc.).
- Use Turbo only for real task orchestration and caching; declare task dependencies and outputs accurately.
- Avoid publishing every package unless public publishing is an explicit product requirement. Internal packages may remain private.
- Use package-level `tsconfig` extending shared configuration; avoid mutually incompatible compiler options.
- Ensure Next.js can transpile local workspace packages where required.

## Build and package design

- Prefer source-first packages only when the Next.js build can transpile them reliably; otherwise use a consistent package build output strategy.
- A package must have a clear entry point and exports map.
- Mark React and other app-level frameworks as peer dependencies for component packages where appropriate.
- Keep browser-only code behind client boundaries. Do not make theme tokens or pure utilities depend on `window`.
- Do not pull p5.js into the initial bundle. Load it dynamically from the graphics package only when a sketch is mounted.
- Avoid exporting unstable internals. Each package should expose a small, deliberate public API.

## App roles

### `apps/demo`

The full showcase with the visual theme lab, layout variants, component gallery, dashboards, sample modules, artwork gallery, and premium page catalog. Demo data is local and explicitly labelled.

### `apps/starter`

A lean starter that consumes published/internal package APIs. It must not import demo modules, demo datasets, or demo-only routes. Include one example page and documented removal/extension path.

### `apps/docs`

Documents install, customization, architecture, themes, layouts, components, artwork, accessible patterns, and migration recipes. Search/navigation should be useful. If a separate docs app is too expensive initially, document a clean in-app docs route and capture the trade-off rather than leaving docs absent.

## Configuration centralization

Keep these in one authoritative location:

- Theme tokens and semantic color mappings.
- Theme presets and light/dark variants.
- Navigation schema and route metadata.
- Table defaults and common formatters where broadly shared.
- Motion preferences and intensity mapping.
- Feature registry only if the app genuinely needs dynamic module registration.

Do not create a mega-config file that owns every behavior. Centralize by domain with clear exports.

## Migration rule

Do not move the whole codebase in one uncontrolled operation. First establish the root workspace and build path, then extract stable shared foundations, then migrate page patterns and modules incrementally. Keep an old-to-new mapping in the local AI report.
