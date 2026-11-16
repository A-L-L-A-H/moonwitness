# Isolated WebTransport interoperability harness

This directory is a dedicated HTTP/3 + QUIC + WebTransport sidecar. It does
not modify Fastify, the application server, the protocol package, or SDK
semantics. The server is pinned to `github.com/quic-go/webtransport-go`
`v0.12.0` and exposes `https://localhost:6121/webtransport` over UDP.

Generate a development certificate before starting the container. A trusted
local CA certificate is required for browser E2E; `mkcert` is preferred when
available. Keep `cert.pem` and `key.pem` under this directory only as ignored
generated files.

```powershell
New-Item -ItemType Directory -Force infra/webtransport/certs/generated | Out-Null
mkcert -cert-file infra/webtransport/certs/generated/cert.pem `
  -key-file infra/webtransport/certs/generated/key.pem `
  webtransport.localhost localhost 127.0.0.1 ::1
docker compose -f infra/webtransport/docker-compose.yml up --build
```

The server echoes exact bytes on each client-initiated reliable bidirectional
stream. AEP decoding stays in the TypeScript runtime under test, so this
sidecar tests the real browser → HTTP/3 → QUIC → WebTransport carrier without
duplicating protocol semantics in Go.
