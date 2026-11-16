# CRAYON — Core Component Showcase

## Status

**Version:** 1.0  
**Role:** Component and interaction source of truth  
**Brand:** CRAYON  
**Official meaning:** Create. Run. Automate. Your Own Network.  
**Core promise:** Make it run.  
**Visual ratio:** 90% clean SaaS / 10% crayon-grunge personality

---

## 1. Purpose

This document defines the reusable UI component grammar for CRAYON. Every product surface should compose these primitives instead of inventing one-off visual patterns.

The goals are:

- consistent visual hierarchy;
- fast scanning of infrastructure state;
- obvious primary actions;
- safe destructive operations;
- expressive personality without visual noise;
- reusable implementation across dashboard, deployment, WhatsApp, automation, billing, and future products.

The component system must implement the brand and product rules already defined in:

- `docs/brand/crayon-brand-narrative.md`
- `docs/product/crayon-product-narrative.md`
- `docs/product/crayon-information-architecture.md`
- `docs/product/crayon-domain-resource-model.md`
- `docs/design/crayon-ui-design-system.md`

---

## 2. Component Philosophy

CRAYON components follow three principles:

```text
CLEAN SYSTEM
     +
HUMAN MARKS
     +
TECHNICAL PRECISION
```

The interface should feel intentionally designed, not randomly decorated.

Crayon effects are reserved for emphasis, transitions, annotations, or brand moments. They must never obscure status, labels, numbers, controls, or accessibility affordances.

---

## 3. Surface Levels

All components live on one of four surface levels.

```text
PAGE
  ↓
SECTION
  ↓
CARD / PANEL
  ↓
CONTROL
```

### Page

The global workspace surface.

### Section

A logical content grouping with heading, supporting text, and optional action.

### Card / Panel

A bounded unit of information or interaction.

### Control

A directly interactive UI element.

Avoid nesting more than three visual boundaries unless the content genuinely requires it.

---

## 4. Buttons

### Primary

Use for the single dominant action on a surface.

Examples:

```text
Deploy
Create application
Start
Activate
```

Rules:

- one primary action per major surface;
- high contrast;
- label must describe the action;
- no decorative icon unless it improves recognition.

### Secondary

For supporting actions.

```text
Configure
View logs
Edit
```

### Quiet

For low-priority navigation/actions.

```text
Details
Open
Copy
```

### Destructive

Use only when the operation has irreversible or materially damaging impact.

```text
Delete
Revoke
Disconnect
Terminate
```

Destructive actions require explicit confirmation when the operation cannot be trivially undone.

---

## 5. Cards and Panels

### Standard Card

```text
┌─────────────────────────────────────┐
│ TITLE                         ACTION │
│                                     │
│ Main content                        │
│                                     │
│ metadata                            │
└─────────────────────────────────────┘
```

### Metric Card

Designed to answer one question quickly.

```text
12
Applications
8 running
```

### Resource Card

```text
shop-api        ● LIVE
Node.js         Asia Pacific
CPU 18%         MEM 42%
```

### Activity Card

Emphasizes time and event state rather than large numeric metrics.

### Terminal / Log Panel

Uses a visually distinct technical surface and monospace typography. It remains readable and selectable; decoration must never interfere with copying logs.

---

## 6. Status System

Status is one of CRAYON's most important visual primitives.

Canonical states:

```text
CREATING
BUILDING
DEPLOYING
RUNNING
HEALTHY
DEGRADED
RECONNECTING
FAILED
STOPPED
DELETING
```

Status must be represented through at least two channels:

```text
color + text
```

Never rely on color alone.

Recommended semantic treatment:

```text
● RUNNING
● HEALTHY
● BUILDING
● RECONNECTING
● DEGRADED
● FAILED
● STOPPED
```

For active states, a subtle pulse may be used. Animation must stop or reduce under reduced-motion preferences.

---

## 7. Badges

Badges communicate compact classifications, not paragraphs.

Examples:

```text
LIVE
FREE
PRO
NODE.JS
CONTAINER
AI
BAILEYS
```

Avoid more than three badges in a row unless the resource list explicitly benefits from them.

---

## 8. Forms

Forms should make the user's intent obvious before showing implementation details.

Pattern:

```text
Label
Help text
[ control ]
Validation / error
```

Rules:

- labels are always visible;
- placeholders are not labels;
- errors explain what failed and how to fix it;
- dangerous settings require contextual warnings;
- secrets are masked by default;
- advanced provider settings are progressively disclosed.

---

## 9. Tables

Tables should optimize for scanning operational state.

Recommended column order:

```text
Name
Status
Runtime / Type
Key metric
Updated
Actions
```

Rules:

- sticky header for long datasets;
- compact row density for infrastructure pages;
- row hover should not change meaning;
- status remains visible while scrolling horizontally;
- destructive row actions require confirmation.

