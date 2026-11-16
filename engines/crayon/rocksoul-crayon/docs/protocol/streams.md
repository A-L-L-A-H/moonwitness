# Stream Constitution, Allocation & Backpressure Model
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Logical Stream vs. Transport Stream Layering

A fundamental tenet of AEP is the strict decoupling of **Application Logical Streams** from the underlying **Physical Transport**:

```text
┌─────────────────────────────────────────────────────────┐
│              Application Layer (Execution)              │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               AEP Logical Stream Manager                │
│    (Logical Stream ID, Sequence, Cumulative ACK, Prior.)│
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               AEP Transport Adapter Engine              │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────┐ ┌─────────────────────────┐
│    WebTransport Adapter     │ │    WebSocket Adapter    │
│ (QUIC Streams & Datagrams)  │ │ (Single TCP Frame Pipe) │
└─────────────────────────────┘ └─────────────────────────┘
```

### 1.1 Normative Definitions
1. **Connection**: An active Layer 4 / Layer 7 physical transport association between client and server (e.g. an active WebSocket TCP connection or an active WebTransport QUIC session).
2. **Transport Stream**: A transport-native channel provided by the underlying network protocol (e.g. a native QUIC unidirectional/bidirectional stream in WebTransport). WebSockets have exactly *one* transport stream (the TCP socket itself).
3. **Logical Stream (AEP Stream)**: A lightweight, virtual, multiplexed, sequentially ordered communication path identified by a 32-bit `streamId` inside the AEP frame header.

### 1.2 Transport Parity Guarantee
- **Over WebTransport**: The adapter MAY map an AEP logical stream 1-to-1 to a native QUIC bidirectional stream (to eliminate transport-level Head-of-Line blocking), or multiplex multiple short-lived logical streams over a pooled bidirectional QUIC stream. Datagrams are strictly reserved for Priority 4 (Ephemeral) data.
- **Over WebSocket**: All AEP logical streams are interleaved over the single physical WebSocket TCP connection via framed multiplexing.
- **Parity Invariant (P027)**: Regardless of transport, the application semantics, stream state machines, frame ordering, flow control, and priority scheduling behave **identically** on client and server runtimes.

---

## 2. Normative Stream ID Allocation & Lifecycle Rules

The allocation of `streamId` is an **AEP logical stream allocation rule** governed by the protocol kernel, completely decoupled from native transport stream numbering.

### 2.1 Uniqueness Scope: Strictly Per Session
> [!IMPORTANT]
> **Stream ID Uniqueness Scope**: AEP Logical Stream IDs are **scoped strictly PER SESSION**, not per physical connection.
> When a transport connection drops and a session reconnects, active stream IDs remain valid, preventing collision and preserving in-flight execution bindings.

### 2.2 Numerical Allocation Rules
- **Stream 0 (Control Channel)**:
  - Strictly reserved for session-level control traffic (`HELLO`, `WELCOME`, `CLOSE`, `SIGNAL(HEARTBEAT)`).
  - Stream 0 is initialized upon session creation and remains open until the session is explicitly terminated.
  - Stream 0 **MUST NEVER** carry application payloads, domain events, or executions ([P025](file:///x:/REPO/2026/rocksoul/docs/protocol/invariants.md#P025)).
- **Client-Initiated Streams**:
  - Allocated strictly as **Odd Integers**: `1, 3, 5, 7, ...` up to $2^{31} - 1$ (`2,147,483,647`).
  - Initiated by client dispatching `OPEN` or `RUN`.
- **Server-Initiated Streams**:
  - Allocated strictly as **Even Integers**: `2, 4, 6, 8, ...` up to $2^{31} - 2$ (`2,147,483,646`).
  - Initiated by server dispatching `OPEN` (e.g. for server-driven background workflow progress, push updates).

### 2.3 Collision Prevention
Because clients assign strictly odd stream IDs and servers assign strictly even stream IDs, stream ID collisions are **mathematically impossible** ($2k + 1 \neq 2m, \forall k, m \in \mathbb{N}_0$).

### 2.4 Stream Closure & Reuse Prohibition
1. **Half-Close**: A peer signals that it will transmit no further frames on a stream by emitting a frame with `flags.END_STREAM` (Bit 0 `FIN`). The peer may continue to receive frames.
2. **Full Close**: A stream is fully closed when both peers have transmitted `FIN`, or when either peer transmits a `CLOSE` frame referencing that `streamId`.
3. **Reuse Prohibition**: A closed `streamId` **MUST NEVER BE REUSED** within the same session. Reusing stream IDs creates catastrophic race conditions with late-arriving packets or delayed retransmissions.

### 2.5 Stream ID Exhaustion
If a peer allocates stream IDs approaching $2^{31} - 2$, the peer must initiate a graceful **Session Rollover**:
1. Server emits `SIGNAL(SESSION_ROLLOVER_REQUIRED)` on Stream 0.
2. Existing streams run to natural completion.
3. Client establishes a fresh Session via `HELLO` and begins new streams starting at ID `1`.

---

## 3. Priority Bands & Flow Control

Every AEP frame carries an explicit Priority Band (`uint8`, Offset 28):

| Band | Level | Designation | Traffic Types | Backpressure Treatment |
|---|---|---|---|---|
| **0** | `CRITICAL` | Session & Control | Handshake, Resumption, Cancel Signals, Auth Tokens | Preempts all queues. Never dropped. |
| **1** | `HIGH` | Interactive Execution | User Mutations, Tool Approvals, AI Token Stream | High priority scheduling weight. |
| **2** | `NORMAL` | Standard Operations | Read Queries, Notifications, Resource Metadata | Weighted fair round-robin. |
| **3** | `LOW` | Background Data | File Chunks, Workspace Diff Sync, Telemetry Batches | Paused during Priority 0–2 saturation. |
| **4** | `EPHEMERAL`| Non-Critical Live | Typing indicators, Live Cursors, Unbuffered Metrics | Dropped immediately during congestion. |

---

## 4. Bounded Queues & Backpressure Invariants

Unbounded queues are strictly prohibited ([P007](file:///x:/REPO/2026/rocksoul/docs/protocol/invariants.md#P007)).

### 4.1 Bounded Limits
- **`maxBufferBytes`**: `2,097,152` bytes (2 MB) per active logical stream.
- **`maxPendingFrames`**: `64` frames in-flight before requiring cumulative `ACK`.
- **`maxActiveStreams`**: `128` concurrent open streams per session.

### 4.2 Deterministic Overflow Policies
When a stream buffer exceeds limits, the runtime enforces one of four deterministic policies:
1. **`BLOCK`**: Sender suspends frame generation until receiver's `ACK` advances the window.
2. **`DROP_EPHEMERAL`**: Priority 4 frames are discarded silently without error.
3. **`CANCEL_LOW_PRIORITY`**: Active Priority 3 streams are terminated with `STREAM_PREEMPTED` to protect interactive streams.
4. **`FAIL_STREAM`**: Terminates the overflowing stream immediately with `STREAM_BACKPRESSURE_OVERFLOW` error frame.
