# Binary Application Framing Specification
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Frame Architecture Overview

AEP frames are binary-first, fixed-header envelopes engineered for high-throughput, zero-copy, low-latency parsing across both browser `ArrayBuffer`/`Uint8Array` runtimes and Node.js backend streams.

### 1.1 Endianness & Integer Encoding
- **Byte Order**: Big-Endian (Network Byte Order) for all multi-byte numeric fields.
- **Integer Types**: Unsigned 8-bit (`uint8`), 16-bit (`uint16`), 32-bit (`uint32`), and 64-bit (`uint64`).
- **Memory Alignment**: Header fields are aligned on 32-bit boundaries. The total header size is a multiple of 4 bytes, ensuring that the variable payload starts at a 32-bit aligned offset in memory.

---

## 2. Normative Binary Frame Layout (Exact 36-Byte Base Header)

Every AEP frame begins with an immutable, fixed-size **36-byte Base Header**, followed by an optional **Variable Payload**:

```text
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Magic Bytes (0x41 0x45 0x50 0x31)         |  (ASCII "AEP1")
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Version (1)  |FrameType (0x01-0x07)|       Flags (uint16)    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Stream ID (uint32)                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Sequence Number (uint32)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   Acknowledgement Number (uint32)             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                    Timestamp Milliseconds (uint64)            +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Priority (u8) | Reserved (u8) |        Reserved (uint16)      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Payload Length (uint32)                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Payload Data (variable)                   |
|                              ...                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### 2.1 Normative Field Specification & Mathematical Proof

$$\text{TOTAL HEADER SIZE} = \sum \text{Field Sizes} = 4 + 1 + 1 + 2 + 4 + 4 + 4 + 8 + 1 + 1 + 2 + 4 = \mathbf{36\text{ Bytes}}$$

| Byte Offset | Size | Field | Encoding | Valid Range | Required | Description |
|---|---|---|---|---|---|---|
| `0..3` | 4 B | `magic` | `uint32` (BE) | `0x41455031` | YES | ASCII `"AEP1"`. Identifies wire format. |
| `4` | 1 B | `protocolVersion` | `uint8` | `0x01` | YES | Current major protocol revision. |
| `5` | 1 B | `frameType` | `uint8` | `0x01..0x07` | YES | Canonical primitive (`HELLO`..`CLOSE`). |
| `6..7` | 2 B | `flags` | `uint16` (BE) | `0x0000..0xFFFF` | YES | Frame bitmask modifiers (see §2.3). |
| `8..11` | 4 B | `streamId` | `uint32` (BE) | `0..4,294,967,295` | YES | Multiplexed logical stream identifier. |
| `12..15` | 4 B | `sequence` | `uint32` (BE) | `0..4,294,967,295` | YES | Monotonic frame sequence per stream. |
| `16..19` | 4 B | `acknowledgement` | `uint32` (BE) | `0..4,294,967,295` | YES | Cumulative acknowledged sequence. |
| `20..27` | 8 B | `timestamp` | `uint64` (BE) | POSIX epoch ms | YES | Transmission timestamp (UTC). |
| `28` | 1 B | `priority` | `uint8` | `0..4` | YES | Priority band (`0`=CRITICAL, `4`=EPHEMERAL). |
| `29` | 1 B | `reservedPad8` | `uint8` | Fixed `0x00` | YES | 8-bit alignment padding. |
| `30..31` | 2 B | `reservedPad16` | `uint16` (BE) | Fixed `0x0000` | YES | 16-bit alignment padding for 32-bit boundary. |
| `32..35` | 4 B | `payloadLength` | `uint32` (BE) | `0..16,777,216` | YES | Payload byte length (0 to 16 MB). |
| `36..N` | Var | `payload` | Binary | Any byte sequence | NO | Encoded MessagePack payload. |

### 2.2 Decoder Aggregate Bound

A streaming frame decoder MAY retain bytes only while assembling one wire frame. Its aggregate retained-byte limit is exactly `36 + 16,777,216 = 16,777,252` bytes (the base header plus the maximum payload). A decoder MUST reject the input and discard its retained partial bytes when accepting another chunk would exceed that limit. This parser-assembly limit is distinct from the 2 MB per-stream execution queue and its 64-frame flow-control limit.

---

## 2.2 Architectural Audit of Candidate Fields (Why Not in Fixed Header?)

During protocol hardening, candidate fields (`sessionId`, `connectionId`, `requestId`, `executionId`) were evaluated for inclusion in the binary header.

| Candidate Field | Evaluated Size | Architectural Reason for Exclusion from Fixed Header | Proper Layer & Location |
|---|---|---|---|
| `connectionId` | 8–16 Bytes | Transport-managed identifier. WebTransport and WebSocket adapters already associate frames with their underlying transport socket in runtime memory. Repeating it on wire wastes bytes. | Layer 4 / Transport Socket Context |
| `sessionId` | 16 Bytes (UUID) | Authenticated once during `HELLO` handshake on Stream 0 and bound to the connection state. Repeating 16 bytes across 10,000 streaming chunks introduces 160 KB of redundant metadata. | Negotiated in `HELLO`, maintained in Session State |
| `executionId` | 16 Bytes (UUID) | Bound 1-to-1 with `streamId` upon `RUN`. For the entire lifetime of that execution channel, the 4-byte `streamId` uniquely identifies the execution. | Declared in `RUN` payload, mapped to `streamId` |
| `requestId` | 16 Bytes (UUID) | Specific to point-in-time dispatch attempts. Irrelevant for mid-stream `DATA` chunks or `ACK` frames. | Carried inside `RUN` / `SIGNAL` payload envelope |

**Conclusion**: Including all candidate UUIDs in every frame would inflate the header from 36 bytes to 92 bytes (+155% overhead), severely penalizing interactive AI token streaming (where chunks are 10–40 bytes). The 36-byte header represents the mathematically optimal boundary between transport multiplexing and payload encapsulation.

---

## 2.3 Flag Bitmask Definitions (`uint16`)

```text
Bit 0  (0x0001): END_STREAM (FIN)       - Final frame on this logical stream. Initiates half-close.
Bit 1  (0x0002): COMPRESSED             - Payload is compressed with Zstandard / Brotli.
Bit 2  (0x0004): RESUME_REQUEST         - Frame requests session continuity replay on Stream 0.
Bit 3  (0x0008): SYNC_SNAPSHOT          - Payload contains authoritative state snapshot.
Bit 4  (0x0010): IDEMPOTENT             - Execution request carries an authoritative idempotencyKey.
Bit 5  (0x0020): ERROR_PAYLOAD          - Payload contains a structured AppError envelope.
Bit 6  (0x0040): HEARTBEAT              - Liveness ping/pong indicator frame.
Bit 7..15:       RESERVED               - Reserved for future minor revisions. MUST be 0 on transmit;
                                          ignored safely by compliant receivers for forward compatibility.
