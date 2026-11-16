# Architectural Decision Records (ADR)
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## Index of Protocol Decisions

- [ADR-001: Why a Custom First-Party Application Protocol?](#adr-001-why-a-custom-first-party-application-protocol)
- [ADR-002: Why an Execution-Centric Application Model?](#adr-002-why-an-execution-centric-application-model)
- [ADR-003: Why WebTransport as Primary Transport Target?](#adr-003-why-webtransport-as-primary-transport-target)
- [ADR-004: Why WebSocket as Guaranteed Production Fallback?](#adr-004-why-websocket-as-guaranteed-production-fallback)
- [ADR-005: Why No P2P Core (No WebRTC Mesh)?](#adr-005-why-no-p2p-core-no-webrtc-mesh)
- [ADR-006: Why No Custom TCP or Raw Transport Protocols?](#adr-006-why-no-custom-tcp-or-raw-transport-protocols)
- [ADR-007: Why No Heavy Service Mesh (Envoy / Istio)?](#adr-007-why-no-heavy-service-mesh-envoy--istio)
- [ADR-008: Why Idempotent Effects Instead of Transport "Exactly-Once"?](#adr-008-why-idempotent-effects-instead-of-transport-exactly-once)
- [ADR-009: Why the Protocol Kernel is Intentionally Tiny (7 Primitives)?](#adr-009-why-the-protocol-kernel-is-intentionally-tiny-7-primitives)
- [ADR-010: Sequence Exhaustion Does Not Wrap](#adr-010-sequence-exhaustion-does-not-wrap)
- [ADR-011: WebTransport Uses One Reliable AEP Carrier Stream](#adr-011-webtransport-uses-one-reliable-aep-carrier-stream)
- [ADR-012: Why Capability Resolution is Separate from Execution](#adr-012-why-capability-resolution-is-separate-from-execution)
- [ADR-013: HELLO Carries the Server Welcome Response](#adr-013-hello-carries-the-server-welcome-response)
- [ADR-014: Replay Availability Is Not Session Validity](#adr-014-replay-availability-is-not-session-validity)

---

## ADR-001: Why a Custom First-Party Application Protocol?

### Status
Accepted (Normative)

### Context
Rocksoul features diverse application modalities: classic relational CRUD (Users, Tasks, Projects), high-volume duplex chat, AI streaming token generation, agent tool handoffs, live browser telemetry, and workspace file delta synchronization. 

Historically, applications stitch together heterogeneous protocols to support these modalities:
- Standard REST over HTTP/1.1 for CRUD.
- Server-Sent Events (SSE) for one-way AI token streaming.
- Ad-hoc WebSocket endpoints for live chat.
- Long-polling for background workflow notifications.

This patchwork introduces major architectural pathologies:
1. Fragmented authentication lifecycles (each socket/stream re-authenticates independently).
2. Multiple concurrent network connections exhausting mobile client batteries and browser connection pools.
3. Inconsistent error envelopes and telemetry across protocols.
4. Total absence of unified backpressure, session resumption, and execution lifecycle tracking.

### Decision
Establish **AEP (Application Execution Protocol)** as a single, first-party, multiplexed binary protocol connecting the web frontend (`/web`) to the backend gateway through a single public SDK (`@app/sdk`).

### Consequences
- **Positive**: Single connection per client session; unified authentication and session resumption; universal observability; unified flow control and priority bands.
- **Negative**: Requires maintaining a formal protocol specification, framing parser, and dedicated test contracts.
- **Mitigation**: Pure dependency boundary (`packages/protocol`) with zero framework ties; tiny kernel keeping implementation simple and verifiable.

---

## ADR-002: Why an Execution-Centric Application Model?

### Status
Accepted (Normative)

### Context
Modern web architectures frequently oscillate between REST (resource-centric) and RPC (procedure-centric). 
- **Resource-centric (REST)** models state as entities but struggles with long-running, multi-stage, or non-CRUD operations like streaming AI agent reasoning, multi-step browser tasks, or collaborative code patching.
- **RPC (gRPC / tRPC)** models function calls well for point-in-time requests, but lacks native primitives for out-of-band progress tracking, pause/resume semantics, durable execution identity, or mid-stream cancellations.

### Decision
Model all operations as **Executions** (`ExecutionModel`). An Execution represents a bounded, stateful, auditable, and observable unit of work identified by a unique `executionId` and driven through a canonical 9-state machine (`CREATED` -> `ACCEPTED` -> `RUNNING` -> `SUCCEEDED`/`FAILED`/`CANCELLED`).

### Consequences
- **Positive**: A single conceptual model unifies short database queries (`project.search`), long-running AI streaming (`ai.ask`), and background asynchronous workflows (`workflow.run`). Progress reporting, cancellation (`SIGNAL`), and recovery operate identically across all domains.
- **Negative**: Simple queries incur the conceptual structure of an execution.
- **Mitigation**: SDK facade collapses point-in-time executions into standard asynchronous promises (`client.run("project.search")`), hiding protocol state machinery from everyday UI component consumption.

---

## ADR-003: Why WebTransport as Primary Transport Target?

### Status
Accepted (Normative)

### Context
Traditional WebSockets operate over a single TCP stream. TCP guarantees strictly ordered delivery across the entire connection. Consequently, if a single packet is lost during a high-volume background data transfer (e.g. workspace file sync or artifact streaming), the entire connection suffers **Head-of-Line (HoL) Blocking**, stalling critical UI control signals, chat messages, and AI token deltas.

WebTransport operates over HTTP/3 (QUIC / UDP) and natively supports:
1. True independent multiplexed bidirectional streams (loss in Stream A never blocks Stream B).
2. Unordered datagrams for ephemeral telemetry and non-critical progress updates.
3. 0-RTT and fast connection migration (switching from Wi-Fi to 5G without session tear-down).

### Decision
Designate **WebTransport** as the primary wire transport target in AEP's multi-transport runtime strategy.

### Consequences
- **Positive**: Complete elimination of Head-of-Line blocking; ultra-low latency for interactive AI streaming; native multiplexing.
- **Negative**: Requires HTTP/3 UDP networking, TLS certificate hashing in local development, and modern browser support. Node.js backend support requires native addon modules not yet standard in pure in-tree Fastify.
- **Mitigation**: Transport runtime automatically negotiates and falls back to WebSocket where WebTransport is unavailable or unsupported.

---

## ADR-004: Why WebSocket as Guaranteed Production Fallback?

### Status
Accepted (Normative)

### Context
While WebTransport is superior for multiplexing, corporate firewalls, enterprise proxies, and constrained cloud hosting environments frequently block UDP (QUIC) traffic. Furthermore, standard Node.js LTS distributions support HTTP/1.1 and HTTP/2 natively, while production-grade HTTP/3 servers in Node.js remain ecosystem-dependent.

### Decision
Guarantee **WebSocket** (`@fastify/websocket` over TCP) as the immediate, zero-friction, production-grade fallback transport. AEP framing, execution states, sequence numbers, and session lifecycles operate identically over WebSocket.

### Consequences
- **Positive**: 100% universal browser compatibility; works out-of-the-box in all hosting providers, reverse proxies (Nginx, Traefik, Cloudflare), and standard Node.js runtimes.
- **Negative**: Reintroduces TCP Head-of-Line blocking across multiplexed logical streams under severe packet loss.
- **Mitigation**: The AEP runtime implements software-level priority queues (Priority Bands 0 to 4) and bounded flow-control buffers to ensure critical control signals jump ahead of bulk payloads before wire transmission.

---

## ADR-005: Why No P2P Core (No WebRTC Mesh)?

### Status
Accepted (Normative)

### Context
Peer-to-Peer (P2P) architectures using WebRTC data channels are sometimes advocated for real-time collaborative applications. However:
1. WebRTC requires complex STUN/TURN/ICE signaling infrastructure with non-deterministic NAT traversal failure rates (8-15%).
2. P2P creates an $O(N^2)$ communication mesh that severely degrades client battery and network bandwidth.
3. Most critically, Rocksoul's canonical state (users, permissions, projects, AI models, SQLite database) is strictly hosted and authoritative on the backend.

### Decision
AEP explicitly rejects a P2P core architecture. AEP is strictly a **Client-to-Gateway** hub-and-spoke protocol.

### Consequences
- **Positive**: Zero NAT traversal complexity; zero TURN server costs; deterministic security boundary; backend remains the single authoritative source of truth.
- **Negative**: Client-to-client interactions (e.g. multi-user chat) must transit the gateway.
- **Mitigation**: Gateway multiplexing and low-latency framing introduce negligible latency overhead (< 2ms).

---

## ADR-006: Why No Custom TCP or Raw Transport Protocols?

### Status
Accepted (Normative)

### Context
Designing custom Layer-4/Layer-5 transport protocols (raw TCP sockets, custom UDP retransmission schemes) is occasionally proposed for maximum performance.

However, web browsers operate in an unprivileged sandbox and have zero access to raw TCP or UDP sockets. Browsers only expose standard W3C APIs: `fetch`, `WebSocket`, and `WebTransport`.

### Decision
AEP operates strictly at the **Application Layer (Layer 7)**, layered on top of W3C-standard web transports. No custom kernel drivers, raw sockets, or proprietary transport layers are permitted.

### Consequences
- **Positive**: Runs identically in any browser (Chrome, Firefox, Safari, Edge), mobile webviews, Electron, and Node.js environments without special permissions.
- **Negative**: Constrained by the behavioral boundaries of standard transport primitives.
- **Mitigation**: Bounded software flow control, sequence acknowledgements, and session resumption provide enterprise-grade reliability atop standard web primitives.

---

## ADR-007: Why No Heavy Service Mesh (Envoy / Istio)?

### Status
Accepted (Normative)

### Context
In microservice architectures, enterprise service meshes (Istio, Linkerd, Envoy sidecars) manage service discovery, mTLS, and traffic routing. 

For Rocksoul's current single-tenant or modular multi-tenant architecture, introducing a sidecar service mesh would:
1. Quadruple operational complexity and infrastructure overhead.
2. Introduce substantial latency hops on localhost/inter-process communication.
3. Complicate development and local testing.

### Decision
Implement the **Application Fabric** as a lightweight, logical capability routing plane embedded directly within the Node.js / Fastify runtime. Node registration and capability discovery are managed via an in-process `CapabilityRegistry` without external sidecars.

### Consequences
- **Positive**: Single-binary or minimal container deployment; instant local startup; sub-millisecond capability resolution.
- **Negative**: Inter-service scaling must be managed through application-level node registration rather than external mesh routing.
- **Mitigation**: The `FabricNode` abstraction defines clean interfaces (`nodeId`, `health`, `capacity`) allowing seamless bridge to Redis or NATS clustering if horizontal multi-node scaling is required in future phases.

---

## ADR-008: Why Idempotent Effects Instead of Transport "Exactly-Once"?

### Status
Accepted (Normative)

### Context
In distributed systems, achieving true "exactly-once delivery" across an unreliable physical network is mathematically impossible (proven by the Two Generals' Problem and the FLP Impossibility Result). Networks drop packets, disconnect prematurely, and delay acknowledgements.

Protocols that claim "exactly-once transport delivery" inevitably fail during network partition edges or server crashes, producing duplicated state or silent data loss.

### Decision
AEP strictly disclaims transport-level exactly-once delivery. Instead, AEP establishes a **tripartite delivery contract**:
1. **Transport Layer**: At-least-once delivery with sequence acknowledgement and replay.
2. **Application Layer**: Idempotent execution processing via `executionId` and `idempotencyKey`.
3. **Business / Persistence Layer**: Single authoritative effect in the SQLite database enforced via unique constraints.

### Consequences
- **Positive**: Mathematically sound; resilient against socket drops, delayed ACKs, and client retransmissions; zero risk of duplicate mutations in production data.
- **Negative**: Mutating capability requests must generate and attach an `idempotencyKey`.
- **Mitigation**: The SDK client automatically generates UUIDv4 idempotency keys for all mutating executions if omitted by the application caller.

---

## ADR-009: Why the Protocol Kernel is Intentionally Tiny (7 Primitives)?

### Status
Accepted (Normative)

### Context
Protocols frequently suffer from "feature creep," adding specialized top-level frame types whenever a new business requirement emerges (e.g. `AI_PROMPT_FRAME`, `TASK_ASSIGN_FRAME`, `BROWSER_ACTION_FRAME`, `WORKSPACE_SYNC_FRAME`).

This leads to:
1. Explosion of parser states and exponential growth in test permutations.
2. Brittle framing code requiring updates whenever business domain logic changes.
3. Inability for intermediate proxies or gateways to route traffic generically.

### Decision
Restrict the AEP protocol kernel strictly to **7 canonical primitives**:
`HELLO`, `OPEN`, `RUN`, `DATA`, `SIGNAL`, `ACK`, and `CLOSE`.

All domain semantics, tool calls, AI streaming tokens, and file diffs are expressed as structured payloads inside `RUN` and `DATA` frames targeting registered `capabilities`.

### Consequences
- **Positive**: The core framing parser is tiny (< 300 lines of code), fully verifiable, and stable over decades. New domains (AI, Coding, Tasks, Workflows) require zero changes to the protocol kernel.
- **Negative**: Advanced protocol-level features must be negotiated through capability metadata rather than custom frame types.
- **Mitigation**: The Capability Registry provides rich declarative schemas, versioning, and validation policies that handle domain diversity cleanly.

## ADR-010: Sequence Exhaustion Does Not Wrap

### Status
Accepted (Normative)

### Decision
Sequence numbers are uint32 values and MUST NOT wrap within a session. A sender MUST initiate stream/session rollover before emitting a sequence beyond `0xFFFFFFFF`; receiving a wrapped value is `INVALID_SEQUENCE`.

### Rationale
The stream constitution already prohibits reuse of stream IDs and defines session rollover. Without an epoch field, wrapped and delayed frames would be indistinguishable.

## ADR-011: WebTransport Uses One Reliable AEP Carrier Stream

### Status
Accepted (Phase 5)

WebTransport is preferred when securely available, with WebSocket as the
fallback. The initial adapter carries all reliable AEP bytes over one
bidirectional WebTransport stream so AEP logical multiplexing, ordering, ACK,
backpressure, and recovery semantics remain identical across transports.
Native stream IDs are not AEP identities. Datagrams are capability-only and are
reserved for a future explicitly ephemeral use case; critical protocol data
never uses datagrams.

## ADR-012: Why Capability Resolution is Separate from Execution

### Status

Accepted (Phase 6 preparation)

### Decision

Capability existence, support, availability, authorization, and input validity
remain separate semantic dimensions. An explicit registry and structured
resolver result are separate from the `CapabilityExecutor` boundary. Resolution
is advisory; the authoritative executor must re-check authorization and
availability before unsafe work.

Capability contracts contain no ORM, database, Fastify, browser, WebSocket, or
WebTransport details. This preserves one execution model and lets static and
future dynamic capabilities share one typed contract.

## ADR-013: HELLO Carries the Server Welcome Response

### Status

Accepted (Normative)

### Context

Earlier protocol documents used `WELCOME` as though it were an eighth frame
type, while the protocol constitution permits exactly seven primitives. Resume
also referred to an undefined `RESUME_ACCEPTED` flag. Both names describe
handshake semantics, not fundamental transport primitives.

### Decision

`WELCOME` is a semantic role of a server-to-client `HELLO` frame on Stream 0.
The server `HELLO` payload sets `helloKind: "WELCOME"`. For resume, it carries
`resume.status` (`ACCEPTED` or `REJECTED`) and `resume.delivery` (`REPLAY`,
`SYNC_SNAPSHOT`, or `NONE`). `RESUME_ACCEPTED` is not a flag. Existing
`RESUME_REQUEST` remains a client `HELLO` request flag, while `SYNC_SNAPSHOT`
is reserved for the accepted snapshot response and snapshot `DATA` frame.

### Consequences

- The kernel remains exactly seven primitives.
- Handshake, initial session establishment, and resume use one bidirectional
  framing contract.
- Implementations must add the documented HELLO payload validation and vectors
  before claiming handshake/resume conformance.

## ADR-014: Replay Availability Is Not Session Validity

### Status

Accepted (Normative)

### Context

The 60-second in-memory replay window was previously treated as a session
grace window in one failure scenario, contradicting the durable 24-hour session
continuity contract.

### Decision

The 60-second / 1,024-frame limit governs only replay availability. A valid
session remains eligible for authoritative state synchronization until its
24-hour dormant TTL expires, it is revoked, or its resume token is invalid.
After replay expiry, resume uses `SYNC_SNAPSHOT`; it must not force logout.

### Consequences

- Gateway state sync is required after a valid replay miss.
- Tests distinguish replay expiry from session expiry.
- Session expiry remains an explicit `CLOSE(SESSION_EXPIRED)` outcome only
  after durable TTL expiry, revocation, invalid token, or incompatibility.

## ADR-015: Durable AEP Resume Token Is Returned in WELCOME

### Status

Accepted (Normative)

### Decision

An initial server `HELLO` response MUST include a one-time-visible
`resumeToken` alongside `sessionId`. The gateway stores only a SHA-256 hash of
that token in the durable AEP session record. A later `HELLO` request with
`mode: "RESUME"` MUST carry the session ID, token, and last acknowledged
sequence. Tokens are rotated on accepted resume; only the replacement token is
returned in the next WELCOME. Resume tokens are credentials, never logged, and
are valid only while the durable session is active and within its 24-hour
dormant TTL.

### Consequences

- The WELCOME schema has an optional `resumeToken` only for server responses.
- The database is the authority for session ownership, expiry, and revocation.
- The in-memory replay ring remains an optimization; state sync is required
  after replay loss or gateway restart.

## ADR-016: Transitional Browser REST Control-Plane Exception

### Status

Accepted (Transitional)

### Decision

`apps/web/src/lib/api-client.ts` remains the typed REST control-plane adapter
for authentication, model CRUD, metadata, notifications, and compatibility
routes. It MUST NOT be used for AEP execution transport. Interactive AI and
future long-running capability operations use `@rocksoul/sdk` through a
separate runtime facade. The exception is transitional until each
REST-backed feature has an equivalent capability contract and browser E2E
coverage.

### Consequences

- The existing REST baseline is not silently reclassified as AEP.
- Direct `fetch` is permitted only inside the central REST adapter, never in
  feature components or feature-specific clients.
- The browser gate remains a tracked migration item, not an unrecorded
  architecture violation.

## ADR-015: Application facade is the default developer boundary

### Status

Accepted (Phase 8)

### Decision

Normal feature code uses typed resources and capabilities through the
application facade. HTTP remains an implementation adapter for compatibility;
it is not the conceptual API of migrated features.

### Consequences

Transport changes, execution state, retries, and normalized errors remain
centralized. Unmigrated features must be tracked explicitly rather than
silently mixing transport concerns into UI code.

## ADR-016: Execution graphs remain local and deterministic

### Status

Accepted (Phase 8)

### Decision

The first graph implementation schedules explicit dependency waves locally. It
does not introduce a remote workflow language, implicit JavaScript execution,
or transactional rollback claims.

### Consequences

Graphs are predictable and testable, while durable orchestration remains a
separate future capability if real requirements emerge.

## ADR-017: Application cursors are opaque facts, not wire sequences

### Status

Accepted (Phase 8)

### Decision

Subscriptions persist server-issued application cursors separately from AEP
frame sequence numbers. A gap triggers replay and, when necessary, explicit
snapshot reconciliation.

### Consequences

Clients cannot infer storage offsets or manufacture continuity. A durable,
cross-process event history is required before horizontal scaling.

## ADR-018: Schema incompatibility fails closed

### Status

Accepted (Phase 8)

### Decision

Optional additive fields are compatible; unknown required semantics and
incompatible major versions are rejected. Capability discovery exposes safe
compatibility information only.

### Consequences

Backend evolution can proceed without breaking older clients, while semantic
changes require explicit versioning and migration work.

## ADR-019: Durable events use a transactional outbox

### Status

Accepted (Phase 8 follow-up)

### Decision

Domain mutations and their authoritative application events are written in the
same database transaction through an outbox record. A bounded dispatcher reads
committed outbox records, assigns application cursors, and delivers them to
subscribers. Replay reads the committed outbox rather than process memory.

### Invariants

- A committed mutation has an event available for dispatch.
- An event cannot be dispatched for a rolled-back mutation.
- Dispatcher retries are idempotent and do not duplicate business effects.
- Replay and live delivery use the same event identity and authorization filter.
- Queue and retention limits remain bounded; exhaustion is observable.

### Consequences

The current in-memory hub remains a single-process implementation checkpoint.
The durable adapter requires a migration, transaction-aware mutation helpers,
and concurrency/failure tests before replacing it in production.
