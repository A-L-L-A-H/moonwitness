---
name: rocksoul-transport-infrastructure
description: Operational guidance for WebTransport, WebSocket fallback, HTTP compatibility, transport selection, Go transport infrastructure, protocol conformance, and secure network testing in Rocksoul.
metadata:
  scope: packages/sdk transport adapters, infra/webtransport, tests/webtransport, and transport docs
  version: 1.0.0
  repository_architecture: TypeScript SDK plus Go WebTransport infrastructure
---

# Rocksoul Transport Infrastructure

Load for `packages/sdk/src/transport/**`, WebSocket/WebTransport behavior, selector logic, `infra/webtransport/**`, transport tests, containerized network tests, or transport specification changes.

## Contract

- Read `docs/protocol/transport-webtransport.md`, `transport-websocket.md`, `runtime.md`, `webtransport-e2e.md`, and the relevant framing/stream/recovery documents first.
- Transport adapters implement the AEP contract; they must not invent application semantics, business routing, capability authorization, or domain payload types.
- Keep transport selection in the runtime selector. Feature/UI code must not inspect socket type, ready state, stream IDs, or transport-specific errors.
- AEP logical stream identity is not a WebTransport stream ID or WebSocket connection. Preserve framing, ordering, bounds, ACK, cancellation, reconnect, and resume semantics across adapters.
- Treat fallback as explicit negotiated behavior; never silently downgrade security, protocol version, or delivery guarantees.
- Validate lengths and protocol bytes before allocation/deserialization. Bound queues, replay, pending frames, and concurrent streams. Handle malformed, truncated, duplicated, reordered, delayed, and oversized input safely.
- Keep Go infrastructure isolated behind the documented transport contract. Do not leak Go implementation details into TypeScript protocol contracts.

## Verification

Run package SDK tests, protocol vector/property tests, WebSocket tests, WebTransport native/container tests, and relevant E2E tests according to the changed boundary. Verify parity across transports for success, failure, disconnect, delayed ACK, duplicate frame, ordering, backpressure, security, and recovery cases. Never claim exactly-once transport.

Report transport selected, negotiated guarantees, tests per adapter, failure matrix coverage, and unsupported scenarios. Stop when the wire layout or fallback semantics contradict the normative specification.
