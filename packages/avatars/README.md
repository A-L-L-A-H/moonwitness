# @moonwitness/avatars

DiceBear witness avatar style and validation helpers (`createAvatar`, `avatarDataUri`, `witness`, `WITNESS_PALETTES`, `WITNESS_BACKGROUNDS`, `validateSavedAvatar`, `buildSavedAvatar`, `normalizeSeed`).

## Exports & Dependencies

- `.` -> `./src/index.ts` (`src/witness.ts`, `src/contract.ts`)
- Dependencies: `@dicebear/core`

## Scripts

```sh
pnpm --filter @moonwitness/avatars lint       # eslint src
pnpm --filter @moonwitness/avatars typecheck  # tsc --noEmit
pnpm --filter @moonwitness/avatars test       # vitest run (contract.test.ts, witness.test.ts)
```

## Ownership

- **Owner:** Design System & Identity UI (`packages/avatars`)
- **Governance:** [DOCUMENTATION_GOVERNANCE_CONTRACT.md](../../docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
