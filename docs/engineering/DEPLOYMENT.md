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
2. Verifies required SSH secrets (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_SSH_KNOWN_HOSTS`) and deployment variables (`VPS_DEPLOY_PATH`, `PRODUCTION_URL`, `PRODUCTION_API_URL`, `PRODUCTION_IDENTITY_URL`); enforces a configurable minimum free-disk threshold.
3. Verifies the release tag resolves to a commit reachable from `main`, then configures SSH with the pinned `VPS_SSH_KNOWN_HOSTS` Environment secret and strict host-key checking.
4. Captures the exact previously deployed commit SHA, validates the remote Compose checkout, and confirms the VPS tag resolves to the same SHA verified by GitHub Actions.
5. Deploys the immutable SHA, waits for every enabled Compose service (including enabled `ops` services) to become healthy, and never removes persistent volumes.
6. Checks web root/health, Core API `/api/v1/readyz`, MID OIDC discovery and MID JWKS on their separate public origins.
7. On failure after pre-flight, checks out the exact captured previous commit SHA and rebuilds Compose.

## Required `production` Environment Configuration

| Name                      | Kind     | Purpose                                                          |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `VPS_HOST`                | secret   | Target VPS hostname or IP                                        |
| `VPS_USER`                | secret   | Non-root deploy SSH user with Docker permission                  |
| `VPS_SSH_KEY`             | secret   | Ed25519 private key for deploy SSH access                        |
| `VPS_SSH_KNOWN_HOSTS`     | secret   | Independently verified known-hosts entry for the exact host/port |
| `VPS_DEPLOY_PATH`         | variable | Absolute path of repo checkout on VPS (e.g. `/opt/moonwitness`)  |
| `VPS_PORT`                | variable | SSH port; defaults to `22`                                       |
| `PRODUCTION_URL`          | variable | Public web origin                                                |
| `PRODUCTION_API_URL`      | variable | Public Core API origin                                           |
| `PRODUCTION_IDENTITY_URL` | variable | Public MID issuer origin                                         |
| `MIN_FREE_DISK_MB`        | variable | Minimum free disk before deploy; defaults to 1024 MiB            |

## Rollback

On automated failure after pre-flight, `deploy.yml` checks out the exact previous commit SHA captured on the VPS and runs `docker compose up -d --build --remove-orphans`. It does not guess a prior tag and never deletes named volumes. For manual rollback, see [DEPLOYMENT-RUNBOOK.md#rollback-manual](../architecture/DEPLOYMENT-RUNBOOK.md#rollback-manual). Never delete or move `v*` release tags.

## Verification boundaries

- The workflow requires a pinned SSH host key and separate HTTPS origins for web, Core API and MID.
- Enabled Compose services are checked through their container state/health checks; intentionally disabled profile services are absent from that check.
- Backup freshness is not yet an automated deployment gate; it remains blocked on the manifest/retention contract in [MW-0036 / #192](../architecture/DATA-OWNERSHIP-BACKUP-RESTORE.md).
- A staging deployment and deliberate failed-health rollback drill have not been evidenced. Do not describe the workflow as production-verified until both #192 and the staging drill are completed.
