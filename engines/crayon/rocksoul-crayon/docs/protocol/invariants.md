# Protocol Invariants Charter
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

The following **28 Protocol Invariants** are mathematically binding laws governing the design, implementation, and verification of AEP across all phases:

---

### P001: Exactly One Frontend Communication Gate
- **Statement**: All frontend network communication to the application fabric must pass strictly through `@app/sdk`.
- **Rationale**: Prevents fragmented transport logic, bypass of telemetry, and leaked endpoints.
- **Failure Example**: A developer writing `fetch('/api/v1/models/tasks')` directly inside a React component.
- **Enforcement**: Architecture boundary linter and build check.
- **Test Strategy**: ESLint boundary rule preventing direct imports of `fetch`, `axios`, or `WebSocket` in `apps/web/src`.

---

### P002: Exactly One Canonical Execution Model
- **Statement**: Every application operation (CRUD, AI generation, file transfer, workflow) must be executed as an instance of the Canonical Execution lifecycle.
- **Rationale**: Eliminates ad-hoc state machines, fragmented error models, and mismatched progress reporting.
- **Failure Example**: Creating a custom WebSocket helper that emits raw `socket.send("task_done")` bypassing `ExecutionState`.
- **Enforcement**: Runtime capability executor requiring `ExecutionIdentity`.
- **Test Strategy**: Automated contract test verifying every capability produces a valid `ExecutionIdentity` and transitions through standard states.

---

### P003: Transport Implementation Cannot Leak Into Feature Code
- **Statement**: Feature and UI code must not contain transport-specific logic, branching, or assumptions (`if (isWebSocket)`).
- **Rationale**: Allows runtime transport negotiation and upgrade (WebTransport vs WebSocket) without UI regressions.
- **Failure Example**: UI checking `socket.readyState` instead of `execution.status`.
- **Enforcement**: Public SDK exports zero transport classes or socket primitives.
- **Test Strategy**: Typecheck enforcement: SDK public facade exposes zero transport classes or socket interfaces.

---

### P004: Every Reliable Stream Is Monotonic
- **Statement**: Frame sequence numbers on a reliable stream must increment strictly monotonically ($s_{n+1} = s_n + 1$).
- **Rationale**: Guarantees deterministic packet ordering and detectable frame loss.
- **Failure Example**: Sending sequence `4` immediately after sequence `2` without frame `3`.
- **Enforcement**: Sequence validator in stream reorder queue.
- **Test Strategy**: Unit test asserting parser raises `SEQUENCE_GAP_DETECTED` on skipped sequence numbers.

---

### P005: Duplicate Transport Messages Cannot Produce Duplicate Business Effects
- **Statement**: Re-transmitting a `RUN` frame due to network retransmission must result in at most one state mutation in the database.
- **Rationale**: Networks retry; task assignment, banking, and message posting must remain idempotent.
- **Failure Example**: Network timeout on POST /tasks creating two identical tasks in SQLite.
- **Enforcement**: SQLite unique constraint `(actor_id, capability_id, idempotency_key)` on `execution_records`.
- **Test Strategy**: Fault injection test firing 10 concurrent identical `RUN` frames and asserting exactly 1 row is created in SQLite.

---

### P006: Invalid Execution Transitions Are Rejected
- **Statement**: The Execution state machine must reject any transition not defined in the formal state transition matrix.
- **Rationale**: Prevents resurrection of cancelled tasks or double-completion races.
- **Failure Example**: An execution transitioning from `CANCELLED` directly to `SUCCEEDED`.
- **Enforcement**: State machine transition table validator throwing `INVALID_STATE_TRANSITION`.
- **Test Strategy**: Fuzz test attempting all 81 combinatorial transitions, verifying only the approved transitions succeed.

---

### P007: Queues Are Bounded
- **Statement**: All internal buffers and queues must enforce explicit upper byte and frame limits. Unbounded queues are strictly forbidden.
- **Rationale**: Protects browser tabs and server processes from out-of-memory crashes during disconnections.
- **Failure Example**: Browser queueing 500 MB of frames in memory while offline.
- **Enforcement**: Bounded circular buffers enforcing `maxBufferBytes` (2 MB) and `maxPendingFrames` (64).
- **Test Strategy**: Property test flooding stream at 100x drain rate and asserting backpressure policy (`BLOCK` / `FAIL_STREAM`) engages.

---

