# Security Constitution & Threat Defense Model
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Security Architecture & Threat Matrix

AEP is engineered under a **Zero-Trust Client** assumption. The frontend is considered an untrusted, potentially hostile execution environment. All security enforcement occurs strictly at the server gateway and capability policy layer.

### 1.1 Threat Mitigation Matrix

| Threat Vector | Attack Scenario | AEP Defense Mechanism |
|---|---|---|
| **Malformed Frames** | Fuzzing binary buffers to trigger buffer overflow or memory corruption. | Strict 7-step validation sequence (§2 Framing). Fail-closed parsing with zero dynamic heap allocation before bounds check. |
| **Oversized Frames (DoS)** | Sending 2 GB binary stream to crash server memory. | Hard limit: 16 MB max frame. Interactive streaming bounded to 64 KB chunks. Exceeding limits triggers immediate stream teardown. |
| **Replay Attacks** | Capturing and resending mutating `RUN` frame over network. | Monotonically increasing `sequence` per stream, timestamp freshness check (max 30s clock skew), and durable `idempotencyKey` deduping. |
| **Session Fixation** | Attacker forcing pre-allocated `sessionId` on victim. | Session IDs are minted server-side using CSPRNG (`randomBytes(32)`), hashed with SHA-256, and bound to actor identity upon successful authentication. |
| **Capability Escalation** | Client forging `RUN` targeting administrative capabilities. | Capability policy evaluates actor roles and token scopes inside the Fastify fabric at the moment of execution dispatch. |
| **Queue / Memory Exhaustion** | Flooding high volume of un-ACKed frames. | Strict bounded queues per stream (max 2 MB buffer, max 64 in-flight frames) with explicit `BLOCK` or `FAIL_STREAM` backpressure. |
| **Decompression Bombs** | Sending tiny compressed frame that expands to gigabytes in memory. | Streaming decompression with strict 10:1 decompression ratio limit and hard output byte cap. |
| **Protocol Downgrade** | Man-in-the-middle attempting to force plaintext or legacy protocol. | Incompatible major protocol versions rejected immediately in frame header verification. |
| **Custom Cryptography** | Vulnerable home-grown crypto routines. | **STRICTLY PROHIBITED**. Transport relies on TLS 1.3 / WSS. Signatures and hashes rely exclusively on standard SHA-256 and bcrypt. |

---

## 2. Security Debt Tracking & Production Blockers

### ✅ SEC-DEBT-001: Hardcoded Development API Key — Resolved
- The seed no longer contains a live-looking credential or fallback API key.
- A development API key is seeded only when `ROCKSOUL_DEV_API_KEY` is explicitly supplied by the operator.
- Production deployments continue to require authenticated user sessions or explicitly provisioned scoped API keys.
