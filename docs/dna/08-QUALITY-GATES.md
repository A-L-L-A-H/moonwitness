---
title: "Seven DNA Quality Gates"
version: "1.3.0"
status: "approved"
last_verified: "2026-11-17"
owner: "quality"
---

# SEVEN DNA: QUALITY GATES

## Completion states

Use separate states and evidence:

- **APPROVED:** creative direction accepted.
- **SPECIFIED:** token rules, component recipes, responsive rules, motion, and exclusions documented.
- **IMPLEMENTED:** code exists and is integrated in the shared UI package / consumer apps.
- **VERIFIED:** acceptance tests and manual visual/accessibility review pass.
- **RELEASED:** included in an identified release or deployment.

Do not collapse these states. A poster, mockup, spec, or design token file alone does not prove a completed skin.

## Master DNA acceptance criteria

A Master DNA can be marked SPECIFIED only when it has:

- an unmistakable world metaphor and design thesis;
- composition and layout grammar;
- shape and material vocabulary;
- color role and typography direction;
- navigation and motion language;
- component interpretations;
- responsive direction;
- hard exclusions and anti-slop rules;
- clear relationship to its parent product or experience.

All seven DNA specifications in this directory meet the documentation-level target. Runtime skins are implemented as token sets in `packages/ui/src/skins/registry.ts`, scalable vector scenes in `packages/ui/src/blocks/world-artwork.tsx`, and recipes rendered through `SkinRoot` or route-level `SkinScope`; they reach VERIFIED only when the engineering gates below pass for every consuming app.

## Runtime implementation acceptance criteria

For each DNA:

- [ ] Unique entry composition with a recognisable signature.
- [ ] Independent token set with semantic roles.
- [ ] Typography roles and licensed font assets.
- [ ] Geometry, density, surface, elevation, and texture rules.
- [ ] Navigation and layout recipe distinct from other DNA.
- [ ] Component recipes for actions, cards, forms, tables, overlays, feedback, and data.
- [ ] Motion behavior plus reduced-motion fallback.
- [ ] Responsive behavior for wide, medium, and narrow screens.
- [ ] Original or properly licensed visual assets.
- [ ] Original vector artwork renders without animation and scales without raster loss.
- [ ] No change to business behavior or accessibility contract.
- [ ] Visual comparison evidence in Skin Laboratory.
- [ ] Build, typecheck, accessibility, and relevant interaction tests pass.
- [ ] Measured WCAG contrast ratios for every skin's token pairs pass `pnpm ui:contrast` (a failing pair exits non-zero and blocks the commit).
- [ ] Design-system component and skin contracts pass `pnpm ui:test`.
- [ ] Glyphs render only through `Icon` from `@moonwitness/ui` (`ICON_PURITY`) and the skip landmark stays owned by `RouteShell`/`SkipLink` (`LANDMARK_PURITY`).

## Cross-skin anti-slop review

Reject the implementation when:

- changing only the palette makes one skin look like another;
- the same dashboard grid, rounded cards, and sidebar are reused without a world-specific reason;
- the signature metaphor appears only in a hero image and disappears from navigation and interactions;
- typography, composition, and motion are indistinguishable;
- decorative effects outrank information hierarchy or text sits over busy illustrations without a clear reading layer;
- controls work only with pointer or hover;
- content loses meaning with animation or 3D disabled;
- fake progress, telemetry, astronomy, or status is shown as real;
- sacred names or Qur'anic text are used as decorative textures, ALLAH is depicted, or identifiable human faces are used against DNA guidelines;
- violent/disturbing imagery or copyrighted characters, manga panels, or artist styles are imitated.

## Performance and experience quality thresholds

- **Fast initial rendering:** `LCP <= 2.5s`, `CLS <= 0.1`, priority hero imagery with static SSR HTML semantics before JS hydration.
- **Smooth interaction:** `INP <= 200ms`, desktop frame pacing target `60fps` on compositor properties (`transform`/`opacity`), clean `30fps` or static fallback on constrained devices.
- **Graceful 3D & View Transition fallback:** WebGL2/WebGPU (`Three.js`), scroll choreography, and View Transitions must degrade cleanly to static vector/raster media and instant DOM navigation without throwing or hiding content.
- **Controlled asset & JS budgets:** zero unnecessary client JS bundles; responsive AVIF/WebP derivatives and inline SVG geometry with lazy-loaded below-the-fold media.
- **Zero fake telemetry:** never fabricate metrics, coordinates, live badges, or counts.

## Accessibility and resilience gates

- Keyboard-only navigation for all tasks.
- Visible focus that remains recognisable against each DNA's surface.
- Screen-reader names, roles, descriptions, and dynamic announcements.
- Contrast checked for text, controls, focus, and data states — measured automatically per skin by `pnpm ui:contrast`, not eyeballed.
- Zoom and reflow without clipped essential content.
- Reduced-motion mode and no required ambient animation.
- Motion starts paused, is user-pauseable, and remains disabled when reduced motion is requested.
- Static fallback for canvas, WebGL, video, remote image, or shader failure.
- Sound disabled by default and explicitly user-controlled.
- No visual-only critical content.

## Visual review protocol

Review the same representative task in each skin using the same viewport sizes and content. Evaluate identity, hierarchy, task completion, accessibility, responsive composition, performance, and fallback behavior separately. A skin does not pass by looking impressive in a static desktop screenshot.

## Release gate

No skin is production-ready until the shared package API, app integration, automated checks, visual evidence, accessibility review, and rollback path are recorded in the implementation report.
