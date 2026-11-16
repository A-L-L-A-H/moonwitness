# CRAYON — WhatsApp / Baileys Showcase

## Status

**Version:** 1.0  
**Role:** Product-specific UX and operational specification  
**Scope:** WhatsApp / Baileys workload only  
**Parent model:** CRAYON application, runtime, automation, and observability contracts

This document defines the customer-facing experience for a managed WhatsApp workload implemented with Baileys. It does not redefine CRAYON navigation, generic components, or the global resource model.

---

## 1. Product Role

WhatsApp is a flagship CRAYON workload and an early monetizable use case.

The customer is not buying "Baileys hosting". The customer is buying a running WhatsApp automation capability:

```text
CONNECT → RUN → AUTOMATE → ASSIST → OBSERVE
```

CRAYON hides runtime mechanics while keeping important operational truth visible.

Core promise for this surface:

> **Get your WhatsApp running. Then make it work for you.**

---

## 2. Runtime Boundary

The customer-facing resource is a **WhatsApp Instance**.

Its implementation may be:

```text
WhatsApp Instance
      ↓
CRAYON Runtime Resolver
      ↓
Cloudflare Container / Docker Host / Future Provider
      ↓
Node.js
      ↓
Baileys
      ↓
WhatsApp
```

The UI must not expose provider-specific concepts unless an advanced operator explicitly asks for them.

Baileys is the runtime implementation, not the customer-facing product name.

---

## 3. Primary User Journey

```text
CREATE WHATSAPP
      ↓
NAME INSTANCE
      ↓
SELECT PLAN / RESOURCE PROFILE
      ↓
PROVISION
      ↓
PAIR
      ↓
CONNECTED
      ↓
TEST MESSAGE
      ↓
ENABLE AUTOMATION
      ↓
OPTIONAL AI ASSISTANT
      ↓
RUN
```

The happy path should make the first successful message possible with the minimum number of decisions.

---

## 4. Create Flow

Entry CTA:

**Create WhatsApp**

The creation form should ask only for information required to start:

```text
Instance name
Runtime profile
Region preference (optional)
AI enabled? (optional)
Automation template (optional)
```

Advanced runtime configuration belongs behind an Advanced section.

Creation result:

```text
CREATING
   ↓
STARTING
   ↓
PAIRING
```

Do not show a fake percentage when the system cannot produce a meaningful percentage.

---

## 5. Pairing Experience

The pairing screen is the most important first-run surface.

Primary content:

```text
WA-SALES-01

PAIR YOUR PHONE

[ QR CODE ]

Open WhatsApp → Linked Devices → Link a Device

Waiting for scan…
```

Secondary controls:

```text
[ Refresh QR ]
[ Use pairing code ]
[ Cancel ]
```

State transitions:

```text
QR_READY
QR_EXPIRED
WAITING_FOR_SCAN
SCANNED
AUTHENTICATING
CONNECTED
PAIRING_FAILED
```

Never hide why the QR became invalid.

Example:

> QR expired. Generate a new one to continue.

---

## 6. Connected State

Once authenticated, the surface changes from pairing-first to operational-first.

Hero status:

```text
● CONNECTED
WA-SALES-01
```

Immediate actions:

```text
[ Send test message ]
[ Automate ]
[ View messages ]
[ Logs ]
```

Operational summary:

```text
Connection     CONNECTED
Phone          +62 xxx
Uptime         7d 12h
Messages       12,492
Automations    37 active
AI             ON
Last event     14 seconds ago
```

---

## 7. Message Surface

The message surface is an operator console, not a generic chat clone.

Required capabilities:

```text
Conversation list
Search
Message detail
Inbound / outbound direction
Timestamp
Delivery state
Automation marker
AI marker
Human handoff marker
```

Useful message metadata:

```text
source: whatsapp
origin: human | automation | ai
workflow_id
agent_id
received_at
sent_at
status
```

The UI must clearly distinguish messages produced by automation from messages manually sent by an operator.

---

## 8. Automation Surface

A connected WhatsApp instance should expose a direct path to automation.

Recommended CTA:

**Automate this number**

Starter templates:

