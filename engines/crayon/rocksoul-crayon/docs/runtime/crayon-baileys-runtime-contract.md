# CRAYON — Baileys Runtime Contract

## Status

**Version:** 1.0  
**Role:** Runtime contract for the WhatsApp/Baileys workload  
**Product boundary:** This document defines how a Baileys workload behaves at runtime. It does not redefine WhatsApp UX, the public API resource model, or generic CRAYON runtime concepts.

---

## 1. Purpose

CRAYON treats Baileys as a managed workload that can execute on any compatible container/runtime provider without changing the customer-facing WhatsApp resource model.

The runtime contract guarantees:

```text
START
PAIR
CONNECT
SERVE
RECOVER
STOP
RESTORE
```

The runtime is expected to fail and restart safely. Persistent session state must survive runtime replacement.

---

## 2. Runtime Boundary

```text
CRAYON CONTROL PLANE
        │
        │ desired state / commands
        ▼
BAILEYS RUNTIME ADAPTER
        │
        ▼
BAILEYS WORKLOAD
        │
        ├── WhatsApp WebSocket
        ├── auth/session state adapter
        ├── event publisher
        ├── health endpoint
        └── structured logs
```

The workload does not own billing, tenant authorization, deployment policy, or provider-specific orchestration.

---

## 3. Portability Contract

The same application contract must support:

```text
Cloudflare Container
Docker VPS
Docker host
Future container providers
```

Provider-specific concerns belong in the runtime adapter:

```text
provider adapter
├── provision
├── start
├── stop
├── restart
├── inspect
├── logs
├── health
└── destroy
```

The Baileys application itself must not contain provider-specific assumptions.

---

## 4. Process Model

A Baileys instance is one logical WhatsApp account.

Recommended isolation:

```text
1 logical WhatsApp account
        ↓
1 Baileys workload
```

A runtime may contain more than one account only as an explicit future optimization; the default contract keeps account isolation simple and auditable.

The process must be supervised so an unexpected exit becomes a recoverable runtime event.

---

## 5. Lifecycle State Machine

```text
PROVISIONING
     ↓
STARTING
     ↓
PAIRING
     ↓
CONNECTING
     ↓
CONNECTED
     ↓
RUNNING
   ↙     ↘
DEGRADED  RECONNECTING
   │          │
   └──────────┘
        ↓
     RUNNING

RUNNING → STOPPING → STOPPED

ANY ACTIVE STATE → CRASHED → RESTARTING → RESTORING → CONNECTING

PAIRING → EXPIRED → PAIRING
```

### State semantics

`PROVISIONING`: provider resource is being created.  
`STARTING`: process/image is starting.  
`PAIRING`: credentials are not yet fully linked; QR or pairing-code UX may be available.  
`CONNECTING`: connection attempt is in progress.  
`CONNECTED`: WhatsApp connection is established but runtime readiness is not yet fully confirmed.  
`RUNNING`: runtime is healthy and serving commands/events.  
`DEGRADED`: runtime remains available but one or more non-fatal capabilities are impaired.  
`RECONNECTING`: session exists and the process is attempting recovery.  
`STOPPING`: graceful shutdown is in progress.  
`STOPPED`: desired state is stopped.  
`CRASHED`: process exited unexpectedly.  
`RESTARTING`: supervisor/provider restart has been requested.  
`RESTORING`: persisted session material is being loaded/validated.  
`EXPIRED`: pairing material is no longer valid and a new pairing flow is required.

---

## 6. Startup Contract

Startup must be deterministic:

```text
1. load configuration
2. establish observability
3. load persisted auth state
4. validate state version
5. initialize Baileys client
6. register event handlers
7. connect
8. publish readiness
```

The runtime must not report `RUNNING` before its health/readiness criteria are met.

---

## 7. Pairing Contract

The first-time flow is:

```text
CREATE INSTANCE
      ↓
START RUNTIME
      ↓
GENERATE QR / PAIRING CODE
      ↓
USER PAIRS DEVICE
      ↓
AUTH STATE UPDATED
      ↓
CONNECT
      ↓
RUNNING
```

Pairing output must be treated as short-lived sensitive material.

Do not persist QR images indefinitely. Store only the minimum metadata required for session UX and expiration handling.

---

## 8. Authentication / Session Persistence

The runtime must treat auth state as durable external state.

```text
Baileys process
      │
      ▼
Session State Adapter
      │
      ├── credentials
      ├── Signal keys
      ├── key/value auth records
      └── schema/version metadata
      │
      ▼
Durable Store
```

The implementation must not depend on ephemeral container disk for the only copy of session state.

