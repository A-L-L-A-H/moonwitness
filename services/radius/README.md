# services/radius

Rust Axum HTTP management API and UDP RADIUS authentication/accounting server for MikroTik / NAS clients (`moonwitness-internal` `--profile ops`).

## Overview

- **Crate:** `radius` (`Cargo.toml`), SQLite storage via `sqlx` (`migrations/001_init.sql`)
- **Network Safety (`src/config.rs`):** Fails closed if `HOST` is non-private/non-loopback without `ALLOW_PUBLIC_BIND=1`. Also fails closed at startup unless `RADIUS_NAS_CLIENTS` (per-NAS CIDR JSON entries with optional `previous_secret` rotation) or a non-default `RADIUS_SECRET` (rejects `"moonwitness-radius-secret"`) is configured.

## Configuration

| Variable | Default (`config.rs` / Compose) | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` (`0.0.0.0` in Compose) | Bind address |
| `HTTP_PORT` | `3000` (`8090` in `.env.example` & Compose) | Internal HTTP management port |
| `RADIUS_AUTH_PORT` | `1812` | UDP authentication listener |
| `RADIUS_ACCT_PORT` | `1813` | UDP accounting listener |
| `DATABASE_URL` | `sqlite:./radius.db?mode=rwc` | SQLite database file |
| `RADIUS_NAS_CLIENTS` | `""` | JSON array of `{ id, cidr, secret, previous_secret? }` |
| `RADIUS_SECRET` | `""` | Legacy single-NAS shared secret fallback (`0.0.0.0/0`) |
| `ALLOW_PUBLIC_BIND` | `false` | Set `"1"` / `"true"` in trusted container bridge networks |

## HTTP API (`src/api.rs`)

- `GET /health` -> `{"status":"ok","service":"radius"}`
- `GET|POST /api/users`
- `GET|PUT|DELETE /api/users/:username`
- `GET /api/logs`
- `GET /api/stats`

Proxied by `apps/api` via `RADIUS_URL` (`http://127.0.0.1:8090` default).

## Run & Test

```sh
cp .env.example .env
cargo run
cargo test
```

## Ownership & References

- **Owner:** Infrastructure & Telemetry Services (`services/radius`)
- **Security & Topology:** [SECURITY.md](../../docs/engineering/SECURITY.md), [docker-compose.yml](../../docker-compose.yml)
