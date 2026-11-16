# CRAYON — Information Architecture & Product Map

## Status

**Version:** 1.0  
**Role:** Product structure and UX source of truth  
**Brand:** CRAYON  
**Official meaning:** Create. Run. Automate. Your Own Network.  
**Core promise:** Make it run.

---

## 1. Purpose

This document defines the product structure of CRAYON before detailed UI implementation. It turns the brand narrative into a usable application model: navigation, resources, workspaces, lifecycle states, user journeys, and product boundaries.

CRAYON is not positioned as a generic hosting panel. It is a creative infrastructure platform for building, running, and automating software.

The primary product loop is:

```text
CREATE → RUN → AUTOMATE → CONNECT → OBSERVE → IMPROVE
```

The first-class product pillars remain:

```text
CREATE
RUN
AUTOMATE
YOUR OWN NETWORK
```

---

## 2. Product Map

```text
CRAYON
│
├── HOME
│   ├── Overview
│   ├── Activity
│   └── Quick Actions
│
├── CREATE
│   ├── Applications
│   ├── Templates
│   ├── Projects
│   └── Environments
│
├── RUN
│   ├── Deployments
│   ├── Runtimes
│   ├── Containers
│   ├── Workers
│   └── Jobs
│
├── AUTOMATE
│   ├── Workflows
│   ├── Schedules
│   ├── AI Agents
│   ├── WhatsApp
│   └── Integrations
│
├── YOUR OWN NETWORK
│   ├── Domains
│   ├── DNS
│   ├── Services
│   ├── Secrets
│   ├── Storage
│   └── Data
│
├── OBSERVE
│   ├── Logs
│   ├── Metrics
│   ├── Health
│   ├── Events
│   └── Usage
│
└── ACCOUNT
    ├── Team
    ├── Billing
    ├── API Keys
    ├── Settings
    └── Security
```

The navigation is organized around user intent rather than infrastructure vendor terminology.

---

## 3. Primary Navigation

The default authenticated shell should expose a compact navigation:

```text
OVERVIEW

CREATE
  Applications
  Templates
  Projects

RUN
  Deployments
  Containers
  Workers
  Jobs

AUTOMATE
  Workflows
  AI Agents
  WhatsApp

NETWORK
  Domains
  Storage
  Data
  Secrets

OBSERVE
  Logs
  Metrics
  Usage

ACCOUNT
  Billing
  Team
  Settings
```

The navigation should support command-palette access so users can reach any resource without needing to browse the tree.

---

## 4. Core Concepts

### 4.1 Organization

The billing and ownership boundary.

```text
Organization
├── members
├── plans
├── billing
├── projects
└── resource policies
```

### 4.2 Project

The principal customer workspace. A project groups software, environments, deployments, domains, storage, automations, and secrets.

```text
Project
├── Applications
├── Environments
├── Deployments
├── Runtime resources
├── Automations
├── Domains
├── Storage
├── Secrets
└── Usage
```

### 4.3 Environment

A deployable context such as `development`, `staging`, or `production`.

```text
Project
├── development
├── staging
└── production
```

### 4.4 Application

The thing a customer wants to run. An application may be backed by a Worker, Container, static runtime, or external runtime provider.

### 4.5 Deployment

An immutable attempt to produce and release a specific application version.

### 4.6 Runtime

The compute abstraction that executes an application.

```text
Runtime
├── Worker
├── Container
├── Job
├── Function
└── External Node
```

### 4.7 Automation

A rule or workflow that connects triggers, logic, AI, and actions.

### 4.8 Service

A reachable application endpoint or internal dependency.

### 4.9 Integration

An external system connected to CRAYON, such as WhatsApp, payment providers, AI providers, Git providers, or notification systems.

---

## 5. Create → Run → Automate Model

### CREATE

The user starts with an idea or source.

Possible entry points:

```text
New Application
Import Git Repository
Deploy Docker Image
Choose Template
Create AI Agent
Create Workflow
Create WhatsApp
```

### RUN

CRAYON resolves the required runtime and executes the application.

```text
SOURCE
  ↓
BUILD
  ↓
RELEASE
  ↓
RUNTIME
  ↓
HEALTHY
```

### AUTOMATE

