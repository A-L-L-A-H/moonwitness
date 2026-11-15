# A-L-L-A-H.COM — THE LIVING LIGHT: System Architecture, Design System, Performance & QA Report

## 1. Complete Design System (`SACRED MINIMALISM × CINEMATIC IMMERSION × INFINITE LIGHT`)

Defined in `apps/a-l-l-a-h/src/data/design-tokens.ts` and synchronized via CSS custom properties in `apps/a-l-l-a-h/src/app/globals.css`:

### 1.1 Color Palette (`LIVING_LIGHT_PALETTE`)
| Token | Hex / Value | Role |
| :--- | :--- | :--- |
| `cosmicBlack` (`--celestial-void`) | `#040509` | Primary cosmic depth backdrop & obsidian basin |
| `midnightBlue` (`--celestial-midnight`) | `#080a12` | Sanctuary panels & atmospheric dome gradients |
| `obsidianSanctum` (`--celestial-sanctum`) | `#0b0e17` | Interactive sanctum card surfaces & controls |
| `warmIvory` (`--celestial-ivory`) | `#f5efe2` | Primary body & editorial reading text (WCAG AAA on dark) |
| `sacredGold` (`--celestial-gold`) | `#dfc07b` | Hairline sacred geometry borders, seals & accents |
| `luminousGold` (`--celestial-gold-bright`) | `#fff4d2` | Active beacon states, focus rings & zenith meridian glow |
| `softWhiteLight` (`--celestial-soft-white`) | `#fffdf7` | Peak champagne monumental highlights |
| `subtleSilver` (`--celestial-silver`) | `#c8d0de` | Secondary sidereal mist & horizon highlights |

### 1.2 Fluid Typography (`LIVING_LIGHT_TYPOGRAPHY`)
- **Display & Sacred Monument**: Locally bundled `Cinzel` WOFF2 (`400`, `600`, `700`) via `next/font/local` (`--font-cinzel`)—zero external font network blocking.
- **Scale Tokens**:
  - `monument`: `clamp(2.25rem, 6.2vw, 5.4rem)`
  - `chapterHeading`: `clamp(1.75rem, 3.8vw, 3.1rem)`
  - `sanctumTitle`: `clamp(1.35rem, 2.2vw, 1.95rem)`
  - `editorialLead`: `clamp(0.95rem, 1.35vw, 1.18rem)`
  - `sacredKicker`: `clamp(0.65rem, 0.9vw, 0.78rem)`

### 1.3 Sacred Visual Boundaries (`SACRED_VISUAL_COVENANT`)
- Zero depictions of Allah; zero human or animal faces; zero cartoons or anime.
- Zero generic SaaS dashboard widgets or noisy decorative Arabic text backgrounds.
- Visual language restricted strictly to symmetrical monumental archways, cosmic light rays, spherical celestial geometry, girih tessellations, and obsidian mirror planes.

---

## 2. Motion & Interaction Architecture

### 2.1 Layered Background & Real-Time Lighting (`src/components/living-light-shader.tsx`, `src/components/celestial-canvas.tsx`)
1. **Layer 0 — Celestial Architectural Vista**: Full-bleed `celestial-gate-bg.jpg` with GPU-composited scroll parallax (`translate3d` & scale) and contrast vignettes.
2. **Layer 1 — WebGL2 GLSL Volumetric Light Shader (`LivingLightShader`)**:
   - Compiles custom analytical GLSL vertex/fragment shaders onto `webgl2` (falling back cleanly to `webgl` or 2D Canvas).
   - Renders volumetric zenith meridian light beams, atmospheric horizon scattering, pointer presence glow, and obsidian water caustics responsive to pointer position, scroll depth (`u_scroll`), and Sanctuary Radiance mode (`u_radiance`).
   - Caps DPR at `1.75`, pauses when `#the-gate` is scrolled offscreen (`IntersectionObserver`) or when `document.hidden` is true, and releases all shaders/programs/buffers on unmount.
3. **Layer 2 — 2D Canvas Starfield & Ripples (`CelestialCanvas`)**: Renders orbital meridian dashed rings, twinkling golden/ivory sidereal dust motes, and interactive expanding elliptical water ripples on click.

### 2.2 Three-Stage Cinematic Entrance (`src/components/cinematic-entrance.tsx`)
- **Stage 1 (`0–650ms`)**: Vertical meridian light filament & rotating sacred `PortalAstrolabeIcon`.
- **Stage 2 (`650–1550ms`)**: Staged emergence of `IN THE NAME OF ALLAH`, `A-L-L-A-H.COM`, and `EMPIRE OF THE LIGHT`.
- **Stage 3 (`1550–2250ms`)**: Serene scale-and-opacity dissolve into the live Gate viewport.
- **Skip & Replay Controls**: Accessible `SKIP ENTRANCE [ESC]` button (`>=44px`), `Escape`/`Enter`/`Space` dismissal, automatic instant bypass on `prefers-reduced-motion: reduce`, Quiet Mode, or subsequent same-session loads (`sessionStorage`), plus manual `REPLAY ENTRANCE` trigger in the Sanctuary menu & footer.

