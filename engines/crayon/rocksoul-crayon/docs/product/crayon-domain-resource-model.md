# CRAYON — Domain & Resource Model

## Status

**Version:** 1.0  
**Role:** Domain-model and resource-contract source of truth  
**Brand:** CRAYON  
**Official meaning:** Create. Run. Automate. Your Own Network.  
**Core promise:** Make it run.

---

## 1. Purpose

This document defines the canonical domain concepts, ownership boundaries, relationships, lifecycle states, identifiers, and provider abstractions for CRAYON.

The model translates the Information Architecture into implementation-ready concepts without coupling customer-facing product semantics to a specific compute provider.

The central invariant is:

```text
CUSTOMER INTENT
    ↓
PRODUCT RESOURCE
    ↓
RUNTIME RESOLUTION
    ↓
PROVIDER RESOURCE
```

A customer creates and owns a CRAYON resource. A provider executes the resource. Provider objects are implementation details and must never become the primary product identity.

---

## 2. Domain Hierarchy

```text
Account
└── Organization
    ├── Members
    ├── Plan
    ├── Billing Account
    ├── Projects
    │   ├── Environments
    │   │   ├── Applications
    │   │   │   ├── Deployments
    │   │   │   └── Runtime Resources
    │   │   ├── Services
    │   │   ├── Workflows
    │   │   ├── WhatsApp Instances
    │   │   ├── Domains
    │   │   ├── Storage Resources
    │   │   ├── Data Connections
    │   │   └── Secrets
    │   └── Usage
    └── API Keys / Integrations
```

This hierarchy provides isolation, authorization, billing attribution, and predictable navigation.

---

## 3. Identity Model

### 3.1 Account

An authenticated human identity.

Responsibilities:

```text
login
profile
credentials
sessions
security settings
```

An Account may belong to one or more Organizations.

### 3.2 Organization

The primary ownership, tenancy, and billing boundary.

```text
Organization
├── id
├── name
├── slug
├── plan_id
├── billing_account_id
├── created_at
├── updated_at
└── status
```

All billable customer resources must be attributable to exactly one Organization.

### 3.3 Membership

Defines an Account's role within an Organization.

```text
Membership
├── organization_id
├── account_id
├── role
├── status
└── joined_at
```

### 3.4 API Key

A machine credential scoped to an Organization and optionally narrowed to resources/permissions.

Never expose secret material after creation.

---

## 4. Project

A Project is the main customer workspace and grouping boundary.

```text
Project
├── organization_id
├── name
├── slug
├── description
├── environments
├── resources
└── status
```

A Project should own related infrastructure without becoming a provider-specific account.

Examples:

```text
shop
sales-bot
customer-portal
internal-tools
```

---

## 5. Environment

An Environment represents an execution context inside a Project.

Standard names:

```text
development
staging
production
```

Custom environments may exist later.

```text
Environment
├── project_id
├── name
├── slug
├── type
├── variables
├── resource links
└── protection policy
```

Production may have stricter approval, secret, deployment, and deletion policies than development.

---

## 6. Application

An Application is the customer-facing software unit that CRAYON helps run.

It is a logical resource, not a container or Worker.

```text
Application
├── project_id
├── environment_id
├── name
├── slug
├── source
├── runtime_intent
├── configuration
├── current_release
└── status
```

### Source types

```text
git
container_image
template
archive
future_local_cli
```

### Runtime intent

```text
worker
container
job
external_node
auto
```

`auto` delegates the decision to CRAYON's runtime resolver.

---

## 7. Source

A Source describes where an Application's code or image comes from.

```text
Source
├── type
├── repository/provider
├── repository_url
├── branch/tag/commit
├── image
└── build configuration
```

The source snapshot used by a Deployment must be immutable through a resolved revision identifier.

---

## 8. Deployment

A Deployment is an immutable release attempt for an Application.

```text
Deployment
├── application_id
├── environment_id
├── source_revision
├── build
├── release
├── runtime_binding
├── status
├── started_at
├── completed_at
└── failure_reason
```

