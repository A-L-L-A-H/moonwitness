# ADR-003: DNA Design Token System

## Context

Multiple apps need consistent visual design (grunge, industrial, manga aesthetic). Tokens must be centralized and themeable.

## Decision

Centralize all design tokens in `packages/ui/src/dna/`:

- `tokens.ts`: Token type definitions (colors, spacing, typography, motion, effects)
- `default-theme.ts`: Default token values
- `registry.ts`: Token resolution, CSS variable generation, theme switching
- Themes: default, highContrast, print, lowMotion, sepia

Apps consume tokens via `@moonwitness/ui` and CSS custom properties.

## Consequences

- **Positive**: Single source of truth, themeable, accessibility presets built-in
- **Negative**: Changes to token structure require coordinated updates across consumers

## Rules

- Never hardcode colors/spacing/typography in components
- Add new tokens to `tokens.ts` type + `default-theme.ts` values
- Test contrast ratios with `pnpm ui:contrast` gate
