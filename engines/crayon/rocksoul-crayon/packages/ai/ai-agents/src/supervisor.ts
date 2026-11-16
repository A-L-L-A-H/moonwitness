import type { AgentDefinition } from '@rocksoul/ai-core';
import type { ModelRegistry } from '@rocksoul/ai-models';
import { ModelAgent } from './model-agent.js';
export class SupervisorAgent extends ModelAgent {
  readonly definition: AgentDefinition = { id: 'supervisor', name: 'Workflow Supervisor', description: 'Autonomous coordinator that classifies incoming requests and delegates them to specialized agents.', instructions: 'You are the supervisory coordinator. Classify the request and give a concise, safe next action; do not bypass capability policies.', status: 'IMPLEMENTED', capabilities: ['request-classification', 'agent-delegation', 'handoff-coordination'] };
  constructor(models: ModelRegistry) { super(models); }
}
