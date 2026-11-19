# @moonwitness/contracts

Zod API and domain contracts across MoonWitness domains (`timeline`, `canon`, `knowledge`, `witness`, `chronicle`, `research`, `sidra`, `publication`).

Note in `src/index.ts`: write models for `works`, `signal`, and `justice` (`DEFERRED_WRITE_MODELS`) remain intentionally deferred.

## Exports & Dependencies

- `.` -> `./src/index.ts`
- `./errors` -> `./src/errors/index.ts`
- `./types` -> `./src/types/index.ts`
- `./schema` -> `./src/schema/index.ts`
- `./schema/timeline` -> `./src/schema/timeline/index.ts`
- `./timeline` -> `./src/timeline/index.ts`
- `./sdk` -> `./src/sdk/index.ts`
- Dependencies: `zod`

## Scripts

```sh
pnpm --filter @moonwitness/contracts lint       # eslint src
pnpm --filter @moonwitness/contracts typecheck  # tsc --noEmit
pnpm --filter @moonwitness/contracts test       # vitest run (contracts.test.ts)
```

## Ownership

- **Owner:** API & Domain Contracts (`packages/contracts`)
- **API Versioning:** [API-VERSIONING.md](../../docs/engineering/API-VERSIONING.md)