Deployment lifecycle:

```text
QUEUED
  ↓
BUILDING
  ↓
RELEASING
  ↓
HEALTH_CHECK
  ↓
ACTIVE
```

Failure branches:

```text
BUILDING      → FAILED
RELEASING     → FAILED
HEALTH_CHECK  → DEGRADED / FAILED
```

A deployment must be traceable to the exact source revision and runtime resource that executed it.

---

## 9. Runtime Resource

A Runtime Resource is the execution layer backing an Application, Job, or other deployable workload.

```text
Runtime Resource
├── id
├── type
├── provider
├── provider_resource_id
├── location
├── desired_state
├── observed_state
├── resource_class
└── capabilities
```

Supported logical runtime types:

```text
Worker
Container
Job
External Node
```

Provider examples:

```text
cloudflare
vps
future_provider
```

Provider choice is replaceable.

---

## 10. Runtime Resolver

The Runtime Resolver converts product requirements into an execution plan.

```text
Application requirements
        ↓
Policy
        ↓
Runtime Resolver
        ↓
Runtime Type
        ↓
Provider Adapter
        ↓
Provider Resource
```

Inputs may include:

```text
network requirements
persistent process requirement
WebSocket requirement
CPU/memory needs
execution duration
storage requirements
region
plan limits
cost policy
```

Example:

```text
Baileys
+ persistent WebSocket
+ Node.js compatibility
        ↓
Container
        ↓
Cloudflare Container OR VPS Docker
```

---

## 11. Provider Adapter

A Provider Adapter translates CRAYON operations into provider-specific APIs.

```text
ProviderAdapter
├── provision
├── start
├── stop
├── restart
├── delete
├── inspect
├── logs
├── metrics
├── deploy
└── health
```

CRAYON must not expose provider-specific implementation details as mandatory product concepts.

---

## 12. Service

A Service is a reachable application endpoint or internal dependency.

```text
Service
├── project_id
├── application_id
├── environment_id
├── name
├── protocol
├── host
├── port
├── visibility
└── health
```

Examples:

```text
https
http
websocket
tcp
internal
```

A Service may expose a public endpoint, internal endpoint, or both.

---

## 13. Domain

A Domain represents customer-controlled or managed DNS naming attached to a CRAYON resource.

```text
Domain
├── organization_id
├── project_id
├── hostname
├── provider
├── verification
├── routing target
└── TLS state
```

Examples:

```text
app.example.com
api.example.com
wa.example.com
```

Domain ownership and DNS records must remain auditable.

---

## 14. Storage Resource

A Storage Resource is a logical object/file persistence capability.

```text
Storage
├── project_id
├── type
├── provider
├── bucket / namespace
├── region
├── quota
└── status
```

Logical types may include:

```text
object
artifact
backup
cache
future volume
```

For workloads with ephemeral compute, persistent product data must reside outside the ephemeral runtime filesystem.

---

## 15. Data Connection

A Data Connection represents a configured external or managed data source.

```text
DataConnection
├── project_id
├── type
├── provider
├── endpoint
├── database/schema
├── credential reference
└── status
```

Examples:

```text
PostgreSQL
Redis
D1
Neon
Supabase
future providers
```

Credentials are stored as secret references, never inline application records.

---

## 16. Secret

A Secret is sensitive configuration material referenced by applications, deployments, integrations, and workflows.

```text
Secret
├── project_id
├── environment_id
├── name
├── version
├── scope
├── created_at
├── rotated_at
└── status
```

Secret values should be encrypted and never returned in normal read APIs after creation.

---

## 17. Workflow

A Workflow is a persistent automation definition.

```text
Workflow
├── project_id
├── environment_id
├── trigger
├── nodes
├── edges
├── policy
├── version
└── status
```

Execution model:

```text
TRIGGER
  ↓
CONTEXT
  ↓
DECISION / CONDITION
  ↓
ACTION
  ↓
OBSERVE
```