```

### 2.4 Stream-0 `HELLO` Payload Roles

`HELLO` is bidirectional and is the sole canonical handshake carrier. It has no
separate `WELCOME` frame type. On Stream 0, the payload MUST identify its role:

```text
Client initial handshake: { helloKind: "REQUEST", mode: "INITIAL", serializers, ... }
Client resume attempt:    { helloKind: "REQUEST", mode: "RESUME", sessionId, resumeToken, lastAckSeq, ... }
Server welcome response:  { helloKind: "WELCOME", sessionId, resumeToken, negotiatedSerializer,
                            resume?: { status: "ACCEPTED" | "REJECTED",
                                       delivery: "REPLAY" | "SYNC_SNAPSHOT" | "NONE",
                                       reasonCode?: string }, ... }
```

`RESUME_REQUEST` is valid only on a client `HELLO` request on Stream 0.
`RESUME_ACCEPTED` is a payload status, not a flag. `SYNC_SNAPSHOT` is valid on
the server `HELLO` response only when `resume.delivery` is `SYNC_SNAPSHOT`, and
on the following `DATA` frame carrying the authoritative snapshot. A rejected
resume is represented by `resume.status: "REJECTED"`; it is not a new frame or
flag.

---

## 3. Strict 8-Step Validation Order (Fail-Closed Security)

Parsers **MUST** execute validation in the following strict order to prevent buffer overruns, CPU exhaustion, and memory allocation attacks:

```text
Step 1: Buffer Length >= 36 Bytes
        └── FALSE -> Await further network chunks (do not allocate or parse).
