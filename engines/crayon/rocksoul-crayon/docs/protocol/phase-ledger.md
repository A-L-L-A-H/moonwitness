# AEP Phase Ledger

**Protocol baseline:** AEP `1.1.0-normative`  
**Purpose:** record implementation readiness without redefining normative wire behavior.

| Phase | Scope | Current status | Evidence / boundary |
|---|---|---|---|
| 1 | Specification and protocol constitution | **VERIFIED** | AEP 1.1 documentation baseline, ADR-013, ADR-014, and readiness matrix. |
| 2 | Pure protocol kernel | **VERIFIED** for local codec scope | `packages/protocol` validates typed Stream-0 HELLO request/welcome payloads, canonical/malformed vectors, and bounded aggregate decoder behavior. |
| 3 | Application Communication Runtime | **INTEGRATED** for initial/resume bootstrap | SDK reaches `READY` only after typed WELCOME, persists the rotated resume token, and emits resume HELLO after suspension; snapshot reconciliation remains future work. |
| 4 | WebSocket transport | **INTEGRATED** for authenticated dispatch and resume snapshot | SDK adapter and Fastify gateway interoperate for auth, HELLO/WELCOME, RUN→ACK→DATA, token resume, and snapshot sync; replay ring and backpressure fault matrix remain incomplete. |
| 5 | WebTransport transport and infrastructure | **INTEGRATED** | Native Chromium HTTP/3 acceptance passes in the isolated container topology: 25 sequential sessions, fragmented/concatenated AEP framing, concurrency, strict TLS pin rejection, and cleanup. Production deployment observability remains follow-up work. |
| 6 | Capability resolution and Application Fabric | **INTEGRATED** for `ai.chat` | Authenticated WebSocket RUN is authorized and delegated to the canonical `@rocksoul/ai-base` service; general registry-driven dispatch remains future work. |
| 7 | Durable delivery, recovery, and gateway execution | **INTEGRATED** for durable session/snapshot foundation | `execution_records` persists accepted/terminal identities and `aep_sessions` persists hashed rotating resume tokens with 24-hour TTL; replay ring, queues, and restart worker recovery remain incomplete. |
| 8 | Application Fabric SDK, semantic resources, events, subscriptions, graph, and UI adoption | **INTEGRATED / PARTIALLY VERIFIED** | SDK facade, typed Projects/Tasks contracts, native Projects/Tasks CRUD/watch, transactional CRUD outbox foundation, durable event log hydration, `mail.send`, batch/graph/retry/schema/cursor primitives, and browser Mail execution smoke test are implemented. Outbox dispatch/replay hardening, full UI migration, transport comparison benchmark, and cross-browser qualification remain open. |

## Phase rules

- A later phase may not be claimed solely because a component or test fixture exists.
- `FOUNDATION` and `INTEGRATED` are not production-readiness claims.
- Each future phase must identify governing documents, affected invariants, failure-matrix rows, conformance tests, and documentation changes before implementation begins.
- The detailed evidence and open gaps are maintained in `readiness-matrix.md`.