```text
FAQ Reply
Lead Capture
New Customer Greeting
Order Status
Payment Reminder
Appointment Booking
Human Handoff
Follow-up Sequence
```

Example workflow:

```text
INCOMING MESSAGE
      ↓
CLASSIFY
      ↓
IF SALES INTENT
      ↓
CREATE LEAD
      ↓
SEND PRODUCT INFO
      ↓
WAIT
      ↓
FOLLOW UP
```

Automation runs should link back to the originating WhatsApp instance.

---

## 9. AI Assistant Surface

AI is optional and layered on top of a working WhatsApp connection.

The product should avoid making AI appear mandatory.

Example:

```text
AI SALES ASSISTANT
● ACTIVE

Purpose
Qualify incoming leads and answer product questions.

Knowledge
3 sources

Tone
Friendly

Actions
Reply
Create lead
Assign human
Create task
```

AI controls:

```text
Enable / Disable
Test
Review prompt
Knowledge sources
Allowed actions
Human approval
Usage
```

For high-risk actions, require explicit policy/approval configuration.

---

## 10. Human Handoff

Automation must not trap the customer behind AI.

A conversation can move between:

```text
AUTOMATION
    ↓
AI
    ↓
HUMAN
```

Human handoff should be visible in the conversation timeline.

Example event:

```text
10:31 AI assistant detected a high-intent lead.
10:31 Conversation assigned to Rezza.
10:32 Human agent replied.
```

---

## 11. Health Model

WhatsApp health must be expressed as operational truth.

Primary states:

```text
CREATING
PAIRING
CONNECTED
RUNNING
DEGRADED
RECONNECTING
AUTH_REQUIRED
FAILED
STOPPED
```

Secondary indicators:

```text
WhatsApp session
Runtime process
Message pipeline
Automation engine
AI engine
Storage/session state
```

A connection can be technically alive while another subsystem is degraded. The UI should avoid collapsing everything into one green badge.

---

## 12. Reconnect / Recovery

Runtime restarts are expected and recoverable.

Target behavior:

```text
CONNECTED
   ↓
RUNTIME INTERRUPTION
   ↓
RECONNECTING
   ↓
RESTORE SESSION
   ↓
CONNECTED
```

If restoration fails:

```text
AUTH_REQUIRED
```

The UI should explain the next action rather than expose raw stack traces first.

Preferred failure copy:

> **We lost the session. Reconnect WhatsApp to bring this number back online.**

Technical detail can remain available under Diagnostics.

---

## 13. Session Persistence Contract

A WhatsApp Instance must be restart-safe.

Never make ephemeral container storage the only source of truth for authentication state.

Conceptually:

```text
Container filesystem
    = disposable runtime state

Persistent session store
    = durable source of truth

R2 / object storage
    = backup, media, or export storage where appropriate
```

The runtime must handle credential/key updates continuously and safely.

---

## 14. Logs

WhatsApp logs should be task-oriented.

Categories:

```text
CONNECTION
AUTH
MESSAGE
MEDIA
AUTOMATION
AI
RUNTIME
ERROR
```

Default view:

```text
10:41:03  CONNECTED
10:41:08  MESSAGE RECEIVED
10:41:08  AI CLASSIFIED: sales
10:41:09  WORKFLOW STARTED
10:41:10  MESSAGE SENT
```

Raw runtime logs remain accessible for advanced debugging.

---

## 15. Usage

The customer should understand both operational and billable usage.

Primary metrics:

```text
Runtime hours
CPU
Memory
Messages received
Messages sent
Automation runs
AI tokens / spend (when applicable)
Media storage
```

The usage surface should link to the relevant plan/quota information.

---

## 16. Billing Surface

WhatsApp pricing should be understandable without exposing provider billing internals.

Example commercial model:

```text
Plan
+ WhatsApp instances
+ Runtime allowance
+ Automation allowance
+ AI allowance
+ Storage allowance
```

Usage warnings:

```text
80% quota → Heads up
100% quota → Limit reached / upgrade / pause depending on policy
```

The system must never surprise a customer with infrastructure charges that were not visible in the product.

---

## 17. Instance Detail Layout

