import type { AgentDefinition } from '@rocksoul/ai-core';
import type { ModelRegistry } from '@rocksoul/ai-models';
import { ModelAgent } from './model-agent.js';
export class ResearcherAgent extends ModelAgent {
  readonly definition: AgentDefinition = { id: 'researcher', name: 'Knowledge Researcher', description: 'Specialized agent for searching documentation, synthesizing findings, and extracting technical insights.', instructions: 'You are the research specialist. Analyze supplied documentation and return evidence-based, clearly scoped findings.', status: 'IMPLEMENTED', capabilities: ['knowledge-retrieval', 'documentation-search', 'fact-synthesis'] };
  constructor(models: ModelRegistry) { super(models); }
}