---

## 10. Dialogs and Confirmation

Dialogs are reserved for meaningful decisions.

### Confirmation grammar

```text
[Title]

What will happen?
What cannot be undone?

[Cancel] [Confirm]
```

Example:

```text
Delete WA-SALES-01?

This permanently removes the managed instance.
Its runtime will stop immediately.

[Cancel] [Delete instance]
```

Never hide critical consequences behind vague labels such as `OK` or `Continue`.

---

## 11. Command Palette

Command Palette is a first-class CRAYON component.

Structure:

```text
╭────────────────────────────────────────╮
│ Search or run a command…               │
├────────────────────────────────────────┤
│ Deploy application                     │
│ Open WhatsApp                          │
│ Restart container                      │
│ Create workflow                        │
│ Add domain                             │
│ View logs                              │
╰────────────────────────────────────────╯
```

Commands are grouped by action and resource.

Destructive commands do not execute immediately; they route to confirmation.

Keyboard support should include:

```text
⌘/Ctrl + K
↑ ↓
Enter
Esc
```

---

## 12. Search

Global search should show:

```text
resource icon
resource name
resource type
status
project
```

The result should be actionable in one click.

Search should prioritize customer-owned resources over documentation noise when the user is authenticated.

---

## 13. Tabs

Use tabs for stable sibling categories with the same context.

Recommended resource detail tabs:

```text
Overview
Activity
Deployments
Configuration
Usage
```

Do not use tabs as a substitute for information architecture.

---

## 14. Drawers

Use drawers for quick inspection or focused editing where preserving the parent context matters.

Examples:

```text
Quick logs
Deployment details
Event details
Secret metadata
```

A drawer should not become a hidden second application.

---

## 15. Alerts and Banners

### Informational

Explain state or context.

### Warning

Explain risk and provide a next action.

### Error

State what failed and what can be done now.

### Success

Confirm a completed action briefly; do not block the interface unnecessarily.

Error copy pattern:

```text
What happened.
Why it probably happened.
What you can do next.
```

---

## 16. Empty States

Empty states should teach the next action rather than merely say there is no data.

Example:

```text
No applications yet.

Bring a repository, Docker image, or template.

[Create application]
```

Do not use empty-state filler such as "Nothing here yet!" without useful guidance.

---

## 17. Loading States

Use loading indicators that match the expected duration.

### Immediate

Subtle inline spinner/skeleton.

### Short operation

Button progress + local status.

### Long operation

Dedicated progress/event surface.

### Indeterminate infrastructure work

Show known stage and latest event rather than fake percentage progress.

Example:

```text
DEPLOYING

Build completed
Starting container…
Waiting for health check…
```

Never invent progress values that are not backed by system state.

---

## 18. Crayon Primitives

These are the distinctive CRAYON primitives.

### CrayonUnderline

A restrained hand-drawn underline for headings or important words.

Use:

```text
Build it.
────────
```

Do not use on every heading.

### CrayonArrow

A small hand-drawn arrow to connect a note to a UI element.

Example:

```text
works →
```

### CrayonNote

Short handwritten annotation.

Allowed examples:

```text
ship it →
this one is live
watch this
works.
```

### CrayonHighlight

Marker-like emphasis behind a small amount of text.

### PaperSurface

Subtle paper material treatment used primarily on marketing/empty/brand surfaces.

### BlueprintGrid

Sparse technical grid used for developer/infrastructure surfaces, not as a full-page texture by default.

### ScribbleStatus

A restrained imperfect ring or mark around a status/icon when additional brand expression is useful.

---

## 19. Avoiding the “Childish Crayon” Trap

CRAYON is not a children's product aesthetic.

The following rules are mandatory:

```text
NO cartoon mascots
NO childish illustrations
NO rainbow-everywhere UI
NO hand-drawn everything
NO random doodle walls
NO bubble-heavy controls
NO novelty typography for normal data
```

The product should remain credible to developers, operators, agencies, startups, and businesses.

---

## 20. Typography Roles

Use typography by semantic role, not by arbitrary page styling.

```text
Display       → marketing / major page statements
Heading       → page and section hierarchy
Body          → explanations
Label         → controls
Numeric       → metrics
Monospace     → identifiers, logs, runtime data
Handwritten   → rare CRAYON annotations
```

Handwritten typography is an accent layer only.

---

## 21. Iconography

Icons should be simple, recognizable, and geometrically compatible with the UI.

Rules:

- use one icon family across product surfaces;
- avoid mixing filled and outlined metaphors arbitrarily;
- icons accompany labels rather than replacing them when the action is ambiguous;
- custom CRAYON doodles are reserved for brand moments.

---

## 22. Navigation Shell

Canonical authenticated shell:

