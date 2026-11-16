# CRAYON — Application Shell Showcase v1.0

## Status

**Version:** 1.0  
**Role:** Canonical authenticated application-shell UX specification  
**Brand:** CRAYON  
**Official meaning:** Create. Run. Automate. Your Own Network.  
**Core promise:** Make it run.

---

## 1. Purpose

This document defines the canonical authenticated CRAYON application shell before page-level implementation. Every dashboard, resource detail page, workspace, and operational surface must fit inside this shell unless an explicit product decision creates a different surface.

The shell is designed around user intent rather than provider terminology.

```text
CREATE → RUN → AUTOMATE → CONNECT → OBSERVE → IMPROVE
```

The visual system follows the CRAYON principle:

```text
CLEAN SYSTEM + HUMAN MARKS + TECHNICAL PRECISION
```

Target ratio:

```text
90% professional SaaS
10% crayon / grunge personality
```

---

## 2. Canonical Desktop Frame

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRAYON       [ Project ▾ ] [ Environment ▾ ]        ⌘K   +   ?   ● avatar   │
├────────────────┬────────────────────────────────────────────────────────────┤
│                │                                                            │
│ OVERVIEW       │  Make something.                                          │
│                │  Make it run.                                             │
│ CREATE         │                                                            │
│ Applications   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐ │
│ Templates      │  │ 12 Apps    │ │ 8 Running  │ │ 3 Deploys  │ │ 2.4 GB  │ │
│ Projects       │  │            │ │            │ │            │ │ storage │ │
│                │  └────────────┘ └────────────┘ └────────────┘ └─────────┘ │
│ RUN            │                                                            │
│ Deployments    │  NEEDS ATTENTION                                          │
│ Containers     │  ┌─────────────────────────────────────────────────────┐  │
│ Workers        │  │ api-prod    BUILD FAILED          View logs →       │  │
│ Jobs           │  └─────────────────────────────────────────────────────┘  │
│                │                                                            │
│ AUTOMATE       │  DEPLOYMENTS                                               │
│ Workflows      │  ┌─────────────────────────────────────────────────────┐  │
│ AI Agents      │  │ ● shop-api       LIVE        2m ago                 │  │
│ WhatsApp       │  │ ● storefront     LIVE        7m ago                 │  │
│                │  │ ● wa-sales       CONNECTED   12m ago                │  │
│ NETWORK        │  └─────────────────────────────────────────────────────┘  │
│ Domains        │                                                            │
│ Storage        │  ┌──────────────────────┐ ┌────────────────────────────┐ │
│ Data           │  │ WHATSAPP             │ │ AUTOMATIONS                │ │
│ Secrets        │  │ WA-SALES-01          │ │ 37 active                  │ │
│                │  │ ● CONNECTED          │ │ 1,284 runs                 │ │
│ OBSERVE        │  │ 12,492 messages      │ │ 99.2% success              │ │
│ Logs           │  │ AI ON                │ │                            │ │
│ Metrics        │  └──────────────────────┘ └────────────────────────────┘ │
│ Usage          │                                                            │
│                │  RESOURCE USAGE                                            │
│ ACCOUNT        │  ┌─────────────────────────────────────────────────────┐  │
│ Billing        │  │ CPU     ███████░░   Memory  █████░░░░░             │  │
│ Team           │  │ Storage ████░░░░░   Requests ██████░░░             │  │
│ Settings       │  └─────────────────────────────────────────────────────┘  │
│                │                                                            │
│                │  RECENT ACTIVITY                                           │
│                │  2m  shop-api deployed successfully                       │
│                │  8m  WA-SALES-01 reconnected                             │
│                │  11m domain added to storefront                          │
│                │                                                            │
└────────────────┴────────────────────────────────────────────────────────────┘
```

This is a structural reference, not a fixed pixel mockup. Actual implementation must remain responsive and accessible.

---

## 3. Shell Regions

The shell has six persistent regions.

### 3.1 Global Header

```text
[CRAYON] [Organization ▾] [Project ▾] [Environment ▾]
                         [Global Search / ⌘K] [Create +] [?] [Notifications] [Avatar]
```

Responsibilities:

- current context
- global search
- command palette
- create action
- help/documentation
- notifications
- profile/account access

The header must remain visually quiet. It is infrastructure, not hero content.

### 3.2 Primary Sidebar

The sidebar owns high-level information architecture.

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

Rules:

- maximum one active item
- section labels are quiet and compact
- no nested tree deeper than necessary in the primary sidebar
- resource-specific navigation appears inside detail pages
- destructive or account-sensitive actions are not exposed as primary navigation shortcuts

### 3.3 Context Bar

Project and environment are first-class context.

```text
Project: storefront ▾
Environment: production ▾
```

Context switching must update the content scope without silently changing organization.

### 3.4 Main Workspace

The main workspace is where intent is executed. Each page must declare one primary action.

### 3.5 Utility Rail / Drawer

Optional on wide screens for contextual details:

```text
activity
resource metadata
quick actions
notifications
```

It must collapse on smaller widths.

### 3.6 Global Feedback Layer

Transient feedback must appear consistently:

```text
success toast
warning toast
error toast
progress notification
background job indicator
```

Important state changes should remain discoverable in activity/event history rather than disappearing after a toast.

---

## 4. Context Switching

CRAYON operates with this hierarchy:

```text
Organization
   ↓
