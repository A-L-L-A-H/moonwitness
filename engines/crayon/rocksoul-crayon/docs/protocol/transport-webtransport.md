# WebTransport Transport

Phase 5 adds `WebTransportTransport` as a browser-safe, injectable transport
adapter. It is selected when `globalThis.WebTransport` is available and the
configured endpoint is `https://`; otherwise the selector uses WebSocket.
Fallback is capability-based only and is not retried after authentication or
protocol failure.

Reliable AEP bytes use one bidirectional WebTransport stream. AEP logical
`streamId` remains the canonical application identity; native stream identity
is never exposed. This preserves WebSocket parity and gives the runtime one
incremental byte source. The runtime's existing `FrameDecoder` handles partial
and concatenated frames.

Datagrams are advertised as a native capability but are not used for AEP
critical data, ACKs, execution state, authorization, or metadata. No datagram
API is exposed until an explicitly ephemeral use case is specified.

The adapter integrates `writer.ready`, `write`, `close`, a single readable
stream owner, bounded pending bytes, abort-safe cleanup, and normalized errors.
No reconnect, resume, business dispatch, or WebTransport server is implemented
in this phase.

An isolated compatible HTTP/3/WebTransport sidecar now exists under
`infra/webtransport/`. Mock adapter verification remains distinct from real
production WebTransport E2E; browser-native verification is still blocked
until a trusted certificate and browser automation runner are available.

## Phase 5B Infrastructure Discovery

The current host provides Node.js 26.5.0, pnpm 11.17.0, and Docker 29.7.2 /
Compose 5.5.0. The repository has no HTTP/3 or QUIC server, reverse-proxy
termination, certificate setup, or browser WebTransport E2E harness. The
application stack remains Fastify over its existing HTTP server and is not a
production WebTransport server. The new harness is a separate Dockerized
`quic-go/webtransport-go` v0.12.0 sidecar with UDP port 6121 and generated-
certificate instructions; it does not alter Fastify.

Accordingly, Phase 5B must not claim wire-level interoperability. The adapter,
MockWebTransport, selector, secure URL policy, binary path, and runtime parity
remain testable locally; a real test requires a dedicated supported HTTP/3 /
QUIC WebTransport endpoint plus a browser capable of connecting to its local
development certificate. No custom QUIC/TLS implementation is introduced.
