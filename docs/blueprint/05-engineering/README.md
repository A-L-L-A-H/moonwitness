# 05 — Engineering

Repository and package standards for Gen2.

Baseline:

- Node.js 24 LTS
- TypeScript
- pnpm
- ESM
- Fastify 5 for HTTP services
- Vitest for unit/contract tests
- ESLint + Prettier
- strict TypeScript

Engineering rules include small public surfaces, explicit dependencies, no deep imports, no hidden global state, no direct database coupling from domain packages, and deterministic builds.