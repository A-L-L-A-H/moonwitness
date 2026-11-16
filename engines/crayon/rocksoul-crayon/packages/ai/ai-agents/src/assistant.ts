import type { AgentDefinition } from '@rocksoul/ai-core';
import type { IMemoryProvider } from '@rocksoul/ai-core';
import type { ModelRegistry } from '@rocksoul/ai-models';
import { ModelAgent } from './model-agent.js';

export class AssistantAgent extends ModelAgent {
  readonly definition: AgentDefinition = {
    id: 'assistant',
    name: 'General Assistant',
    description: 'Autonomous assistant handling contextual conversation, safe tool executions, and system queries.',
    instructions: 'You are the primary AI assistant for Rocksoul. Assist users with general queries, orchestrate capabilities, and adhere strictly to security policies.',
    status: 'IMPLEMENTED',
    capabilities: ['chat', 'memory', 'safe-tools', 'context-awareness'],
  };

  constructor(models: ModelRegistry, memory?: IMemoryProvider, tools?: import('@rocksoul/ai-tools').ToolRegistry) { super(models, memory, tools); }
}
