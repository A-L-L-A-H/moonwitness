# Deployment Runbook

> [!IMPORTANT]
> All production deployments run on GitHub-hosted `ubuntu-latest` runners via the `deploy.yml` workflow with `environment: production`. No self-hosted runners are used.

## Architecture

```
GitHub Actions (ubuntu-latest)
  │
  │  SSH over VPS_SSH_KEY secret
  ▼
VPS (single Linux host)
  ├── docker compose up -d --build --remove-orphans
  ├── caddy       → public TLS ingress (ports 80, 443)
  ├── web         → moonwitness.biz.id & a-l-l-a-h.com (Next.js :3000)
  ├── api         → api.moonwitness.biz.id / id.moonwitness.biz.id (Fastify :3002)
  ├── postgres    → PostgreSQL 16 primary DB (moonwitness-internal)
  ├── radius      → (--profile ops) UDP 1812/1813 + HTTP 8090 (internal)
  ├── snmp-poller → (--profile ops) HTTP 8094 (internal)
  ├── syslog      → (--profile ops) UDP 5140 / TCP 5514 + HTTP 8093 (internal)
  └── storage     → (--profile ops) S3 SigV4 HTTP 8091 (internal)
```

## Required GitHub Environment: `production`

Configure these in **Settings → Environments → production → Secrets and variables**.

### Secrets (never logged)

| Secret        | Description                                                                        |
| ------------- | ---------------------------------------------------------------------------------- |
| `VPS_HOST`    | VPS hostname or IP (e.g. `vps.moonwitness.biz.id`)                                 |
| `VPS_USER`    | SSH user with Docker access (e.g. `deploy`)                                        |
| `VPS_SSH_KEY` | Ed25519 private key (the VPS's `~/.ssh/authorized_keys` must have the public half) |

### Variables (not secret, logged in CI)

| Variable          | Description                        | Example                      |
| ----------------- | ---------------------------------- | ---------------------------- |
| `VPS_DEPLOY_PATH` | Absolute path to repo clone on VPS | `/opt/moonwitness`           |
| `PRODUCTION_URL`  | Public base URL for smoke tests    | `https://moonwitness.biz.id` |

> [!NOTE]
> `PRODUCTION_URL` is used for smoke tests: the workflow checks `$PRODUCTION_URL` (root) and `$PRODUCTION_URL/api/health`.

## Triggering a Deploy

### Automatic (recommended)

Push a Git tag and create a GitHub Release. The `deploy.yml` workflow fires on `release: published`.

### Manual

In GitHub UI: **Actions → Deploy → Run workflow** → enter the release tag.

## Deploy Steps (automated by workflow)

1. **Resolve tag** — determine tag from release event or manual input.
2. **Require secrets** — fail fast if any required secret/variable is missing.
3. **SSH pre-flight** — verify Docker is running, compose file exists, `docker compose config` validates, disk has space.
4. **Pull & deploy** — `git checkout <tag>`, `docker compose pull`, `docker compose up -d --build --remove-orphans`.
5. **Health check** — poll `$PRODUCTION_URL/api/health` up to 20 times (10s sleep each = 200s max).
6. **Smoke test** — verify root page and API health return HTTP 200.
7. **Rollback on failure** — if any step fails, `git checkout <prev-tag>` + `docker compose up -d --remove-orphans`.

## First-Time VPS Bootstrap

```bash
# On the VPS
mkdir -p /opt/moonwitness
cd /opt/moonwitness
git clone https://github.com/A-L-L-A-H/moonwitness.git .
cp .env.example .env
# edit .env with real secrets
docker compose up -d
```

## SSH Key Setup

```bash
# On your local machine
ssh-keygen -t ed25519 -f moonwitness-deploy -C "github-actions-deploy"
# Copy public key to VPS
ssh-copy-id -i moonwitness-deploy.pub deploy@VPS_HOST
# Add private key content to GitHub secret VPS_SSH_KEY
cat moonwitness-deploy
```

## Rollback Manual

If the automated rollback fails or you need a specific version:

```bash
ssh deploy@VPS_HOST
cd /opt/moonwitness
git log --oneline --tags -10        # find the target tag
git checkout v0.X.Y
docker compose up -d --remove-orphans
```

## Healthcheck Endpoints

The deployment workflow (`deploy.yml`) polls `GET $PRODUCTION_URL/api/health`, which is served by **`@moonwitness/web`** (`apps/web/src/app/api/health/route.ts`):

```json
{ "ok": true, "data": { "status": "healthy", "timestamp": "..." } }
```

with HTTP 200 within 200 seconds of the compose stack starting. Internally, **Core API (`apps/api`, port `3002`)** exposes:

- `GET /api/v1/healthz` -> `200 {"status":"ok"}` (Docker Compose `api` healthcheck)
- `GET /api/v1/health` -> process health metadata
- `GET /api/v1/readyz` -> `200 {"status":"ready","database":"ok"}` / `503` when the database is unavailable

## Security Notes

- Deployment SSH key must only have access to the deploy user, not root.
- `VPS_SSH_KEY` is stored as a GitHub encrypted secret and never logged.
- The `environment: production` gate requires reviewers if branch protection requires them.
- `docker compose up --remove-orphans` removes containers for services removed from compose, but never removes named volumes (`moonwitness-data`, etc.).
- Never pass `--volumes` to `docker compose down` in automated workflows.