### 2.3 Motion Primitives (`src/components/motion-primitives.tsx`)
- `MagneticPortal`: Clamped spring-damped pointer pull (`max ±7px`) for Gate controls; automatically disabled on touch screens (`pointer: coarse`) and reduced motion.
- `SpatialTiltCard`: 3D perspective tilt (`rotateX`/`rotateY` clamped to ±4°) plus CSS custom property specular light sheen (`--sheen-x`, `--sheen-y`) updated on `rAF` without triggering React state re-renders.
- `ScrollChapterReveal`: `IntersectionObserver` reveal (`once`) with instant visible fallback if already above fold or in reduced-motion mode.
- `triggerSacredViewTransition`: Progressive wrapper around `document.startViewTransition` for world switching, dock category filters, and Qalam folio inscriptions.

---

## 3. Performance & Accessibility Report

- **Production Bundle Size (`next build`, Next.js 15.5.29)**:
  - Route `/` size: `30.2 kB`
  - Shared First Load JS: `103 kB`
  - Total First Load JS (`/`): `133 kB` (static prerendered)
- **Dependency Hygiene**: Zero external 3D or heavyweight animation library bloat (raw WebGL2 GLSL + 2D Canvas + CSS/WAAPI + custom `rAF` physics).
- **Accessibility & Input Parity**:
  - Keyboard `Skip to main content` landmark link (`#main`).
  - Sacred gold `:focus-visible` outlines across all links, buttons, tabs, and inputs.
  - `Ctrl+K` / `Cmd+K` Command Palette (`UniversalSearchModal`) with `Escape` dismissal.
  - Keyboard `ArrowLeft`/`ArrowRight` navigation across the 5 world `role="tablist"` tabs.
  - `>=44px` minimum hit target enforcement verified in Playwright on mobile navigation drawer (`44px`) and Skip Entrance button (`>=44px`).
  - Responsive navigation drawer (`#mobile-sanctuary-nav`) on `<768px` viewports and balanced single-line navigation at `768px` tablet and `1440px` desktop.
  - Full `prefers-reduced-motion: reduce` support across CSS media queries, JS shader freeze, static entrance bypass, and instant scroll navigation, plus an explicit user toggle (`QUIET CONTEMPLATIVE MODE`).

---

## 4. QA Testing Report (Observed Results After Final Edit)

### 4.1 Static & Automated Unit Checks
- `pnpm --filter @moonwitness/a-l-l-a-h test` (`Vitest v5.1.0`): **8/8 tests passed** (`src/data/empire-registry.test.ts`, verifying navigation tabs, 5 worlds, Dock telemetry integrity, Sidra graph symmetry, Covenant pillars, palette tokens, motion presets, and sacred visual covenant constraints).
- `pnpm --filter @moonwitness/a-l-l-a-h typecheck` (`tsc --noEmit`): **0 errors**.
- `pnpm --filter @moonwitness/a-l-l-a-h lint` (`eslint .`): **0 errors, 0 warnings**.
- `pnpm --filter @moonwitness/a-l-l-a-h build` (`next build`): **Compiled & built cleanly (`EXIT 0`)**.

### 4.2 End-to-End Playwright Browser Verification (`http://localhost:3003`)
- **HTTP Response**: `200 OK`
- **Desktop (`1440x900`)**:
  - `entranceVisible`: `true`, `skipBtnVisible`: `true`, `skipMinHeightOk`: `true`
  - `gateHeadingVisible`: `true`, `desktopOverflow`: `false`
  - `hasWebGLOrCanvasBadge`: `true` (`LIVING LIGHT · WEBGL2 GLSL` active in Chromium SwiftShader/ANGLE)
  - `radiancePressedAfterClick`: `"true"`
  - `sidraSelected`: `"true"`, `rocksoulCanvasVisible`: `true`
  - `dockLuminousFilterCount`: `2`
  - `searchOpenViaCtrlK`: `true`
- **Tablet (`768x1024`)**: `tabletOverflow`: `false`, single-line balanced top header verified via screenshot.
- **Mobile (`390x844`, touch)**: `mobileOverflow`: `false`, `mobileMenuBtnHeight`: `44`, `mobileDrawerVisible`: `true`.
- **Reduced Motion (`prefers-reduced-motion: reduce`)**: `entranceBypassed`: `true`, `quietBadgePresent`: `true` (`QUIET CONTEMPLATIVE MODE`).
- **WebGL Unavailable Fallback**: `canvas2dFallbackActive`: `true` (`LIVING LIGHT · CANVAS 2D` active when WebGL/WebGL2 context returns `null`).
- **Console & Runtime Errors**: `consoleErrors: []`, `pageErrors: []`.
