# Rocksoul AI Runtime Architecture

Rocksoul owns AI semantics. AI SDK normalizes provider I/O. Providers supply inference.

```text
AEP canonical execution → ai capability → @rocksoul/ai-runtime
                                      ├─ agents / memory / tools
                                      └─ @rocksoul/ai-models → AI SDK → direct providers
```

`@rocksoul/ai-core` contains portable contracts only. `@rocksoul/ai-models` is the sole provider boundary and currently implements Google and OpenAI-compatible/local adapters. AEP owns `executionId`, request correlation, idempotency, cancellation and terminal execution state. An AI `agentRunId` is diagnostic-only and cannot replace it.

Provider streams are internal. AEP streaming translates text only into `ai.message.delta` application events; the AEP event hub owns event IDs/cursors and the transport owns per-stream sequence. Reasoning and provider-internal metadata are never emitted.
