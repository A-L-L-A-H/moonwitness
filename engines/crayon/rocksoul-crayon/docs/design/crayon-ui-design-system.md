# CRAYON — UI Design System v1.0

## Status

**Version:** 1.0  
**Role:** Visual and interaction source of truth  
**Product:** CRAYON  
**Official meaning:** Create. Run. Automate. Your Own Network.  
**Core promise:** Make it run.

---

## 1. Purpose

This document defines the visual and interaction language for CRAYON. It exists to prevent one-off visual decisions across the landing page, application shell, dashboard, deployment surfaces, WhatsApp/Baileys surfaces, automation, observability, billing, and future modules.

CRAYON is a technical product with personality. The visual system must preserve usability first and express personality through controlled crayon/grunge details.

The governing principle is:

```text
CLEAN SYSTEM
     +
HUMAN MARKS
     +
TECHNICAL PRECISION
```

Target visual ratio:

```text
90% professional SaaS usability
10% crayon / grunge personality
```

---

## 2. Visual North Star

CRAYON should feel like a sophisticated infrastructure product that was designed on paper before becoming software.

Reference qualities:

```text
paper notebook
editorial typography
engineering blueprint
black ink
marker highlight
subtle imperfection
modern SaaS density
technical clarity
```

CRAYON must not feel like:

```text
children's software
cartoon UI
gaming UI
cyberpunk dashboard
neon-glass UI
generic blue enterprise SaaS
random doodle collage
```

---

## 3. Color Tokens

### Base

```text
--crayon-paper-0       #FCFBF7
--crayon-paper-1       #F5F2E9
--crayon-paper-2       #EBE7DC
--crayon-ink-900       #111111
--crayon-ink-700       #2A2A2A
--crayon-ink-500       #68655F
--crayon-ink-300       #AAA69D
--crayon-white         #FFFFFF
```

### Accent

```text
--crayon-lime          #7CFF4F
--crayon-cyan          #00F0FF
--crayon-magenta       #FF2DFE
--crayon-orange        #FF9D00
```

### Semantic status

```text
--status-success       #35C759
--status-warning       #F5A623
--status-danger        #FF3B30
--status-info          #2F80ED
--status-neutral       #8E8E93
```

Accent colors are intentional highlights. Never make an entire screen neon.

---

## 4. Color Rules

1. Ink is the default text and structural color.
2. Paper is the default application canvas.
3. White is used for elevated surfaces where needed.
4. Lime/cyan/magenta/orange identify emphasis, not decoration.
5. Semantic status colors must remain semantically stable.
6. Do not use accent colors for unrelated actions merely because they look attractive.
7. A page should normally have one dominant accent and at most two supporting accents.

Example:

```text
Dashboard → mostly ink/paper + lime status accents
AI        → mostly ink/paper + magenta accent
Network   → mostly ink/paper + cyan accent
Billing   → mostly ink/paper + orange accent
```

---

## 5. Typography

Typography should combine a highly readable modern sans with a technical monospace layer.

### Primary UI

Use a modern grotesk/sans-serif for navigation, labels, forms, cards, and body text.

Preferred characteristics:

```text
clean
slightly condensed where useful
high x-height
excellent numeric clarity
```

### Technical UI

Use a monospace face for:

```text
logs
IDs
URLs
commands
environment variables
runtime details
resource metrics
code
build output
```

### Handwritten layer

Handwritten/crayon typography is only for:

```text
annotations
micro-copy
section accents
marketing moments
easter eggs
```

Never use it for:

```text
forms
critical status
error messages
billing values
navigation
long paragraphs
```

---

## 6. Type Scale

Reference scale:

```text
Display     64 / 1.00 / 700
Hero        48 / 1.05 / 700
H1          36 / 1.10 / 700
H2          28 / 1.15 / 700
H3          22 / 1.20 / 650
Title       18 / 1.25 / 650
Body        15 / 1.50 / 450
Small       13 / 1.40 / 500
Caption     11 / 1.30 / 600
Mono        13 / 1.45 / 450
```

Do not create arbitrary font sizes for individual screens.

---

## 7. Spacing

Use an 8-point base grid:

```text
4   micro
8   tight
12  compact
16  standard
24  section
32  major
48  large
64  hero
96  marketing
```

Use spacing to create hierarchy instead of excessive borders or shadows.

---

## 8. Radius

The product should be friendly without becoming toy-like.

