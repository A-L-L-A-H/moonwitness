# AEP Protocol Readiness Matrix

**Assessment date:** 2026-09-08  
**Assessment scope:** protocol governance, current local source surfaces, and narrow automated checks.  
**Assessment rule:** this document records evidence and blockers. It does not amend any normative protocol behavior.

## Status vocabulary

- **FOUNDATION**: contracts or isolated components exist.
- **IMPLEMENTED**: a local component exists, but its dependent boundary is not proven.
- **INTEGRATED**: adjacent components are connected for the stated scope.
- **VERIFIED**: relevant automated evidence passed for the stated scope.
- **BLOCKED**: a normative contradiction or missing prerequisite prevents a conformance claim.

## Current readiness

| Area | Current status | Evidence | Missing proof / blocker |
|---|---|---|---|
| Specification governance | **VERIFIED** | Protocol documents now share the `1.1.0-normative` baseline; ADR-013 and ADR-014 define handshake/resume and continuity windows. | Resume and durable-session behavior still require a separately verified gateway phase. |
| Pure protocol kernel | **VERIFIED** for local codec behavior and HELLO schema | `packages/protocol`; 18 protocol tests passed, including vectors, fragmented input, MessagePack, malformed bytes, sequence, ACK, header validation, HELLO request/welcome validation, and aggregate decoder bounds. | The parser is bounded; per-stream queue/backpressure enforcement remains a runtime/gateway responsibility. |
| SDK runtime and execution handles | **INTEGRATED** for initial/resume bootstrap | The SDK emits initial or resume HELLO, stores the rotated resume token, validates WELCOME, and reaches `READY` only after that response; 33 SDK tests passed. | Client-side snapshot reconciliation and automatic transport replacement remain incomplete. |
| Capability registry/resolution | **INTEGRATED** for registered AEP capabilities | Server-owned resolver canonicalizes `chat` to `ai.chat`, validates the capability schema, and fails closed for unknown IDs before durable dispatch. | Additional executor adapters beyond `ai.chat` remain future work. |
| WebSocket carrier | **INTEGRATED** for authenticated bootstrap and bounded execution dispatch | Upgrade authentication, principal binding, HELLO/WELCOME, RUN authorization, ACK, DATA, resume, replay, cancellation, per-stream limits, and sanitized failure handling are covered by API tests. | Native WebTransport parity and production metrics remain incomplete. |
| WebTransport carrier | **INTEGRATED** | SDK adapter, selector tests, isolated HTTP/3 sidecar, and native Chromium acceptance pass with 25 sequential sessions, fragmented/concatenated AEP frames, concurrency, strict pin rejection, and cleanup. | Production deployment metrics and cross-browser qualification remain incomplete. |
| Delivery, idempotency, and recovery | **INTEGRATED** for durable identity and snapshot resume | `execution_records` and `aep_sessions` are database-backed; resume token hashes are rotated and valid sessions return an authoritative execution snapshot. | Replay ring, concurrent duplicate proof, worker restart recovery, client snapshot reconciliation, and in-flight cancellation remain incomplete. |
| Browser communication gate | **INTEGRATED** under ADR-016 transitional boundary | `apps/web/src/lib/api-client.ts` is the single typed REST control-plane adapter; AEP execution transport remains in SDK/gateway scope. | Feature-level migration to capability-backed AEP operations and browser E2E proof remain incomplete. |
| Security and parser bounds | **INTEGRATED** for framing/bootstrap/initial dispatch | Header checks, payload limit, aggregate decoder bound, upgrade auth, principal authorization, schema validation, per-stream 64 in-flight cap, and 2 MB/256-message rate window are implemented and rate overflow is tested. | Dedicated in-flight saturation test, outbound queue accounting, session replay, and full capability policy coverage remain. |
| Credential hygiene | **INTEGRATED** | Hardcoded live-looking seed credential removed; development API key seeding now requires explicit `ROCKSOUL_DEV_API_KEY`; auth regression suite passes. | Existing operator environment values and historical non-live test fixtures still require deployment review. |
| Full system verification | **FOUNDATION** | E2E, API, protocol, SDK, and WebTransport test suites are present. | This assessment ran only narrow protocol/SDK/WebSocket checks; it did not establish full API, browser, recovery, authorization, or native WebTransport conformance. |

