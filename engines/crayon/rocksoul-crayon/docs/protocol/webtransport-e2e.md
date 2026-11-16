# WebTransport interoperability harness

## Status

Phase 5C native-browser acceptance gate passes in the isolated Docker topology
under `infra/webtransport/`. It uses the
upstream `quic-go/webtransport-go` v0.12.0 server and a Docker UDP mapping on
port 6121. The server endpoint is `/webtransport` and accepts real browser
WebTransport sessions over HTTP/3 and QUIC.

The browser-native evidence covers 25 sequential sessions, fragmented and
concatenated AEP frames, eight concurrent sessions/streams, deterministic
transport cleanup, and rejection of an incorrect certificate hash. No mock or
WebSocket fallback participates in this checkpoint.

## TLS and browser prerequisites

The harness separates its TLS roles. `page-cert.pem` is signed by the local
development CA and trusted by Chromium for the HTTPS page. `cert.pem` is a
short-lived ECDSA P-256 self-signed WebTransport leaf whose DER SHA-256 digest
is supplied through `serverCertificateHashes`. Verification is never disabled.

The container acceptance runner at `tests/webtransport/container-runner.mjs`
uses the canonical protocol encoder and incremental decoder. Missing native
WebTransport, TLS failures, byte differences, decode failures, and browser
errors are hard failures.

The browser page origin is served separately over trusted HTTPS on port 8443;
the WebTransport server remains UDP/HTTP3 on port 6121. The dedicated server
allow-list accepts only that exact development origin. Start it in a second
PowerShell terminal before Playwright:

```powershell
node tests/webtransport/secure-page-server.mjs
pnpm exec playwright test tests/webtransport/native-roundtrip.spec.ts
```

## Scope boundary

The Go sidecar echoes carrier bytes exactly. It intentionally does not copy
the TypeScript AEP parser or dispatch rules. AEP incremental decode, validation,
logical stream identity, and runtime behavior remain the implementation under
test. No Fastify route, production TLS configuration, or protocol semantics
are changed by this harness.

## Required evidence

Record the exact browser/version, Docker image digest or build output, trusted
certificate method, UDP endpoint, successful browser session logs, 25-run
summary, multi-frame and partial-frame results, concurrent-stream results,
failure/cleanup results, and the command used to tear the harness down.

## Verified acceptance evidence (2026-09-08)

- Chromium `153.0.8010.12` ran in a Linux headless container with a secure context.
- Native HTTP/3 CONNECT reached `https://webtransport:6121/webtransport` from
  the exact allowed origin `https://browser:8443`.
- 25 sequential sessions and eight concurrent sessions passed.
- One AEP frame split across four writes and two concatenated AEP frames were
  returned byte-identically and decoded by `FrameDecoder`.
- An intentionally incorrect SHA-256 certificate hash was rejected.
- Every successful transport reached `transport.closed`; browser console and
  page error collections were empty.

Reproduce and tear down with:

```powershell
docker compose -f infra/webtransport/docker-compose.yml --profile e2e up --build --abort-on-container-exit --exit-code-from browser
docker compose -f infra/webtransport/docker-compose.yml --profile e2e down --remove-orphans
```

## Phase 5C.3 network diagnosis

The verified topology is Windows Chromium → Docker Desktop WSL2 backend →
`webtransport-webtransport-1` (`172.20.0.2`) with host mapping `6121/udp` →
container `6121/udp`. Docker reports both IPv4 and IPv6 published mappings.

The host-to-Docker UDP path was independently tested with a temporary UDP
probe on another published port; a datagram sent from PowerShell was received
inside a container. This proves generic UDP publishing, but not QUIC or
WebTransport.

With the real server running, Chromium 153.0.8010.12 reports a secure context
and `WebTransport` as a function, then returns `WebTransportError: Opening
handshake failed`. The server produces no session-accepted or upgrade log.
The failure is therefore below the WebTransport handler boundary: QUIC/HTTP3
admission or the browser-to-Docker UDP response path remains unverified. No
checkpoint is created.

## QUIC FORENSIC FINDINGS

Using a temporary `nicolaka/netshoot` tcpdump process in the WebTransport
container network namespace during exactly one Playwright connection attempt:

```text
22:17:45.982385  IN   172.20.0.1:46091 -> 172.20.0.2:6121  UDP length 125
22:17:45.985330  OUT  172.20.0.2:6121 -> 172.20.0.1:46091  UDP length 128
22:17:45.985525  OUT  172.20.0.2:6121 -> 172.20.0.1:46091  UDP length 419
22:17:45.985631  OUT  172.20.0.2:6121 -> 172.20.0.1:46091  UDP length 55
22:17:45.986558  IN   172.20.0.1:46091 -> 172.20.0.2:6121  UDP length 125
```

Seven packets matched the filter and zero were dropped by the container
kernel. The server receives the browser's QUIC Initial and sends multiple
responses. The browser then retransmits the same-sized Initial, but no client
handshake packet reaches the container. The evidence classifies this as the
return-path case: Docker/Windows/WSL2 UDP response delivery or processing is
failing before QUIC handshake completion. The WebTransport handler is never
reached, so origin/path/Extended CONNECT/AEP are not yet causal layers.

Windows `pktmon` was available but could not start because this session lacks
the required administrator privilege (`Failed to communicate with the PktMon
driver: Access is denied`). The namespace capture is therefore the authoritative
packet evidence for this run.

## NETWORK ISOLATION FINDINGS

| Topology | QUIC Initial | QUIC response | Client handshake | WebTransport | AEP |
|---|---:|---:|---:|---:|---:|
| Windows Chromium → Docker published UDP | yes | yes | no | no | no |
| Windows Chromium → direct WSL2 | not run | not run | not run | not run | not run |
| Chromium container → Docker server | not run | not run | not run | not run | not run |

The only available WSL environment is the special `docker-desktop` WSL2
distribution. It exposes `172.31.39.59`, but it does not mount the repository
drive and has no Go toolchain or `ss` utility. The same static server binary
could not be launched there without a separate file-transfer/runtime setup, so
no direct-WSL success or failure is claimed.

The Docker-browser comparison was also not claimed: it requires a browser
container with the local CA installed and a separate container hostname/SAN
configuration. The existing evidence proves the Docker-published path reaches
the server and that the server responds, but it does not by itself prove that
Docker is the sole causal layer until a second real topology succeeds.
