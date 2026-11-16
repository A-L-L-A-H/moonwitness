# 09 — Quality Gates and Definition of Done

## Establish the real commands first

Inspect the repository's `package.json` files and tooling before running commands. Do not assume script names. Record the exact commands in the local AI report. Prefer root orchestrated scripts after the workspace is established.

## Required gates

### 1. Repository integrity

- No accidental deletion or overwrite of user work.
- No secrets, credentials, tokens, or `.env` files committed.
- No generated caches or `node_modules` in version control.
- Lockfile is consistent with workspace manifests.

### 2. Static quality

- TypeScript strict checking passes for apps and packages.
- Lint passes without suppressing meaningful rules.
- Formatting passes according to the repository's formatter.
- Package export paths resolve.
- No circular imports across packages.
- No `any`, broad `@ts-ignore`, or disabled type checking introduced to silence errors.

### 3. Functional behavior

- App starts and expected routes load.
- Navigation links lead to real routes or clearly disabled/coming-soon states.
- Theme, mode, density, layout, and intensity controls actually update the interface and persist only if persistence is deliberately implemented.
- Forms validate and expose accessible feedback.
- Tables and chart interactions perform the behavior advertised by the UI.
- Dialogs/menus/popovers support keyboard and focus behavior.
- Loading, empty, error, and success states behave correctly.

### 4. Visual quality

Inspect at minimum:

- Desktop wide: 1440 px or similar.
- Laptop: 1280 px.
- Tablet: around 768 px.
- Mobile: around 390 px.

Check:

- R!OT identity is present across the application, not only in the marketing hero.
- Navigation, typography, spacing, and content hierarchy remain consistent.
- Theme presets are visually distinct but use the same semantic component APIs.
- Light/dark modes have correct contrast and no invisible borders/icons.
- Artwork never hides important information or blocks clicks.
- Text remains readable over every background.
- Tables do not collapse into unusable layouts.
- The app is not overloaded with random stickers, grain, motion, or excessive shadows.

### 5. Accessibility

- All primary actions are keyboard reachable.
- Focus is visible and not clipped.
- Icon-only controls have accessible names.
- Inputs have labels and error associations.
- Dialogs, menus, tabs, and popovers use accessible primitives.
- Color is not the only status indicator.
- Images have meaningful alt text or are marked decorative.
- Reduced-motion preference is respected.
- Contrast meets WCAG AA where applicable; validate normal and small text in every theme.

### 6. Performance

- Avoid loading p5.js and large artwork on pages that do not use them.
- Use dynamic import for optional p5 sketches and heavy interactive modules.
- Pause offscreen animation and respect reduced motion.
- Optimize PNG and SVG sizes.
- Avoid large blur/filter/animated layers across the entire app.
- Inspect bundle output or available build metrics when practical.
- Prevent layout shift by reserving media dimensions/aspect ratios.

### 7. Artwork quality

- Every manifest entry marked `verified` maps to an existing asset and a visual inspection.
- SVG is true vector source, with `viewBox` and no embedded raster masquerading as vector.
- PNG dimensions/transparency match the target.
- p5 sketches have deterministic seed behavior, safe resource limits, export path, reduced-motion behavior, and static fallback.
- Character poses are recognizably consistent.
- No duplicate outputs are counted as separate artwork.
- Prompt/source metadata is recorded.

## Definition of done for a phase

A phase can be marked complete only when:

1. Its tasks are implemented, not merely planned.
2. The changed code is integrated into the actual app/package.
3. Relevant quality gates pass, or every failure is explicitly explained.
4. The TODO and report are updated with file/command evidence.
5. No unreviewed conflict or known regression is hidden.

## Release-quality definition

The result is not premium-ready until the workspace installs cleanly, the demo app builds, the starter app runs, the shared component APIs are documented, the theme lab works, the core modules are migrated, and the artwork library is curated and integrated. If any of these are incomplete, report the product as a development milestone—not as a finished commercial template.
