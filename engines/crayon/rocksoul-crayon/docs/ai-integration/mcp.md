# Model Context Protocol (MCP) Integration

**Package**: `@rocksoul/ai-mcp`  
**Status**: INTEGRATED & VERIFIED

---

## 1. Abstraction Boundary

Application code and agents never interact directly with MCP wire transports (stdio, SSE, WebSocket). `@rocksoul/ai-mcp` provides an `MCPRegistry` that translates external MCP tool declarations into native `ToolDefinition` contracts.

---

## 2. Security Default

All tools dynamically imported or registered via MCP default to the `ASK_USER` security policy, preventing remote MCP servers from silently executing operations on the host.
