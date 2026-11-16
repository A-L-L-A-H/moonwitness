# WebSocket Transport

Phase 4 adds a transport-only WebSocket adapter in
`packages/sdk/src/transport/websocket.ts` and a minimal Fastify loopback bridge
at `/aep`.

The adapter sends binary `ArrayBuffer` values, rejects text messages, exposes
transport capabilities (`binary`, `reliable`, `ordered`, `fullDuplex`, and no
native multiplexing), normalizes lifecycle errors, and bounds pending bytes.
Logical AEP stream identity remains in the protocol/runtime layer; WebSocket
close is not an AEP `CLOSE` frame and does not cancel executions.

## Message and Frame Boundaries

WebSocket message boundaries are not AEP frame boundaries. A message may carry
zero, one, or many frames, and a frame may be delivered across multiple
messages. `ApplicationRuntime.ingestBytes()` is the single runtime ingestion
boundary and feeds the Phase 2 incremental `FrameDecoder`; transport code does
not parse headers or payloads. Partial input remains buffered until complete,
while concatenated frames are emitted in order exactly once.

The runtime retains active execution state when the physical socket closes.
Transport close/error events are normalized and do not implement reconnect or
resume policy.

The Fastify bridge is an authenticated AEP gateway adapter. It decodes input
through the existing AEP `FrameDecoder` and re-encodes frames; it contains no
authentication, capability dispatch, domain, ORM, or AI behavior.

No reconnect, resume, heartbeat, WebTransport, or frontend migration is part of
this phase.
