# Recovery & Reconnection Constitution
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. Architectural Separation of Continuity Layers

The typed SDK contract for this separation is `packages/sdk/src/session.ts`.
It defines stable Session identity, replacement Connection identity, explicit
Stream resumability, server-authoritative expiry/revocation, and generation
ownership. It intentionally does not implement the durable ledger or transport
handshake described below.

In distributed systems and browser environments, network disconnections and gateway process restarts are normal operational events. AEP decouples recovery into four distinct layers:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CONNECTION CONTINUITY (Ephemeral Layer 4/7 Socket)                  │
│    Lost on network disruption, Wi-Fi handoff, or server restart.       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. SESSION CONTINUITY (Cryptographic Durable Identity)                 │
│    Survives transport drops and gateway restarts via resumeToken.      │
│    Valid for 24 hours (SESSION_DORMANT_TTL).                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. EXECUTION CONTINUITY (Application Fabric Work)                      │
│    Stateful operations tracked durably in SQLite execution_records.    │
│    Long-running tasks continue independently of client presence.       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. EVENT REPLAY AVAILABILITY (Ephemeral In-Memory Ring Buffer)         │
│    Fast in-memory delta buffer (60s / 1,024 frames). Lost on restart.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Formal Resumption Handshake Flow

```text
Client (Reconnected Transport)                       Server (AEP Gateway)
        │                                                     │
        │── HELLO (flags: RESUME_REQUEST,                    │
        │          sessionId: "ses_uuid",                     │
        │          resumeToken: "hmac_sig",                   │
        │          lastAckSeq: 42)                           │
        │                                                    ─┼─ Validate resumeToken & State
        │                                                     │
        ├── [Case 1: Buffer Available (Fast Path)] ───────────┤
        │ ◄── HELLO (helloKind: WELCOME,                      │
        │             resume: ACCEPTED / REPLAY) ─────────────┤
        │ ◄── DATA [Seq: 43] (Missed Frame Replay) ───────────┤
        │ ◄── DATA [Seq: 44] (Missed Frame Replay) ───────────┤
        │── ACK (ackNum: 44) ────────────────────────────────►│ (Re-sync complete)
        │                                                     │
        ├── [Case 2: Server Restarted / Buffer Lost] ────────┤
        │ ◄── HELLO (helloKind: WELCOME,                      │
        │             resume: ACCEPTED / SYNC_SNAPSHOT,       │
        │             flags: SYNC_SNAPSHOT) ──────────────────┤
        │ ◄── DATA (flags: SYNC_SNAPSHOT,                     │
        │           payload: AuthoritativeStateSnapshot) ─────┤ (From SQLite DB)
        │── ACK (ackNum: 1) ─────────────────────────────────►│ (Local view reconciled)
        │                                                     │
        └── [Case 3: Session Revoked or Expired (>24h)] ──────┤
          ◄── CLOSE (code: SESSION_EXPIRED / UNAUTHORIZED) ───┤ (Force clean login)
```

---

## 3. Normative Resume Decision Branches

When the gateway receives a `RESUME_REQUEST`, it evaluates three deterministic branches in order:

### Branch A: Accepted Resume with Frame Replay (Fast Path)
- **Preconditions**:
  1. `resumeToken` signature is cryptographically valid.
  2. Session exists in gateway memory (within 60s disconnect window).
  3. All frames in range `(lastAckSeq + 1 .. currentSeq)` are present in the circular ring buffer.
- **Action**: Gateway transmits `HELLO(helloKind: "WELCOME", resume.status: "ACCEPTED", resume.delivery: "REPLAY")` and streams the missing frames in strict sequence. Session returns to `READY`.

### Branch B: Accepted Resume with Authoritative State Sync (Post-Restart / Buffer Eviction)
- **Preconditions**:
  1. `resumeToken` signature is valid and within the 24-hour dormant TTL.
  2. Gateway process has restarted OR the network outage exceeded the 60s ephemeral ring buffer window.
- **Normative Rule**: **SERVER RESTART DOES NOT KILL THE SESSION.**
  - The in-memory replay buffer is lost, but the session and its executions remain alive in SQLite.
- **Action**:
  1. Gateway transmits `HELLO(helloKind: "WELCOME", resume.status: "ACCEPTED", resume.delivery: "SYNC_SNAPSHOT")` with `SYNC_SNAPSHOT`.
  2. Gateway compiles an **Authoritative State Snapshot** from SQLite:
     - Active `executionIds` and their current statuses (`ACCEPTED`, `RUNNING`, `WAITING`).
     - Terminal results for any executions that completed while client was offline (`SUCCEEDED`, `FAILED`).
     - Open subscription channels and current entity version numbers.
  3. Gateway transmits the snapshot in a single `DATA` frame with `flags.SYNC_SNAPSHOT`.
  4. Client reconciles its state, marks completed executions as finished, and re-attaches progress listeners to ongoing executions.

### Branch C: Rejected Resume (Explicit Termination Only)
- **Preconditions**:
  1. Session TTL exceeded (> 24 hours since last authenticated activity).
  2. User explicitly logged out (session revoked in database).
  3. `resumeToken` HMAC signature verification fails (tampering attempt).
  4. Major protocol version incompatibility.
- **Action**: Gateway emits `HELLO(helloKind: "WELCOME", resume.status: "REJECTED", resume.delivery: "NONE", reasonCode)` followed by `CLOSE` with code `SESSION_EXPIRED` or `UNAUTHORIZED`. Client clears local storage, returns to `CONNECT`, and prompts user to authenticate.

---

## 4. Execution Recovery Behavior Post-Restart

| Execution State at Crash | Post-Restart Fabric Behavior | Client Recovery Experience |
|---|---|---|
| **`ACCEPTED`** (Not yet running) | Re-queued for execution if idempotent; or marked `FAILED(SERVER_RESTARTED)`. | Notified via State Sync; auto-retries if idempotent. |
| **`RUNNING`** (Background Worker) | Worker process continues execution independently; updates SQLite `execution_records`. | On reconnect, client re-attaches to live stream or receives result. |
| **`SUCCEEDED`** | Final result already committed to SQLite. | State Sync returns completed output immediately. Zero duplicate work. |
| **`FAILED`** | Failure record committed to SQLite. | State Sync returns original failure diagnostic. |
