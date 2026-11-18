# services/storage

S3-compatible object storage HTTP server written in Rust (`axum` + `sqlx` SQLite metadata index + filesystem object blobs under `STORAGE_ROOT`), deployed on `moonwitness-internal` under Docker Compose `--profile ops`.

## Security & Configuration (`src/config.rs`)

- Requires non-empty `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY` at startup (SigV4 authentication in `src/sigv4.rs`).
- Canonicalizes `STORAGE_ROOT` to prevent path traversal outside the storage root.
- Fails closed if binding a non-private/non-loopback `HOST` unless `ALLOW_PUBLIC_BIND=1`.

| Variable | Default (`config.rs` / `.env.example`) | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` (`0.0.0.0` in Compose) | Bind address |
| `HTTP_PORT` | `8091` | HTTP S3 API & health port |
| `STORAGE_ROOT` | `./data` | Root directory for stored objects |
| `DATABASE_URL` | `sqlite:./storage.db?mode=rwc` | SQLite metadata database (`migrations/001_init.sql`) |
| `STORAGE_ACCESS_KEY` | _Required_ | SigV4 access key ID |
| `STORAGE_SECRET_KEY` | _Required_ | SigV4 secret key |
| `STORAGE_ALLOW_ANONYMOUS` | `false` | Local-dev escape hatch only (never use in production) |
| `STORAGE_MAX_OBJECT_SIZE` | `536870912` (512 MiB) | Request body limit in bytes |

## Endpoints (`src/s3/mod.rs`)

- `GET /health` -> `{"status":"ok","service":"storage"}`
- Fallback S3 router (`s3_fallback`): bucket operations (list, create, head, delete, location, multipart list) and object operations (get, put, head, delete, multipart upload/part/complete/abort).

Proxied server-side by `apps/api` (`STORAGE_URL`, default `http://127.0.0.1:8091`).

## Run & Test

```sh
cp .env.example .env
cargo run
cargo test
```

## Ownership & References

- **Owner:** Infrastructure & Telemetry Services (`services/storage`)
- **Architecture & Topology:** [DATA-OWNERSHIP-BACKUP-RESTORE.md](../../docs/architecture/DATA-OWNERSHIP-BACKUP-RESTORE.md), [docker-compose.yml](../../docker-compose.yml)
