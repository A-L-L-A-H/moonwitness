# Deployment

> [!NOTE]
> **Status:** Single-VPS Compose topology and SSH deployment workflow are **configured** on `dev` (`docker-compose.yml`, `Caddyfile`, `.github/workflows/deploy.yml`, `docs/architecture/DEPLOYMENT-RUNBOOK.md`), with compose/Caddy structural constraints **tested** in Vitest (`vps-topology.test.ts`). Execution against a live VPS requires populating the `production` GitHub Environment secrets (`unverified in repo`).

## Architecture & Service Topology

MoonWitness deploys as a single-VPS Docker Compose stack fronted exclusively by **Caddy** on ports `80`/`443`:

- `caddy` (`moonwitness-public`) → TLS termination & reverse proxy (`moonwitness.biz.id` & `a-l-l-a-h.com` → `web:3000`; `api.moonwitness.biz.id` / `id.moonwitness.biz.id` → `api:3002`)
- `web` (Next.js App Router) → `apps/web` (internal `:3000`, exposes `/api/health`)
- `api` (Fastify Core API + MID OIDC + IGate) → `apps/api` (internal `:3002`, exposes `/api/v1/healthz` & `/api/v1/readyz`)
- `postgres` (`postgres:16-alpine`) → primary relational database for `api` on `moonwitness-internal`
- `radius`, `snmp-poller`, `syslog`, `storage` (Rust `--profile ops` services on `moonwitness-internal`, per-service SQLite volumes)
- `arsy` (`cp/arsy`) → native loopback-only host agent (`127.0.0.1:8787`)

See [VPS-TOPOLOGY-OPERATIONS.md](../architecture/VPS-TOPOLOGY-OPERATIONS.md) and [DEPLOYMENT-RUNBOOK.md](../architecture/DEPLOYMENT-RUNBOOK.md) for full service, volume, and backup details.

## GitHub Actions Deploy Flow (`.github/workflows/deploy.yml`)

Runs exclusively on **GitHub-hosted `ubuntu-latest`** runners under the protected `production` environment:

1. Resolves release tag from `release: published` or manual `workflow_dispatch` input.
2. Verifies required `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (secrets) and `VPS_DEPLOY_PATH`, `PRODUCTION_URL` (vars).
3. Connects over SSH with `webfactory/ssh-agent`, runs remote Docker & `docker compose config --quiet` pre-flight checks.
4. Checks out the release tag at `VPS_DEPLOY_PATH`, pulls/rebuilds services, and runs `docker compose up -d --build --remove-orphans` (never removing persistent volumes).
5. Polls `$PRODUCTION_URL/api/health` (up to 20 × 10s = 200s) and smoke-tests root + API health HTTP 200.
6. Rolls back to the previous release tag automatically on failure.

## Required `production` Environment Configuration

| Name              | Kind     | Purpose                                                         |
| ----------------- | -------- | --------------------------------------------------------------- |
| `VPS_HOST`        | secret   | Target VPS hostname or IP                                       |
| `VPS_USER`        | secret   | Non-root deploy SSH user with Docker permission                 |
| `VPS_SSH_KEY`     | secret   | Ed25519 private key for deploy SSH access                       |
| `VPS_DEPLOY_PATH` | variable | Absolute path of repo checkout on VPS (e.g. `/opt/moonwitness`) |
| `PRODUCTION_URL`  | variable | Public base URL for health/smoke checks                         |

## Rollback

On automated failure, `deploy.yml` checks out the prior tag and runs `docker compose up -d --remove-orphans`. For manual rollback, see [DEPLOYMENT-RUNBOOK.md#rollback-manual](../architecture/DEPLOYMENT-RUNBOOK.md#rollback-manual). Never delete or move `v*` release tags.
