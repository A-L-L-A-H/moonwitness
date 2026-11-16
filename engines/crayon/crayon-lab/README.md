# moonwitness-crayon-lab

Methodology and research laboratory experience.

## Foundation status

Genesis 00 establishes the governed, portable repository baseline only. It contains no migrated business logic.

## Architecture boundary

This repository follows the frozen MoonWitness Gen2 blueprint. Consumers use its public package entrypoint only; private source paths and foreign databases are not integration boundaries.

## Development

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