Once running, the application can participate in workflows.

```text
TRIGGER
  ↓
CONTEXT
  ↓
DECISION
  ↓
ACTION
  ↓
OBSERVATION
```

Example:

```text
WhatsApp message
  ↓
AI classification
  ↓
Create lead
  ↓
Send product information
  ↓
Create invoice
  ↓
Notify operator
```

---

## 6. WhatsApp Product Surface

WhatsApp is a flagship workload, not the definition of the entire platform.

```text
WhatsApp
├── Instances
├── Connections
├── QR / Pairing
├── Messages
├── Automations
├── AI Agent
├── Webhooks
├── Logs
└── Usage
```

An instance represents one managed WhatsApp runtime, commonly implemented with Baileys in a containerized workload.

Expected lifecycle:

```text
CREATING
  ↓
PAIRING
  ↓
CONNECTED
  ↓
RUNNING
  ↓
RECONNECTING
  ↓
RUNNING
```

The product must treat runtime restarts as recoverable events. Session state must not depend on ephemeral container storage.

---

## 7. Deployment Experience

The primary deployment flow should be intentionally short:

```text
1. Choose source
2. Choose runtime
3. Configure variables
4. Review resources
5. Deploy
6. Observe
```

### Source options

```text
GitHub
Git repository URL
Docker image
Template
Local/CLI upload (future)
```

### Runtime selection

CRAYON should recommend a runtime rather than forcing users to understand provider-specific infrastructure.

```text
Application requirements
        ↓
Runtime resolver
        ↓
Worker / Container / External Node
```

---

## 8. Runtime Abstraction

CRAYON must not hard-code the user experience around Cloudflare.

The user sees:

```text
Run my application
```

The runtime layer decides:

```text
Cloudflare Worker
Cloudflare Container
Docker host
VPS
Future providers
```

This keeps the product portable and allows compute migration without changing the customer-facing product model.

---

## 9. Observability Surface

Every deployable resource should expose a consistent observation model.

```text
Status
Health
Logs
Metrics
Events
Usage
Deploy history
```

A resource page should answer quickly:

> Is it alive?

> What is it doing?

> What changed?

> How much is it costing?

> What broke?

---

## 10. Resource Detail Pattern

All major resources should share a common detail-page grammar:

```text
[ Resource name ]      [status] [primary action]

Overview
├── Current state
├── Key metrics
├── Endpoint / identifiers
└── Health

Activity
├── Events
├── Logs
└── Deployments

Configuration
├── Variables
├── Secrets
├── Networking
└── Runtime settings

Usage
├── CPU
├── Memory
├── Storage
└── Requests
```

This consistency is more important than decorative UI effects.

---

## 11. Dashboard Information Hierarchy

The dashboard should prioritize what needs attention.

```text
1. Needs attention
2. What's running
3. What changed
4. What's deploying
5. Resource usage
6. Recent activity
```

Recommended dashboard blocks:

```text
HEALTH SNAPSHOT
ACTIVE DEPLOYMENTS
APPLICATIONS
WHATSAPP STATUS
AUTOMATIONS
RESOURCE USAGE
RECENT EVENTS
```

The dashboard should not become a wall of charts.

---

## 12. Command Palette

Command palette is a core navigation primitive, not an optional power-user feature.

Examples:

```text
Create application
Deploy project
Open WhatsApp
Restart container
View logs
Create workflow
Add domain
Open billing
Search resources
```

The palette should support direct actions where safe and route to confirmation for destructive operations.

---

## 13. Search Model

Global search should index customer-owned operational resources.

```text
Search
├── Applications
├── Deployments
├── Containers
├── WhatsApp instances
├── Workflows
├── Domains
├── Logs
└── Events
```

Search results should provide context, status, and direct navigation.

---

## 14. Billing and Quota Surface

Billing must be built into the product model from the beginning.

```text
Plan
 ↓
Quota
 ↓
Usage
 ↓
Limit
 ↓
Overage / Upgrade / Restriction
```

Initial quota dimensions:

```text
Projects
Applications
Deployments
Runtime hours
Memory
CPU
Storage
Requests
Automation executions
AI usage
WhatsApp instances
```

The free plan must never expose unlimited persistent compute.