### P008: Server Remains Authoritative
- **Statement**: The server is the sole arbiter of execution outcomes, entity states, and capability authorizations. Client claims are un-trusted.
- **Rationale**: Prevents authorization bypass and state corruption.
- **Failure Example**: Client claiming an execution succeeded before server confirmation.
- **Enforcement**: Server gateway validates every frame and verifies all authorization claims.
- **Test Strategy**: Security audit test verifying client-forged terminal status is ignored by the gateway.

---

### P009: Unknown Optional Protocol Data Cannot Crash Runtime
- **Statement**: Protocol parsers must safely ignore unknown optional fields, flags, and event types without throwing unhandled exceptions.
- **Rationale**: Enables backward-compatible rolling deployments between newer and older versions.
- **Failure Example**: Client throwing fatal syntax error upon receiving an unknown metadata key in a payload.
- **Enforcement**: Schema decoders parse known schemas and preserve unknown keys in an open metadata bucket.
- **Test Strategy**: Fuzz test injecting random unknown fields into valid AEP frames.

---

### P010: Reconnect Cannot Implicitly Create a Second Execution
- **Statement**: Reconnecting a dropped session must re-attach to existing active executions rather than re-running them.
- **Rationale**: Prevents duplicate task executions on transient Wi-Fi drops.
- **Failure Example**: Reconnecting after 5s network drop causing an AI generation run to restart from scratch.
- **Enforcement**: Resumption handshake matches `executionId` from active session registry.
- **Test Strategy**: Disconnect test dropping physical socket mid-run, asserting session re-attaches cleanly.

---

### P011: Capability Availability and Authorization Are Separate
- **Statement**: Advertising capability existence does not grant permission to execute it. Authorization is evaluated upon dispatch.
- **Rationale**: Protects administrative capabilities from unauthorized access by authenticated low-privilege actors.
- **Failure Example**: A standard user invoking `admin.purge_database` because the capability is listed in the manifest.
- **Enforcement**: `CapabilityPolicy` engine evaluates actor session claims upon `RUN`.
- **Test Strategy**: Integration test asserting 403 / `CAPABILITY_UNAUTHORIZED` for unauthorized actor dispatching known capability.

---

### P012: Cross-Stream Ordering Is Never Assumed Without Causal Metadata
- **Statement**: The runtime must not rely on arrival order across independent streams without explicit `causationId` or `parentExecutionId`.
- **Rationale**: Different multiplexed streams may be prioritized or processed on different worker threads.
- **Failure Example**: Assuming stream 3 events arrive before stream 5 events on the network.
- **Enforcement**: Stream scheduler makes zero cross-stream sequence guarantees.
- **Test Strategy**: Protocol verification test simulating arbitrary stream interleaving.

---

### P013: Protocol Downgrade Cannot Happen Silently
- **Statement**: The transport layer must not downgrade security or version protocols without explicit negotiation.
- **Rationale**: Prevents MITM downgrade attacks.
- **Failure Example**: Falling back from encrypted WSS to unencrypted WS without developer configuration.
- **Enforcement**: Transport negotiation verifies transport security level.
- **Test Strategy**: Security test asserting error on attempted plaintext downgrade.

---

### P014: Existing Domain Remains Source of Truth
- **Statement**: The Fastify service layer, Drizzle schemas, and SQLite database are the ground truth; AEP does not duplicate or bypass them.
- **Rationale**: Preserves architectural integrity and zero-redundancy principle.
- **Failure Example**: Writing AEP execution results to an isolated storage table that is out of sync with Drizzle models.
- **Enforcement**: Capability executors call canonical existing services directly.
- **Test Strategy**: E2E test verifying Drizzle ORM queries return data generated via AEP executions.

---

### P015: Every Production Bug Produces a Regression Test
- **Statement**: Any defect identified in protocol framing, execution state, or transport must be accompanied by an automated reproduction test.
- **Rationale**: Guarantees system resilience and prevents regression debt.
- **Failure Example**: Fixing a framing parser bug without adding a unit test to the suite.
- **Enforcement**: CI pipeline rejects PRs marked as bug fixes without accompanying test fixtures.
- **Test Strategy**: Continuous integration verification enforcing test coverage on bug fixes.

---

### P016: Frame Validation Is Fail-Closed
- **Statement**: Any frame failing byte checks, magic matching, or size bounds must be dropped immediately; the parser must not attempt heuristic recovery.
- **Rationale**: Prevents memory corruption and parser exploit chaining.
- **Failure Example**: Parser reading arbitrary memory when length header exceeds buffer size.
- **Enforcement**: Strict 8-step validation order in frame reader.
- **Test Strategy**: Binary fuzzing test sending random byte streams to the frame decoder.

---

