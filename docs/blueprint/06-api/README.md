# 06 — API

The external/network boundary is intentionally singular.

```text
HTTPS + OpenAPI
      ↓
moonwitness-api
      ↓
application capabilities
      ↓
domain
```

SSE is a streaming mode of the same HTTP API. Do not create parallel REST/gRPC/tRPC/GraphQL business implementations.

Initial compatibility surface: `/v1`.