```text
radius-xs      4px
radius-sm      8px
radius-md      12px
radius-lg      16px
radius-xl      24px
radius-pill    999px
```

Default controls: 8–12px.  
Default cards: 12–16px.  
Hero/marketing panels may use larger radii.

---

## 9. Borders

Borders are part of the CRAYON identity.

Default:

```text
1px solid rgba(17,17,17,.14)
```

Strong structural border:

```text
1px solid #111111
```

Hand-drawn border is reserved for selected marketing cards, empty states, callouts, or special feature moments.

Never use intentionally irregular borders for dense operational tables.

---

## 10. Shadows

Use extremely restrained shadows.

Preferred:

```text
0 1px 2px rgba(17,17,17,.06)
0 8px 24px rgba(17,17,17,.08)
```

The visual hierarchy should come primarily from spacing, borders, and surface contrast.

---

## 11. Crayon Language

Crayon effects are a semantic visual layer, not a component theme applied everywhere.

### Allowed motifs

```text
marker underline
scribbled circle
hand-drawn arrow
highlight stroke
small handwritten note
rough-edged label
imperfect accent line
```

### Density rules

Operational screens:

```text
0–2 crayon accents per viewport
```

Marketing screens:

```text
2–6 accents per viewport
```

Never cover content with doodles.

### Semantic meaning

A crayon mark should do one job:

```text
call attention
explain a relationship
show personality
highlight a CTA
```

If removing the mark improves clarity, remove it.

---

## 12. Grunge Layer

Grunge is texture, not visual noise.

Allowed:

```text
very subtle paper grain
slight ink imperfections
controlled distressed texture
small offset marker marks
```

Avoid:

```text
heavy film grain
scratches across text
dirty backgrounds
high-contrast noise
random texture overlays
```

Accessibility and readability always win over texture.

---

## 13. Application Shell

Desktop shell:

```text
┌────────────────────────────────────────────────────────────┐
│ CRAYON                         Search         Account        │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ Overview      │                                            │
│               │                                            │
│ CREATE        │               CONTENT AREA                 │
│ Applications  │                                            │
│ Templates     │                                            │
│ Projects      │                                            │
│               │                                            │
│ RUN           │                                            │
│ Deployments   │                                            │
│ Containers    │                                            │
│ Workers       │                                            │
│ Jobs          │                                            │
│               │                                            │
│ AUTOMATE      │                                            │
│ Workflows     │                                            │
│ AI Agents     │                                            │
│ WhatsApp      │                                            │
│               │                                            │
│ NETWORK       │                                            │
│ Domains       │                                            │
│ Storage       │                                            │
│ Data          │                                            │
│ Secrets       │                                            │
│               │                                            │
│ OBSERVE       │                                            │
│ Logs          │                                            │
│ Metrics       │                                            │
│ Usage         │                                            │
│               │                                            │
│ ACCOUNT       │                                            │
│ Billing       │                                            │
│ Team          │                                            │
│ Settings      │                                            │
└───────────────┴────────────────────────────────────────────┘
```

The sidebar must remain compact. Group labels are small, high-contrast, and visually secondary.

---

## 14. Navigation Rules

Navigation should follow intent:

```text
CREATE
RUN
AUTOMATE
NETWORK
OBSERVE
ACCOUNT
```

Do not expose provider names such as “Cloudflare Worker” as top-level navigation.

Advanced provider details belong inside runtime configuration.

---

## 15. Dashboard Grammar

The dashboard answers six questions in order:

```text
1. What needs attention?
2. What's running?
3. What changed?
4. What's deploying?
5. How much am I using?
6. What should I do next?
```

Recommended structure:

```text
Page header
  ↓
Attention / incident strip
  ↓
Health snapshot
  ↓
Applications + deployments
  ↓
WhatsApp / automation status
  ↓
Usage
  ↓
Recent events
```

Avoid chart walls.

---

## 16. Cards

Cards should be used to group meaning, not to turn every field into a floating rectangle.

Card anatomy:

```text
┌──────────────────────────────────────┐
│ title                      action    │
│ supporting context                   │
├──────────────────────────────────────┤
│                                      │
│ primary content                      │
│                                      │
└──────────────────────────────────────┘
```

Prefer 1 strong metric + context over 8 tiny metrics.

---

## 17. Buttons

### Primary

Strong ink button or selected accent fill depending on context.

Use for:

