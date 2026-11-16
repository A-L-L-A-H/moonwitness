# CRAYON — WhatsApp API Contract v1.0

## Status

**Version:** 1.0  
**Scope:** WhatsApp/Baileys public product contract  
**Purpose:** Define stable resources, endpoints, events, idempotency, errors, and lifecycle boundaries before runtime implementation.

This document is the API contract only. UI composition belongs to `crayon-whatsapp-baileys-showcase.md`; generic resource semantics belong to `crayon-domain-resource-model.md`; runtime implementation belongs to the future Baileys runtime contract.

---

## 1. Contract principles

1. A WhatsApp instance is a CRAYON-owned resource backed by an implementation runtime.
2. Baileys is an implementation choice, not the public API identity.
3. Providers and runtime hosts remain behind an adapter boundary.
4. Every mutating request is authenticated, authorized, auditable, and scoped to an organization/project.
5. Mutations that can be retried must support idempotency.
6. Webhook/event delivery is at-least-once; consumers must deduplicate by event ID.
7. Runtime restarts are normal and must not invalidate product state.
8. Session credentials are never returned through ordinary resource GET responses.

---

## 2. Resource hierarchy

```text
Organization
  ↓
Project
  ↓
Environment
  ↓
WhatsApp Instance
  ├── Connection
  ├── Session
  ├── Messages
  ├── Automations
  ├── Webhooks
  ├── Events
  └── Usage
```

### Canonical identifiers

```text
org_{id}
proj_{id}
env_{id}
wa_{id}
msg_{id}
wh_{id}
evt_{id}
```

IDs are opaque and must not encode provider-specific identifiers.

---

## 3. WhatsApp Instance

A WhatsApp Instance represents one customer-managed WhatsApp identity and its execution lifecycle.

### Example representation

```json
{
  "id": "wa_01J...",
  "projectId": "proj_01J...",
  "environmentId": "env_01J...",
  "name": "wa-sales",
  "status": "connected",
  "runtime": {
    "kind": "container",
    "engine": "baileys"
  },
  "phone": {
    "display": "+62••••••1234",
    "verified": true
  },
  "createdAt": "2026-09-10T12:00:00Z",
  "updatedAt": "2026-09-10T12:04:00Z"
}
```

`phone` must be redacted according to the account privacy policy.

---

## 4. Lifecycle state machine

```text
                         ┌──────────────┐
                         │   CREATING   │
                         └──────┬───────┘
                                ↓
                         ┌──────────────┐
                         │   PAIRING    │
                         └──────┬───────┘
                                ↓
                         ┌──────────────┐
                         │  CONNECTED   │
                         └──────┬───────┘
                                ↓
                         ┌──────────────┐
                         │   RUNNING    │◄──────────┐
                         └──────┬───────┘           │
                                │                   │
                         connection loss      reconnect success
                                ↓                   │
                         ┌──────────────┐           │
                         │ RECONNECTING │───────────┘
                         └──────┬───────┘
                                │
                         unrecoverable
                                ↓
                         ┌──────────────┐
                         │    ERROR     │
                         └──────────────┘
```

Terminal administrative states:

```text
STOPPED
DELETING
DELETED
```

Runtime failures must never silently transition an instance to `deleted`.

---

## 5. REST API

Base path:

```text
/api/v1
```

### Create

```http
POST /projects/{projectId}/whatsapp/instances
```

Request:

```json
{
  "name": "wa-sales",
  "environmentId": "env_prod"
}
```

Response: `202 Accepted`

```json
{
  "instance": {
    "id": "wa_01J...",
    "status": "creating"
  },
  "operationId": "op_01J..."
}
```

### List

```http
GET /projects/{projectId}/whatsapp/instances
```

Supported query parameters:

```text
status
environmentId
cursor
limit
search
```

### Get

```http
GET /projects/{projectId}/whatsapp/instances/{instanceId}
```

### Start

```http
POST /projects/{projectId}/whatsapp/instances/{instanceId}/start
```

### Stop

```http
POST /projects/{projectId}/whatsapp/instances/{instanceId}/stop
```

### Restart

```http
POST /projects/{projectId}/whatsapp/instances/{instanceId}/restart
```

### Delete

```http
DELETE /projects/{projectId}/whatsapp/instances/{instanceId}
```

Deletion is asynchronous and must emit a terminal event.

