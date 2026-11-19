# @moonwitness/ai

Provider-neutral AI contracts, Zod validation schemas, error hierarchy, Ollama adapter, and eval harness for **RIOT Intelligence**.

## Exports (`package.json`)

- `.` -> `./src/index.ts` (types, schemas, error schemas)
- `./types` -> `./src/types/index.ts`
- `./schemas` -> `./src/schemas/index.ts`
- `./errors` -> `./src/errors/index.ts`
- `./adapters/ollama` -> `./src/adapters/ollama/index.ts`

## Dependencies

- Workspace: `@moonwitness/contracts`
- External: `zod`

## Scripts

```sh
pnpm --filter @moonwitness/ai lint       # eslint src
pnpm --filter @moonwitness/ai typecheck  # tsc --noEmit
pnpm --filter @moonwitness/ai test       # vitest run
pnpm --filter @moonwitness/ai eval       # node ../../scripts/eval.mjs
```

## Ownership & References

- **Owner:** RIOT Intelligence & Core Platform (`packages/ai`)
- **ADR:** [docs/architecture/adr-008-riot-intelligence-baseline.md](../../docs/architecture/adr-008-riot-intelligence-baseline.md)
