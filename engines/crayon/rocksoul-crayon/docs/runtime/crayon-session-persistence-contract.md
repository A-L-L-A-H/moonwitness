# CRAYON — Session Persistence Contract v1.0

## Status

**Version:** 1.0  
**Role:** Durable session-state contract for stateful WhatsApp/Baileys instances  
**Product boundary:** Defines how CRAYON stores, updates, restores, versions, protects, and deletes WhatsApp session state. It does not redefine the public WhatsApp API or Baileys process lifecycle.

This contract complements:

- `docs/product/crayon-whatsapp-api-contract.md`
- `docs/runtime/crayon-baileys-runtime-contract.md`

The central invariant is simple:

> A runtime is replaceable; the logical WhatsApp session is not tied to that runtime's local filesystem.

---

## 1. Purpose

A WhatsApp instance is stateful. Baileys authentication material changes during the lifetime of a session and must remain available across:

```text
process restart
container restart
host restart
runtime replacement
provider migration
rolling deployment
runtime crash
planned maintenance
```

CRAYON therefore separates:

```text
Logical Instance
      │
      ├── authoritative session state
      └── current runtime placement
```

The session store is an infrastructure boundary, not an application-local directory that happens to survive today.

---

## 2. Canonical identity

Session state is addressed by the stable CRAYON instance identity:

```text
organization_id
project_id
environment_id
instance_id
```

The canonical key is:

```text
session:{organization_id}:{project_id}:{environment_id}:{instance_id}
```

Provider-specific identifiers must never become the primary session key:

```text
runtime_id       ≠ session identity
container_id     ≠ session identity
host_id           ≠ session identity
pod_id            ≠ session identity
provider_account  ≠ session identity
```

A new runtime must resolve the same durable state using the same `instance_id`.

---

## 3. Session state boundary

Conceptually:

```text
                CRAYON CONTROL PLANE
                         │
                   instance_id
                         │
                         ▼
                SESSION REPOSITORY
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Credentials     Signal Keys    Metadata
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Baileys Runtime
```

The repository owns persistence semantics.

The Baileys runtime owns protocol-specific state transitions.

The control plane owns authorization, lifecycle intent, tenancy, and destructive-operation policy.

---

## 4. State classes

Persisted state is divided into explicit classes.

### 4.1 Credentials

Examples include the primary Baileys authentication credential structure and compatible versioned metadata required to restore it.

Requirements:

```text
encrypted at rest
instance-scoped
versioned
integrity checked
never returned by ordinary API reads
```

### 4.2 Signal key material

Signal-related key/value records are treated as sensitive mutable state.

Requirements:

```text
atomic where practical
instance-scoped
versioned by store schema
protected from ordinary application queries
```

### 4.3 Session metadata

Non-secret metadata required to operate the persistence layer may include:

```text
schema_version
created_at
updated_at
last_persisted_at
revision
runtime_last_seen
state_checksum
store_backend
```

Metadata must not contain raw credential material.

### 4.4 Recovery metadata

The store may retain bounded information needed to diagnose recovery, such as:

```text
last_valid_revision
last_successful_restore
last_persistence_error_code
migration_state
backup_reference
```

Retention must be bounded and must not become an uncontrolled event log.

---

## 5. Logical storage model

The implementation may use SQL, KV, object storage, or another durable system, but the logical model must remain stable.

```text
SessionRecord
├── identity
├── schema
├── revision
├── credentials
├── key_collection
├── integrity
├── timestamps
└── lifecycle
```

Suggested conceptual record:

```json
{
  "organizationId": "org_01J...",
  "projectId": "proj_01J...",
  "environmentId": "env_prod",
  "instanceId": "wa_01J...",
  "schemaVersion": 1,
  "revision": 184,
  "createdAt": "2026-09-10T12:00:00Z",
  "updatedAt": "2026-09-10T12:14:11Z",
  "integrity": {
    "algorithm": "sha256",
    "value": "..."
  },
  "lifecycle": "active"
}
```

