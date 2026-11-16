# CRAYON — Dashboard Showcase v1.0

## Status

**Version:** 1.0  
**Role:** Dashboard-specific UX specification  
**Depends on:** Brand Narrative, Product Narrative, Information Architecture, Domain/Resource Model, UI Design System, Core Component Showcase, Application Shell Showcase

This document defines only the authenticated Overview/Dashboard experience. It does not redefine global branding, navigation, reusable components, or the underlying resource model.

---

## 1. Dashboard job

The dashboard answers one question first:

> **What needs my attention right now?**

Then it answers, in order:

```text
1. WHAT NEEDS ATTENTION
2. WHAT IS RUNNING
3. WHAT CHANGED
4. WHAT IS DEPLOYING
5. WHAT IS COSTING / USING RESOURCES
6. WHAT HAPPENED RECENTLY
```

The dashboard is an operational cockpit, not an analytics wall.

---

## 2. Page anatomy

```text
┌─────────────────────────────────────────────────────────────┐
│ GLOBAL HEADER                                               │
├──────────────┬──────────────────────────────────────────────┤
│              │ PAGE HEADER                                  │
│ APPLICATION  │ project / environment context                │
│ SHELL        │                                              │
│              │ ATTENTION STRIP                              │
│              │                                              │
│              │ HEALTH SNAPSHOT                              │
│              │                                              │
│              │ ACTIVE / RECENT DEPLOYMENTS                  │
│              │                                              │
│              │ RESOURCE + AUTOMATION SUMMARY                │
│              │                                              │
│              │ RECENT ACTIVITY                              │
└──────────────┴──────────────────────────────────────────────┘
```

The dashboard must remain useful at 1280px wide without requiring horizontal scrolling.

---

## 3. Page header

Primary heading:

> **Make something.**

Supporting line:

> Build, run, and automate everything that keeps your work moving.

The header shows the active project and environment using the shell's existing context controls.

Primary action:

```text
[ + Create ]
```

The Create menu exposes only contextually valid actions:

```text
Application
WhatsApp
Workflow
AI Agent
Storage
Domain
```

Do not introduce a second creation taxonomy in the dashboard.

---

## 4. Attention strip

Only render this section when actionable attention exists.

Examples:

```text
! 1 deployment failed
! WhatsApp WA-SALES is reconnecting
! Production storage is 91% full
! 1 certificate expires in 7 days
```

Each item must have:

```text
severity
short explanation
primary recovery action
optional detail link
```

Example:

```text
! shop-api deployment failed
  TypeScript build error
  [View logs] [Retry]
```

Do not use vague alerts such as `Something went wrong` when a concrete reason is available.

---

## 5. Health snapshot

Four to six compact metrics maximum.

Recommended:

```text
APPLICATIONS     12
RUNNING           8
DEPLOYING         2
FAILED            1
AUTOMATIONS      37
RUNTIME USAGE   2.4 GB
```

Metric cards communicate current state, not vanity metrics.

Each metric should support click-through to the relevant filtered resource view.

---

## 6. Active deployments

The deployment block answers:

> **What is changing right now?**

Recommended table columns:

```text
APPLICATION
STATUS
RUNTIME
VERSION / COMMIT
STARTED
DURATION
ACTION
```

Example rows:

```text
shop-api       DEPLOYING     Node.js     a82f4c     2m ago   44s
storefront     LIVE          Next.js     e91d21     8m ago   —
wa-sales       CONNECTED     Baileys     v1         2h ago   —
```

`LIVE`, `DEPLOYING`, `FAILED`, `RECONNECTING`, and `STOPPED` must be visually distinct using the established status system.

---

## 7. Applications overview

The applications block shows a compact list or grid depending on viewport.

Each application summary contains:

```text
name
status
runtime
region
last deployment
health signal
```

Primary interaction is opening the application detail page.

Secondary actions should be available through a row menu rather than visual clutter.

---

## 8. WhatsApp summary

WhatsApp has a dedicated dashboard block because it is a flagship CRAYON workload.

The block answers:

> **Are my WhatsApp connections alive and useful?**

Show at most the most relevant instances, with a link to the full WhatsApp area.

Example:

```text
WA-SALES-01     ● CONNECTED
Messages        12,492
Automations     37
AI              ON

WA-SUPPORT-01   ! RECONNECTING
Last seen       34s ago
```

If no WhatsApp instance exists, show a product-aware empty state:

```text
No WhatsApp instance yet.

Connect a number and start automating conversations.

[ Create WhatsApp ]
```

---

## 9. Automation summary

Show only operationally meaningful workflow information.

```text
ACTIVE       14
RUNNING       2
FAILED        1
PAUSED        3
```

A small recent-run list may show:

```text
Lead follow-up       SUCCESS    12s ago
Invoice reminder     SUCCESS    2m ago
WhatsApp classifier  FAILED     4m ago
```

The dashboard must never simulate real-time activity. Data shown must come from actual runtime events or explicitly indicate when it was last updated.

---

## 10. Resource usage

The default usage block is intentionally compact.

```text
CPU       ███████░░░   62%
MEMORY    █████░░░░░   48%
STORAGE   ████░░░░░░   39%
REQUESTS  ██████░░░░   57%
```

Show current period and comparison only when the comparison is meaningful.

Examples:

```text
This month
vs previous month
```

Avoid decorative charts with no operational interpretation.

