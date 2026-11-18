# @moonwitness/contracts

Zod API and domain contracts across MoonWitness domains (`timeline`, `canon`, `knowledge`, `witness`, `chronicle`, `research`, `sidra`, `publication`).

Note in `src/index.ts`: write models for `works`, `signal`, and `justice` (`DEFERRED_WRITE_MODELS`) remain intentionally deferred.

## Exports & Dependencies

- `.` -> `./src/index.ts`
- `./timeline` -> `./src/timeline/index.ts`
- Dependencies: `@moonwitness/errors`, `@moonwitness/schema`, `@moonwitness/types`, `zod`

## Scripts

```sh
pnpm --filter @moonwitness/contracts lint       # eslint src
pnpm --filter @moonwitness/contracts typecheck  # tsc --noEmit
pnpm --filter @moonwitness/contracts test       # vitest run (contracts.test.ts)
```

## Ownership

- **Owner:** API & Domain Contracts (`packages/contracts`)
- **API Versioning:** [API-VERSIONING.md](../../docs/engineering/API-VERSIONING.md)