```text
CRAYON
──────────────────
Overview

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

The sidebar should support collapse without losing context.

Command Palette remains the fastest alternative to deep navigation.

---

## 23. Resource Detail Shell

Every major resource uses the same top structure:

```text
[ icon ] Resource name        [STATUS]
Type / runtime / project      [primary action]

Tabs: Overview | Activity | Configuration | Usage
```

Below that, the page should prioritize the resource's current state and next useful action.

---

## 24. Deployment Component

Canonical deployment timeline:

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

Each stage should expose real state and timestamps where available.

Failure state:

```text
BUILD FAILED

TypeScript compilation failed.

[Open logs] [Retry]
```

---

## 25. WhatsApp / Baileys Components

### Connection Card

Must expose:

```text
Instance
Connection status
Phone identity when available
Uptime
Message activity
Runtime
```

### Pairing Panel

```text
QR CODE

Scan with WhatsApp → Linked Devices

[Refresh QR]
```

Pairing instructions must be concise.

### Message Activity

Show real counts and event state.

### Reconnection State

Never present reconnecting as healthy.

```text
● RECONNECTING
Attempt 3
Last connected 14s ago
```

---

## 26. Metrics

Metrics are designed around decisions.

Good:

```text
CPU      18%
Memory   42%
Requests 14.2k
Cost     $1.84
```

Avoid charts that exist only because the dashboard has empty space.

Every chart should answer a clear operational question.

---

## 27. Logs

A log viewer should include:

```text
stream selector
search/filter
severity
copy
follow/tail
timestamp
source
```

Example:

```text
19:02:11  INFO   connected to runtime
19:02:12  INFO   health check passed
19:04:33  WARN   reconnect requested
```

---

## 28. Billing Components

Billing must visually distinguish:

```text
PLAN
INCLUDED
USED
REMAINING
PROJECTED
OVERAGE / LIMIT
```

Usage should be understandable before the user reaches an unexpected limit.

Example:

```text
Container hours
████████████░░ 78%
78 / 100 hours

12 days remaining
```

---

## 29. Accessibility

All production components must support:

- keyboard navigation;
- visible focus state;
- sufficient contrast;
- reduced motion;
- screen-reader labels for icon-only controls;
- semantic headings and landmarks;
- error messaging associated with form controls;
- status communicated through text, not color alone.

Crayon effects must never reduce accessibility.

---

## 30. Responsive Behavior

### Desktop

Full sidebar + dense operational surfaces.

### Tablet

Collapsible navigation + reduced secondary metadata.

### Mobile

Prioritize:

```text
status
primary action
key metric
critical activity
```

Complex logs and wide tables should become horizontally scrollable rather than unreadably compressed.

---

## 31. Motion

Motion communicates state, not decoration.

Allowed:

```text
status pulse
panel transition
drawer open
command palette
deployment progress
skeleton shimmer
```

Avoid:

```text
constant floating motion
random bouncing
large parallax
attention-seeking loops
```

Respect `prefers-reduced-motion`.

---

## 32. Component Naming Contract

Implementation names should remain semantic and stable.

Examples:

```text
CrayonButton
CrayonCard
CrayonBadge
CrayonStatus
CrayonMetric
CrayonTable
CrayonDialog
CrayonCommandPalette
CrayonLogViewer
CrayonDeploymentTimeline
CrayonUnderline
CrayonArrow
CrayonNote
CrayonHighlight
PaperSurface
BlueprintGrid
```

Product-specific compositions should build on these primitives instead of duplicating their logic.

---

## 33. Showcase Requirements

The eventual component showcase route should demonstrate at minimum:

```text
BUTTONS
CARDS
BADGES
STATUS
FORMS
TABLES
DIALOGS
COMMAND PALETTE
SEARCH
TABS
DRAWERS
ALERTS
EMPTY STATES
LOADING STATES
METRICS
LOGS
DEPLOYMENT TIMELINE
WHATSAPP PAIRING
BILLING / QUOTA
CRAYON PRIMITIVES
```

Each example should show default, hover, focus, disabled, loading, success, warning, and error states where applicable.

---

## 34. Definition of Done

The component system is ready for product implementation when:

```text
✓ every major resource has a reusable detail pattern
✓ status states are consistent
✓ destructive actions have consistent confirmation UX
✓ command palette can reach major actions
✓ tables/forms/dialogs share one grammar
✓ crayon primitives are sparse and intentional
✓ desktop/mobile behavior is defined
✓ accessibility requirements are explicit
✓ components have stable semantic names
✓ mockups can be produced without inventing new primitives
```

---

## 35. Next Step

The next artifact should be the **CRAYON Application Shell Showcase**: one production-quality dashboard frame that composes these primitives into the canonical Overview, Applications, Deployments, WhatsApp, Automation, Observe, and Account experiences.