```text
Deploy
Create
Start
Save
Connect
```

### Secondary

Outlined/soft surface.

Use for:

```text
Cancel
Preview
Open logs
Configure
```

### Destructive

Red semantic treatment. Never use a crayon accent as destructive shorthand.

### Icon-only

Only when the icon meaning is standard or has an accessible tooltip.

---

## 18. Status System

Statuses must be readable without relying on color alone.

Recommended pattern:

```text
● RUNNING
● BUILDING
● DEPLOYING
● DEGRADED
● FAILED
● STOPPED
```

Combine:

```text
indicator + label + optional context
```

Never communicate critical state through color alone.

---

## 19. Forms

Form design should be calm and predictable.

Rules:

```text
label above field
help text below field
required state explicit
error state local
one primary submit action
```

Avoid custom hand-drawn controls for ordinary forms.

Use crayon annotation only to explain unusual concepts.

---

## 20. Tables

Tables are a core infrastructure surface.

Principles:

```text
compact rows
clear column labels
right-align numbers
monospace IDs when useful
sticky header for long lists
status visible in first few columns
bulk actions only when relevant
```

Do not use crayon textures inside dense tables.

---

## 21. Deployment Surface

A deployment page should visually prioritize:

```text
Application
Current status
Version / commit
Runtime
Region
Started at
Duration
Primary URL
```

Lifecycle:

```text
QUEUED
  ↓
BUILDING
  ↓
RELEASING
  ↓
STARTING
  ↓
HEALTHY
```

Failure state:

```text
FAILED
  ↓
reason
  ↓
relevant log excerpt
  ↓
likely fix
  ↓
RETRY
```

---

## 22. WhatsApp / Baileys Surface

The WhatsApp experience gets a distinctive but restrained CRAYON treatment.

Primary card:

```text
WA-SALES-01
● CONNECTED

Messages       12,492
Automations       37
AI                    ON
Uptime            7d 12h
```

Pairing surface:

```text
┌───────────────────────┐
│                       │
│          QR           │
│                       │
└───────────────────────┘

scan → connect → go
```

Use a handwritten annotation near the QR area, not around every field.

---

## 23. Terminal / Logs

Logs are intentionally more technical than the rest of the application.

```text
background → near-black ink
text       → paper-white
accent     → one contextual accent
font       → monospace
```

Provide:

```text
filter
search
copy
follow
pause
clear
severity
request / deployment context
```

Do not make logs look handwritten.

---

## 24. Empty States

Empty states can carry more CRAYON personality.

Recommended anatomy:

```text
small illustration / mark
clear statement
short explanation
one primary action
optional handwritten note
```

Example:

```text
Nothing here yet.

Your first app is waiting.

[ Create application ]

↳ let's make something.
```

---

## 25. Error States

Error UI must be serious and actionable.

```text
WHAT HAPPENED
WHY IT MATTERS
WHAT YOU CAN DO
```

Example:

```text
Deployment failed.

The health check did not receive a response.

[ View logs ] [ Retry ]
```

Never joke about security failures, billing failures, or irreversible destructive errors.

---

## 26. Command Palette

Command palette is a first-class CRAYON primitive.

Structure:

```text
┌────────────────────────────────────────┐
│ Search or run a command…              │
├────────────────────────────────────────┤
│ CREATE                                 │
│   New application                      │
│   New workflow                         │
│   New WhatsApp                         │
│                                         │
│ RUN                                    │
│   Deploy project                       │
│   Restart container                    │
│   View logs                            │
└────────────────────────────────────────┘
```

Safe actions may execute immediately. Destructive actions require confirmation.

---

## 27. Motion

Motion should communicate state, not decoration.

Use:

```text
150–200ms → micro interactions
200–300ms → panels / menus
300–450ms → larger transitions
```

Prefer subtle:

```text
fade
slide
scale 0.98 → 1
progress
status pulse
```

Avoid constant motion, bouncing UI, and decorative confetti.

---

## 28. Responsiveness

### Desktop
Primary design target for infrastructure operations.

### Tablet
Collapse secondary navigation and preserve primary actions.

### Mobile
Prioritize:

```text
status
primary action
recent activity
critical alerts
```

Do not simply shrink desktop tables into unreadable layouts. Convert dense data to cards or horizontal scroll when appropriate.

---

## 29. Accessibility

Minimum requirements:

