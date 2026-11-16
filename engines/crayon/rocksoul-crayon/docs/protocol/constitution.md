# Protocol Constitution
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*
*Status: Normative Specification*

---

## 1. Preamble & Sacred Boundaries

The Application Execution Protocol (AEP) is a private, first-party, binary-first application-layer protocol designed to unify client-server communication between the browser frontend (`/web`) and the Rocksoul backend fabric.

### 1.1 Fundamental Axiom: The Existing System is Sacred
AEP is an **adaptive integration protocol**, not a system rewrite.
1. The existing Fastify HTTP server, Drizzle ORM schemas, LibSQL SQLite persistence, existing authentication engine, domain services, and Rocksoul AI Runtime represent the **sole Canonical Source of Truth**.
2. AEP never introduces shadow domain models (e.g. `AIUser`, `AITask`, `AIProject`). Domain concepts in AEP are strictly metadata identifiers referencing existing canonical entities.
3. Fastify REST routes (`/health`, `/api/v1/auth`, `/api/v1/models`, `/api/v1/ai`) remain operational as the underlying service baseline.

### 1.2 Hierarchy of Protocol Authority
Protocol authority is strictly top-down:
```text
Protocol Specification (docs/protocol/*)
        │  [Authoritative Normative Rules]
        ▼
Pure Protocol Contracts (packages/protocol)
        │  [Zero dependency on React, Fastify, Drizzle, provider SDKs]
   ┌────┴──────────────────────────┐
   ▼                               ▼
Client Runtime (@app/sdk)     Server Gateway (Fastify AEP Plugin)
   │                               │
   ▼                               ▼
Transport Adapters             Application Fabric
(WebTransport / WS)            (Existing Services & DB)
```
- **The SDK does NOT dictate the protocol.**
- **Fastify implementation details do NOT dictate the protocol.**
- The Protocol Specification is the sole authority.

### 1.3 Architectural Boundary & Dependency Separation
- `packages/protocol` is a strictly pure TypeScript package containing type definitions, frame validators, and state machine transitions. It **MUST NEVER** import:
  - React or browser DOM globals (`window`, `document`)
  - Fastify, Node HTTP, or Express
  - Drizzle ORM or SQLite drivers
  - Rocksoul AI runtime packages
  - Concrete business domain routines

---

## 2. Core Philosophy

AEP is governed by four immutable engineering principles:

1. **MINIMUM PROTOCOL, MAXIMUM SEMANTICS**:
   The protocol kernel defines only 7 fundamental primitives. All domain richness (tasks, projects, AI generation, mail, code diffing, browser automation) is carried in semantic execution payloads, never in transport-level framing.
2. **ONE EXECUTION MODEL, UNLIMITED CAPABILITIES**:
   Every action—whether searching a project, assigning a task, streaming AI tokens, patching a file, or running a workflow—is an **Execution**.
3. **ONE EVENT MODEL, UNIFIED OBSERVABILITY**:
   All state changes, telemetry deltas, tool handoffs, and notifications are instances of a single, strongly-typed **Event Model**.
4. **COMPLEXITY INSIDE, SIMPLICITY OUTSIDE**:
   The frontend views the system as **One Connected Application**, interacting through a single unified SDK facade (`@app/sdk`). Low-level multiplexing, sequence ordering, reconnection, and backpressure are encapsulated entirely within the runtime.

---

## 3. Protocol Naming & Terminology

- **Provisional Working Name**: **AEP** (*Application Execution Protocol*).
- **Alternative Evaluated Names**:
  - *AXP (Application eXecution Protocol)*: Concise, but conflicts with legacy DEC protocols.
  - *ROP (Rocksoul Operations Protocol)*: Too domain-specific, fails general application abstraction.
  - *CAP (Canonical Application Protocol)*: Overloaded acronym (CAP theorem).
- **Consensus**: **AEP (Application Execution Protocol)** is retained as the authoritative identifier.

### 3.1 Terminology Definitions
- **Connection**: An active, underlying transport-layer channel (WebTransport bidirectional session, WebSocket TCP connection, or HTTP compatibility pipe).
- **Session**: A continuous, authenticated, application-level conversation between an actor and the server. A session survives transport disconnection and spans multiple connections.
- **Stream**: A logical, multiplexed, sequentially ordered communication path within a connection.
- **Execution**: A bounded, stateful, auditable unit of work executed by the application fabric on behalf of an actor.
- **Capability**: A registered, addressable unit of functionality (e.g. `task.assign`, `ai.ask`, `browser.navigate`) with defined input/output schemas and access policies.
- **Frame**: The smallest atomic binary unit of transmission in AEP.
- **Event**: An immutable notification of something that occurred within an execution or session.

---

## 4. The 7 Canonical Protocol Primitives

To guarantee kernel purity, AEP establishes exactly **seven canonical primitives**. No domain-specific primitives (e.g. `AI_FRAME`, `TASK_FRAME`) are permitted.

| Primitive | Code | Direction | Semantic Meaning |
|---|---|---|---|
| **HELLO** | `0x01` | Client ⇄ Server | Session negotiation, protocol version handshake, transport capability exchange. |
| **OPEN** | `0x02` | Client ⇄ Server | Opens a logical multiplexed stream or execution channel with initial parameters. |
| **RUN** | `0x03` | Client → Server | Dispatches an Execution request targeting a specific `capabilityId` with idempotency token. |
| **DATA** | `0x04` | Bi-directional | Transmits sequential payload chunks, stream deltas, or execution inputs/outputs. |
| **SIGNAL** | `0x05` | Bi-directional | Out-of-band control signal (cancellation, pause, resume, ping/pong, credit update). |
| **ACK** | `0x06` | Bi-directional | Protocol acceptance and in-order buffering confirmation for sequence numbers. |
| **CLOSE** | `0x07` | Bi-directional | Graceful or abrupt termination of a stream, execution, or session. |

### 4.1 Rule on Primitive Expansion
Any proposed eighth primitive must satisfy four criteria:
1. Proof that the problem cannot be represented using existing primitives + metadata flags.
2. Demonstration of alternative architectures using combinations of `RUN`, `DATA`, and `SIGNAL`.
3. Proof that the addition is a fundamental architectural requirement, not a convenience wrapper.
4. Comprehensive update of state machines, invariant tables, and formal test cases.
