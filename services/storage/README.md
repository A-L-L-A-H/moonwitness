# services/storage

S3-compatible object storage HTTP server written in Rust (Axum + SQLite metadata index). It supports a local filesystem backend by default and an optional Google Drive v3 blob backend. Both use the same S3 endpoint, SigV4 authentication, and bucket/object metadata API.

## Storage backends

### Filesystem (default)

No additional credentials are required. Object blobs are stored beneath `STORAGE_ROOT`, and metadata is stored in `DATABASE_URL`.

### Google Drive

Set `STORAGE_BACKEND=google_drive` and configure:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_DRIVE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Offline OAuth refresh token |
| `GOOGLE_DRIVE_FOLDER_ID` | Existing Drive folder owned or accessible by the OAuth account |

Enable Google Drive API in the Google Cloud project and authorize the OAuth account with Drive file-management scope for the configured folder. Generate an offline refresh token (the OAuth consent flow must request offline access); use a dedicated Google account or dedicated folder rather than personal files. Keep OAuth and S3 credentials outside source control.

Objects are uploaded with Drive resumable uploads in 8 MiB chunks. SQLite stores each Drive file ID in `storage_ref`; bucket/key, size, ETag, content type, and S3 metadata remain in the storage database. Downloads and deletes resolve through the stable file ID, not through a Drive filename search.

S3 multipart uploads use the existing local `.multipart` staging area and upload the assembled object to the selected backend during completion. Keep `STORAGE_ROOT` on persistent storage for multipart staging and the SQLite database even when Google Drive is selected.

**MVP limits:** the S3 request body is currently buffered by the existing Axum handler, and a Drive download is currently read fully into memory before the response is sent (a requested byte range is sliced after that read). Keep `STORAGE_MAX_OBJECT_SIZE` conservative and do not treat this implementation as a high-concurrency, large-object production object store. Streaming/range-aware Drive downloads, durable resumable-session recovery, Drive API retry/backoff, and automated provider migration are follow-up work.

## Security & configuration

- Requires non-empty `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY` at startup (SigV4 authentication in `src/sigv4.rs`).
- Canonicalizes `STORAGE_ROOT` to prevent path traversal outside the storage root.
- Fails closed if binding a non-private/non-loopback `HOST` unless `ALLOW_PUBLIC_BIND=1`.
- The OAuth refresh token is exchanged server-side and cached in memory; it is never returned by the S3 API.
- Existing filesystem objects are not automatically migrated when switching backends. Keep the database and referenced provider credentials available, or migrate objects explicitly before changing providers.

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address |
| `HTTP_PORT` | `8091` | HTTP S3 API & health port |
| `STORAGE_ROOT` | `./data` | Local staging and filesystem root |
| `DATABASE_URL` | `sqlite:./storage.db?mode=rwc` | Metadata database |
| `STORAGE_BACKEND` | `filesystem` | `filesystem` or `google_drive` |
| `STORAGE_ACCESS_KEY` | Required | S3 access key ID |
| `STORAGE_SECRET_KEY` | Required | S3 secret key |
| `STORAGE_ALLOW_ANONYMOUS` | `false` | Local-development-only SigV4 bypass |
| `STORAGE_MAX_OBJECT_SIZE` | `536870912` | Maximum S3 object size in bytes |

## Endpoints

- `GET /health` -> `{"status":"ok","service":"storage"}`
- Fallback S3 router: bucket operations (list, create, head, delete, location, multipart list) and object operations (get, put, head, delete, multipart upload/part/complete/abort).

Proxied server-side by `apps/api` (`STORAGE_URL`, default `http://127.0.0.1:8091`).

## Run & test

```sh
cp .env.example .env
# Edit .env; keep STORAGE_BACKEND=filesystem for local-only mode.
cargo run
cargo fmt --check
cargo test
```

For Google Drive mode, fill all four `GOOGLE_DRIVE_*` values and set `STORAGE_BACKEND=google_drive`. The adapter requires outbound HTTPS access to Google OAuth and Drive API endpoints.