---

## 15. Roles and Access

Initial role model:

```text
OWNER
ADMIN
DEVELOPER
OPERATOR
VIEWER
```

Permissions should be resource-oriented:

```text
read
create
update
deploy
operate
observe
billing
manage_access
```

Destructive operations such as delete, revoke, disconnect, and billing changes require explicit confirmation and should be auditable.

---

## 16. Key User Journeys

### Journey A — First application

```text
Landing page
  ↓
Sign up
  ↓
Create project
  ↓
Deploy application
  ↓
Healthy
  ↓
Open URL
```

Target experience: the user should understand the product before seeing infrastructure complexity.

### Journey B — WhatsApp

```text
Create WhatsApp
  ↓
Choose instance
  ↓
Generate QR
  ↓
Pair device
  ↓
Connected
  ↓
Enable automation
  ↓
Observe messages
```

### Journey C — Automation

```text
Create workflow
  ↓
Choose trigger
  ↓
Add action
  ↓
Test
  ↓
Activate
  ↓
Observe runs
```

### Journey D — Failed deployment

```text
Deployment failed
  ↓
Show reason first
  ↓
Open relevant logs
  ↓
Suggest likely fix
  ↓
Retry
  ↓
Healthy
```

Failure UX is part of the product, not an afterthought.

---

## 17. States

Every major resource must explicitly design:

```text
EMPTY
CREATING
BUILDING
DEPLOYING
RUNNING
DEGRADED
RECONNECTING
FAILED
STOPPED
DELETING
DELETED
```

The UI must never leave the user guessing whether an operation is still happening.

---

## 18. Product Boundaries

CRAYON owns:

```text
customer identity
projects
resource orchestration
UI state
billing
usage
deployment intent
workflow definitions
integrations
observability projections
```

Underlying providers own:

```text
compute execution
network infrastructure
object storage primitives
provider-specific runtime mechanics
```

CRAYON should abstract provider details while preserving escape hatches for advanced users.

---

## 19. Visual Product Principle

The CRAYON visual language should express the product architecture:

```text
CLEAN SYSTEM
     +
HUMAN MARKS
     +
TECHNICAL PRECISION
```

The UI should remain primarily professional SaaS. Crayon/grunge elements are used as personality and emphasis, not as a substitute for information architecture.

Recommended ratio:

```text
90% usable interface
10% crayon / grunge personality
```

---

## 20. Product Success Definition

CRAYON should make the following sentence true for a new user:

> “I brought something I wanted to build, and CRAYON got it running.”

For an existing user:

> “I can see everything I run, automate what repeats, and understand what my infrastructure is doing.”

The product succeeds when infrastructure becomes an enabler rather than the user's primary task.

---

## 21. Next Implementation Sequence

The implementation sequence is deliberately ordered to prevent UI churn:

```text
01  Brand System
02  Product Narrative
03  Information Architecture      ← this document
04  Domain / Resource Model
05  UI Design Tokens
06  UI Primitives
07  Application Shell
08  Dashboard
09  Applications + Deployments
10  WhatsApp / Baileys surface
11  Automation / Workflow surface
12  Domains / Storage / Secrets
13  Logs / Metrics / Usage
14  Billing / Plans / Quotas
15  Landing Page
16  MVP implementation
```

No major screen should be considered final until its resource model and state machine are defined.

---

## 22. Non-Negotiable UX Rules

1. **User intent first.** Do not expose provider complexity unless it helps the user make a decision.
2. **One primary action per surface.** Secondary actions stay visually secondary.
3. **Status must be obvious.** Running, failed, deploying, and reconnecting cannot look alike.
4. **Recovery is first-class.** Every failure should have a next action.
5. **No fake activity.** Progress, logs, metrics, and statuses must reflect real system state.
6. **No decorative complexity.** Crayon personality must never reduce scanability.
7. **Portable runtime.** Customer-facing concepts must not depend on one cloud provider.
8. **Quota visibility.** Usage and limits should be visible before they become billing surprises.
9. **Audit destructive actions.** Delete, revoke, disconnect, suspend, and billing-impacting actions are explicit.
10. **Make it run.** Every major flow should reduce the distance between intent and a working system.
