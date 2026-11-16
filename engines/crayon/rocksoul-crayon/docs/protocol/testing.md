# Protocol Test Contracts & Property Test Specification
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Test Architecture & Methodology

AEP adopts a rigorous, verification-first engineering methodology. The core protocol defines **10 Property Tests**; AEP 1.1 adds explicit handshake/resume conformance vectors that any conforming implementation must satisfy.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Phase 2 Implementation                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    AEP Test Harness                         │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Property-Based Fuzzing    │ 3. Fault Injection Matrix    │
│    (fast-check / random byte)│    (F01 - F20 fault suits)   │
├──────────────────────────────┼──────────────────────────────┤
│ 2. State Machine Exhaustion  │ 4. Transport Parity Suite    │
│    (All combinatorial paths) │    (WebTransport & WebSocket)│
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. The 10 Normative Property Tests

### Property 1: Encode/Decode Round-Trip Symmetry
- **Mathematical Law**:
  $$\forall H \in \text{ValidHeaders}: \text{decode}(\text{encode}(H)) \equiv H$$
- **Generator**: Generates $10,000$ valid random headers with varying `frameType` (`0x01..0x07`), `streamId` (`0..2^{32}-1`), `sequence` (`0..2^{32}-1`), `priority` (`0..4`), `timestamp`, and `flags`.
- **Assertion**: Decoded header object must deep-equal the generated header object.

### Property 2: Canonical Byte Encoding Determinism
- **Mathematical Law**:
  $$\forall B \in \text{ValidCanonicalBuffers}: \text{encode}(\text{decode}(B)) \equiv B$$
- **Generator**: Generates $10,000$ canonical 36-byte byte buffers matching normative endianness and ranges.
- **Assertion**: Binary re-encoding must reproduce the exact byte sequence byte-for-byte.

### Property 3: Header Length Correctness
- **Mathematical Law**:
  $$\forall H \in \text{ValidHeaders}: \text{byteLength}(\text{encode}(H)) \equiv 36$$
- **Assertion**: Under no condition may `encode(header)` return an array with length $\neq 36$.

### Property 4: Malformed Frame Fail-Closed Rejection
- **Law**: Any corrupted header must fail at or before Step 6 without throwing unhandled exceptions, crashing, or allocating heap memory.
- **Generators**:
  - Truncated buffers (0 to 35 bytes).
  - Corrupted magic bytes (`!= 0x41455031`).
  - Out-of-range frame types (`0x00`, `0x08..0xFF`).
  - Inflated payload lengths (`16,777,217` up to `0xFFFFFFFF`).
- **Assertion**: Parser returns deterministic error code (`PROTOCOL_CORRUPTED`, `UNKNOWN_FRAME_TYPE`, `OVERSIZED_PAYLOAD`). Heap memory remains delta-neutral ($O(1)$).

### Property 5: Unknown Optional Field & Flag Tolerance
- **Law**: Unknown optional fields in payload or reserved bits (`0xFF80`) in flags must be safely ignored without disrupting parsing.
- **Generator**: Valid frames injected with arbitrary extra JSON/MessagePack keys and reserved flag bits set to `1`.
- **Assertion**: Parser extracts known fields cleanly; unknown fields are preserved in metadata bucket without throwing.

### Property 6: Per-Stream Monotonic Sequence Integrity
- **Law**:
  $$\forall s_n, s_{n+1} \in \text{StreamFrames}: \text{seq}(s_{n+1}) = \text{seq}(s_n) + 1$$
- **Generator**: Emits sequences with intentional gaps (e.g. 1, 2, 4).
- **Assertion**: Parser rejects out-of-order sequence with `SEQUENCE_GAP_DETECTED` and holds frame in reorder buffer.

### Property 7: Cumulative ACK Monotonicity & Idempotency
- **Law**:
  $$\text{ackSeq}_{t_2} \ge \text{ackSeq}_{t_1}, \quad \forall t_2 > t_1$$
- **Generator**: Emits duplicate ACKs and advanced ACKs.
- **Assertion**: Duplicate ACK is an idempotent no-op; ACK higher than emitted sequence triggers `ACK_OUT_OF_BOUNDS`.

### Property 8: Idempotent RUN Convergence (Race Safety)
- **Law**:
  $$\text{Effect}(RUN(K) \parallel RUN(K)) \equiv \text{Effect}(RUN(K))$$
- **Generator**: Fires $50$ concurrent `RUN` requests carrying the identical `(actorId, capabilityId, idempotencyKey)` tuple across multiple asynchronous threads.
- **Assertion**: Exactly $1$ execution record is created in SQLite. Exactly $1$ business operation executes. All $50$ callers receive identical result references.

### Property 9: State Transition Matrix Exhaustive Compliance
- **Law**: Only transitions explicitly marked `✅` in the formal transition matrices are permitted.
- **Generator**: Tests all $9 \times 9 = 81$ transitions for Session states, and all $9 \times 9 = 81$ transitions for Execution states.
- **Assertion**: Legal transitions succeed; all illegal transitions throw `INVALID_STATE_TRANSITION` and leave original state un-mutated.

### Property 10: Capability Schema Validation Enforcement
- **Law**: Any payload failing `inputSchema` must be rejected before transport wire dispatch.
- **Generator**: Fuzzes input schemas with missing required fields, invalid types, and unexpected parameters.
- **Assertion**: Throws `VALIDATION_ERROR` with structured diagnostic path before emitting wire frames.

---

## 3. Implementation Verification Checklist for Phase 2

Before Phase 2 code is declared complete, the test runner must output clean passes for:
- [ ] 10/10 Property Tests (10,000 iterations each).
- [ ] AEP 1.1 HELLO response and resume-window conformance vectors.
- [ ] Every Failure Matrix scenario, including F11A.
- [ ] All 38 Protocol Invariants verified by automated assertions.
- [ ] Transport Parity Suite passing identically over WebTransport and WebSocket adapters.
- [ ] Zero ESLint / TypeCheck errors across `packages/protocol`.

## 3.1 AEP 1.1 Handshake and Resume Conformance

These are required contract tests in addition to the core properties above.

### H-001: HELLO Has One Canonical Server Welcome Carrier

- **Generator**: Builds valid initial and resume Stream-0 `HELLO` requests,
  valid server `HELLO(helloKind: "WELCOME")` responses, and malformed role,
  stream, flag, and payload combinations.
- **Assertion**: The server welcome is encoded as `HELLO`, never an eighth
  `WELCOME` frame. `RESUME_REQUEST` is accepted only on a client Stream-0
  request. `RESUME_ACCEPTED` has no flag representation; unknown reserved bits
  retain the compatibility handling defined in `versioning.md`.

### H-002: Resume Window Selection Is Deterministic

- **Generator**: Uses a deterministic clock at offsets within 60 seconds,
  after 60 seconds but within 24 hours, and after 24 hours; vary replay-buffer
  availability and token/session validity.
- **Assertion**: A valid replay hit selects `REPLAY`; a valid replay miss
  selects `SYNC_SNAPSHOT`; only dormant-TTL expiry, revocation, invalid token,
  or major incompatibility selects rejected welcome followed by `CLOSE`.