---

## 6. Pairing API

Pairing is a short-lived capability, not the permanent session credential.

### Request pairing

```http
POST /projects/{projectId}/whatsapp/instances/{instanceId}/pairing
```

Response:

```json
{
  "pairingId": "pair_01J...",
  "method": "qr",
  "status": "pending",
  "expiresAt": "2026-09-10T12:10:00Z"
}
```

### Pairing status

```http
GET /projects/{projectId}/whatsapp/instances/{instanceId}/pairing/{pairingId}
```

### QR retrieval

```http
GET /projects/{projectId}/whatsapp/instances/{instanceId}/pairing/{pairingId}/qr
```

The QR endpoint must never persist a reusable credential in a publicly cacheable response.

### Pairing completion

Pairing completion is event-driven; clients should observe the instance state or subscription stream rather than polling indefinitely.

---

## 7. Messaging API

### Send text

```http
POST /projects/{projectId}/whatsapp/instances/{instanceId}/messages
```

Request:

```json
{
  "to": "+6281234567890",
  "type": "text",
  "text": {
    "body": "Hello from CRAYON."
  }
}
```

Response: `202 Accepted`

```json
{
  "messageId": "msg_01J...",
  "status": "queued"
}
```

### Future message types

```text
image
video
audio
document
sticker
location
contact
interactive
reply
```

Provider-specific payloads must live behind an explicit extension object and must not leak into the canonical text-message contract.

---

## 8. Message status

Canonical message states:

```text
QUEUED
SENDING
SENT
DELIVERED
READ
FAILED
CANCELLED
```

Not every WhatsApp event can be guaranteed for every message; absence of `READ` must not be interpreted as `FAILED`.

---

## 9. Incoming messages

Incoming messages are delivered as events.

Example:

```json
{
  "id": "evt_01J...",
  "type": "whatsapp.message.received",
  "occurredAt": "2026-09-10T12:11:00Z",
  "organizationId": "org_01J...",
  "projectId": "proj_01J...",
  "instanceId": "wa_01J...",
  "data": {
    "messageId": "msg_01J...",
    "from": "+6281234567890",
    "type": "text",
    "text": "Halo, mau tanya harga."
  }
}
```

Events contain normalized fields first. Raw provider payloads, where retained, belong in a protected debug/raw field with explicit retention rules.

---

## 10. Webhooks / subscriptions

### Create webhook

```http
POST /projects/{projectId}/whatsapp/webhooks
```

Request:

```json
{
  "url": "https://example.com/webhooks/crayon",
  "events": [
    "whatsapp.message.received",
    "whatsapp.message.status",
    "whatsapp.instance.status"
  ]
}
```

### Webhook representation

```json
{
  "id": "wh_01J...",
  "status": "active",
  "url": "https://example.com/webhooks/crayon",
  "events": [
    "whatsapp.message.received",
    "whatsapp.message.status",
    "whatsapp.instance.status"
  ],
  "createdAt": "2026-09-10T12:00:00Z"
}
```

Webhook delivery requirements:

```text
at-least-once delivery
stable event IDs
signed payloads
retries with backoff
delivery timeout
dead-letter handling
manual replay capability
```

---

## 11. Event taxonomy

Canonical event families:

```text
whatsapp.instance.created
whatsapp.instance.status
whatsapp.instance.started
whatsapp.instance.stopped
whatsapp.instance.restarted
whatsapp.instance.deleted
whatsapp.pairing.created
whatsapp.pairing.completed
whatsapp.pairing.expired
whatsapp.connection.lost
whatsapp.connection.restored
whatsapp.message.received
whatsapp.message.queued
whatsapp.message.sent
whatsapp.message.status
whatsapp.message.failed
whatsapp.automation.triggered
whatsapp.automation.completed
whatsapp.automation.failed
```

Event names are stable API identifiers. Internal provider event names must not be exposed as the canonical taxonomy.

---

## 12. Event envelope

All asynchronous events should follow one envelope:

```json
{
  "id": "evt_01J...",
  "type": "whatsapp.instance.status",
  "version": 1,
  "occurredAt": "2026-09-10T12:11:00Z",
  "organizationId": "org_01J...",
  "projectId": "proj_01J...",
  "environmentId": "env_prod",
  "resourceId": "wa_01J...",
  "traceId": "trace_01J...",
  "data": {}
}
```