The persistence adapter must support atomic updates where practical and must preserve the latest accepted auth state during reconnect and shutdown.

A new runtime created from the same logical instance ID must be able to restore the session without user re-pairing when the session remains valid.

---

## 9. Auth Update Handling

Baileys emits authentication/key updates over the lifetime of the connection.

The runtime must:

```text
receive auth update
      ↓
validate payload
      ↓
persist durable state
      ↓
acknowledge update
```

Persistence failures are runtime health events and must not be silently ignored.

If durable persistence is unavailable, the runtime must move to `DEGRADED` and apply a safe policy rather than continuing to assume state durability.

---

## 10. Connection Recovery

WhatsApp connectivity must be modeled as transient.

```text
CONNECTED
   ↓
connection closed
   ↓
classify close reason
   ├── transient → backoff + reconnect
   ├── auth/session invalid → re-pair required
   ├── policy/ban signal → STOP + operator action
   └── process failure → supervisor restart
```

The reconnect strategy must use bounded exponential backoff with jitter and a maximum retry policy.

Avoid hot reconnect loops.

---

## 11. Restart Safety

Restart causes include:

```text
process crash
container restart
host restart
platform reschedule
deployment replacement
manual restart
resource pressure
```

All restart paths must converge on the same recovery sequence:

```text
START
 ↓
RESTORE
 ↓
CONNECT
 ↓
HEALTH CHECK
 ↓
RUNNING
```

No restart path may require a user to manually copy internal auth files.

---

## 12. Graceful Shutdown

The runtime must handle termination signals:

```text
SIGTERM
  ↓
stop accepting new commands
  ↓
flush critical state/events
  ↓
close connection cleanly where practical
  ↓
close resources
  ↓
exit
```

Shutdown must be bounded and must not wait indefinitely for remote operations.

---

## 13. Health and Readiness

Minimum health dimensions:

```text
PROCESS
AUTH STATE
WHATSAPP CONNECTION
COMMAND CHANNEL
PERSISTENCE
EVENT PIPELINE
```

Suggested readiness rule:

```text
process healthy
AND auth state available
AND WhatsApp connected
AND persistence healthy
```

Liveness answers:

> Is the process alive?

Readiness answers:

> Can this instance currently serve its contract?

These must remain separate.

---

## 14. Internal Runtime Interface

The runtime should expose a narrow command surface:

```text
start()
stop()
restart()
status()
health()
pairing()
sendMessage()
acknowledgeEvent()
```

Provider orchestration should call these through an adapter rather than reaching directly into application internals.

---

## 15. Event Contract

Runtime events must be structured and idempotently identifiable.

Core events:

```text
runtime.created
runtime.started
runtime.pairing.required
runtime.pairing.updated
runtime.connected
runtime.disconnected
runtime.reconnecting
runtime.degraded
runtime.recovered
runtime.auth.updated
runtime.message.received
runtime.message.sent
runtime.failed
runtime.stopped
runtime.deleted
```

Each event should carry at minimum:

```text
instance_id
runtime_id
event_id
timestamp
schema_version
state
correlation_id
```

Message events should additionally carry a stable message identifier where provided by the upstream protocol.

---

## 16. Command Idempotency

Operations may be retried because control-plane/network requests are not guaranteed to be delivered exactly once.

At minimum:

```text
start  → idempotent desired state
stop   → idempotent desired state
restart → deduplicated operation
pairing → current pairing session
sendMessage → explicit caller idempotency key
```

The runtime should not send duplicate messages solely because the command transport retried.

---

## 17. Message Sending Boundary

Message sending flow:

```text
CRAYON API
   ↓
authorize
   ↓
validate
   ↓
resolve instance
   ↓
check RUNNING
   ↓
command queue
   ↓
Baileys runtime
   ↓
WhatsApp
   ↓
result event
```

The runtime should not implement customer billing or quota decisions; the control plane owns admission control.

---

## 18. Secrets

Secrets must not be written to normal logs.

Sensitive values include:

```text
session credentials
Signal keys
provider tokens
API keys
webhook secrets
pairing material
```

Structured logs should use redaction and typed fields rather than embedding secret material into arbitrary strings.

---

## 19. Logging Contract

Logs must be structured enough for centralized aggregation.

Minimum fields:

```text
level
timestamp
instance_id
runtime_id
component
event
message
correlation_id
error_code
```

Recommended levels:

```text
DEBUG
INFO
WARN
ERROR
```

No sensitive credential material may be logged.

---

## 20. Resource and Backpressure Policy

Baileys workload must protect itself from unbounded queues and memory growth.

At minimum:

```text
bounded command queue
bounded internal buffers
message processing concurrency limit
media size limits
retry ceilings
```

