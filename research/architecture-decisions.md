# Architecture Decisions — A-L-L-A-H.COM (The Living Light)

This document records the canonical architectural and design decisions resulting from Phase 1 research and governs the implementation of `apps/a-l-l-a-h`.

---

## ADR-001: Raw WebGL2 GLSL + 2D Canvas Hybrid over Three.js / WebGPU
- **Context**: A-L-L-A-H.COM requires volumetric light shafts, horizon scattering, starfield depth, and interactive water reflection ripples without blowing up initial JavaScript size or failing on restricted headless/Safari environments.
- **Decision**: Implement `LivingLightShader` (`src/components/living-light-shader.tsx`) using raw WebGL2 (GLSL ES 3.00 / WebGL1 fallback) composited above the master celestial architectural vista (`public/art/celestial-gate-bg.jpg`), layered under the 2D `CelestialCanvas` starfield/ripple engine.
- **Consequences**:
  - Zero external 3D library payload (~150KB+ saved vs. Three.js/R3F).
  - Deterministic cleanup on unmount and automatic fallback to 2D Canvas + static vista when WebGL2 is unavailable or disabled.
  - Real-time GPU response to pointer coordinates, scroll progress, and Sanctuary Radiance mode.

---

## ADR-002: Zero-Dependency Motion System (Spring Math + CSS Variables + View Transitions API)
- **Context**: Interactive buttons, world cards, chapter transitions, and world switching must feel responsive and alive while respecting strict FPS budgets and `prefers-reduced-motion`.
- **Decision**: Implement reusable primitives in `src/components/motion-primitives.tsx`:
  - `MagneticPortal` (clamped spring-interpolated pointer pull).
  - `SpatialTiltCard` (3D perspective rotation + CSS `--sheen-x`/`--sheen-y` directional specular reflection without React re-renders).
  - `ScrollChapterReveal` (`IntersectionObserver` once-revealed transitions).
  - `triggerSacredViewTransition` (`document.startViewTransition` progressive wrapper).
- **Consequences**:
  - 60–120fps pointer interactions isolated to GPU compositor properties (`transform`, `opacity`).
  - Native View Transitions cross-dissolve when switching Worlds or Dock modes in supporting browsers, with zero-delay synchronous fallback elsewhere.

---

## ADR-003: Non-Blocking Three-Stage Cinematic Entrance with Session & Reduced-Motion Memory
- **Context**: First-time visitors should experience a reverent awakening ("First Ray -> Sacred Invocation -> Horizon Gate"), while returning visitors, keyboard users, and `prefers-reduced-motion` users must never be trapped behind a slow loader.
- **Decision**: Implement `CinematicEntrance` (`src/components/cinematic-entrance.tsx`) with:
  - Total autonomous duration of ~2.2 seconds.
  - Immediate, visible `SKIP ENTRANCE [ESC]` control (`min-h-[44px]`) plus `Escape` key handler.
  - Automatic instant bypass when `prefers-reduced-motion: reduce`, Quiet Mode, or `sessionStorage` witness flag is set, plus an explicit `REPLAY ENTRANCE` action in the footer/controls.
- **Consequences**:
  - Initial HTML underneath remains rendered and crawlable for immediate FCP/LCP while offering an unforgettable first-visit opening ritual.

---

## ADR-004: Cohesive Design Token Contract (`SACRED MINIMALISM × CINEMATIC IMMERSION × INFINITE LIGHT`)
- **Context**: Visual tokens (colors, typography, motion durations, sacred boundaries) were previously implicit in utility classes.
- **Decision**: Centralize typed tokens in `src/data/design-tokens.ts` synchronized with CSS custom properties in `src/app/globals.css`:
  - Cosmic Black (`#040509`), Midnight Blue (`#080a12`), Obsidian Sanctum (`#0b0e17`), Warm Ivory (`#f5efe2`), Sacred Gold (`#dfc07b`), Luminous Gold (`#fff4d2`), Soft White Light (`#fffdf7`), Subtle Silver (`#c8d0de`).
  - Machine-testable `SACRED_VISUAL_COVENANT` constants enforced by unit tests.
- **Consequences**:
  - Single source of truth shared between visual components, CSS utilities, documentation, and Vitest assertions.

---

## ADR-005: Responsive Omnidirectional Navigation (Desktop Horizon Bar + Mobile Sanctuary Navigation + Ctrl+K Search)
- **Context**: Previously, `<nav>` in the hero header used `hidden md:flex`, leaving mobile and narrow tablet viewports (`<768px`) without header section navigation tabs.
- **Decision**: Preserve the clean architectural desktop horizon header while introducing an accessible mobile quick-navigation bar/drawer (`>=44px` hit targets) plus scroll-spy active tab tracking across `THE GATE`, `THE WORLDS`, `THE DOCK`, and `ABOUT`.
- **Consequences**:
  - Every section, world, search modal, Sanctuary Radiance toggle, Quiet Mode toggle, and Skip/Replay Entrance control is accessible by touch, mouse, and keyboard across `390px`, `768px`, and `1440px+` viewports.

---

## ADR-006: Sacred Boundary & Zero-Slop Production Hygiene
- **Decision**:
  - Zero representations depicting Allah; zero human/animal faces; zero cartoon/anime visuals; zero fake third-party logos or generic SaaS dashboard widgets.
  - Real interactive experiences in every one of the Five Worlds (`Moonwitness` meridian archive reader, `Arsy` real Web Audio API harmonic carrier synthesizer, `Qalam` persistent folio inscription scriptorium, `Sidra` interactive polyhedral knowledge graph, `Rocksoul DX` live procedural Girih geometry engine).
