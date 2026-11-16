# Delivery Semantics, Idempotency & ACK Constitution
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Tripartite Delivery Model

AEP explicitly rejects the theoretical fallacy of "transport-level exactly-once delivery" across unreliable browser-to-server networks (Two Generals' Problem). 

Instead, AEP enforces an honest, verifiable, and resilient **Tripartite Delivery Model**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. TRANSPORT LAYER: At-Least-Once Delivery                             │
│    Unacknowledged frames are retransmitted. Gaps detected via sequence.│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. APPLICATION RUNTIME: Idempotent Execution Processing                │
│    Durable deduplication maps duplicate RUN frames to 1 logical run.   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. BUSINESS / PERSISTENCE LAYER: Authoritative Database State          │
│    Canonical SQLite persistence holds the single immutable truth.      │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Explicit Guarantees Provided
1. **At-Least-Once Delivery**: With sequence numbers and cumulative ACKs, no transmitted frame is silently dropped without detection.
2. **Idempotent Application Effect**: Retrying a mutation $N$ times produces the identical business result as executing it once ($f(f(x)) = f(x)$).
3. **Monotonic Stream Order**: Frames on any single reliable logical stream are delivered and processed strictly in monotonic sequence.

### 1.2 Explicit Non-Guarantees (What AEP Will Never Claim)
> [!WARNING]
> **IMPOSSIBLE GUARANTEES EXPLICITLY NOT PROVIDED**:
> 1. **No Transport Exactly-Once**: A dropped socket or delayed packet will cause frame retransmission.
> 2. **No Global Ordering Across Independent Streams**: Stream $A$ and Stream $B$ execute concurrently; relative completion order depends on fabric scheduling.
> 3. **No Infinite Replay**: In-memory replay ring buffers are strictly bounded to 60 seconds / 1,024 frames.
> 4. **No Infinite Buffering**: Buffer overflows trigger deterministic backpressure drops or stream termination.

---

## 2. Normative ACK Semantics: Protocol Acceptance Only

To eliminate historical ambiguities where "ACK" was conflated with "business processing" or "database commit," AEP establishes a **single normative definition**:

> [!IMPORTANT]
> **Normative Definition of AEP Protocol ACK (`0x06`)**:
> An `ACK(streamId, ackSeq)` frame certifies **EXCLUSIVELY** that the receiver's protocol kernel has received all frames on `streamId` up to sequence `ackSeq` without gaps, verified frame headers, and successfully accepted/buffered them into the stream queue for execution.
> **AN ACK DOES NOT MEAN THE EXECUTION HAS COMPLETED OR PERSISTED TO DISK.**

### 2.1 State & Confirmation Progression Matrix

| Layer / Confirmation | Wire Primitive | Normative Meaning | Durable on Disk? | Replayable from Buffer? |
|---|---|---|---|---|
| **Protocol Acceptance** | `ACK` (`0x06`) | In-order frame received, bounds-checked, and buffered in queue. Advances window. | NO (In-Memory) | YES (from Session Buffer) |
| **Execution Progress** | `DATA` (`0x04`) `execution.*` | Execution state transition (`ACCEPTED`, `RUNNING`, `WAITING`, `PROGRESS`). | NO / Ephemeral | YES (within 60s window) |
| **Execution Terminal** | `DATA` (`0x04`) `execution.completed` | Work completed in application service; output generated. | NO (Transitional) | YES (within 60s window) |
| **Authoritative Persistence**| SQLite Commit (`execution_records`) | Business mutation committed to canonical SQLite storage. Sole source of truth. | **YES (Durable Disk)** | **YES (via STATE_SYNC)** |

---

## 3. Idempotency Constitution: Cache Is Not Authority

### 3.1 The Immutable Idempotency Tuple
Every mutating `RUN` request must carry a client-generated UUIDv4 idempotency key. The unique identity of the mutation is defined by the 3-part tuple:
$$\text{Identity} = \langle \text{actorId}, \text{capabilityId}, \text{idempotencyKey} \rangle$$

### 3.2 Cache Non-Authority Invariant (P018)
- In-memory deduplication caches in the Fastify Gateway are **strictly non-authoritative L1 latency optimizations**.
- The gateway cache may be evicted, restarted, or bypassed during rolling deployments.
- **The SQLite database table `execution_records` is the sole authoritative arbiter of idempotency.**

### 3.3 Atomic Race Resolution Algorithm
When two concurrent requests ($R_1, R_2$) with the exact same idempotency tuple arrive simultaneously at the gateway (or across two gateway instances):

```text
Incoming RUN(actorId, capabilityId, idempotencyKey)
        │
        ▼
[Optional L1 Cache Check]
        ├── HIT: Return existing execution reference / result.
        └── MISS: Proceed to Atomic Database Claim.
        │
        ▼
[Atomic SQLite Insert]
INSERT INTO execution_records (
    execution_id, actor_id, capability_id, idempotency_key, status, created_at
) VALUES (:newId, :actorId, :capabilityId, :idempotencyKey, 'ACCEPTED', :now)
ON CONFLICT (actor_id, capability_id, idempotency_key) DO NOTHING;
        │
        ├── ROWS AFFECTED == 1 (Winner):
        │     - This request claimed execution rights.
        │     - Dispatch to CapabilityExecutor.
        │     - Transition to RUNNING -> SUCCEEDED / FAILED in SQLite upon finish.
        │
        └── ROWS AFFECTED == 0 (Duplicate / Loser):
              - Conflict detected. Query existing execution_records row:
              - IF status IN ('ACCEPTED', 'RUNNING', 'WAITING'):
              │     Attach caller's stream as observer; stream progress events.
              - IF status == 'SUCCEEDED':
              │     Return cached final result immediately (Status 200 equivalent).
              - IF status == 'FAILED':
              │     Return cached failure error immediately.
              - IF status == 'CANCELLED':
                    Return CANCELLATION_RECORDED error.
```

This algorithm guarantees that even under extreme concurrency, network retransmission storms, or node crashes, **exactly one physical mutation executes in SQLite**.