Project
   ↓
Environment
   ↓
Resource
```

The current scope must always be visible.

Changing project or environment must:

1. update resource lists,
2. update metrics and usage,
3. update navigation where relevant,
4. preserve safe return navigation,
5. never mutate data merely by switching context.

Production environments should have a visually distinct but restrained indicator.

---

## 5. Global Search

Search is available from the header and command palette.

Search scope:

```text
Applications
Deployments
Containers
Workers
Jobs
WhatsApp instances
Workflows
AI Agents
Domains
Logs
Events
```

Result rows should include:

```text
resource name
resource type
status
project/environment
recent activity
```

Keyboard:

```text
⌘K / Ctrl+K → open
↑ ↓           → navigate
Enter         → open
Esc           → close
```

---

## 6. Command Palette

The command palette is a primary control surface.

Example commands:

```text
Create application
Deploy application
Create container
Create WhatsApp instance
Create workflow
Add domain
Open logs
Restart resource
View usage
Open billing
Search resources
```

Safe actions may execute directly.

Destructive actions route through explicit confirmation:

```text
Delete application?
This will remove X resources.
[Cancel] [Delete]
```

---

## 7. Create Action

The global `+ Create` action should expose a short list of high-value intents:

```text
Application
Container
Worker
Workflow
AI Agent
WhatsApp
Project
Domain
```

The create menu must not expose raw provider primitives unless advanced mode is enabled.

---

## 8. Dashboard Composition

The dashboard follows attention order:

```text
1. Needs attention
2. What's running
3. What changed
4. What's deploying
5. Resource usage
6. Recent activity
```

Recommended blocks:

```text
NEEDS ATTENTION
HEALTH SNAPSHOT
ACTIVE DEPLOYMENTS
APPLICATIONS
WHATSAPP
AUTOMATIONS
RESOURCE USAGE
RECENT ACTIVITY
```

Do not fill the dashboard with charts simply because charts are available.

---

## 9. Status Language

Status must be explicit and consistent.

```text
● RUNNING
● CONNECTED
● HEALTHY
○ STOPPED
◐ BUILDING
◐ DEPLOYING
◌ RECONNECTING
△ DEGRADED
× FAILED
```

Status colors are semantic tokens, not decorative brand colors.

Important states also receive text, icon, and accessible labels so color is never the only signal.

---

## 10. Application Detail Shell

Every major resource follows this grammar:

```text
[ Resource name ]   [status]          [Primary action]
[subtext / identifier / environment]

Overview | Activity | Configuration | Usage

┌─────────────────────┐ ┌─────────────────────┐
│ Current state       │ │ Key metrics         │
└─────────────────────┘ └─────────────────────┘

Activity / logs / deployments

Configuration / variables / networking
```

Primary action examples:

```text
Deploy
Restart
Connect
Run
Enable
```

---

## 11. Deployment Detail

Deployment detail is optimized for diagnosis.

```text
BUILD → RELEASE → START → HEALTH CHECK
```

The page should answer:

```text
What version?
What happened?
Where did it fail?
What changed?
Can I retry?
```

Failed deployment priority:

```text
Failure reason
↓
Relevant log excerpt
↓
Likely cause
↓
Suggested action
↓
Retry
```

---

## 12. WhatsApp Detail

WhatsApp/Baileys is a flagship workload.

```text
WA-SALES-01                         ● CONNECTED

[QR / Pairing]

Messages        12,492
Automations        37
AI                 ON
Uptime        7d 12h

Overview | Messages | Automations | Webhooks | Logs | Usage
```

Connection states must distinguish:

```text
PAIRING
CONNECTED
RECONNECTING
DISCONNECTED
AUTH_REQUIRED
FAILED
```

The UI should explain what the user needs to do next.

For a pairing flow:

```text
Generate QR
      ↓
Scan with WhatsApp
      ↓
Waiting for device
      ↓
Connected
```

---

## 13. Automation Detail

Workflow UI uses a readable sequence rather than a dense diagram by default.

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
AI classify intent
      ↓
Create lead
      ↓
Send product information
      ↓
Create invoice
      ↓
Notify operator
```

Advanced graph view may be available, but the linear representation remains the default for simple workflows.

---

## 14. Logs and Terminal Surfaces

Logs must feel technical without becoming visually hostile.