Sensitive data may be stored in separate encrypted columns/records rather than in one physical blob.

---

## 6. Revision model

Session mutations are monotonic within one logical instance.

```text
revision 41
   ↓
auth update
   ↓
revision 42
   ↓
auth update
   ↓
revision 43
```

Rules:

1. A successful write advances the revision.
2. A stale writer must not silently overwrite a newer revision.
3. Revision comparison must be server-side authoritative.
4. Failed writes must not claim a durable revision that does not exist.

Recommended write primitive:

```text
compare(expected_revision)
        ↓
apply mutation
        ↓
commit revision + 1 atomically
```

When backend constraints prevent a true transaction, an equivalent optimistic-concurrency mechanism must be used.

---

## 7. Read contract

A runtime restore request is logically:

```text
load(instance_id)
   ↓
not_found | found
   ↓
validate schema
   ↓
validate integrity
   ↓
return session state
```

The repository must distinguish:

```text
NOT_FOUND
CORRUPT
SCHEMA_UNSUPPORTED
ACCESS_DENIED
TEMPORARY_FAILURE
```

These states must not collapse into a generic `empty session`, because an empty session can incorrectly trigger unnecessary re-pairing.

---

## 8. Write contract

Auth updates follow:

```text
Baileys auth update
        ↓
normalize
        ↓
validate
        ↓
encrypt/protect
        ↓
compare revision
        ↓
atomic commit
        ↓
ack
```

The runtime should treat successful persistence as the durability acknowledgement.

It must not acknowledge a critical state update before the store has accepted it according to the repository's durability guarantee.

---

## 9. Atomicity

The persistence layer must prevent partially committed session states from becoming the active canonical state.

At minimum:

```text
credentials + required key mutations
```

must have a consistent commit boundary, or the backend must use a transaction/versioned snapshot strategy that provides equivalent semantics.

A runtime crash during persistence must resolve to either:

```text
previous valid revision
OR
new valid revision
```

not an ambiguous half-written state.

---

## 10. Concurrency

Only one logical instance may be actively mutating its session state at a time under normal operation.

The system must also tolerate accidental concurrent runtimes during deployment or recovery.

Recommended protections:

```text
instance-scoped optimistic locking
lease/fencing token when required
monotonic revision
writer identity
```

A stale runtime must receive a typed conflict and must not overwrite the current state.

---

## 11. Runtime lease / fencing

When CRAYON detects a potential split-brain situation:

```text
old runtime ─────┐
                 ├── same instance
new runtime ─────┘
```

the control plane may issue a generation/fencing token:

```text
instance_generation = 17
```

Writes are accepted only from the currently authorized generation.

Example:

```text
old runtime generation 16 → REJECTED
new runtime generation 17 → ACCEPTED
```

This prevents a delayed old process from corrupting session state after migration.

---

## 12. Restore contract

Runtime startup must use this sequence:

```text
runtime starts
   ↓
resolve instance identity
   ↓
acquire current runtime generation
   ↓
load latest session revision
   ↓
validate schema
   ↓
validate integrity
   ↓
initialize Baileys state adapter
   ↓
connect
```

Restore must be read-only until the runtime has established its writer authority.

The restored revision becomes the runtime's starting point.

---

## 13. Schema versioning

Session data is explicitly versioned:

```text
schema_version = N
```

A runtime must declare the versions it can read and write.

Compatibility matrix:

```text
runtime can read store version → restore allowed
runtime cannot read store version → fail safely
runtime can migrate store version → controlled migration
```

Never silently reinterpret incompatible state.

Breaking session schema changes require a versioned migration or a new persistence contract revision.

---

## 14. Migration

Migration must be separate from ordinary auth updates.

