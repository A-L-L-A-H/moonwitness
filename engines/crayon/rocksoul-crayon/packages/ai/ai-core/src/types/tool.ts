import type { ExecutionContext } from './context.js';
import type { ToolPolicy } from './policy.js';

export interface ToolDefinition<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  category: 'safe' | 'filesystem' | 'terminal' | 'network' | 'browser' | 'mcp' | 'workspace';
  schema?: Record<string, unknown>;
  policy?: ToolPolicy;
  execute: (input: TInput, context: ExecutionContext) => Promise<TOutput>;
}

export interface IToolRegistry {
  register(tool: ToolDefinition): void;
  get(id: string): ToolDefinition | undefined;
  list(): ToolDefinition[];
  has(id: string): boolean;
  execute(id: string, input: any, context: ExecutionContext): Promise<any>;
}