```text
19:41:02  INFO  deploy started
19:41:08  INFO  image pulled
19:41:14  INFO  container started
19:41:18  INFO  health check passed
19:41:18  INFO  deployment live
```

Requirements:

- monospace typography
- copy action
- timestamps
- severity
- filtering
- search
- pause/resume streaming
- clear distinction between live and historical logs
- no fake streaming animations

---

## 15. Responsive Behavior

### Desktop

```text
sidebar + full workspace
```

### Tablet

```text
compact sidebar
contextual drawers
fewer dashboard columns
```

### Mobile

```text
top bar
bottom/slide navigation
stacked cards
full-screen resource detail
```

The product must not simply shrink desktop layouts. Content hierarchy changes by viewport.

---

## 16. Crayon / Grunge Placement Rules

Crayon personality is intentional and sparse.

### Allowed

```text
marker underline
hand-drawn arrow
small handwritten note
organic border accent
paper texture
subtle scribble around a key action
```

### Not allowed

```text
full hand-drawn cards
doodles everywhere
cartoon mascots
random stickers on every component
rough typography for primary UI text
visual noise behind dense tables
```

Recommended visual split:

```text
Professional interface  ██████████████████ 90%
Crayon personality      ██ 10%
```

---

## 17. Accessibility

The shell must target WCAG 2.2 AA behavior.

Required:

- keyboard access to all primary controls
- visible focus state
- semantic landmarks
- accessible names for icon-only buttons
- text alternatives for status indicators
- reduced-motion support
- readable contrast
- no color-only state communication
- logical tab order

Crayon texture must never reduce text contrast or obscure focus indicators.

---

## 18. Empty / Loading / Error States

Every first-class page must implement:

```text
EMPTY
LOADING
SUCCESS
DEGRADED
ERROR
NO PERMISSION
```

Empty state example:

```text
Nothing here yet.

Create your first application.

[Create application]
```

Error state example:

```text
Something broke.

We could not load this deployment.

[Retry] [Open status]
```

Copy must describe the situation instead of using placeholder language such as “Lorem ipsum” or generic “Something went wrong” without recovery guidance.

---

## 19. Navigation Invariants

The shell must preserve:

```text
current organization
current project
current environment
current resource
current tab
```

Deep links must be stable.

Browser back/forward must work.

Refresh must preserve the current route and context.

Command palette navigation must produce normal routable URLs.

---

## 20. Performance Rules

The shell should prioritize perceived responsiveness.

- render navigation immediately
- load large datasets incrementally
- stream logs only when requested
- avoid loading every dashboard widget before first paint
- retain previous data during safe refetches
- debounce global search
- virtualize long tables/log streams
- isolate high-frequency metrics from the rest of the page

Decorative animation must never compete with operational updates.

---

## 21. Implementation Contract

The shell should be implemented as reusable primitives rather than page-specific markup.

Suggested component layers:

```text
Shell
├── GlobalHeader
├── ContextSwitcher
├── Sidebar
├── CommandPalette
├── CreateMenu
├── Notifications
├── WorkspaceFrame
├── ResourceHeader
├── ResourceTabs
├── StatusBadge
├── MetricCard
├── ActivityFeed
├── DataTable
├── LogViewer
├── EmptyState
├── LoadingState
├── ErrorState
└── CrayonPrimitives
    ├── CrayonUnderline
    ├── CrayonArrow
    ├── CrayonNote
    ├── PaperSurface
    └── BlueprintGrid
```

No feature team should invent another shell pattern for an individual module.

---

## 22. Canonical Example Copy

### Dashboard

```text
Make something.
Make it run.
```

### Healthy resource

```text
Yep. It's alive.
```

### Deployment

```text
Ship it.
```

### Reconnecting

```text
Connection dropped. We're bringing it back.
```

### Failed deployment

```text
It broke.
Here's why.
```

Brand personality may appear in these microcopy moments, but technical details remain explicit.

---

## 23. Acceptance Criteria

The application shell is considered complete only when:

```text
[ ] global context is always visible
[ ] sidebar matches IA
[ ] command palette works
[ ] create menu works
[ ] project/environment switching is safe
[ ] deep links work
[ ] keyboard navigation works
[ ] loading/error/empty states exist
[ ] status system is consistent
[ ] resource detail grammar is reusable
[ ] deployment diagnosis is supported
[ ] WhatsApp pairing surface is defined
[ ] logs are usable
[ ] responsive behavior is implemented
[ ] reduced-motion/accessibility requirements are handled
[ ] crayon styling does not reduce usability
```

---

## 24. Next Surface

After this shell is implemented and visually verified, the next canonical showcase is:

```text
CRAYON DASHBOARD v1.0
```

It should use the real shell, real component grammar, real state language, and the first production-oriented resource examples. After dashboard approval, build the first monetizable journey:

```text
WHATSAPP / BAILEYS
CREATE → QR → CONNECT → AUTOMATE → OBSERVE
```
