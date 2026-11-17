# ADR-005: Visual Regression Testing

## Context

The UI design system (`@moonwitness/ui`) has 124 unit tests but no visual regression tests. Design token or component changes can break visual output without failing logic tests.

## Decision

Adopt **Playwright visual comparisons** as the initial visual regression approach:

- Use `@playwright/test` with `toHaveScreenshot()` for component/page snapshots
- Store baseline screenshots in `apps/web/e2e/__screenshots__/` or per-test snapshot dirs
- Run visual tests in CI as a non-blocking job initially (diffs trigger review, not auto-fail)

## Future Enhancement

- Consider Chromatic or Percy if budget allows for cross-browser cloud baselines
- Expand coverage to all `packages/ui/src/primitives/` components

## Consequences

- **Positive**: Catches unintended visual changes; documents expected appearance
- **Negative**: Baseline maintenance overhead; flaky on CI without stable fonts/rendering

## Initial Scope

- Landing page hero section
- Navigation shell
- Key UI primitives (Button, Card, Modal) via Storybook or direct render tests
