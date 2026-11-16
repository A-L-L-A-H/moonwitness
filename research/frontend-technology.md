# Frontend Technology Research — A-L-L-A-H.COM (The Living Light)

## 1. Objective & Selection Criteria

A-L-L-A-H.COM ("Empire of the Light") requires an architecture capable of rendering a monumental, serene, shader-augmented spatial gateway at immediate First Contentful Paint (FCP) while preserving semantic HTML, keyboard accessibility, progressive enhancement, and zero visual clutter.

Every candidate technology was evaluated against five criteria:

1. **Production stability and broad browser support** (Chromium, Safari/WebKit, Firefox across desktop and mobile).
2. **Progressive enhancement**: meaningful semantic rendering even when GPU shaders, Web Audio, or continuous motion are disabled.
3. **Runtime efficiency**: minimal main-thread JavaScript overhead, GPU-composited animations, zero unnecessary third-party runtimes.
4. **React 19 / Next.js 15 compatibility**: clean Server/Client Component boundaries without hydration mismatches.
5. **Alignment with Sacred Minimalism**: visual restraint, architectural precision, and strict avoidance of generic SaaS or cartoonish visual tropes.

---

## 2. Core Rendering & Application Stack

### 2.1 Next.js 15 App Router & React 19

- **Installed Stack Verified in Workspace**: `next ^15.5.6`, `react ^19.2.0`, `react-dom ^19.2.0`, `typescript ^5.9.3`.
- **Server vs. Client Component Boundary**:
  - `src/app/layout.tsx` and `src/app/page.tsx` remain **React Server Components (RSC)**, emitting immediate semantic document structure, metadata, `SkipLink`, and locally hosted `Cinzel` WOFF2 typography (`next/font/local`) with zero third-party font network latency.
  - Interactive visual subsystems (`EmpireOfLightExperience`, `LivingLightShader`, `CelestialCanvas`, `CinematicEntrance`, `WorldsSanctum`, `DockMatrixSection`, `UniversalSearchModal`) sit behind explicit `"use client"` boundaries so SSR outputs a complete HTML document before hydration begins.
- **React 19 Strict Hooks Discipline**:
  - Effects never invoke synchronous `setState` on mount (avoiding cascading double-renders and satisfying `eslint-plugin-react-hooks` v7).
  - Reduced-motion preference and browser capability checks use event listeners, `matchMedia`, or deferred animation callbacks rather than blocking hydration.

### 2.2 Styling & Layout: Tailwind CSS v4 + CSS Custom Properties

- **Installed Stack Verified**: `tailwindcss ^4.1.17` via `@tailwindcss/postcss`.
- **Modern CSS Capabilities**:
  - **CSS Custom Properties (`:root` design tokens)**: Drive color palette (`#040509` cosmic black, `#080a12` midnight blue, `#f5efe2` warm ivory, `#dfc07b` sacred gold), specular pointer sheen coordinates (`--sheen-x`, `--sheen-y`), scroll progress (`--scroll-progress`), and transition timings without React re-renders during pointer movement.
  - **CSS `clip-path` & `perspective()`**: Constructs monumental chamfered gold gates (`.btn-chamfer`) and GPU-composited 3D perspective card transforms (`transform: perspective(1000px) rotateX(...) rotateY(...) translate3d(...)`) on the compositor thread.
  - **Fluid Typography (`clamp()`) & CSS Container Queries (`@container`)**: Keeps sanctum panels, world chambers, and dock cards proportionally balanced from `360px` mobile screens to `1600px+` ultrawide displays without brittle breakpoint proliferation.
  - **Explicit Reduced Motion Media Queries**: `@media (prefers-reduced-motion: reduce)` neutralizes keyframe spins, transitions, and parallax shifts deterministically at the stylesheet level.

### 2.3 View Transitions API (`document.startViewTransition`)

- **Capability & Support**: Supported natively in Chromium-based browsers (Chrome 111+, Edge 111+) and Safari 18+; falls back gracefully when unavailable (e.g., Firefox or legacy browsers).
- **Use Case in A-L-L-A-H.COM**:
  - Wraps discrete macro-state transitions (switching between the Five Worlds in `WorldsSanctum` and filtering/focusing sanctum artifacts) via a progressive `triggerSacredViewTransition(updateFn)` helper.
  - Automatically bypasses `startViewTransition` when `prefers-reduced-motion: reduce` or Quiet Contemplative Mode is active, calling `updateFn()` synchronously for zero delay.

### 2.4 Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`)

- **Capability & Support**: Baseline Web standard across all modern desktop and mobile browsers, strictly gated behind explicit user gesture (`▶ ENGAGE CARRIER TONE` in `Arsy`).
- **Implementation Decision**: Pure procedural sine and fifth harmonic oscillators with exponential gain ramping (`exponentialRampToValueAtTime`) avoid downloading heavy ambient MP3/WAV loops while producing pure Pythagorean interval acoustics (`432 Hz`, `528 Hz`, `648 Hz`, `864 Hz`).

---

## 3. Progressive Enhancement Tiers

| Tier                           | Environment Profile                                   | Visual & Interaction Behavior                                                                                                                                                                                                                                |
| :----------------------------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 0 — Structural Base**   | SSR / JS disabled / low-capability                    | Full semantic HTML landmarks, local Cinzel typography, static high-res architectural vista (`celestial-gate-bg.jpg`), keyboard-navigable links and accordions/tabs.                                                                                          |
| **Tier 1 — Canvas & Motion**   | Standard JS, no WebGL2, or WebGL fallback             | Interactive 2D Canvas starfield and elliptical water ripples, CSS 3D perspective tilt, spring magnetic portals, IntersectionObserver chapter choreography, Web Audio harmonic carrier.                                                                       |
| **Tier 2 — Full Living Light** | WebGL2 hardware acceleration + no reduced motion      | Full-bleed custom GLSL volumetric ray shader (meridian god-rays, horizon atmospheric scattering, pointer/scroll-reactive water caustics) composited beneath orbital astrolabe geometry and starlight motes, plus View Transitions API scene cross-dissolves. |
| **Quiet / Reduced-Motion**     | `prefers-reduced-motion: reduce` or user Quiet toggle | Instant entrance bypass (`0ms`), static serene shader/vista frame, zero parallax drift, instant state switches with zero spinning geometry.                                                                                                                  |

---

## 4. Candidate Rejections & Rationale

- **Rejected heavy UI animation meta-frameworks where native primitives suffice**: Importing multiple external 40–150KB animation engines for magnetic buttons, tilt cards, and simple scroll choreography inflates Initial JS without improving visual fidelity over a focused ~2KB custom spring solver + WAAPI + View Transitions helper.
- **Rejected autoplay background audio or mandatory fullscreen preloaders**: Violates serenity, blocks FCP, and breaks accessibility; entrance sequence includes an immediate **Skip Entrance (`Esc`)** button and auto-skips on subsequent session visits or reduced motion.
