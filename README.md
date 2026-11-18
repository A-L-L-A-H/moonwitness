# Moonwitness

Consolidated monorepo for the A-L-L-A-H / MoonWitness / ROCKSOUL ecosystem: Turborepo + pnpm workspaces, shared packages, strict TypeScript, local quality gates, and Conventional Commits governance.

## Topology

```text
apps/
  web/                  Next.js App Router — A-L-L-A-H Sanctuary & MoonWitness Operations (port 3000)
  api/                  Fastify REST API, SQLite/libSQL, addon host & proxies (port 3002)
  rocksoul/             ROCKSOUL DX desktop workbench (Tauri 2 + React 19 + SQLite, port 1420)
  memory/               FastAPI + SQLite FTS5 + LanceDB local memory vault (ports 8000 / 3005 / 9000)
services/
  radius/               Rust Axum RADIUS service
  snmp-poller/          Rust Axum SNMP poller service
  storage/              Rust Axum S3-compatible object storage service (SigV4)
  syslog/               Rust Axum Syslog ingest service
cp/
  arsy/                 Go host reconciler, VPN/DNS control plane
packages/
  ai/                   RIOT Intelligence Ollama adapter & eval harness
  assets/               Artwork manifest & sharp asset pipeline
  avatars/              DiceBear witness avatar system
  contracts/            Zod API & domain contracts
  core/                 Domain Result helpers, formatters, env parser
  errors/               Structured domain errors
  orm/                  Schema-driven libSQL repository, migrations, audit, backup
  schema/               Shared schema helpers
  types/                Shared TypeScript domain types
  ui/                   DNA tokens, skin presets, primitives, composites, shadcn compat
  addons/               __base & timeline addon modules
scripts/                Gate engine, commitlint, branch guard, hook installer
docs/
  MASTER-CANON-CROSS-REPO-CODEX.md   Master cross-repo canon & entry doors index
  dna/                               Design DNA specifications & DNA/Skin plan
  engineering/                       BRANCHING, GATECHECK, CI-CD, RELEASING, SECURITY
```

## Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- pnpm (`12.18.0`, pinned via `packageManager`)
- Rust toolchain (`apps/rocksoul`, `services/*`)
- Go 1.22+ (`cp/arsy`)
- Python 3.12 (`apps/memory`)

## Quickstart

```sh
pnpm install
pnpm hooks:install     # install pre-push branch guard and gatehooks
pnpm gate:doctor       # verify local toolchains, git identity, and remotes
pnpm dev               # run workspace apps in watch mode
```

## Docker Compose Profiles

The compose architecture supports isolated runtime tiers via Compose profiles:

### Default Tier (Core Web + API + Ingress)

```sh
docker compose up --build
```

- Ingress (`caddy`): <http://localhost:80>, <https://localhost:443>
- Web (`@moonwitness/web`): <http://localhost:3000>
- API (`@moonwitness/api`): <http://localhost:3002/api/v1/healthz>

### Ops Tier (Background & Telemetry Services)

Starts the supplementary telemetry and storage workers:

```sh
docker compose --profile ops up --build
```

- RADIUS (`services/radius`): Port 1812/udp, 1813/udp
- SNMP Poller (`services/snmp-poller`): Port 162/udp
- Syslog (`services/syslog`): Port 514/udp
- Object Storage (`services/storage`): S3-compatible SigV4 API on port 9000
- Postgres (`postgres`): Shared relational storage for telemetry

### Tear Down

```sh
docker compose down        # preserves volume data
docker compose down -v     # destroys container volumes
```

All development happens on `dev`. `main` only accepts promotions via pull requests. Detailed branching policies: [docs/engineering/BRANCHING.md](docs/engineering/BRANCHING.md).

## Quality Gates & Verification

```sh
pnpm gate:quick        # fast feedback: format, lint, typecheck
pnpm gate:local        # full check: frozen install, lint, typecheck, test, build
pnpm gate:push         # gate:local + branch policy, secret scan, audit, commitlint
pnpm gate:release      # release readiness check for main: version, changelog, tags
pnpm gate:doctor       # diagnostic environment check

pnpm lint              # workspace ESLint
pnpm typecheck         # workspace TypeScript validation
pnpm test              # workspace Vitest suite
pnpm build             # production Turbo build
pnpm format            # Prettier formatting
```

All gate stages output unambiguous statuses: `PASS`, `FAIL`, `BLOCKED`, or `NOT APPLICABLE`. No silent skips. See [docs/engineering/GATECHECK.md](docs/engineering/GATECHECK.md).

## Conventions

- Internal packages use just-in-time TypeScript source compilation consumed directly via `transpilePackages`.
- Environment configurations are validated at process boot via `parseEnv` from `@moonwitness/core` (`apps/web/src/env.ts`, `apps/api/src/shared/env.ts`).
- Commit messages strictly follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- New applications belong in `apps/*`; reusable packages in `packages/*`.

## Engineering References

- [Architecture Foundation](docs/architecture/engineering-foundation.md)
- [ADR-007: RockSoul Local Execution & Data Boundary](docs/architecture/adr-007-rocksoul-local-execution-and-data-boundary.md)
- [Branching Model](docs/engineering/BRANCHING.md)
- [Local Quality Gates](docs/engineering/GATECHECK.md)
- [CI/CD Pipelines](docs/engineering/CI-CD.md)
- [Release Process](docs/engineering/RELEASING.md)
- [Deployment Guide](docs/engineering/DEPLOYMENT.md)
- [Security Model](docs/engineering/SECURITY.md)
- [Contributing](CONTRIBUTING.md)