Workflow versions should be immutable once activated.

---

## 18. Workflow Run

A Workflow Run records one execution of a Workflow version.

```text
WorkflowRun
├── workflow_id
├── workflow_version
├── trigger_event
├── status
├── started_at
├── completed_at
└── failure
```

Lifecycle:

```text
QUEUED
→ RUNNING
→ SUCCEEDED
```

Failure states:

```text
FAILED
CANCELLED
TIMED_OUT
```

---

## 19. AI Agent

An AI Agent is a configured automation actor that can reason within explicit boundaries and invoke permitted tools/actions.

```text
AIAgent
├── project_id
├── environment_id
├── model_policy
├── instructions
├── tools
├── memory policy
├── budget policy
├── safety policy
└── status
```

The AI Agent must not bypass CRAYON authorization or quota controls.

---

## 20. WhatsApp Instance

A WhatsApp Instance is a first-class managed integration/workload representing one authenticated WhatsApp session.

```text
WhatsAppInstance
├── project_id
├── environment_id
├── name
├── runtime_resource_id
├── connection_state
├── pairing_state
├── auth_state_reference
├── automation links
├── webhook configuration
└── usage
```

Typical implementation:

```text
WhatsApp Instance
      ↓
Container Runtime
      ↓
Node.js
      ↓
Baileys
      ↓
WhatsApp
```

The runtime implementation is replaceable; the product concept remains `WhatsAppInstance`.

### Lifecycle

```text
CREATING
  ↓
PAIRING
  ↓
CONNECTED
  ↓
RUNNING
  ↓
RECONNECTING ──→ RUNNING
  │
  └────────────→ DEGRADED / FAILED
```

Session state must survive runtime restarts.

---

## 21. Integration

An Integration connects CRAYON to an external system.

Examples:

```text
GitHub
GitLab
WhatsApp
OpenAI
Anthropic
Gemini
payment provider
email provider
notification provider
```

```text
Integration
├── organization_id / project_id
├── provider
├── type
├── credential reference
├── configuration
└── status
```

Integrations may be organization-scoped or project-scoped.

---

## 22. Event

An Event is an immutable record of a meaningful system transition.

```text
Event
├── organization_id
├── project_id
├── resource_type
├── resource_id
├── event_type
├── actor
├── payload
└── occurred_at
```

Examples:

```text
application.created
deployment.started
deployment.failed
runtime.restarted
whatsapp.connected
workflow.completed
secret.rotated
quota.warning
billing.charge
```

Events power activity feeds, audit trails, automations, and debugging.

---

## 23. Observation Model

Every major runtime-backed resource exposes a normalized observation shape.

```text
Observation
├── desired_state
├── observed_state
├── health
├── revision
├── provider_status
├── resource_usage
└── last_observed_at
```

This creates a stable UX regardless of whether the backing runtime is Worker, Container, or VPS.

---

## 24. Usage Meter

Usage records support quotas, billing, and capacity planning.

```text
UsageMeter
├── organization_id
├── project_id
├── resource_id
├── metric
├── quantity
├── unit
├── period
└── source
```

Initial metrics:

```text
requests
runtime_seconds
cpu_seconds
memory_gib_seconds
storage_gb_hours
bandwidth_bytes
automation_runs
ai_tokens
whatsapp_instances
```

Usage events must be appendable/reconcilable so billing can be audited.

---

## 25. Billing Model

Billing is attached to Organization ownership but derived from resource usage.

```text
Plan
  ↓
Entitlements
  ↓
Resource Limits
  ↓
Usage Meter
  ↓
Charge / Quota Decision
```

Billing concepts:

```text
Plan
Entitlement
Quota
Usage
Invoice
Credit
Charge
```

CRAYON should keep provider cost and customer price separate.

---

## 26. Resource State Model

All resources should distinguish desired state from observed state.

```text
Desired State:
RUNNING | STOPPED | DELETED

Observed State:
CREATING
STARTING
RUNNING
DEGRADED
STOPPING
STOPPED
FAILED
UNKNOWN
```