Step 2: Magic Bytes == 0x41455031 ("AEP1")
        └── FALSE -> PROTOCOL_CORRUPTED (Drop transport connection immediately; no recovery).
Step 3: Protocol Version Supported (Major == 1)
        └── FALSE -> VERSION_INCOMPATIBLE (Emit error frame, close connection cleanly).
Step 4: Frame Type in Range [0x01..0x07]
        └── FALSE -> UNKNOWN_FRAME_TYPE (Fail-closed; drop frame, emit PROTOCOL_ERROR).
Step 5: Flags Conflict Check
        └── FALSE -> INVALID_FLAGS (e.g. HEARTBEAT set concurrently with END_STREAM).
Step 6: Payload Length Bounds Check (payloadLength <= 16,777,216)
        └── FALSE -> OVERSIZED_PAYLOAD (Abort stream immediately; DO NOT ALLOCATE BUFFER).
Step 7: Total Frame Available (Buffer Length >= 36 + payloadLength)
        └── FALSE -> Partial frame; keep in socket stream buffer without parsing payload.
Step 8: Payload Deserialization
        └── Pass exact payload byte slice to ISerializer.decode().
```

> [!CAUTION]
> **SECURITY INVARIANT (P026)**: The parser **MUST NEVER** call `Buffer.alloc(payloadLength)` or `new Uint8Array(payloadLength)` before Step 6 has verified that `payloadLength <= 16,777,216`. Malformed frames declaring `0xFFFFFFFF` length must fail at Step 6 in constant time $O(1)$ without allocating memory.

---

## 4. Size Limits & Resource Bounds Justification

| Metric | Normative Value | Architectural Justification | Protection Against | Configurable? |
|---|---|---|---|---|
| **Base Header Size** | **36 Bytes** | Fixed 32-bit aligned layout containing all multiplexing, sequence, and priority metadata. | Memory fragmentation, alignment faults. | NO (Protocol Law) |
| **Max Frame Payload** | **16 MB** (`16,777,216` B) | Accommodates large AI context payloads and binary artifacts without risking Node.js/V8 max heap allocation faults. | Remote Heap Exhaustion / OOM DoS. | Server configurable down to 4 MB |
| **Default Chunk Size** | **64 KB** (`65,536` B) | Matches typical TCP/QUIC MTU burst windows; provides low latency without starving concurrent streams. | Stream starvation, Head-of-Line delay. | Client configurable |
| **Max Stream Buffer** | **2 MB** (`2,097,152` B) | Bounded memory ceiling per active logical stream. Backpressure engages when reached. | Unbounded consumer memory leaks. | Server configurable |
| **Max Pending In-Flight**| **64 Frames** | Flow-control window per stream before sender must wait for cumulative `ACK`. | Socket buffer overflow. | Runtime negotiated |
| **Max Replay Window** | **60 Seconds** | Ephemeral in-memory ring buffer retention for dropped connection resumption. | Stale memory exhaustion. | Server configurable |
| **Max Replay Frames** | **1,024 Frames** | Hard ceiling on frame count in session circular buffer. | High-frequency message flood. | Server configurable |
| **Session Dormant TTL** | **24 Hours** | Durable session token validity in SQLite before full re-authentication required. | Permanent session fixation. | Server configurable |

---

## 5. Mathematical Codec Properties & Invariants

Compliant implementations must satisfy three formal algebraic properties:

1. **Length Determinism**:
   $$\forall H \in \text{ValidHeaders}: \text{length}(\text{encode}(H)) \equiv 36\text{ bytes}$$
2. **Round-Trip Symmetry**:
   $$\forall H \in \text{ValidHeaders}: \text{decode}(\text{encode}(H)) \equiv H$$
3. **Canonical Byte Invariance**:
   $$\forall B \in \text{Valid36ByteBuffers}: \text{encode}(\text{decode}(B)) \equiv B$$
