# 07 — UI / UX

Portable frontend architecture:

```text
design tokens
  ↓
headless behavior / accessible primitives
  ↓
React UI primitives
  ↓
domain UI kits
  ↓
applications
```

Canonical reusable UI platform:

- `moonwitness-frontend-platform`

Application surfaces:

- `moonwitness-wheremythfadetolegend` — **ACTIVE**, primary public Web
- `moonwitness-commandcenter` — **HOLD**, operations/research boundary shell implemented
- `moonwitness-crayon-lab` — **FOUNDATION / TARGET UX**, methodology/research application
- `moonwitness-web` — **PAUSED**, legacy public Web

## Experience constitution

Canonical scene, epistemic, motion, response, sonic, depth, state, performance and accessibility behavior is defined in:

- `EXPERIENCE-CONSTITUTION-V1.md`

Core experience rules include:

> **Cinematic behavior must communicate system state, not decorate it.**

> **MoonWitness should never animate what it does not know.**

The constitution formalizes UX/experience governance only. It does not create application routes, capability ownership, API resources, repository boundaries, or navigation.

## Information-architecture rule

> **Capabilities power screens. Applications own navigation.**

Repository names and capability names are not automatically top-level menu items. Runtime, Worker, Cosmic, Corpus, Crayon, Prophetic, API, SDK, and Core remain capability/platform boundaries unless an authorized application intentionally exposes a supported view.

Current application navigation, maturity labels, contextual drill-down rules, historical/live semantics, and Figma/showcase status labels are defined in:

- `APPLICATION-INFORMATION-ARCHITECTURE-V1.md`

Canonical end-to-end task, object drill-down, evidence traversal, return/back, state-preservation, responsive and accessibility flows are defined in:

- `USER-FLOW-AND-INTERACTION-MODEL-V1.md`

The page-level execution matrix for Figma and generated showcase work is:

- `FIGMA-SHOWCASE-SCREEN-MATRIX-V1.md`

The screen matrix classifies every planned visual surface as `EXISTING`, `ALIGNED TARGET`, `GATED FUTURE`, or `COMPONENT ONLY`, records current curated-image coverage, and defines the one-screen-per-image generation queue. Generated images do not create application scope.

## Component-first + UX-flow gates

MoonWitness page design is **component-first and flow-first**, not page-first.

Canonical component workflow:

- `FIGMA-COMPONENT-FIRST-WORKFLOW-V1.md`

Canonical interaction workflow:

- `USER-FLOW-AND-INTERACTION-MODEL-V1.md`

Required design order:

```text
EXPERIENCE / VISUAL CONSTITUTION
  ↓
VARIABLES / TOKENS
  ↓
RAW PRIMITIVES
  ↓
COMPONENTS + VARIANTS
  ↓
DOMAIN INSTRUMENTS
  ↓
PAGE TEMPLATES
  ↓
USER FLOW / INTERACTION MODEL
  ↓
SCENE COMPOSITION
  ↓
APPLICATION PAGES
  ↓
RESPONSIVE STATES
  ↓
GENERATED SHOWCASE IMAGES
```

A Home, Command Center, map, ledger, report, or any other golden page must not be designed as an independent one-off visual system. It must be composed from approved raw/component/template layers **and** an approved task/object interaction flow.

If the required component system for a screen family is incomplete, the design status is:

`BLOCKED_BY_COMPONENT_SYSTEM`

If the screen's entry, primary task, drill-down, return path, state behavior, evidence traversal, responsive behavior, or keyboard/focus model is not defined, the design status is:

`BLOCKED_BY_UX_FLOW`

A golden page may proceed only when both gates are cleared.

Generated images come last. If an image invents new geometry, navigation, spacing, typography, metrics, interaction states, routes, drill-down relationships, or visual language that conflicts with the component or UX-flow master, the image is rejected; the masters do not move to match an inconsistent generation.

## Public Web default / “Home” behavior

There is no separate canonical `Home` route in the active public Web today. The default public entry is the Monthly Report / Observatory landing experience, currently resolving to the report route and default August 2026 dataset when no valid route is supplied.

Designs may describe that first-view experience as **Observatory Home Experience**, but must not add a ninth `Home` top-level navigation item unless a future product decision explicitly creates that route.

A global MoonWitness app switcher or unified launcher is not currently a canonical requirement.

## Ownership

The frontend platform owns reusable tokens, accessible primitives, reusable patterns, and application-independent domain UI kits. Applications own routes, page composition, product data integration, and product-specific presentation. New primitives prefer Base UI where appropriate; stable legacy Radix components may remain during migration.

`moonwitness-design-system` is a public showcase/compatibility bridge and experimental visual reference. It does not supersede `moonwitness-frontend-platform` as canonical reusable UI owner.

Figma is the design specification/master workspace for visual geometry, variables, variants, responsive composition, and design review. Storybook is the executable visual workbench when Figma access is constrained. Reusable production implementation remains canonical in `moonwitness-frontend-platform`.

## Primary public Web data paths

The primary public Web may combine two explicit data paths:

```text
historical/frozen data
  ↓
versioned GitHub data
  ↓
static data adapter

live operational data
  ↓
moonwitness-sdk / MoonClient
  ↓
moonwitness-api
```

Historical/frozen and live operational states must remain visibly distinguishable in product UI.

UI applications must never access private databases directly. Direct PostgreSQL access from browser/application UI is forbidden.