## Resolved contradiction register

### C-001 — Specification version and status drift

`constitution.md`, `decisions.md`, `lifecycle.md`, `errors.md`, `events.md`, `failure-matrix.md`, `security.md`, `serialization.md`, and `versioning.md` identify themselves as `1.0.0-draft`. `framing.md`, `execution.md`, `streams.md`, `delivery.md`, `recovery.md`, `capabilities.md`, `invariants.md`, and `testing.md` identify themselves as `1.1.0-normative`.

**Impact:** agents cannot determine one coherent normative release or whether later requirements supersede draft text.  
**Required decision:** name the canonical AEP release/status, define supersession, then align document headers and an explicit change log.  
**Resolution:** all protocol document headers now identify `1.1.0-normative`; the phase ledger records scope independently from the protocol version.  
**Status:** **RESOLVED**.

### C-002 — `WELCOME` is described as a frame but is not a canonical primitive

The constitution permits only `HELLO`, `OPEN`, `RUN`, `DATA`, `SIGNAL`, `ACK`, and `CLOSE`. `lifecycle.md`, `recovery.md`, `failure-matrix.md`, and `versioning.md` describe `WELCOME` as a server frame.

**Impact:** a conforming implementation cannot encode the handshake/resume response without either introducing an eighth primitive or guessing that `WELCOME` is a payload/state label.  
**Required decision:** specify the canonical carrier for welcome/resume response (for example, a `HELLO` response payload or another existing primitive), its schema, stream scope, and transition effect; then update all affected documents and vectors.  
**Resolution:** ADR-013 and `framing.md` define `WELCOME` as the semantic role of a server-to-client `HELLO` frame on Stream 0. No eighth primitive was introduced.  
**Status:** **RESOLVED**; implementation conformance is tracked in G-004.

### C-003 — `RESUME_ACCEPTED` is used as a flag but has no framed definition

`recovery.md` and `failure-matrix.md` use `RESUME_ACCEPTED` in `WELCOME` flags. The framing flag registry defines `RESUME_REQUEST` and `SYNC_SNAPSHOT`, but no `RESUME_ACCEPTED` bit or payload field.

**Impact:** resume acceptance cannot be encoded interoperably.  
**Required decision:** define it as an existing-payload field or allocate a flag through the versioning process; specify its bit/schema, validity by frame type, and compatibility behavior.  
**Resolution:** ADR-013 defines `resume.status` in the server HELLO payload. `RESUME_REQUEST` remains the client flag; `RESUME_ACCEPTED` is not a flag.  
**Status:** **RESOLVED**; implementation conformance is tracked in G-004.

### C-004 — 60-second expiry conflicts with 24-hour recovery eligibility

Failure F11 says a session resumed after more than 60 seconds must receive `CLOSE(SESSION_EXPIRED)`. `recovery.md` instead defines 60 seconds as the ephemeral replay-buffer window and permits authoritative state sync for a valid session within a 24-hour dormant TTL.

**Impact:** reconnect behavior after 60 seconds is undefined between forced logout and state synchronization.  
**Required decision:** reserve 60 seconds for replay availability and define session expiry independently, or intentionally change the recovery contract. Update F11, lifecycle grace terminology, and recovery branches together.  
**Resolution:** ADR-014 reserves 60 seconds for replay availability and retains the 24-hour dormant TTL for session validity. F11 now requires state sync after replay expiry, while F11A covers true session expiry.  
**Status:** **RESOLVED**; gateway recovery implementation remains future work.

### C-005 — Phase labels are stale relative to recorded implementation phases

`testing.md` presents Phase 2 as pre-implementation while `runtime.md`, transport documents, and ADR-011/012 record Phase 3 through Phase 6-preparation work.