### P017: No Shadow Domain Models Allowed
- **Statement**: No domain models prefixed with `AI*` or `Proto*` may be created. Canonical models (`User`, `Project`, `Task`, `Mail`) must be used.
- **Rationale**: Adheres strictly to Section 0 (Absolute Rules).
- **Failure Example**: Defining `AITask` in the protocol package.
- **Enforcement**: Monorepo architectural rule and ESLint naming policy.
- **Test Strategy**: Static analysis rule rejecting duplicate entity definitions.

---

### P018: In-Memory Cache Is Never Source of Truth for Idempotency
- **Statement**: Idempotency status must be checkable against persistent SQLite database state to survive gateway crashes.
- **Rationale**: Gateway restarts must not wipe out deduplication guarantees.
- **Failure Example**: Rebooting the server allows a retried `RUN` request to double-insert records.
- **Enforcement**: Atomic insert into `execution_records` with SQLite unique index.
- **Test Strategy**: Gateway crash simulation during in-flight duplicate dispatch.

---

### P019: Cancellation Is Idempotent and Race-Safe
- **Statement**: Disagreeing races between `CANCEL` and `COMPLETED` must resolve deterministically without corrupting execution state.
- **Rationale**: Network latency causes control signals to race with terminal data frames.
- **Failure Example**: Cancel signal arriving after completion causing execution to enter an unhandled corrupted state.
- **Enforcement**: Terminal state check prior to processing cancellation signal.
- **Test Strategy**: Race condition test firing `CANCEL` concurrently with `DATA(FIN)`.

---

### P020: Priority Inversion Is Prohibited
- **Statement**: A stream with higher priority must never be blocked by a stream with lower priority.
- **Rationale**: Critical control and cancellation signals must penetrate saturated data pipelines.
- **Failure Example**: A large file upload preventing an execution cancellation signal from reaching the executor.
- **Enforcement**: Priority-aware dequeuing in transport scheduler.
- **Test Strategy**: Priority saturation test transmitting Priority 0 frames during heavy Priority 3 streaming.

---

### P021: Production Error Responses Never Leak Internal Diagnostics
- **Statement**: Production error payloads must not include stack traces, server file paths, or raw database queries.
- **Rationale**: Hardens against internal system reconnaissance.
- **Failure Example**: Client displaying SQLite syntax error with server absolute directory path.
- **Enforcement**: Error sanitizer masking raw errors when `NODE_ENV === 'production'`.
- **Test Strategy**: Error serialization test in `NODE_ENV=production`.

---

### P022: Heartbeat Timeout Triggers Automatic Session Suspension
- **Statement**: Absence of peer heartbeat signals beyond the negotiated ping timeout must transition the session to `SUSPEND`.
- **Rationale**: Prevents half-open zombie connections from consuming server resources.
- **Failure Example**: Disconnected mobile device leaving unmonitored server resources allocated indefinitely.
- **Enforcement**: Ping/pong watchdog timer closing silent sockets.
- **Test Strategy**: Simulated network silent disconnect with timer expiration.

---

### P023: Client Credentials Are Never Logged in Plaintext Telemetry
- **Statement**: Passwords, bearer tokens, and raw API keys must be scrubbed from all execution logs and telemetry events.
- **Rationale**: Prevents credential leakage across observability pipelines.
- **Failure Example**: Logging `Authorization: Bearer xyz` in trace payloads.
- **Enforcement**: Telemetry redact utility stripping secret keys before logging.
- **Test Strategy**: Automated audit asserting zero raw secret tokens in telemetry events.

---

### P024: Terminal States Are Irreversible
- **Statement**: Once an Execution reaches `SUCCEEDED`, `FAILED`, `CANCELLED`, or `EXPIRED`, its state can never be modified.
- **Rationale**: Guarantees immutability of audit ledgers and historical logs.
- **Failure Example**: Execution transitioning from `SUCCEEDED` back to `RUNNING`.
- **Enforcement**: State machine transition table with terminal rows having 0 outgoing transitions.
- **Test Strategy**: State machine test attempting to mutate terminal execution states.

---

### P025: Stream 0 Is Strictly Reserved for Control Traffic
- **Statement**: Stream index `0` must never carry application payload data or domain executions.
- **Rationale**: Guarantees a dedicated out-of-band channel for session maintenance and emergency signals.
- **Failure Example**: Dispatching a `RUN` frame on Stream 0.
- **Enforcement**: Frame router throwing error if `streamId === 0` and `frameType === RUN`.
- **Test Strategy**: Stream router assertion rejecting non-control frames targeting Stream 0.

