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

| Secret                | Description                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `VPS_HOST`            | VPS hostname or IP (e.g. `vps.moonwitness.biz.id`)                                                            |
| `VPS_USER`            | SSH user with Docker access (e.g. `deploy`)                                                                   |
| `VPS_SSH_KEY`         | Ed25519 private key (the VPS's `~/.ssh/authorized_keys` must have the public half)                            |
| `VPS_SSH_KNOWN_HOSTS` | Pinned known-hosts entries for the exact VPS host and SSH port; obtained and fingerprint-verified out of band |

### Variables (not secret, logged in CI)

| Variable                  | Description                                                     | Example                          |
| ------------------------- | --------------------------------------------------------------- | -------------------------------- |
| `VPS_DEPLOY_PATH`         | Absolute path to repo clone on VPS                              | `/opt/moonwitness`               |
| `VPS_PORT`                | SSH port (optional; defaults to `22`)                           | `22`                             |
| `MIN_FREE_DISK_MB`        | Minimum free disk required before deployment (default 1024 MiB) | `1024`                           |
| `PRODUCTION_URL`          | Public web origin for smoke tests                               | `https://moonwitness.biz.id`     |
| `PRODUCTION_API_URL`      | Public Core API origin                                          | `https://api.moonwitness.biz.id` |
| `PRODUCTION_IDENTITY_URL` | Public MID issuer origin                                        | `https://id.moonwitness.biz.id`  |

> [!NOTE]
> All three production origins are required and must be HTTPS origins without a path or query. The workflow checks web at `PRODUCTION_URL`, Core API readiness at `PRODUCTION_API_URL/api/v1/readyz`, and MID discovery/JWKS at the identity origin.

## Triggering a Deploy

### Automatic (recommended)

Push a Git tag and create a GitHub Release. The `deploy.yml` workflow fires on `release: published`.

### Manual

In GitHub UI: **Actions → Deploy → Run workflow** → enter the release tag.

## Deploy Steps (automated by workflow)

1. **Resolve release tag** — require a semantic version tag such as `v0.1.0`.
2. **Verify source** — check out the tag, resolve its commit SHA, and require that exact commit to be reachable from `main`.
3. **Require protected settings** — the production Environment must provide the SSH key, pinned host key, deploy path, and the web/API/identity HTTPS origins.
4. **Verify SSH identity** — use only the supplied `VPS_SSH_KNOWN_HOSTS` data with `StrictHostKeyChecking=yes`. The workflow never runs `ssh-keyscan` during deployment and never learns a new host key from the network.
5. **Pre-flight and capture current release** — verify the remote Compose checkout is clean, Docker works, Compose configuration is valid, at least `MIN_FREE_DISK_MB` (default 1024 MiB) is free, and record the exact current commit SHA and tag.
6. **Deploy immutable source** — the VPS fetches the tag and independently verifies it resolves to the SHA checked by GitHub Actions before checking out that exact SHA.
7. **Wait for enabled services** — verify every running Compose service, including services enabled by the `ops` profile, reaches `running` and `healthy` when a health check exists. Disabled profile services are not treated as an outage.
8. **Verify public endpoints** — check the web root and web health route, Core API database readiness, MID OIDC discovery, and the MID JWKS document.
9. **Rollback on failure** — restore the exact previous commit SHA captured during pre-flight and rebuild the Compose stack. No named volumes are deleted and no database schema rollback is attempted.
10. **Record evidence** — the GitHub Actions summary includes the deployed release SHA, prior SHA/tag, tested endpoint URLs, and job result.

### Pin the VPS host key (one-time operator task)

Obtain the host key from a trusted network path and independently compare its fingerprint with the VPS provider console or another authenticated out-of-band source. Do not trust an unverified `ssh-keyscan` result.

```sh
ssh-keyscan -p 22 -H VPS_HOST > moonwitness-known-hosts
ssh-keygen -lf moonwitness-known-hosts
```

After verifying the fingerprint, store the full contents of `moonwitness-known-hosts` as the GitHub production Environment secret `VPS_SSH_KNOWN_HOSTS`. For a non-default port, generate the entry using that exact port. The deploy workflow uses strict host-key checking and fails closed when the host key is missing or changes.

Protect published `v*` release tags against deletion or movement using the repository's tag/release governance. The workflow independently compares the tag SHA on GitHub and the VPS before deployment.

> [!WARNING]
> Backup freshness and restore verification are not yet an automated deployment gate. The PostgreSQL backup/restore work in [#192](https://github.com/A-L-L-A-H/moonwitness/issues/192) must define and verify the production backup manifest/retention contract before production deployment can be considered fully hardened. A successful workflow is not proof of a restore drill or a production cutover.

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

The deployment workflow verifies each public surface separately:

- `GET $PRODUCTION_URL/` and `GET $PRODUCTION_URL/api/health` -> Next.js web root and web health.
- `GET $PRODUCTION_API_URL/api/v1/readyz` -> Core API readiness; requires a successful PostgreSQL query and returns `200 {"status":"ready","database":"ok"}`. Database failure returns HTTP 503.
- `GET $PRODUCTION_IDENTITY_URL/.well-known/openid-configuration` -> MID OIDC discovery document.
- `GET $PRODUCTION_IDENTITY_URL/.well-known/jwks.json` -> MID public signing-key set; deployment requires a non-empty `keys` array.

The workflow also checks the container state of every enabled Compose service. Services not enabled by the `ops` profile are intentionally absent from this check.

## Security Notes

- Deployment SSH key must only have access to the deploy user, not root.
- `VPS_SSH_KEY` and `VPS_SSH_KNOWN_HOSTS` are stored as GitHub Environment secrets and never logged.
- Verify the SSH host fingerprint against an authenticated out-of-band source before saving `VPS_SSH_KNOWN_HOSTS`; the workflow requires strict host-key checking.
- The `environment: production` gate requires reviewers if branch protection requires them.
- `docker compose up --remove-orphans` removes containers for services removed from compose, but never removes named volumes (`moonwitness-data`, etc.).
- Never pass `--volumes` to `docker compose down` in automated workflows.
