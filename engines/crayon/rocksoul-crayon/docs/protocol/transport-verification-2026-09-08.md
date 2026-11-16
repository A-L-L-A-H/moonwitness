# Transport verification checkpoint — 2026-09-08

## Native WebTransport

Command:

```text
docker compose -f infra/webtransport/docker-compose.yml --profile e2e up --build --abort-on-container-exit --exit-code-from browser
```

Result: `PASS`.

| Signal | Result |
|---|---:|
| Sequential sessions | 25 |
| Concurrent streams | 8 |
| Fragmented AEP frames | 1 |
| Concatenated AEP frames | 2 |
| Invalid certificate rejection | true |
| Transport cleanup | `transport.closed` resolved |
| Secure context | true |
| Browser | HeadlessChrome 153.0.8010.12 |
| Unexpected browser errors | 0 |

This verifies the isolated Docker Chromium/HTTP3 topology. It does not claim
production Internet routing, Windows host UDP routing, or non-Chromium browser
qualification.

## Web UI cross-browser qualification

The authenticated application suite also passed on Firefox 155 and WebKit
26.6 using the local API/Vite topology:

```text
pnpm --filter ./apps/web exec playwright test --project=firefox --project=webkit --workers=1
8 passed (1.0m)
```

This qualifies the web UI flows on those engines. Native WebTransport remains
scoped to the Chromium Docker harness above because the tested WebTransport
endpoint and certificate topology are Chromium-specific.