This avoids pretending that an asynchronous provider operation completed instantly.

For example:

```text
user clicks Restart
        ↓
desired_state = RUNNING
        ↓
observed_state = RESTARTING
        ↓
provider event
        ↓
observed_state = RUNNING
```

---

## 27. Identifier Rules

Every durable CRAYON resource needs a globally unique opaque identifier.

Recommended external shape:

```text
crn_<resource-type>_<opaque-id>
```

Examples:

```text
crn_app_01J...
crn_dep_01J...
crn_wa_01J...
crn_wf_01J...
```

Provider IDs must be stored separately:

```text
resource.id
provider_resource_id
```

Never expose a provider ID as the canonical CRAYON resource identity.

---

## 28. Ownership and Isolation

Every customer-owned resource must resolve to an Organization.

```text
Organization
  ↓
Project
  ↓
Environment
  ↓
Resource
```

Authorization must be checked at the resource boundary.

Cross-organization reads/writes are denied by default.

Background jobs must carry tenant context explicitly:

```text
job
├── organization_id
├── project_id
├── resource_id
└── actor / system identity
```

No ambient/global tenant assumptions.

---

## 29. Resource Relationships

Core relationship graph:

```text
Organization
  │
  ├── Project
  │    └── Environment
  │         ├── Application
  │         │    └── Deployment
  │         │         └── Runtime Resource
  │         ├── Service
  │         ├── Workflow
  │         │    └── Workflow Run
  │         ├── AI Agent
  │         ├── WhatsApp Instance
  │         ├── Domain
  │         ├── Storage
  │         ├── Data Connection
  │         └── Secret
  │
  ├── Integration
  ├── Membership
  ├── API Key
  └── Billing
```

Cross-resource references must use stable CRAYON resource IDs.

---

## 30. Resource Capability Model

Different runtime types support different capabilities.

```text
Capability
├── web_http
├── websocket
├── background_process
├── persistent_process
├── cron
├── queue
├── tcp
├── grpc
├── volume
├── object_storage
└── custom_domain
```

Runtime selection should use capabilities rather than hard-coded product names.

Example:

```text
Baileys
requires:
  websocket
  persistent_process
  outbound_network
  Node.js-compatible runtime

resolver:
  Container
```

---

## 31. Configuration Model

Separate configuration into four categories:

```text
PUBLIC CONFIG
  safe to expose to the client

RUNTIME CONFIG
  passed to the workload

SECRET CONFIG
  encrypted / secret reference

SYSTEM CONFIG
  CRAYON/provider-managed; not customer editable
```

This distinction must survive across UI, API, deployment, and provider adapters.

---

## 32. Audit Model

Every security-sensitive or destructive mutation must create an audit event.

Examples:

```text
member.role_changed
secret.created
secret.rotated
api_key.created
api_key.revoked
resource.deleted
resource.restarted
integration.connected
billing.updated
```

Audit data must identify:

```text
who
what
when
where
resource
result
```

---

## 33. Delete Model

Resources use explicit deletion semantics.

```text
ACTIVE
  ↓
DELETING
  ↓
DELETED
```

Where the provider supports asynchronous deletion, CRAYON tracks the operation until confirmed.

Soft-delete may be used for control-plane records, but provider resources must not remain unintentionally billable after logical deletion.

---

## 34. Idempotency

Provisioning, deployment, restart, webhook handling, and billing-related operations must be idempotent where possible.

Every externally-triggered mutating operation should support an idempotency key when retrying could create duplicates.

Example:

```text
POST /deployments
Idempotency-Key: deploy_<client-generated-key>
```

A retried request must resolve to the same logical operation rather than create another deployment.

---

## 35. Reconciliation

CRAYON is a control plane, so desired state may diverge from observed provider state.

Reconciliation loop:

```text
DESIRED STATE
      ↓
PROVIDER INSPECTION
      ↓
DIFF
      ↓
RECONCILE
      ↓
OBSERVE
      ↓
EVENT
```