When limits are exceeded, the runtime must expose a typed health/usage signal rather than silently dropping work.

---

## 21. Provider-Agnostic Deployment Contract

The runtime adapter receives:

```text
instance_id
image
version
resource_class
environment
secret_refs
network_policy
persistence_ref
```

The provider returns:

```text
runtime_id
provider
endpoint
state
health
created_at
```

The provider must be replaceable without changing the WhatsApp API contract.

---

## 22. Cloudflare Container Profile

When running on Cloudflare Containers, the runtime profile must assume:

```text
container may restart
local disk is not the durable source of truth
process termination can occur
network connections may be interrupted
```

Therefore:

```text
persistent auth → external durable store
connection → reconnectable
startup → restore-safe
health → externally observable
```

A Cloudflare-specific adapter owns provisioning, lifecycle, routing, and provider mechanics.

---

## 23. Docker VPS Profile

When running on a Docker VPS:

```text
container may restart
host may reboot
```

The same persistence and recovery rules still apply.

Docker volume may be used as a local cache or recovery accelerator, but the application contract should remain portable and the control plane should retain authoritative metadata.

---

## 24. Failure Taxonomy

```text
RUNTIME
├── process_failure
├── memory_pressure
├── filesystem_failure
└── configuration_error

NETWORK
├── connection_timeout
├── upstream_disconnect
├── DNS_failure
└── transport_error

AUTH
├── session_missing
├── session_invalid
└── re_pair_required

PERSISTENCE
├── read_failure
├── write_failure
├── conflict
└── schema_mismatch

POLICY
├── unsupported_operation
├── account_restriction
└── operator_suspension
```

Errors should map to stable machine-readable codes.

---

## 25. Deployment Rollout

Baileys runtime upgrades must not assume that all instances can be upgraded simultaneously.

Recommended rollout:

```text
NEW IMAGE
   ↓
health check
   ↓
single canary
   ↓
observe
   ↓
small batch
   ↓
progressive rollout
```

Session compatibility must be checked before switching versions.

Rollback must restore the previous known-good workload version without deleting session state.

---

## 26. Deletion Semantics

Deleting a runtime does not automatically mean deleting its durable session.

Separate actions:

```text
STOP RUNTIME
DELETE RUNTIME
DISCONNECT WHATSAPP
DELETE SESSION
DELETE INSTANCE
```

The product must make these distinctions explicit so accidental deletion cannot destroy a reusable WhatsApp session silently.

---

## 27. Observability Requirements

Every instance should expose:

```text
current state
last connected time
last message time
last heartbeat
reconnect count
restart count
message throughput
error count
persistence health
runtime version
```

These metrics feed CRAYON's generic Observe surface; this document does not redefine the global observability UI.

---

## 28. Security Boundaries

The runtime is untrusted from the point of view of the control plane.

Never allow a compromised instance to:

```text
read another tenant's session
read another instance's secrets
modify billing state
modify authorization
impersonate control-plane identity
```

All control-plane calls require scoped authentication and instance identity.

---

## 29. Runtime Identity

Each instance must have stable logical identity independent of provider placement.

```text
instance_id = stable customer resource identity
runtime_id  = current compute placement identity
provider_id = provider-specific identifier
```

Example:

```text
instance_id: wa_01J...
runtime_id:  cfcontainer_...
provider:    cloudflare
```

After migration:

```text
instance_id: wa_01J...
runtime_id:  docker_...
provider:    docker-vps
```

The customer still sees the same WhatsApp instance.

---

## 30. Contract Invariants

The following are non-negotiable:

1. **Session state survives runtime replacement.**
2. **Runtime provider is replaceable.**
3. **Unexpected process exit is recoverable.**
4. **Reconnect loops are bounded.**
5. **Health and readiness are explicit.**
6. **Secrets never appear in normal logs.**
7. **Commands tolerate transport retries.**
8. **Message sending avoids duplicate delivery caused by command retries.**
9. **Destructive deletion of session state is explicit.**
10. **The runtime never becomes the owner of customer billing or authorization.**

---

## 31. Implementation Boundary

This contract is complete when an implementation can answer, in code and tests:

```text
How does an instance start?
How does it pair?
Where is auth state stored?
What happens after restart?
What happens when WhatsApp disconnects?
What happens when persistence fails?
How does the control plane know health?
How is a message command made retry-safe?
How can the same instance migrate providers?
How is session deletion distinguished from runtime deletion?
```

The next implementation layer may define concrete adapters, schemas, Docker images, Cloudflare bindings, database tables, and test fixtures without changing this contract unless a versioned architecture decision is recorded.
