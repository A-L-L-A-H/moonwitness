---
title: "MoonFrame Skin Engine Contract"
version: "1.2.0"
status: "approved"
last_verified: "2026-11-17"
owner: "architecture"
---

# MOONFRAME SKIN ENGINE — SHARED CONTRACT

## 1. Objective

Provide one reliable functional foundation that can express seven independent visual worlds without multiplying business logic, breaking application behavior, or reducing accessibility.

A skin is a complete design language, not a theme-color switch.

## 2. Separation of concerns

### Shared platform layer (`packages/ui` + `packages/assets`)

`packages/ui` (`@moonwitness/ui`) is the single implementation owner for reusable UI foundations:

- semantic design tokens and brand theme contracts;
- DNA / skin definitions (`MASTER_DNA_WORLDS`, `SkinRoot`, `SkinScope`, scoped skin stylesheets);
- layout, typography, spacing, motion, and responsive primitives;
- reusable presentation components (`IllustratedHero`, `WorldExplorer`, `WorldTile`, `WorldAtlas`, `SiteNavigation`, `PrimaryAction`, `SecondaryAction`, `SectionHeading`, `StorySection`, `EditorialFeature`, `IllustrationFrame`, `ResponsiveImage`, `MotionReveal`, `DnaButton`, `DnaChamber`, `DnaPortalArch`, `DnaBadge`);
- keyboard interaction, focus management, accessible names/roles/states, and WCAG contrast enforcement (`pnpm ui:contrast`);
- `packages/assets` owns illustration assets, image manifests, icons/artwork, and fonts.

### Master DNA layer

Owns presentation and experiential composition via `[data-dna]` scoping:

- color, typography, spacing, scale, density, radii, borders, elevation;
- layout grammar and navigation metaphor;
- component recipes and visual variants;
- surfaces, textures, icons, illustration and image direction;
- motion, transitions, sound policy, and reduced-motion fallback;
- responsive composition for each DNA world without leaking styles across applications (`apps/web` routes vs `apps/rocksoul` local workbench; pre-consolidation `apps/a-l-l-a-h` is unified inside `apps/web`).

### Product layer (`packages/canon` + `apps/*`)

`packages/canon` owns canonical domain meaning and shared types (`WorldIdentifier` across the ecosystem). Active Zone A/B/C applications (`apps/web`, `apps/rocksoul`, `apps/api`) own product-specific information architecture, domain registries, application state, routes, localization, and auth—never duplicating reusable UI tokens or primitives locally.

## 3. Current repository compatibility

The shared UI package is `packages/ui/` (`../../packages/ui/README.md`), published internally as `@moonwitness/ui` (React 19 / Next.js 16 / Tailwind CSS v4). Per [D-012](../../engines/empire-origin/allah-com/DECISIONS.md), the long-term directional goal is native-first HTML primitives (`<select>`, `<dialog>`, `<table>`, `<form>`), **however the current verified implementation (`packages/ui/package.json`) ships with `20` `@radix-ui/react-*` primitive packages** wrapped cleanly alongside Tailwind CSS v4 tokens. Treat `@radix-ui/react-*` as an existing repository baseline rather than an undocumented exception, and do not introduce an additional competing UI primitive framework without architectural review.

Implementation rules:

- inspect the current package source (`packages/ui/package.json`, `packages/ui/src/`) and app integrations before coding;
- extend existing exports rather than creating a parallel component library;
- retain existing primitive and package contracts unless a separately reviewed architecture decision migrates or replaces them;
- do not add another competing component framework, a second token engine, or an unapproved heavy runtime dependency without evidence, progressive fallback, bundle review, and an explicit architecture decision;
- do not copy app-local components into a second shared library.

## 4. Skin selection and runtime contract

The implementation may use a typed skin registry and a root skin identifier (for example, a data attribute), but the exact API must be confirmed against existing app composition before coding.

Minimum runtime requirements:

- one explicit, validated skin identifier;
- deterministic fallback to a safe default when the identifier is missing or invalid;
- no untrusted CSS or arbitrary class injection from user input;
- no cross-skin state leakage;
- stable semantic component props;
- no hydration mismatch caused by client-only skin detection;
- preference persistence only after the application has an agreed settings and consent model;
- SSR and initial render must agree on the selected skin.

Do not hard-code seven unrelated copies of the same page. Do not force all seven worlds into one shared layout either. Share primitives; specialize compositions.

