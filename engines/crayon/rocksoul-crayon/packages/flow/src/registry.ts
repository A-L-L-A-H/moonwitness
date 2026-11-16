import type { FlowNodeType, NodeMetadata } from './types.js';
const node = (type: FlowNodeType, name: string, description: string, category: NodeMetadata['category'], config: Record<string, unknown>): NodeMetadata => ({ type, name, description, category, config });
export const nodeRegistry: readonly NodeMetadata[] = [
  node('manual-trigger', 'Manual Trigger', 'Starts a flow from the editor.', 'trigger', {}),
  node('schedule-trigger', 'Schedule Trigger', 'Starts on a Scheduler cron binding.', 'trigger', { cron: '0 8 * * *', timezone: 'Asia/Jakarta' }),
  node('webhook-trigger', 'Webhook Trigger', 'Starts from an opaque webhook binding.', 'trigger', {}),
  node('http', 'HTTP Request', 'Makes a bounded, SSRF-protected request.', 'action', { method: 'GET', url: '', headers: {}, body: null, timeoutMs: 30000 }),
  node('condition', 'Condition', 'Routes to true or false based on a value comparison.', 'logic', { path: '$', operator: 'exists', value: null }),
  node('transform', 'Transform', 'Builds JSON from a declarative template.', 'logic', { template: {} }),
  node('rocksoul-capability', 'Rocksoul Capability', 'Invokes an authorized registered application capability.', 'action', { capabilityId: '', input: {} }),
  node('ai-agent', 'AI Agent', 'Invokes the canonical AI runtime.', 'action', { prompt: '', agentId: 'assistant' }),
  node('whatsapp', 'WhatsApp', 'Sends an authorized WhatsApp message.', 'action', { sessionId: 'default', to: '', text: '' }),
];
export const nodeTypes = new Set(nodeRegistry.map(n => n.type));
