# ADR-002: Shared Package Strategy

## Context

Moonwitness is a monorepo with multiple apps consuming shared code. We need a strategy for how shared packages are built and consumed.

## Decision

Use **Just-In-Time (JIT) package strategy** for internal packages (`@moonwitness/ui`, `@moonwitness/core`, `@moonwitness/orm`, etc.):

- Export source TypeScript directly (`./src/*.ts`)
- Consumer apps (Next.js) transpile via `transpilePackages` config
- No separate build step required for internal packages

External publishing (if needed in future): add `tsup` build per package.

## Consequences

- **Positive**: Fast iteration, no build step overhead, single source of truth
- **Negative**: Cannot publish to npm without adding build; consumers must support TS transpilation

## Alternatives Considered

- Pre-built packages (dist/): slower iteration, requires build on every change
- Monorepo-only: not publishable externally (acceptable for now)
