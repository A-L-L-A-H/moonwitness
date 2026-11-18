# AI Agents Specification & Status

> [!NOTE]
> **Absorbed Engine Historical Snapshot (`EVIDENCE:HISTORICAL`, 2026-11-18):**
> Retained verbatim from the absorbed `engines/crayon/rocksoul-crayon` archive ([September 2026 audit](../../../../docs/CONSOLIDATION-CATALOG.md)). Implementation status claims (`IMPLEMENTED` / `FOUNDATION`) reflect that historical upstream archive and **must not** be cited as verified runtime behavior of active monorepo apps (`apps/web`, `apps/api`, `apps/rocksoul`) without current monorepo tests. Root [AGENTS.md](../../../../AGENTS.md) governs active repository agent execution.

**Subsystem**: `@rocksoul/ai-agents`  
**Status Audit Date**: September 2026

---

## 1. Registered Agents

| Agent ID | Name | Readiness Status | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **`assistant`** | General Assistant | **`IMPLEMENTED`** | Contextual conversation, thread memory, safe tool execution, context awareness |
| **`coder`** | Code Engineer | **`FOUNDATION`** | Code analysis, diffing, patch generation, sandboxed workspace |
| **`researcher`** | Knowledge Researcher | **`FOUNDATION`** | Knowledge retrieval, documentation search, fact synthesis |
| **`browser`** | Web Navigator | **`FOUNDATION`** | Web navigation, snapshot extraction, dom interaction |
| **`supervisor`** | Workflow Supervisor | **`FOUNDATION`** | Request classification, agent delegation, handoff coordination |

---

## 2. Assistant Agent (`assistant`)

The assistant agent is fully functional:
- **Conversation State**: Automatically retrieves and persists messages to threads using `IMemoryProvider`.
- **Tool Access**: Seamlessly invokes safe tools (`system_info`, `time_now`, `calculator`) through `ToolRegistry`.
- **Context Awareness**: Receives authenticated user context (`userId`, `orgId`, `requestId`) from Fastify and incorporates it into answers.
- **Resilience**: Operates deterministically even when external LLM API keys are not supplied.

---

## 3. Foundation Agents (`coder`, `researcher`, `browser`, `supervisor`)

These agents have their complete interfaces, definitions, and execution contracts defined and registered in the orchestrator. They are ready to receive LLM model bindings and capabilities without requiring architectural changes.