```text
LOAD OLD
   ↓
VALIDATE
   ↓
TRANSFORM
   ↓
VALIDATE NEW
   ↓
WRITE NEW VERSION
   ↓
VERIFY
   ↓
COMMIT MIGRATION
```

Migration must be resumable or safely repeatable.

The system must retain enough metadata to determine whether a migration is:

```text
not_started
in_progress
completed
failed
rolled_back
```

---

## 15. Backup and recovery

Durable session storage must support a recovery strategy appropriate to the deployment tier.

Minimum logical capabilities:

```text
snapshot/reference
restore
integrity verification
retention policy
operator recovery path
```

Backups must not become an alternate untracked source of truth. The authoritative record remains the current committed session revision.

A restored backup must produce a new verified revision rather than mutating history invisibly.

---

## 16. Encryption and key management

Sensitive session state must be encrypted at rest.

Recommended boundary:

```text
CRAYON
  ↓
application encryption layer or managed encrypted storage
  ↓
durable backend
```

Encryption keys must be separated from ordinary session records.

The persistence contract does not mandate one key-management provider, but it requires:

```text
key rotation support
scoped access
revocation capability
auditable decrypt access
```

Plaintext credential material must not be written to ordinary logs, metrics, traces, or API responses.

---

## 17. Tenant isolation

Every read and write is scoped to the tenant hierarchy:

```text
organization
   ↓
project
   ↓
environment
   ↓
instance
   ↓
session
```

A caller or runtime must not be able to address a session by `instance_id` alone without an authorization context.

Cross-tenant reads are denied even when identifiers are known.

---

## 18. Deletion semantics

Session lifecycle is explicit:

```text
ACTIVE
   ↓
DISCONNECT_REQUESTED
   ↓
DISCONNECTED
   ↓
RETENTION_PENDING
   ↓
PURGED
```

Runtime deletion does not imply session purge.

The control plane must distinguish:

```text
DELETE RUNTIME
DISCONNECT SESSION
ARCHIVE SESSION
PURGE SESSION
DELETE INSTANCE
```

`PURGE SESSION` is destructive and must require explicit authorization according to product policy.

---

## 19. Retention

Retention is policy-driven, not accidental.

The system should be able to configure different policies for:

```text
active sessions
stopped instances
deleted instances
failed migrations
backups
recovery snapshots
```

Expired material must be securely purged according to the storage backend's guarantees.

Do not retain session secrets merely because generic application logs or backups happen to contain them.

---

## 20. Cache policy

A runtime may maintain a local or memory cache:

```text
Durable Store
      ↓
Local runtime cache
      ↓
Baileys
```

Cache is never authoritative.

On mismatch:

```text
Durable revision > local revision
        ↓
refresh local state
```

A container-local copy may accelerate restart but must never be the only durable copy.

---

## 21. Failure semantics

The repository exposes typed failure classes:

```text
session_not_found
session_access_denied
session_corrupt
session_schema_unsupported
session_conflict
session_write_failed
session_read_failed
session_integrity_failed
session_migration_required
session_migration_failed
session_generation_rejected
session_backend_unavailable
session_key_unavailable
```

Runtime responses:

```text
temporary persistence failure
    → DEGRADED / retry policy

conflict
    → stop stale writer / reconcile

schema unsupported
    → safe failure / migration path

corrupt state
    → quarantine / recovery procedure

access denied
    → fail closed
```

Never convert corruption into an automatic fresh-pair operation without explicit policy.

---

## 22. Backpressure

Auth updates may arrive faster than the backend can commit them.

The adapter must provide:

```text
bounded write queue
coalescing where semantically safe
ordered application
retry with backoff
persistent failure signal
```

Coalescing must never discard a required mutation merely because a later update arrived.

Where a backend already provides transactional state semantics, batching is allowed only when it preserves the required ordering and atomicity guarantees.

---

## 23. Observability

Persistence health should expose normalized signals:

