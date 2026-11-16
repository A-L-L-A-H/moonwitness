# ShadcnStore Reference & Resource Pattern Mapping

**Reference**: [shadcn-dashboard-landing-template](https://github.com/shadcnstore/shadcn-dashboard-landing-template)  
**Status**: ANALYZED & MAPPED

---

## 1. Architectural Philosophy

ShadcnStore represents the reference UI design for modern dashboard and workspace applications using React, Tailwind CSS, and shadcn/ui primitives.

> **CRITICAL RULE**: ShadcnStore is an architectural and UX reference, **not** the backend source of truth. Its mock data schemas are used to define **UI Metadata and View Configurations**, while the actual data flows directly from the existing Fastify & Drizzle API.

---

## 2. Resource & View Pattern Mapping

### A. Dashboard (`/dashboard`, `/dashboard-2`)
- **ShadcnStore Pattern**: Grid layout with metric cards (`Card`, `CardContent`), chart widgets (`recharts`), and recent activity lists.
- **Metadata Representation**: `DashboardMetadata` containing an array of `WidgetMetadata` (metrics, charts, summaries).
- **Connected Domain**: Project completion stats, active tasks, unread mail count, and AI agent status.

### B. Tasks (`/tasks`)
- **ShadcnStore Pattern**:
  - Metric summary cards (Total, Completed, In Progress, Pending).
  - TanStack Data Table with faceted filter dropdowns (Status, Priority), column sorting, search input, row actions dropdown, and pagination.
  - Kanban board with drag-and-drop columns (`@dnd-kit`).
- **Metadata Representation**:
  - Resource: `Task`
  - Views: `Table` (`TableMetadata`), `Kanban` (`KanbanMetadata`), `Detail` (`DetailMetadata`).
- **Connected Domain**: Drizzle model `tasks` linked to `projects` and `users`.

### C. Mail (`/mail`)
- **ShadcnStore Pattern**:
  - Resizable split-pane layout (`react-resizable-panels`):
    - Left: Navigation & Folders (Inbox, Sent, Drafts).
    - Center: Message list with search and unread badges.
    - Right: Thread detail view with reply composer.
- **Metadata Representation**:
  - Resource: `Mail`
  - Views: `SplitThreadView`, `ComposeModal`.
- **Connected Domain**: Drizzle model `mailbox_messages`.

### D. Chat (`/chat`)
- **ShadcnStore Pattern**:
  - Sidebar: Channel and conversation thread list.
  - Main: Message timeline, status indicators, and multi-line composer with send/attach controls.
- **Metadata Representation**:
  - Resource: `Chat`
  - Views: `ConversationView`, `ThreadList`.
- **Connected Domain**: Drizzle model `chat_conversations` and `chat_messages`.

### E. Users & Settings (`/users`, `/settings/*`)
- **ShadcnStore Pattern**:
  - Users data table with role badge, status indicator, and profile avatars.
  - Tabbed settings layout (User, Account, Billing, Appearance, Notifications, Connections) with strongly typed forms.
- **Metadata Representation**:
  - Resource: `User`, `AppSetting`
  - Views: `Table`, `Form`, `TabbedLayout`.
- **Connected Domain**: Drizzle model `users`, `app_settings`.

---

## 3. Relationships & Context Hierarchy

```text
Organization (org_rocksoul_default)
    ├── Users
    └── Projects
          ├── Tasks (assignedTo: User)
          ├── Chat Conversations
          └── Files & Artifacts
```

All metadata-driven views will support contextual breadcrumbs, cross-linking, and relation lookups.