Consumers must use `id` for deduplication.

---

## 13. Idempotency

All non-idempotent mutations must accept:

```http
Idempotency-Key: <client-generated-value>
```

At minimum:

```text
create instance
start
stop
restart
send message
create webhook
```

A repeated request with the same key and equivalent authenticated scope must return the original operation result rather than performing the action again.

---

## 14. Async operation model

Long-running actions return an operation ID.

```json
{
  "operationId": "op_01J...",
  "status": "queued"
}
```

Canonical operation states:

```text
QUEUED
RUNNING
SUCCEEDED
FAILED
CANCELLED
```

### Operation endpoint

```http
GET /operations/{operationId}
```

The operation resource is generic and reusable across deployments and future runtimes.

---

## 15. Error contract

Errors use a stable envelope:

```json
{
  "error": {
    "code": "whatsapp_instance_not_connected",
    "message": "The WhatsApp instance is not connected.",
    "requestId": "req_01J...",
    "details": {}
  }
}
```

Core error classes:

```text
unauthorized
forbidden
not_found
conflict
invalid_request
rate_limited
quota_exceeded
runtime_unavailable
provider_unavailable
pairing_expired
instance_not_connected
message_rejected
internal_error
```

Error codes are machine-readable; messages are user-readable but not contractual identifiers.

---

## 16. Authentication and authorization

Supported authentication mechanisms:

```text
Bearer session token
API key
```

Authorization is evaluated against:

```text
organization
project
environment
resource
operation
```

A token/API key must never grant access outside its tenant scope.

Minimum permissions:

```text
whatsapp:read
whatsapp:create
whatsapp:update
whatsapp:operate
whatsapp:send
whatsapp:delete
whatsapp:webhooks:manage
whatsapp:logs:read
```

---

## 17. Rate limits and quotas

Public API limits must be surfaced through headers and dashboard usage.

Dimensions may include:

```text
messages per minute
messages per day
concurrent operations
pairing attempts
webhook deliveries
API requests
WhatsApp instances
runtime hours
AI executions
```

Limits are policy/configuration data; exact commercial values do not belong in this API contract.

---

## 18. Secrets and session security

The API must never expose:

```text
private auth credentials
Signal keys
session database contents
provider access tokens
internal runtime secrets
```

Session storage is an implementation concern behind a persistence interface.

Required properties:

```text
encrypted at rest
scoped per instance
audited access
rotation/revocation support
backup/recovery strategy
```

---

## 19. Runtime boundary

Public API:

```text
CRAYON API
   ↓
WhatsApp Service
   ↓
Runtime Adapter
   ↓
Baileys Runtime
```

The API must not depend directly on:

```text
Docker socket
host filesystem
provider-specific container IDs
provider-specific network addresses
```

A runtime adapter owns those details.

---

## 20. Observability contract

Every instance exposes normalized:

```text
status
health
lastConnectedAt
lastDisconnectedAt
lastMessageAt
restartCount
errorCount
resource usage
usage cost projection
```

Logs are queried through a normalized interface; provider-native logs may be attached as implementation metadata.

---

## 21. Compatibility and versioning

API path versioning begins at:

```text
/v1
```

Backward-compatible additions may be made within v1.

Breaking changes require a new major API version.

Event versions are explicit in the event envelope.

Clients must ignore unknown additive fields.

---

## 22. Audit requirements

The following actions must create audit records:

```text
instance created
instance started
instance stopped
instance restarted
instance deleted
pairing initiated
webhook created/updated/deleted
message sent
credentials/session changed
quota/billing-impacting changes
```

Audit records must include actor, tenant scope, resource, action, outcome, timestamp, request ID, and trace ID where available.

---

## 23. Acceptance criteria

The contract is implementation-ready when:

```text
✓ instance lifecycle is deterministic
✓ provider IDs are hidden from canonical resources
✓ send-message is idempotent
✓ event delivery is deduplicable
✓ pairing is short-lived
✓ session secrets never enter ordinary API responses
✓ runtime restarts are recoverable
✓ tenant boundaries are explicit
✓ quota failures are machine-readable
✓ asynchronous actions expose operation IDs
✓ audit coverage is defined
```

This contract intentionally does not define the internal Baileys code structure. That belongs to the runtime contract.
