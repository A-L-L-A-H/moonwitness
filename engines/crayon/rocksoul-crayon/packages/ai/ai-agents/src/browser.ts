import type { AgentDefinition } from '@rocksoul/ai-core';
import type { ModelRegistry } from '@rocksoul/ai-models';
import { ModelAgent } from './model-agent.js';
export class BrowserAgent extends ModelAgent {
  readonly definition: AgentDefinition = { id: 'browser', name: 'Web Navigator', description: 'Specialized agent for web exploration, page snapshots, content extraction, and browser automation.', instructions: 'You are the browser automation agent. Only propose or invoke authorized browsing capabilities and summarize safe results.', status: 'IMPLEMENTED', capabilities: ['web-navigation', 'snapshot-extraction', 'dom-interaction'] };
  constructor(models: ModelRegistry) { super(models); }
}
