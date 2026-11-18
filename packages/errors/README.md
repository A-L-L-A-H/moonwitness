# @moonwitness/errors

Structured domain error hierarchy shared across backend API, ORM, AI adapters, and validation layers.

## Exports (`src/index.ts`)

- Classes: `DomainError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `TimeoutError`
- Type guard: `isDomainError(value)`

## Scripts

```sh
pnpm --filter @moonwitness/errors lint       # eslint src
pnpm --filter @moonwitness/errors typecheck  # tsc --noEmit
```

## Ownership

- **Owner:** Shared Platform Core (`packages/errors`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
