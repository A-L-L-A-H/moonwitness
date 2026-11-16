import type { ExecutionContext } from './context.js';
import type { ModelMessage } from './message.js';
import type { RunResult } from './run.js';

export type AgentStatus =
  | 'FOUNDATION'
  | 'IMPLEMENTED'
  | 'INTEGRATED'
  | 'VERIFIED'
  | 'PRODUCTION-READY'
  | 'BLOCKED';

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model?: string;
  status: AgentStatus;
  capabilities: string[];
}

export interface AgentRunOptions {
  prompt: string;
  threadId?: string;
  context: ExecutionContext;
  maxSteps?: number;
  temperature?: number;
  model?: string;
}

export interface IAgent {
  readonly definition: AgentDefinition;
  generate(options: AgentRunOptions): Promise<RunResult>;
  stream?(options: AgentRunOptions): AsyncIterable<string>;
}
