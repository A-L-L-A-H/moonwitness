# Security

## Controls & Implementation Status Matrix

| Control                     | Status     | Source / Workflow Path                                    | Verification / Notes                                                        |
| --------------------------- | ---------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Secret scan (tracked files) | Enforced   | `scripts/gatecheck.mjs` (`gate:push`)                     | Scans all tracked files on push                                             |
| Dependency advisories       | Enforced   | `scripts/gatecheck.mjs` (`pnpm audit --prod`)             | High/critical advisories block `gate:push`                                  |
| Static analysis             | Configured | `.github/workflows/codeql.yml`                            | `javascript-typescript`, `security-and-quality` on `ubuntu-latest`          |
| GitHub-hosted CI runners    | Configured | `.github/workflows/*.yml`                                 | Standard `ubuntu-latest` runners; no self-hosted runners used               |
| Least-privilege workflows   | Configured | `.github/workflows/*.yml`                                 | Explicit `permissions:` per workflow                                        |
| Pinned third-party actions  | Configured | `.github/workflows/*.yml`                                 | First-party/reviewed actions pinned to commit SHAs                          |
| Branch protection           | Configured | `.github/workflows/branch-policy.yml`, GitHub rulesets    | PR + status checks + single-scope conventional commits (`commitlint.mjs`)   |
| Immutable release tags      | Configured | GitHub `release-tags` ruleset                             | `v*` tags cannot be moved or deleted                                        |
| Consolidated Core API & MID | Tested     | `apps/api/src/` (`Fastify` + `packages/orm` SQLite)       | MID OIDC & IGate unified inside `apps/api`; tested via Vitest               |
| Caddy TLS ingress boundary  | Configured | `Caddyfile`, `docker-compose.yml`, `vps-topology.test.ts` | Only Caddy exposes 80/443; `web`/`allah`/`api`/Rust sit on internal bridges |
| Private Rust ingress guard  | Tested     | `services/*/src/config.rs`, `private-ingress.test.ts`     | Non-private `HOST` binds fail closed unless `ALLOW_PUBLIC_BIND=1`           |
| RADIUS per-NAS credentials  | Tested     | `services/radius/src/config.rs`, `radius/server.rs`       | Fails closed without `RADIUS_NAS_CLIENTS`/`RADIUS_SECRET`; rejects default  |
| SNMPv3 & AES-GCM at rest    | Tested     | `services/snmp-poller/src/crypto.rs`, `api.rs`            | AES-256-GCM encryption via `SNMP_CREDENTIAL_KEY` + SNMPv3 `authPriv` checks |
| ARSY V1 host-agent guard    | Tested     | `cp/arsy/internal/resources/`, `ARSY-HOST-AGENT-V1.md`    | Loopback-bound, deferred 12 non-V1 kinds, no `--volumes` on `absent`        |
| Release SBOM & provenance   | Configured | `.github/workflows/release-sbom.yml`                      | CycloneDX/workspace SBOM + `SHA256SUMS.txt` + optional OIDC attestation     |

> [!NOTE]
> Code-level and CI checks validate the repository configuration above (`Tested` / `Configured`). Live VPS firewall rules, production TLS certificates, and live container runtime state are **unverified in this repository audit** until `deploy.yml` executes against a configured host target.

## Reporting a vulnerability

Do not open a public issue. Contact the repository owner directly and include reproduction steps,
affected versions, and impact. Expect an acknowledgement before any public disclosure.

## Secrets & Encryption Keys

- Never commit `.env` contents. `.env` is ignored; `.env.example` documents non-secret keys.
- Production secrets (`VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`, `SNMP_CREDENTIAL_KEY`, `RADIUS_NAS_CLIENTS`) live in the host environment or GitHub Environment secrets, never in Git.
- If a secret is committed, rotate it first, then remove it from history. Deleting the commit is not enough.

## Application Authentication & Authorization

- **First-party sessions**: Core API (`apps/api`) hashes passwords with bcrypt, validates MoonWitness ID JWTs (`ES256` + `aud` + `iss`), and stores sessions in SQLite (`packages/orm`), issuing `mw_session` (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
- **Bootstrap admin**: When the user table is empty, `MW_BOOTSTRAP_ADMIN_USERNAME`, `MW_BOOTSTRAP_ADMIN_EMAIL`, and `MW_BOOTSTRAP_ADMIN_PASSWORD` (12–72 UTF-8 bytes) seed the initial admin without default demo passwords.
- **Rust-service proxy boundary**: `apps/api/src/interface/routes/{radius,snmp-poller,syslog,storage}.routes.ts` enforce server-verified sessions and `requireRole`; browser `Cookie` and caller-supplied `Authorization` headers are never forwarded upstream.
- **Storage S3 credentials**: Core API signs Storage S3 requests server-side with `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY`. Anonymous mode is disabled in production.
- **RIOT Intelligence SSRF guard**: Only calls operator-configured `RIOT_AI_BASE_URL`; rejects metadata/private IPs at startup.

## Internal Rust Services (`services/`)

All Rust services run on `moonwitness-internal` (`internal: true`) with no public container ports:

- **RADIUS (`services/radius`)**: Fails closed at startup if `RADIUS_NAS_CLIENTS` and `RADIUS_SECRET` are absent or equal to the legacy default (`moonwitness-radius-secret`). Supports per-NAS CIDR client registries (`RADIUS_NAS_CLIENTS`) with `previous_secret` overlap for zero-downtime key rotation and drops unknown peers before processing.
- **SNMP Poller (`services/snmp-poller`)**: Validates SNMPv1, v2c, and SNMPv3 `authPriv` (`SHA256`/`SHA1` + `AES128`) profiles. Encrypts `community`, `v3_auth_passphrase`, and `v3_priv_passphrase` at rest in SQLite using AES-256-GCM (`SNMP_CREDENTIAL_KEY`), and omits all credential fields from JSON serialization.
- **Syslog (`services/syslog`)**: Enforces bounded TCP frame sizes and connection limits (`config.rs`). Requires `ALLOW_PUBLIC_BIND=1` if binding outside loopback/private ranges.
- **Storage (`services/storage`)**: S3 SigV4 auth + canonical path resolution under `STORAGE_ROOT` + private bind enforcement (`ALLOW_PUBLIC_BIND=1`).

## Supply Chain & Runners

- All GitHub Actions workflows run on GitHub-hosted `ubuntu-latest` runners (no self-hosted runners).
- `.github/workflows/release-sbom.yml` generates workspace `pnpm-sbom.json`, lockfile snapshots, `SHA256SUMS.txt`, and invokes `actions/attest-build-provenance`.
- Release deployment in `.github/workflows/deploy.yml` runs on `ubuntu-latest` inside the protected `production` environment.
