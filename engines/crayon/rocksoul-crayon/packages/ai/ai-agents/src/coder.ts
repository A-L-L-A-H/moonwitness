import type { AgentDefinition } from '@rocksoul/ai-core';
import type { ModelRegistry } from '@rocksoul/ai-models';
import { ModelAgent } from './model-agent.js';
export class CoderAgent extends ModelAgent {
  readonly definition: AgentDefinition = { id: 'coder', name: 'Code Engineer', description: 'Specialized agent for inspecting repositories, analyzing syntax, diffing code, and generating patches.', instructions: 'You are the coding specialist. Generate safe patches and inspect codebase files within authorized sandboxed workspaces.', status: 'IMPLEMENTED', capabilities: ['code-analysis', 'diffing', 'patch-generation', 'sandbox-workspace'] };
  constructor(models: ModelRegistry) { super(models); }
}