```text
session_revision
last_persisted_at
persistence_latency
write_failures
read_failures
conflict_count
migration_state
store_backend_health
key_management_health
```

Logs should contain identifiers and error codes, not credential contents.

Example:

```text
level=ERROR
component=session-store
event=session.write.failed
instance_id=wa_01J...
revision=184
error_code=session_backend_unavailable
trace_id=trace_01J...
```

---

## 24. Audit

The following operations require auditable records where applicable:

```text
session_created
session_restored
session_updated
session_migrated
session_backup_created
session_restored_from_backup
session_disconnected
session_purged
session_access_denied
```

Audit metadata should include:

```text
actor
organization
project
environment
instance
operation
outcome
timestamp
request_id
trace_id
runtime_generation
```

Audit records must not embed raw secrets.

---

## 25. Provider portability

The persistence contract must work independently of runtime placement:

```text
Cloudflare Container ─┐
Docker VPS            ├── same SessionRepository contract
Future provider       ┘
```

Provider migration should therefore be:

```text
stop/drain old runtime
      ↓
acquire new runtime generation
      ↓
restore same instance session
      ↓
verify
      ↓
connect
```

No provider-specific session format may leak into the public API.

---

## 26. Repository interface

The implementation should expose a narrow logical interface, for example:

```text
get(instance_scope)
create(instance_scope, initial_state)
apply_update(instance_scope, expected_revision, update)
get_metadata(instance_scope)
check_health()
start_migration(instance_scope)
complete_migration(instance_scope)
create_snapshot(instance_scope)
restore_snapshot(instance_scope, snapshot_ref)
archive(instance_scope)
purge(instance_scope)
```

The exact programming language and backend are implementation details.

The interface must preserve the semantics above.

---

## 27. Database / backend neutrality

The contract intentionally permits multiple physical strategies:

```text
PostgreSQL
KV store
object store + metadata DB
managed durable storage
future specialized session store
```

A backend is acceptable only if it can satisfy:

```text
durability
atomic/consistent update semantics
concurrency control
tenant isolation
encryption
observability
recovery
```

Technology selection must not redefine the logical session contract.

---

## 28. Security invariants

1. Session secrets are encrypted at rest.
2. Session records are tenant-scoped.
3. Runtime identity is distinct from session identity.
4. Stale runtimes cannot overwrite newer session state.
5. Plaintext credentials never enter ordinary logs.
6. Session deletion is explicit and auditable.
7. Backups are protected with the same sensitivity level as active session state.
8. Access is fail-closed.
9. Unsupported schema versions cannot be silently interpreted.
10. Local container disk is never the sole durable source of truth.

---

## 29. Recovery invariants

1. Every accepted session update has a deterministic revision.
2. A runtime restart can restore the latest accepted revision.
3. A provider migration can restore the same logical session.
4. A failed write cannot masquerade as success.
5. A stale writer cannot corrupt current state.
6. Corruption is detectable before the state is used.
7. Destructive purge cannot occur as a side effect of runtime replacement.

---

## 30. Implementation acceptance criteria

The implementation is contract-complete when tests demonstrate:

```text
✓ create session
✓ write auth update
✓ restore after process restart
✓ restore after container replacement
✓ reject stale revision
✓ reject stale runtime generation
✓ detect corrupt state
✓ reject unsupported schema
✓ migrate a valid older schema
✓ survive transient backend outage with safe runtime behavior
✓ prevent cross-tenant session access
✓ preserve session through provider migration
✓ distinguish runtime deletion from session purge
✓ produce auditable session mutations
✓ keep secrets out of logs
```

---

## 31. Next implementation layer

This contract intentionally stops before choosing the concrete storage technology.

The next layer may define:

```text
SessionRepository implementation
database schema
key/value layout
encryption envelope
Cloudflare binding
Docker/VPS storage profile
migration tooling
backup tooling
integration tests
```

Those implementation decisions must preserve this contract or introduce a versioned architecture decision record.
