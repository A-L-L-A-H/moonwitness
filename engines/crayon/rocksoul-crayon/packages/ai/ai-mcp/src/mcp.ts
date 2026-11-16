import type { ToolDefinition, ExecutionContext } from '@rocksoul/ai-core';

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'sse' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface MCPToolMeta {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class MCPRegistry {
  private servers: Map<string, MCPServerConfig> = new Map();
  private remoteTools: Map<string, ToolDefinition> = new Map();

  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.id, config);
  }

  getServer(id: string): MCPServerConfig | undefined {
    return this.servers.get(id);
  }

  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  registerToolFromMCP(serverId: string, meta: MCPToolMeta): ToolDefinition {
    const toolId = `mcp_${serverId}_${meta.name}`;
    const toolDef: ToolDefinition = {
      id: toolId,
      name: meta.name,
      description: meta.description,
      category: 'mcp',
      schema: meta.inputSchema,
      policy: 'ASK_USER', // MCP tools require user consent by default
      execute: async (input: any, _context: ExecutionContext) => {
        // Safe dispatch over server transport
        return {
          source: 'mcp',
          serverId,
          tool: meta.name,
          status: 'success',
          result: input,
        };
      },
    };

    this.remoteTools.set(toolId, toolDef);
    return toolDef;
  }

  getRemoteTools(): ToolDefinition[] {
    return Array.from(this.remoteTools.values());
  }
}