```text
keyboard navigable
visible focus
semantic labels
color-independent status
sufficient contrast
reduced motion support
accessible dialogs
accessible tables
```

Crayon and grunge effects must never lower readability or contrast.

---

## 30. Responsive + Themed Surfaces

Use a single semantic token layer so future dark mode or alternate themes can be introduced without rewriting component contracts.

Components should consume semantic variables rather than hard-coded hex values.

Example:

```css
--surface-app
--surface-panel
--surface-raised
--text-primary
--text-secondary
--border-default
--accent-primary
--status-success
--status-danger
```

---

## 31. Component Inventory

### Foundations

```text
Color
Typography
Spacing
Radius
Border
Shadow
Icon
Motion
```

### Core

```text
Button
Input
Select
Textarea
Checkbox
Radio
Switch
Badge
Status
Tooltip
Popover
Dropdown
Dialog
Tabs
Toast
Pagination
```

### Data

```text
Card
Metric
Table
List
Timeline
Chart
Activity
LogViewer
CodeBlock
```

### CRAYON-specific

```text
CrayonUnderline
CrayonArrow
CrayonHighlight
CrayonNote
CrayonSticker
InkBorder
PaperSurface
BlueprintGrid
```

CRAYON-specific primitives must remain optional overlays, never mandatory wrappers around every component.

---

## 32. Page Templates

Standard page families:

```text
Dashboard
List
Detail
Create
Edit
Wizard
Workspace
Terminal
Settings
Billing
Empty
Error
```

Each page family must reuse the same header/action grammar.

---

## 33. Detail Page Grammar

```text
[ Back ]

Resource Name                     [status] [primary action]
Resource type · identifier

────────────────────────────────────────────
Overview | Activity | Configuration | Usage
────────────────────────────────────────────

Primary content

Secondary context
```

The first screenful must answer what the resource is and whether it is healthy.

---

## 34. Marketing vs Product

### Marketing

Can use:

```text
larger type
more crayon marks
more expressive composition
more texture
more asymmetry
```

### Product

Must prioritize:

```text
clarity
predictability
density
status
actionability
accessibility
```

### Developer surfaces

Can increase:

```text
monospace
grid
terminal aesthetics
technical annotations
```

---

## 35. Copy Rules

CRAYON copy should be:

```text
short
clear
confident
human
occasionally playful
```

Examples:

```text
Deploying…
Yep. It's alive.
Ship it.
Nothing here yet.
It died. We brought it back.
Connected.
Make it run.
```

Do not make system copy vague merely to sound cool.

---

## 36. Design Do / Don't

### DO

```text
use whitespace
use strong typography
use semantic status
use restrained accents
use occasional handwritten notes
use consistent component grammar
use real technical information
```

### DON'T

```text
turn everything into stickers
make all borders irregular
use gradients everywhere
hide status behind decoration
use fake metrics
make critical UI playful
recreate generic Vercel/Linear UI without CRAYON personality
```

---

## 37. Definition of Done for a Screen

A screen is not considered complete until:

```text
[ ] information hierarchy is obvious
[ ] primary action is obvious
[ ] loading state exists
[ ] empty state exists
[ ] error state exists
[ ] destructive state has confirmation
[ ] mobile behavior is defined
[ ] keyboard behavior is defined
[ ] status is color-independent
[ ] crayon accents are intentional
[ ] tokens are used instead of arbitrary values
[ ] reusable components are used
```

---

## 38. Implementation Contract

Every frontend implementation must treat this document as a design contract.

Do not introduce:

```text
one-off colors
arbitrary radii
random font sizes
untracked shadows
unreviewed doodles
provider-specific navigation labels
```

New visual primitives must either reuse existing tokens or be explicitly added to this system.

---

## 39. Next Visual Deliverables

The next design artifacts should be produced in this order:

```text
01  Logo / wordmark direction
02  Color token implementation
03  Typography implementation
04  Iconography rules
05  Core component showcase
06  Application shell
07  Dashboard
08  Application detail
09  Deployment detail
10  WhatsApp / Baileys workspace
11  Automation builder
12  Logs / metrics
13  Billing
14  Landing page
```

The component showcase becomes the visual regression reference for the entire product.

---

## 40. Final Principle

CRAYON should never ask:

> “How do we make this look more like a crayon?”

The better question is:

> “Where would a human mark this interface to make the important thing easier to see?”

That is the visual language.

```text
CRAYON

clean enough to trust.

weird enough to remember.
```
