# ADR: Rocksoul-owned AI runtime with AI SDK as inference adapter

## Context

The previous AI subsystem used Mastra terminology for its private memory store and composition root, while AEP already owns application execution and AppEvent owns application events.

## Decision

Rocksoul owns agent identity, memory, tools, policy and orchestration. `@rocksoul/ai-models` is the only package that imports AI SDK/provider packages. AI SDK normalizes direct Google and OpenAI-compatible provider I/O; it does not own application execution, users, chat, scheduling, Flow, or webhooks.

## Consequences

`executionId` remains canonical when supplied by AEP; `agentRunId` is an internal attempt correlation. Missing provider configuration fails with `AI_MODEL_NOT_CONFIGURED`; production never fabricates assistant output. AI storage defaults to `ai.db` and migrates compatible legacy tables non-destructively.

## Alternatives rejected

Mastra, LangChain, LangGraph, OpenAI Agents SDK as architecture, raw individual provider SDKs throughout the codebase, and a mandatory AI Gateway were rejected to preserve a small, Rocksoul-owned runtime.

## Migration and boundaries

Legacy `mastra_*` tables are copied into `ai_*` tables with `INSERT OR IGNORE`; legacy data is retained. Scheduler no longer exposes Mastra executors. Provider internals and reasoning are not returned through Rocksoul contracts.