---

## 11. Recent activity

The activity stream is event-oriented.

Examples:

```text
2m   shop-api deployed successfully
8m   WA-SALES received 42 messages
14m  workflow invoice-reminder completed
21m  domain api.example.com verified
43m  deployment v43 failed
```

Every item needs a timestamp and an object link.

Events must distinguish:

```text
DEPLOYMENT
RUNTIME
AUTOMATION
WHATSAPP
NETWORK
BILLING
SECURITY
```

---

## 12. Dashboard priority algorithm

The server/API should return dashboard sections in an attention-aware order, but the UI remains responsible for presentation.

Conceptual score:

```text
attention_score =
  severity
  × urgency
  × user_relevance
  × recency
```

High-scoring items appear before passive metrics.

Critical failures can temporarily replace non-actionable dashboard content at the top of the page.

---

## 13. Empty state

For a brand-new organization:

```text
MAKE SOMETHING.

Your first project is empty.
Let's put something in it.

[ Create an application ]
[ Try a template ]
```

The empty state should teach the product loop without presenting a generic illustration wall.

Secondary explanation:

```text
Create → Run → Automate
```

---

## 14. Loading state

Initial page load should use structural skeletons matching final dimensions.

Prefer:

```text
skeleton metric
skeleton table rows
skeleton activity rows
```

Do not use a full-screen spinner for ordinary dashboard loading.

For delayed sections, load independently so the dashboard becomes useful as soon as the first data arrives.

---

## 15. Error state

If one data source fails, isolate the failure.

Bad:

```text
Dashboard failed to load.
```

Preferred:

```text
Applications unavailable right now.

The rest of your dashboard is still available.

[ Retry applications ]
```

The dashboard should degrade gracefully when one adapter or provider is unavailable.

---

## 16. Refresh behavior

Use progressive refresh:

```text
Initial load
  ↓
short-lived cache
  ↓
background refresh
  ↓
visible timestamp update
```

Operations requiring immediate state should offer an explicit refresh affordance.

Long-running deployment operations should use event/polling mechanisms appropriate to the backend rather than refreshing the entire page.

---

## 17. Responsive behavior

### Desktop

Use two visual columns where space permits:

```text
primary content  ~ 2/3
secondary content ~ 1/3
```

### Tablet

Stack secondary operational summaries below primary deployments.

### Mobile

Priority order becomes:

```text
Attention
Health
Deployments
WhatsApp
Automation
Usage
Activity
```

The dashboard should not attempt to preserve the desktop grid at mobile widths.

---

## 18. Interaction rules

Dashboard cards are entry points, not mini-applications.

Use:

```text
click card → filtered resource view
click row → resource detail
primary action → immediate task
menu → secondary operations
```

Destructive operations must not be executable from passive metric cards.

Examples requiring explicit confirmation:

```text
Delete
Disconnect
Suspend
Revoke
Stop production resource
```

---

## 19. Crayon personality placement

The dashboard uses the established visual ratio:

```text
90% operational interface
10% crayon / grunge personality
```

Allowed accents:

```text
hand-drawn underline under one important heading
small marker arrow toward a critical action
occasional handwritten note
subtle paper texture
one expressive empty-state mark
```

Never apply crayon treatment to every card, chart, table row, or status badge.

---

## 20. Accessibility

The dashboard must remain understandable without color.

Status indicators use:

```text
icon + label + color
```

Never:

```text
color alone = state
```

Keyboard navigation must cover:

```text
Create menu
Dashboard cards
Tables
Row actions
Refresh controls
Command palette
```

Focus states must remain visible against the paper background.

---

## 21. Performance budget

The dashboard should prioritize useful content over animation.

Rules:

```text
No heavy decorative animation on initial load.
No client-side data waterfall when one API request can aggregate data.
No chart library for simple numeric indicators.
No polling faster than operationally necessary.
Lazy-load secondary visualizations.
```

The first meaningful operational state should appear before low-priority analytics.

---

## 22. Data contract expectation

The dashboard API should provide a purpose-built read model rather than forcing the client to fetch every resource independently.

Conceptual response:

```json
{
  "attention": [],
  "health": {},
  "deployments": [],
  "applications": [],
  "whatsapp": [],
  "automations": {},
  "usage": {},
  "activity": []
}
```

The exact API schema belongs to the implementation/domain layer and must remain aligned with the canonical resource model.

---

## 23. Acceptance criteria

The dashboard is ready for implementation when:

```text
[ ] A new user understands what to do next.
[ ] Running/failed/deploying states are immediately distinguishable.
[ ] Attention items appear before passive metrics.
[ ] Deployment status is visible without opening a detail page.
[ ] WhatsApp health is visible when instances exist.
[ ] Usage is understandable without reading documentation.
[ ] Partial API failures do not blank the entire page.
[ ] Empty/loading/error states are intentional.
[ ] Mobile order preserves operational priority.
[ ] Crayon styling never reduces readability.
[ ] No provider-specific terminology leaks into the default experience.
```

---

## 24. Implementation boundary

This showcase does **not** define:

```text
brand identity
navigation taxonomy
base design tokens
primitive component specifications
resource schemas
provider implementations
billing rules
```

Those are owned by the earlier source-of-truth documents.

This document only defines **how the authenticated Overview dashboard composes existing CRAYON primitives and resources into an operational experience**.
