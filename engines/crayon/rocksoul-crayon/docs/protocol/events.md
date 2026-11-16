# Unified Event Model Specification
**Application Execution Protocol (AEP)**
*Specification Version: 1.1.0-normative*

---

## 1. The Unified Event Paradigm

In AEP, all notifications, progress updates, streaming deltas, and state transitions are instances of a single **Unified Event Envelope**:

```typescript
export interface AppEvent<T = unknown> {
  /** Global UUIDv7 event identifier for deduplication */
  readonly eventId: string;

  /** Standardized hierarchical event type identifier */
  readonly eventType: string;

  /** Session context */
  readonly sessionId: string;

  /** Request correlation */
  readonly requestId: string;

  /** Target execution identifier */
  readonly executionId: string;

  /** Stream sequence number for ordering validation */
  readonly sequence: number;

  /** Event generation timestamp in epoch milliseconds */
  readonly timestamp: number;

  /** Priority classification (0..4) */
  readonly priority: number;

  /** Strongly-typed domain payload */
  readonly payload: T;
}
```

---

## 2. Canonical Event Taxonomy

### 2.1 Generic Execution Lifecycle Events
Every Execution emits lifecycle events across its state transitions:

- **`execution.started`**: Execution accepted and dispatched to active executor.
- **`execution.progress`**: Non-terminal status update (progress percentage, status text).
- **`execution.waiting`**: Execution blocked awaiting input/approval (carries challenge details).
- **`execution.completed`**: Terminal success event carrying output data or artifact reference.
- **`execution.failed`**: Terminal failure event carrying structured error envelope.
- **`execution.cancelled`**: Terminal cancellation confirmation.

### 2.2 Domain Event Extensions (Payload Instances)
Domain semantics are represented through standard `eventType` hierarchical namespaces without requiring custom protocol frames:

| Domain Namespace | Canonical Event Types | Payload Content |
|---|---|---|
| **AI Workspaces** | `ai.message.delta`<br>`ai.tool.started`<br>`ai.tool.completed`<br>`ai.approval.required` | Token deltas, Tool inputs/outputs, Human approval request payload |
| **Browser Agent** | `browser.navigation`<br>`browser.snapshot`<br>`browser.action` | Target URL, Base64/Binary DOM screenshot, Click/Type coordinates |
| **Coding Sandbox**| `coding.file.changed`<br>`coding.diff.created`<br>`coding.command.completed` | Unified git diff format, File patch manifest, CLI exit codes |
| **Artifacts** | `artifact.created`<br>`artifact.updated` | Artifact URI, SHA-256 hash, MIME type, size |
| **Canonical Models** | `model.created`<br>`model.updated`<br>`model.deleted` | Model name (`tasks`, `projects`), row ID, delta fields |