---

### P026: Zero Pre-Allocation Before Bounds Verification
- **Statement**: Parsers must never allocate memory buffers based on declared `payloadLength` before confirming that `payloadLength <= MAX_FRAME_PAYLOAD` (16 MB).
- **Rationale**: Protects against remote denial-of-service and V8 process panics caused by maliciously inflated length headers (`0xFFFFFFFF`).
- **Failure Example**: A parser executing `Buffer.alloc(readUInt32BE(32))` directly upon reading the length bytes.
- **Enforcement**: Fail-closed parser Step 6 boundary check executed prior to buffer allocation.
- **Test Strategy**: Fuzz test transmitting frames with declared length `0xFFFFFFFF` and asserting $O(1)$ rejection without memory allocation increase.

---

### P027: Parity of Logical Stream Semantics Across Transports
- **Statement**: Application stream semantics, ordering, sequence numbers, and backpressure must behave identically over WebTransport and WebSocket.
- **Rationale**: Guarantees that falling back to WebSocket introduces zero regressions in application logic.
- **Failure Example**: An application feature failing or requiring branching logic when switched from WebTransport to WebSocket.
- **Enforcement**: Protocol kernel operates strictly above transport adapters without leaking transport identity.
- **Test Strategy**: Parameterized integration test running identical stream test scenarios over both WebTransport and WebSocket adapters.

---

### P028: Stream ID Monotonicity and Scope Strictly Per Session
- **Statement**: Logical Stream IDs must increment monotonically, with client allocating odd IDs and server allocating even IDs, scoped strictly per Session.
- **Rationale**: Prevents ID collisions between client and server, and preserves in-flight stream continuity across transport reconnects.
- **Failure Example**: Reconnecting transport resets stream counter to 1, colliding with an unacknowledged stream from the prior connection.
- **Enforcement**: Stream manager validates odd/even parity and enforces session-wide monotonic counter.
- **Test Strategy**: Allocation test asserting strictly increasing odd numbers for client streams across multiple reconnections.

### P029: Session Identity Survives Connection Replacement
- **Statement**: Replacing a Connection must preserve `sessionId` and allocate a new `connectionId`.
- **Enforcement**: Session continuity contract and generation ownership.

### P030: Resume Cannot Create or Reopen Executions
- **Statement**: Resume re-attaches existing executions only; terminal executions remain terminal.
- **Enforcement**: Execution ledger/runtime, with `executionSurvivalMatrix` as the contract reference.

### P031: Stale Attachments Cannot Mutate Current Session State
- **Statement**: Only the current `(sessionId, connectionId, sessionGeneration)` owner may mutate session state.
- **Enforcement**: Single active attachment and generation check.

### P034: Metadata Is Non-Executable Presentation Data
- **Statement**: Frontend metadata may select only allow-listed renderers and icons; it must never load code, HTML, or components from metadata values.
- **Enforcement**: Zod normalization and controlled registries at the UI runtime boundary.

### P035: Metadata Failures Are Locally Isolated
- **Statement**: Malformed or unavailable resource metadata must not crash the application shell or unrelated navigation.
- **Enforcement**: Safe normalization and resource-local loading/error states.

### P036: Resource Navigation Has One Metadata Authority
- **Statement**: Model-backed navigation derives from backend AutoMenu; specialized/system entries are explicit implementation mappings only.
- **Enforcement**: Navigation runtime normalization boundary.

### P037: Client Metadata Is Not Authorization
- **Statement**: Visibility and enabled state derived from metadata do not grant permission; backend authorization remains authoritative for every CRUD operation.
- **Enforcement**: SDK transport boundary and server responses.

### P038: Generic Resource Rendering Is Model-Agnostic
- **Statement**: Core metadata resource rendering must not branch on individual model names.
- **Enforcement**: `ResourcePage`, `MetadataTable`, and `MetadataForm` consume normalized descriptors only.

### P039: Resource Metadata Is the Generic UI Schema
- **Statement**: Model table, form, relation, searchable, and sort metadata supplied by the backend define the generic resource UI schema.
- **Enforcement**: Metadata normalizer and resolver.

### P040: Server Authorization Is Independent of Metadata
- **Statement**: Every generic model discovery and CRUD operation must resolve a server-owned principal, resource, action, and record scope before execution; missing policy information denies access.
- **Enforcement**: `apps/api/src/security/authorization.ts` and the generic model route.
- **Test Strategy**: HTTP regression tests prove ordinary-user denial, API-key scope denial, and admin positive paths.
