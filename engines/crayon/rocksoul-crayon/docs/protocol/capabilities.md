# Capability Constitution & Application Fabric Model
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

## Phase 6 preparation: canonical capability contract

Capability metadata is semantic and transport-independent. These dimensions
remain separate:

```text
EXISTS → SUPPORTED → AVAILABLE → AUTHORIZED → EXECUTABLE
```

They are independent facts, not one boolean. `EXECUTABLE` is derived only when
support, availability, authorization, and input validation all pass.

The pure contract lives in `packages/sdk/src/capabilities.ts`. It provides
typed descriptors, semantic principal/context types, an explicitly instantiated
versioned registry, discriminated resolution results, and separate resolver and
executor interfaces. It contains no tokens, routes, ORM, database, Fastify,
browser, WebSocket, or WebTransport concepts.

Resolution statuses are `NOT_FOUND`, `UNSUPPORTED`, `UNAVAILABLE`,
`UNAUTHORIZED`, `INVALID_INPUT`, and `EXECUTABLE`. Duplicate `id@version`
registration is rejected. Dynamic discovery must return the same validated
descriptor shape as static registration; no distributed plugin registry or
production gateway integration is implemented in this milestone.

---

## 1. Static Safety + Dynamic Extensibility

AEP avoids two extreme anti-patterns:
1. *Brittle Static Hardcoding*: Monolithic switch statements requiring full redeployment for every new route.
2. *Unchecked Dynamic Slop*: Blindly passing `Record<string, unknown>` payloads without compile-time types or runtime schema validation.

AEP establishes a dual-tier capability model:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   AEP Capability Invocation Layer                      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│       Tier A: Known Contracts        │ │ Tier B: Dynamic Capabilities │
│ (Compile-Time Typed First-Party APIs) │ │ (Runtime Discovered Plugins) │
├───────────────────────────────────────┤ ├──────────────────────────────┤
│ - app.ai.ask(...)                     │ │ - app.capability("plugin.x") │
│ - app.task.assign(...)                │ │ - Introspected JSON Schema   │
│ - Strict TypeScript IntelliSense      │ │ - Client-Side Zod Validation │
│ - Zero typecasting required           │ │ - Declarative Permissions    │
└───────────────────────────────────────┘ └──────────────────────────────┘
```

### 1.1 Tier A: Known Contracts (Compile-Time Typed)
First-party domain operations are registered in the static TypeScript capability registry:

```typescript
export interface KnownCapabilities {
  "ai.ask": {
    input: { prompt: string; agentId: string; threadId?: string };
    output: { responseText: string; usage: { promptTokens: number; completionTokens: number } };
    events: { type: "token.delta"; delta: string } | { type: "tool.started"; tool: string };
  };
  "task.assign": {
    input: { taskId: string; assigneeId: string };
    output: { taskId: string; status: string; updatedAt: string };
    events: never;
  };
  "project.search": {
    input: { query: string; limit?: number };
    output: { projects: Array<{ id: string; name: string }> };
    events: never;
  };
}
```

### 1.2 Tier B: Dynamic Capabilities (Runtime Schema Validated)
Plugins, dynamic tools, and workspace extensions register runtime schemas:

```typescript
export interface DynamicCapabilityDeclaration {
  readonly id: string;                        // e.g. "plugin.github.pr_create"
  readonly version: string;                   // Semver, e.g. "1.2.0"
  readonly inputSchema: Record<string, any>;  // JSON Schema / Zod Contract
  readonly outputSchema: Record<string, any>;
  readonly permissions: string[];             // Required security scopes
  readonly supportsStreaming: boolean;
  readonly supportsCancellation: boolean;
  readonly supportsIdempotency: boolean;
  readonly priority: number;                  // 0..4
}
```
**Strict Validation Rule**: A dynamic capability **MUST** validate incoming inputs against `inputSchema` before wire dispatch on client, and again upon receipt at the Gateway. Dynamic does not mean untyped.

---

## 2. The 4-State Capability Availability Model

AEP normatively distinguishes four orthogonal states for any capability:

```text
       [ Deployed to Fabric ]
                 │
                 ▼
          1. AVAILABLE ────────┐
                 │             │ (Client Lacks Contract)
                 ▼             ▼
          2. SUPPORTED ◄─── [ UNSUPPORTED ]
                 │
                 ▼
          3. AUTHORIZED ───┐
                 │         │ (Actor Lacks Scope)
                 ▼         ▼
          4. EXECUTABLE ◄── [ UNAUTHORIZED ]
                 │
                 ▼
          [ Ready for RUN ]
```

| State | Scope | Definition | How Determined | If False |
|---|---|---|---|---|
| **`AVAILABLE`** | Server Fabric | Capability is deployed and active on at least one fabric worker node. | Gateway `CapabilityRegistry`. | `CAPABILITY_NOT_FOUND` (404) |
| **`SUPPORTED`** | Client Runtime | Client SDK / environment understands the capability contract and schemas. | Client manifest negotiation in `HELLO`. | Client prompts update or uses dynamic fallback. |
| **`AUTHORIZED`** | Actor Identity| Authenticated actor has verified permission/role to invoke this operation. | `CapabilityPolicy` against session claims. | `FORBIDDEN` / `UNAUTHORIZED` (403/401) |
| **`EXECUTABLE`** | Operational | Assigned fabric node is healthy, responsive, and within capacity limits. | Node heartbeat & concurrency load. | `SYSTEM_OVERLOADED` (503) |

> [!IMPORTANT]
> **Protocol Law (P011)**:
> **Capability Advertisement (`AVAILABLE`) $\neq$ Permission (`AUTHORIZED`).**
> A capability listed in the public catalog does not confer invocation authorization. The Gateway authoritatively checks credentials upon every `RUN` frame.

---

## 3. Application Fabric Layering & Minimum Viable Architecture

To prevent the Application Fabric from devolving into premature service mesh complexity, AEP strictly defines its scope:

```text
┌─────────────────────────────────────────────────────────────┐
│                 AEP Gateway (Fastify Plugin)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Capability Resolver                     │
│           (Inspects manifest, matches semver range)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Capability Executor                     │
│    (Adapts capability call to existing Application Service) │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌─────────────────────────┐
│     Existing Domain Services  │   │  Rocksoul AI Runtime    │
│   (Tasks, Projects, Users)    │   │ (Assistant, Tools, Runs)│
└───────────────────────────────┘   └─────────────────────────┘
```

- **Not an ORM-Aware Router**: The Gateway does not know SQLite schemas or write raw SQL. It delegates directly to canonical application service functions.
- **Minimum Viable Topology**:
  - In development and single-server deployments: Fabric is purely in-process function invocation.
  - In multi-node deployments: Fabric nodes register via a lightweight Redis or Unix-socket registry without external sidecar proxies.
