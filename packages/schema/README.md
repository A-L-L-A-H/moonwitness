# @moonwitness/schema

Shared Zod validation schemas and API error schema helpers derived from `@moonwitness/types`.

## Exports (`package.json`)

- `.` -> `./src/index.ts`
- `./timeline` -> `./src/timeline/index.ts`
- `./errors` -> `./src/errors.ts`

## Dependencies

`@moonwitness/types`, `zod`.

## Scripts

```sh
pnpm --filter @moonwitness/schema lint       # eslint src
pnpm --filter @moonwitness/schema typecheck  # tsc --noEmit
```

## Ownership

- **Owner:** API & Domain Contracts (`packages/schema`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