Recommended detail page:

```text
┌─────────────────────────────────────────────────────────────┐
│ WA-SALES-01             ● CONNECTED     [Send test] [...] │
├─────────────────────────────────────────────────────────────┤
│ Overview                                                   │
│                                                             │
│  Phone          +62 xxx       Uptime       7d 12h           │
│  Messages       12,492        Automations  37               │
│  AI             ON            Last event   14s ago          │
│                                                             │
│  ┌─────────────────────┐  ┌────────────────────────────┐    │
│  │ Connection health   │  │ Recent conversations       │    │
│  │ ● WhatsApp          │  │                            │    │
│  │ ● Runtime           │  │ +62xxx   Sales inquiry    │    │
│  │ ● Automation        │  │ +62xxx   FAQ              │    │
│  └─────────────────────┘  └────────────────────────────┘    │
│                                                             │
│  Activity | Messages | Automations | AI | Logs | Usage     │
└─────────────────────────────────────────────────────────────┘
```

The page should keep the primary operational question visible:

> **Is my WhatsApp working right now?**

---

## 18. First-Run Empty States

Useful empty states:

### No WhatsApp instances

> **No numbers yet.**  
> Connect a WhatsApp number and make it work for you.

CTA:

**Connect WhatsApp**

### Connected but no messages

> **Connected. Nothing has happened yet.**  
> Send a test message to make sure everything is alive.

### No automations

> **It's connected. Let's give it a job.**

CTA:

**Create automation**

---

## 19. Safety / Policy UX

The product should make policy boundaries explicit where needed.

CRAYON must not imply that successful technical connection guarantees unrestricted WhatsApp activity.

The UI should include:

```text
account status
connection state
platform warnings
rate-limit / delivery signals
operator controls
audit history
```

Any product copy that could be interpreted as guaranteeing WhatsApp account longevity should be avoided.

---

## 20. Customer Success Loop

The first meaningful milestone is not "container running".

It is:

```text
CONNECTED
   ↓
FIRST MESSAGE
   ↓
FIRST AUTOMATED RESPONSE
   ↓
FIRST LEAD
   ↓
FIRST BUSINESS OUTCOME
```

The UI should make these milestones visible and encourage the next useful action.

---

## 21. Monetizable Feature Ladder

The WhatsApp product can progressively unlock value:

```text
CONNECT
  ↓
MESSAGING
  ↓
AUTOMATION
  ↓
AI
  ↓
CRM / LEADS
  ↓
INVOICE / PAYMENT
  ↓
ANALYTICS
  ↓
TEAM / MULTI-AGENT
```

This creates a natural expansion path without changing the underlying WhatsApp Instance model.

---

## 22. Visual Direction

This surface follows the existing CRAYON visual contract.

Crayon/grunge personality is concentrated in:

```text
QR pairing annotation
status emphasis
micro-copy
section markers
empty-state accents
success moments
```

Operational areas remain highly legible:

```text
messages
logs
metrics
tables
configuration
billing
```

The visual goal is:

```text
SERIOUS OPERATIONS
+
HUMAN PERSONALITY
```

not a cartoon chat application.

---

## 23. Acceptance Criteria

A first implementation is considered complete when a new user can:

```text
1. Create a WhatsApp instance
2. See a real pairing surface
3. Complete authentication
4. See connected / reconnecting / failed states
5. Send a test message
6. View message activity
7. Create or enable an automation
8. View automation results
9. Inspect logs
10. Understand current usage and plan limits
11. Recover from a lost session
12. Delete the instance with explicit confirmation
```

No placeholder status, fake progress, or fake message data should be presented as real runtime state.

---

## 24. Next Layer

This document intentionally stops at the WhatsApp workload experience.

Next implementation layer:

```text
WhatsApp Showcase
      ↓
WhatsApp Domain/API Contract
      ↓
Baileys Runtime Contract
      ↓
Container Image
      ↓
Session Persistence Adapter
      ↓
QR / Pairing Event Stream
      ↓
Automation Integration
      ↓
AI Integration
```

These implementation contracts must preserve the customer-facing WhatsApp Instance abstraction.
