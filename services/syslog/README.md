# Syslog Service

Syslog collector/ingest service for Moonwitness. Listens for syslog messages over UDP and TCP, parses RFC 3164 (BSD) and RFC 5424-style messages (best-effort), stores them in SQLite, and exposes an HTTP API for querying and runtime metrics.

## Run

```sh
cp .env.example .env
cargo run
```

Defaults: HTTP on `127.0.0.1:8093`, UDP ingest on `5140`, TCP ingest on `5514` (unprivileged ports; use 514 with appropriate privileges/capabilities if needed).

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind host for HTTP and syslog listeners |
| `HTTP_PORT` | `8093` | HTTP API port |
| `SYSLOG_UDP_PORT` | `5140` | UDP syslog ingest port (max 64 KiB datagram) |
| `SYSLOG_TCP_PORT` | `5514` | TCP syslog ingest port (newline-delimited UTF-8) |
| `DATABASE_URL` | `sqlite:./syslog.db?mode=rwc` | SQLite database path/URL |
| `SYSLOG_MAX_MESSAGES` | `100000` | Max messages retained (pruned asynchronously in bounded chunks). `0` disables pruning |
| `SYSLOG_MAX_TCP_FRAME_BYTES` | `65536` | Max bytes per TCP line frame including `\n` (64 KiB) |
| `SYSLOG_MAX_TCP_CONNECTIONS` | `256` | Max concurrent active TCP connections (enforced via semaphore) |
| `SYSLOG_MAX_TCP_CONNECTIONS_PER_IP` | `32` | Max concurrent active TCP connections per source IP |
| `SYSLOG_TCP_READ_TIMEOUT_SECS` | `30` | Idle / per-frame read timeout (seconds) for TCP clients |
| `SYSLOG_RETENTION_THRESHOLD` | `500` | Newly ingested message count that wakes the background pruner |
| `SYSLOG_RETENTION_INTERVAL_SECS` | `10` | Periodic interval (seconds) between background retention sweeps |
| `SYSLOG_RETENTION_BATCH_SIZE` | `1000` | Max rows deleted per bounded SQLite `DELETE` chunk |

## TCP Framing & Operational Limits

- **Supported TCP framing**: Non-transparent line-delimited framing (RFC 6587 §3.4.2) using `\n` (or `\r\n`) UTF-8 frames up to `SYSLOG_MAX_TCP_FRAME_BYTES`.
- **Oversized & malformed frames**: Frames exceeding `SYSLOG_MAX_TCP_FRAME_BYTES` or containing invalid UTF-8 are rejected cleanly without unbounded buffering or silent truncation, recorded in metrics, and the TCP connection is closed immediately.
- **Connection & timeout bounds**: Active TCP connections are bounded globally by a semaphore (`SYSLOG_MAX_TCP_CONNECTIONS`) and per source IP (`SYSLOG_MAX_TCP_CONNECTIONS_PER_IP`). Excess connections are rejected immediately. Idle or stalled/slow-drip clients exceeding `SYSLOG_TCP_READ_TIMEOUT_SECS` have any incomplete frame discarded and are disconnected.
- **Transport security**: This collector uses plaintext UDP/TCP intended for trusted internal networks (`HOST=127.0.0.1` by default). TLS/mTLS is **not** provided by this service; terminate TLS externally or run over a trusted private/VPN link if crossing untrusted networks.
- **Retention pruning**: `ingest` performs insert-only writes on the hot path; pruning to `SYSLOG_MAX_MESSAGES` runs asynchronously in a background task triggered by `SYSLOG_RETENTION_THRESHOLD` or `SYSLOG_RETENTION_INTERVAL_SECS` (and flushes on graceful shutdown) using bounded `SYSLOG_RETENTION_BATCH_SIZE` chunks.

## HTTP API

- `GET /health` — service health
- `GET /api/messages?limit=&severity=&hostname=&app_name=&q=` — list messages (newest first, `limit` default 100, max 1000)
- `GET /api/messages/:id` — fetch a single message
- `GET /api/stats` — totals, counts by severity, recent source IPs, and runtime metrics snapshot
- `GET /api/metrics` — JSON snapshot of ingest, TCP bounding, error, and retention pruning metrics
- `GET /metrics` — Prometheus text exposition of runtime metrics

## Notes

- Parsing is best-effort: unknown formats are stored with `raw`/`message` populated and parsed fields left null.
- `apps/api` proxies this service at `/api/v1/syslog/*` when `SYSLOG_URL` is configured.
