# Motion Engineering Research — A-L-L-A-H.COM (The Living Light)

## 1. Philosophy: Purposeful, Sacred Choreography
In **A-L-L-A-H.COM**, motion exists to convey awe, stillness, depth, and orientation—never frenetic distraction. Every movement answers one of four architectural needs:
1. **Emergence**: Revealing the sanctuary gradually from cosmic stillness (`CinematicEntrance`).
2. **Spatial Depth**: Signaling layered distance between celestial heavens, the monumental gate, and the reflective obsidian water mirror (`ScrollChapterReveal`, subtle vista parallax).
3. **Tactile Reverence**: Giving controls subtle physical weight and light response (`MagneticPortal`, `SpatialTiltCard`).
4. **Continuity**: Preserving cognitive orientation when transitioning between the Five Worlds (`View Transitions API`).

---

## 2. Technology Evaluation & Comparison

| Candidate | Strengths | Liabilities for This Project | Verdict |
| :--- | :--- | :--- | :--- |
| **GSAP + ScrollTrigger** | Mature timeline sequencing, scroll pinning, cross-browser normalize. | Imperative DOM mutation fights React 19 lifecycle without careful cleanup; ~27KB+ core + ScrollTrigger runtime weight; overkill when no complex scrubbed SVG morph chains or pinning hijack are needed. | **Not Adopted** for core bundle |
| **Motion (framer-motion)** | Ergonomic React springs, layout animations, `AnimatePresence`. | ~35KB+ gzipped client bundle added to hero FCP; pointer-driven card tilt still creates overhead if triggering React state. | **Not Adopted**; spring math implemented directly in 90 lines |
| **Custom `rAF` Spring Solver + CSS Custom Properties** | Zero external dependency (<2.5KB); updates DOM `transform` & CSS variables (`--sheen-x`, `--sheen-y`) directly without React re-renders; deterministic cleanup. | Requires disciplined lifecycle management and reduced-motion guards. | **ADOPTED** for interactive physics |
| **CSS Scroll-Driven Animations (`animation-timeline: scroll()`) + `IntersectionObserver`** | Pure compositor execution when supported; `IntersectionObserver` has 98%+ baseline support for threshold triggers and scroll-spy section detection. | `animation-timeline: view()` still has uneven Firefox/older Safari support. | **Hybrid ADOPTED**: `IntersectionObserver` + passive scroll `--scroll-progress` variable |
| **View Transitions API (`document.startViewTransition`)** | Native GPU snapshot cross-dissolves across React state updates with 2 lines of integration and CSS styling (`::view-transition-*`). | Partial browser support (Safari 18+, Chromium 111+; absent in some older browsers). | **ADOPTED** as progressive enhancement |

---

## 3. Core Motion Subsystems Engineered

### 3.1 Three-Stage Cinematic Entrance (`CinematicEntrance`)
- **Timing Budget (~2.2 seconds total)**:
  1. `0.0s – 0.65s` (**First Meridian Ray**): Deep cosmic void `#040509` with an expanding vertical beam of luminous gold (`#fff4d2`) and slowly rotating sacred astrolabe geometry (`PortalAstrolabeIcon`).
  2. `0.65s – 1.45s` (**Sacred Invocation & Monument**): Staged reveal of `IN THE NAME OF ALLAH`, golden diamond ornament, `A-L-L-A-H.COM` metallic champagne typography, and `EMPIRE OF THE LIGHT`.
  3. `1.45s – 2.20s` (**Horizon Aperture Dissolve**): Gentle depth-scale zoom (`scale(1.03)`) + opacity crossfade unveiling the interactive Gate viewport beneath.
- **Safety & Accessibility Contract**:
  - Prominent **`SKIP ENTRANCE · ESC`** button visible from millisecond zero with `min-height: 44px` and keyboard `Escape` / `Enter` support.
  - Bypassed automatically (`0ms`) when `(prefers-reduced-motion: reduce)` matches, when `sessionStorage.getItem("allah-entrance-witnessed")` is present, or when `quietMode` is active.
  - Users may intentionally re-experience the entrance at any time via a manual **REPLAY ENTRANCE** trigger in the sanctuary footer.

### 3.2 Spring-Physics Magnetic Attraction (`MagneticPortal`)
- **Mathematics**: Uses critically balanced exponential smoothing toward pointer displacement within an interaction envelope, clamped to max ±8px so layout geometry never shifts awkwardly or escapes hit targets.
- **Guardrails**: Automatically disabled on `(pointer: coarse)` touch viewports and whenever `prefers-reduced-motion: reduce` or Quiet Contemplative Mode is enabled.

### 3.3 3D Spatial Perspective Tilt & Directional Light Sheen (`SpatialTiltCard`)
- **Mechanism**: Pointer offset relative to card bounding box drives `perspective(1000px) rotateX(deg) rotateY(deg)` (clamped to ±5° for solemn architectural restraint) plus CSS custom properties `--sheen-x` and `--sheen-y` illuminating a radial obsidian-gold specular reflection gradient directly on the card surface.
- **Performance**: Writes directly to the element's inline style and CSS variables inside `requestAnimationFrame`, triggering **zero React re-renders** per mousemove frame.

### 3.4 Scroll Choreography & Section Spy
- **Multi-Plane Parallax**: A passive scroll listener computes normalized gate viewport exit progress (`0.0` to `1.0`) and drives subtle vertical depth displacement on the celestial vista (`translate3d`) and WebGL2 uniform `u_scroll`.
- **Section Spy (`IntersectionObserver`)**: Observes `#the-gate`, `#the-worlds`, `#the-dock`, and `#about`, keeping top desktop navigation and mobile quick navigation synchronized with the visitor's actual vertical destination without scroll jank.
- **Chapter Reveals (`ScrollChapterReveal`)**: Elements enter once with restrained vertical rise (`18px -> 0`) and opacity dissolve (`cubic-bezier(0.22, 1, 0.36, 1)`), remaining permanently visible once witnessed (`triggerOnce: true`) so scrolling backward never hides content.

---

## 4. Reduced Motion & Accessibility Verification Targets
- All transitions honor `@media (prefers-reduced-motion: reduce)` in CSS **and** JS runtime `matchMedia` listeners.
- Interactive elements preserve visible gold focus rings (`:focus-visible`), semantic ARIA attributes (`aria-current`, `aria-selected`, `aria-pressed`, `role="tablist"`, `role="dialog"`), and `>=44px` minimum touch targets on mobile navigation and skip controls.