## 5. Token domains

Every DNA must declare values or rules for:

- color roles: canvas, surface, elevated surface, text, muted text, border, accent, status, focus;
- typography: display, heading, body, label, numeric, code, line-height, tracking, measure;
- spacing and density: compact, comfortable, spacious, section rhythm;
- geometry: corner treatment, line weight, clipping, shape vocabulary;
- depth and material: flat, paper, metal, glass, film, membrane, or architectural mass;
- motion: entrance, exit, feedback, ambient movement, duration, easing, reduced motion;
- responsive behavior: wide, medium, narrow, touch, and low-capability modes;
- component recipes: actions, navigation, surfaces, forms, data, overlays, feedback.

Avoid encoding all roles into a single color variable. Semantic roles must remain consistent within each skin.

## 6. Modern interaction, motion, 3D, and sound contract

- Follow the three-beat interaction grammar (`Establish -> Focus -> Resolve`) so entrances, camera-like framing, spatial destination transitions, scroll choreography, and responsive lighting cues serve orientation and progression rather than spectacle.
- Prefer compositor-friendly CSS properties (`transform`, `opacity`, restrained `clip-path`) and View Transitions API progressive enhancement (falling back to instant semantic DOM transitions when unsupported or reduced).
- Respect `prefers-reduced-motion: reduce` and `VisualEffectsProvider` pause controls at all times; reduced-motion preference always overrides ambient visual effects.
- Sound synthesis uses Web Audio API (`packages/ui/src/sfx/audio.ts`), stays muted by default, requires explicit user activation, and never carries information missing from DOM visuals or text.
- Advanced 3D experiences (Three.js, WebGL2, WebGPU) are opt-in progressive enhancements gated behind capability checks and static poster/SVG/DOM fallbacks.

## 7. Progressive enhancement technology tiers

1. **Core interface rendering (`implemented`):** React 19, Next.js 16 Server Components, semantic DOM, Tailwind CSS v4 mapped to `--mw-*` tokens, native-first primitives.
2. **Motion & interaction (`partial` / `proposed`):** Modern CSS animations/scroll-driven rules, View Transitions API, Motion for React (`motion`), and bounded GSAP + ScrollTrigger (evaluated strictly for multi-stage narrative gateways where CSS/Motion cannot express scroll pinning/scrubbing cleanly).
3. **Advanced 3D experiences (`proposed`):** Three.js / WebGL2 / WebGPU behind `navigator.gpu` / context capability detection and device budgets.
4. **Audio & sound effects (`implemented` foundation / `in_progress`):** Procedural Web Audio API profiles per world.
5. **Asset production (`implemented` foundation / `in_progress`):** Inline SVG/procedural geometry plus art-directed `AVIF`/`WebP` and `AV1`/`WebM` synced via `packages/assets/`.
6. **Performance & accessibility (`implemented` gates / `in_progress`):** `LCP <= 2.5s`, `INP <= 200ms`, `CLS <= 0.1`, WCAG 2.2 AA contrast, keyboard navigation, and zero fake telemetry.

## 8. Accessibility and resilience

Each skin must preserve semantic HTML, keyboard access, visible focus, sufficient contrast, screen-reader labels, reduced motion, zoom/reflow, and touch target requirements. Visual experimentation cannot turn essential controls into image-only or pointer-only interactions.

Critical content must remain available when WebGL, WebGPU, canvas, animation, audio, or remote assets fail. Use progressive enhancement.

## 9. Explicit exclusions

- No generic dashboard grid copied across all seven skins.
- No universal glassmorphism, neon, gradient, blur, round-card, or glow treatment.
- No decorative HUD around ordinary forms without a task reason.
- No intentional illegibility for primary labels, data, or controls.
- No fake progress, fake telemetry, fabricated astronomical values, or simulated operational status presented as real.
- No divine depiction, anthropomorphic divine imagery, claim that a design depicts ALLAH, or use of sacred names / Qur'anic text as decorative textures.
- No unauthorized copying of recognizable game, manga, music, or brand assets.

## 10. Change control

Any change to a Master DNA requires:

1. a documented reason and affected world;
2. a before/after visual comparison;
3. review against the relevant world-specific exclusions;
4. accessibility and responsive checks;
5. an update to the owning DNA document;
6. evidence in the implementation report.

Shared behavior changes require review of all seven skins. A product may not silently redefine a Master DNA locally.