**Impact:** the active phase and permitted implementation scope are unclear to future agents.  
**Required decision:** publish a phase ledger that marks completed, partial, blocked, and future phases without changing protocol semantics.  
**Resolution:** `phase-ledger.md` now publishes the current phase record and evidence boundaries.  
**Status:** **RESOLVED**.

## Implementation conformance findings

These are source-to-specification findings, not specification changes.

### G-001 — Direct browser application networking

`apps/web/src/lib/api-client.ts` uses `fetch` directly. This conflicts with Constitution P001's stated single frontend communication gate. Existing REST endpoints may remain a baseline, but the specification must explicitly define any transitional exception rather than leaving the boundary implicit.

### G-002 — Decoder buffering was not explicitly bounded

`packages/protocol/src/index.ts` grows `FrameDecoder`'s aggregate buffer by concatenating every incoming chunk before a complete frame is available. A malicious or faulty transport can provide an arbitrarily large chunk or indefinite incomplete input. This conflicts with P007's bounded-queue requirement and P026's resource-bounds objective.

**Resolution:** `framing.md` §2.2 sets the `16,777,252` byte aggregate bound (one maximum wire frame). `FrameDecoder` rejects overflow and clears partial state; protocol adversarial tests verify both oversized chunks and incomplete floods.

**Status:** **RESOLVED**.

### G-003 — Gateway scope is intentionally bounded

`apps/api/src/plugins/aep-websocket.ts` authenticates the upgrade, binds the principal, authorizes `ai.chat`, persists execution/session identities, delegates to `@rocksoul/ai-base`, enforces per-stream sequence/order, in-flight limits, inbound rate limits, outbound byte budgets, cancellation, and sanitized lifecycle events. General capability registration beyond the current allowlist and production metrics remain future work.

### G-004 — HELLO response and resume schema is implemented; native proof remains open

`packages/protocol/src/index.ts` exports typed request/welcome payloads and validates Stream-0 role, resume fields, token, and `RESUME_REQUEST` / `SYNC_SNAPSHOT` consistency. The SDK and gateway support initial/resume token exchange; the gateway persists sessions, rotates tokens, replays unacknowledged DATA within the 60-second authority window, falls back to an execution snapshot, and has restart/replay-expiry coverage. Native WebTransport browser proof now passes; full client snapshot reconciliation remains open.

## Verification evidence

The following checks ran against the current workspace on 2026-09-08:

| Command | Result | Scope |
|---|---|---|
| `pnpm --filter @rocksoul/protocol test` | 18 passed | codec, vectors, properties, malformed data, fragmentation, HELLO request/welcome schema, bounded aggregate decoder |
| `pnpm --filter @rocksoul/sdk test` | 33 passed | runtime, sessions, capabilities, selector, WebSocket, WebTransport mocks |
| `pnpm --filter @rocksoul/api exec node --test tests/aep-websocket.test.js` | 9 passed | auth, HELLO/WELCOME, RUN→ACK→DATA, duplicate idempotency, rate overflow, restart resume, replay hit/expiry, cancellation race, outbound queue overflow |
| `pnpm --filter @rocksoul/api exec node --test tests/aep-capabilities.test.js` | 2 passed | canonical capability resolution, aliasing, schema validation, fail-closed unknown capability |
| `pnpm --filter @rocksoul/api exec node --test tests/authorization-http.test.js tests/stats.test.js` | 6 passed | auth policy, API-key scopes, dashboard/auth regression after seed credential removal |

The API test invokes the repository seeding workflow and therefore refreshed local `data/sqlite.db`. No destructive cleanup or database migration was performed by this assessment.

## Ordered next decisions

1. Add production WebTransport observability and cross-browser qualification beyond the passing Chromium acceptance gate.
2. Add production metrics/observability and full browser-to-database E2E.
3. Complete capability registration beyond the current `ai.chat` allowlist.
4. Keep the native WebTransport claim scoped to the verified Chromium/container topology until production qualification exists.
