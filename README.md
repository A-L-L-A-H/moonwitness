# Moonwitness

Consolidated monorepo for the A-L-L-A-H / MoonWitness / ROCKSOUL ecosystem: Turborepo + pnpm workspaces, shared packages, strict TypeScript, local quality gates, and Conventional Commits governance.

## Struktur

```text
apps/
  a-l-l-a-h/            Next.js Empire of the Light Frontier & Canon Codex (port 3003)
  web/                  Next.js App Router — MoonWitness Universe & Operations (port 3000)
  api/                  Fastify REST API, SQLite/libSQL, addon host & proxies (port 3002)
  rocksoul/             ROCKSOUL DX desktop workbench (Tauri 2 + React 19 + SQLite, port 1420)
  memory/               How U Remind Me — FastAPI + SQLite FTS5 + LanceDB vault (8000 / 3005 / 9000)
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

## Prasyarat

- Node.js >= 20 (lihat `.nvmrc`)
- pnpm (`12.18.0`, dikunci lewat `packageManager`)
- Optional per service: Rust toolchain (`apps/rocksoul`, `services/*`), Go (`cp/arsy`), Python 3.12 (`apps/memory`)

## Mulai

```sh
pnpm install
pnpm hooks:install     # opsional: pre-push branch guard + gate
pnpm gate:doctor       # cek toolchain, git identity, remote, branch
pnpm dev               # jalankan workspace apps dalam mode watch
```

## Jalankan dengan Docker Compose

Butuh Docker Engine/Desktop dengan Docker Compose. Sebelum menyalakan stack production (`NODE_ENV=production`), set secret runtime wajib (`STORAGE_ACCESS_KEY` dan `STORAGE_SECRET_KEY`; opsional `CORS_ORIGINS`):

```sh
docker compose up --build
```

- Web (`@moonwitness/web`): <http://localhost:3000> (API rewrite ke `http://api:3002`)
- API (`@moonwitness/api`): <http://localhost:3002/api/v1/healthz> (SQLite di volume `moonwitness-data`)
- A-L-L-A-H Frontier (`@moonwitness/a-l-l-a-h`): <http://localhost:3003>

Hentikan dengan `Ctrl+C` atau `docker compose down` (volume `moonwitness-data` dipertahankan), atau `docker compose down -v` untuk menghapus volume.

Kerja dilakukan di branch `dev`. `main` hanya menerima promosi lewat pull request, `master` dibekukan. Detail: [docs/engineering/BRANCHING.md](docs/engineering/BRANCHING.md).

## Perintah

```sh
pnpm gate:quick        # format, lint, typecheck (feedback cepat)
pnpm gate:local        # install frozen, format, lint, typecheck, test, build
pnpm gate:push         # gate:local + branch policy, secret scan, audit, commit lint
pnpm gate:release      # kesiapan rilis di main: versi, changelog, tag
pnpm gate:doctor       # diagnosis environment

pnpm lint              # ESLint seluruh workspace
pnpm typecheck         # tsc --noEmit seluruh workspace
pnpm test              # Vitest
pnpm build             # production build (cache Turborepo)
pnpm format            # Prettier
```

Gate melaporkan setiap langkah sebagai `PASS`, `FAIL`, `BLOCKED`, atau `NOT APPLICABLE` — tidak ada skip diam-diam. Lihat [docs/engineering/GATECHECK.md](docs/engineering/GATECHECK.md).

## Konvensi

- Package internal memakai pola just-in-time: export source TS langsung, di-transpile oleh Next (`transpilePackages`). Tidak perlu langkah build terpisah untuk `ui`/`core`.
- Environment variable divalidasi saat startup lewat `parseEnv` dari `@moonwitness/core`; tambahkan schema baru di `apps/web/src/env.ts` / `apps/api/src/shared/env.ts` dan dokumentasikan di `.env.example`.
- Commit mengikuti Conventional Commits (`feat:`, `fix:`, `chore:`, …). Changelog dan versi dihasilkan dari pesan commit — lihat [docs/engineering/RELEASING.md](docs/engineering/RELEASING.md).
- Tambah app baru di `apps/*`, package baru di `packages/*` — keduanya otomatis masuk workspace dan pipeline Turbo.

## Dokumentasi engineering

- [Arsitektur fondasi](docs/architecture/engineering-foundation.md)
- [Branching](docs/engineering/BRANCHING.md)
- [Gate lokal](docs/engineering/GATECHECK.md)
- [CI/CD](docs/engineering/CI-CD.md)
- [Releasing](docs/engineering/RELEASING.md)
- [Deployment](docs/engineering/DEPLOYMENT.md)
- [Security](docs/engineering/SECURITY.md)
- [Contributing](CONTRIBUTING.md)