Examples:

```text
container unexpectedly stopped
      ↓
observed = STOPPED
      ↓
desired = RUNNING
      ↓
reconcile
      ↓
restart
```

Provider failures must not corrupt the canonical customer resource record.

---

## 36. Product-Specific Mapping

### Web Application

```text
Application
  ↓
Deployment
  ↓
Worker / Container
  ↓
Service
  ↓
Domain
```

### WhatsApp / Baileys

```text
WhatsAppInstance
  ↓
Runtime Resource
  ↓
Container / External Node
  ↓
Baileys
  ↓
WhatsApp connection
```

### AI Agent

```text
AIAgent
  ↓
Model Provider
  ↓
Tools / Integrations
  ↓
Workflow / Action
  ↓
Usage Meter
```

### Automation

```text
Workflow
  ↓
Workflow Run
  ↓
Actions
  ↓
Events
  ↓
Usage
```

---

## 37. Database Design Principles

The first implementation should favor relational integrity and explicit foreign keys.

Required invariants:

```text
organization_id NOT NULL
project_id NOT NULL where applicable
environment_id NOT NULL where applicable
resource IDs unique
provider IDs namespaced by provider
timestamps on every mutable record
status/state modeled explicitly
soft deletion only where justified
```

Avoid generic JSON blobs for core relationships that need querying, authorization, or billing.

JSON may be used for provider-specific or extensible configuration behind typed boundaries.

---

## 38. API Boundary Principles

The API should expose product concepts, not provider primitives.

Good:

```http
POST /api/v1/projects/:projectId/applications
POST /api/v1/applications/:id/deployments
POST /api/v1/whatsapp/instances
POST /api/v1/workflows
```

Avoid making provider internals the primary route shape:

```http
POST /api/v1/cloudflare/containers/...
```

Provider-specific APIs may exist under an internal adapter boundary.

---

## 39. UX/Data Contract

Every resource detail view should consume a normalized contract:

```text
identity
status
health
current revision
provider summary
endpoint
configuration summary
usage
recent events
available actions
```

The UI should never have to understand five different provider schemas just to render:

```text
RUNNING
CPU
MEMORY
URL
LOGS
RESTART
```

---

## 40. Non-Negotiable Domain Rules

1. CRAYON resource identity is provider-neutral.
2. Organization is the ownership and billing boundary.
3. Project is the primary workspace boundary.
4. Environment separates deployment contexts.
5. Deployment is immutable and traceable to a source revision.
6. Desired state and observed state are separate.
7. Provider resources are implementation details.
8. Persistent state must survive ephemeral runtime replacement.
9. Tenant context is explicit in API and background jobs.
10. Usage is auditable and attributable to resources.
11. Secrets are references, not plaintext data fields.
12. Destructive operations are explicit and auditable.
13. Reconciliation is expected, not exceptional.
14. Runtime selection is capability-driven.
15. The product API speaks CRAYON concepts, not Cloudflare/VPS concepts.

---

## 41. Implementation Sequence

```text
01  Identity + Organization
02  Membership + Authorization
03  Project + Environment
04  Application + Source
05  Deployment
06  Runtime Resource
07  Provider Adapter interface
08  Service + Domain
09  Secret + Configuration
10  Usage Meter + Quota
11  Workflow + Workflow Run
12  Integration
13  WhatsApp Instance
14  AI Agent
15  Events + Audit
16  Reconciliation
17  Billing
```

The domain model should stabilize before building the visual component library around it.

---

## 42. Definition of Done

The CRAYON domain model is considered implementation-ready when:

```text
✓ every customer resource has a clear owner
✓ every resource has a stable identity
✓ lifecycle states are explicit
✓ desired vs observed state is represented
✓ provider adapters are replaceable
✓ usage can be attributed
✓ secrets are isolated
✓ background jobs carry tenant context
✓ destructive operations are auditable
✓ WhatsApp/Baileys is modeled as a product resource
✓ UI can render resources without provider-specific schemas
```
