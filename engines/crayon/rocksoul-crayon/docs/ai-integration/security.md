# Security & Policy Guardrails

**Status**: ENFORCED

---

## 1. Tool Policy Matrix

| Capability Category | Default Policy | Description |
| :--- | :--- | :--- |
| **Safe Utilities** (`system_info`, `time_now`, `calculator`) | `ALLOW` | Harmless read-only system queries and pure computation |
| **Filesystem Operations** | `DENY` | Denied by default; must be restricted to sandboxed workspace with user consent |
| **Terminal / Commands** | `DENY` | Unrestricted shell execution is forbidden |
| **Network & Browser** | `DENY` / `ASK_USER` | Navigation restricted to approved domains with confirmation |
| **Git Destructive** | `DENY` | Force pushes, branch deletions, and hard resets blocked |
| **MCP External Tools** | `ASK_USER` | Explicit user confirmation required before invocation |

---

## 2. Policy Enforcement Engine

When any tool execution is attempted, `ToolRegistry` evaluates the effective policy:
- If `DENY`: Rejects immediately with a security violation error.
- If `ASK_USER`: Checks for explicit confirmation flags in `context.metadata.userApprovedTools`.
- If `ALLOW`: Executes the safe handler within the provided `ExecutionContext`.

Tool input is validated against the registered schema before execution. Execution has a bounded timeout, forwards the canonical abort signal, sanitizes credential-shaped output fields, and deduplicates completed effects when canonical `executionId` and `idempotencyKey` are supplied.
