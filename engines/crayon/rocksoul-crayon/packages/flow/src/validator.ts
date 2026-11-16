import type { FlowDefinition, ValidationIssue } from './types.js';
import { config } from './config.js';
import { nodeTypes } from './registry.js';
export function validateDefinition(definition: FlowDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!definition || !Array.isArray(definition.nodes) || !Array.isArray(definition.edges)) return [{ code: 'INVALID_DEFINITION', message: 'Definition must contain nodes and edges arrays.', severity: 'error' }];
  if (definition.nodes.length > config.FLOW_MAX_NODES) issues.push({ code: 'NODE_LIMIT', message: `At most ${config.FLOW_MAX_NODES} nodes are allowed.`, severity: 'error' });
  if (definition.edges.length > config.FLOW_MAX_EDGES) issues.push({ code: 'EDGE_LIMIT', message: `At most ${config.FLOW_MAX_EDGES} edges are allowed.`, severity: 'error' });
  const nodes = new Map<string, typeof definition.nodes[number]>();
  for (const n of definition.nodes) { if (!n.id || nodes.has(n.id)) issues.push({ nodeId: n.id, code: 'NODE_ID', message: 'Node IDs must be unique and non-empty.', severity: 'error' }); else nodes.set(n.id, n); if (!nodeTypes.has(n.type)) issues.push({ nodeId: n.id, code: 'UNKNOWN_NODE', message: `Unsupported node type: ${n.type}`, severity: 'error' }); }
  const incoming = new Map<string, number>(); const outgoing = new Map<string, typeof definition.edges>();
  for (const e of definition.edges) { if (!nodes.has(e.source) || !nodes.has(e.target)) issues.push({ path: `edges.${e.id}`, code: 'INVALID_EDGE', message: 'Edge source and target must exist.', severity: 'error' }); else { incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1); outgoing.set(e.source, [...(outgoing.get(e.source) ?? []), e]); if (nodes.get(e.source)?.type === 'condition' && !['true', 'false'].includes(e.sourceHandle ?? '')) issues.push({ path: `edges.${e.id}.sourceHandle`, code: 'CONDITION_HANDLE', message: 'Condition edges require true or false handles.', severity: 'error' }); } }
  const triggers = definition.nodes.filter(n => n.type.endsWith('-trigger'));
  if (!triggers.length) issues.push({ code: 'MISSING_TRIGGER', message: 'A flow requires at least one trigger.', severity: 'error' });
  const visiting = new Set<string>(), visited = new Set<string>(); const visit = (id: string) => { if (visiting.has(id)) { issues.push({ nodeId: id, code: 'CYCLE', message: 'Flow graphs must be acyclic.', severity: 'error' }); return; } if (visited.has(id)) return; visiting.add(id); for (const e of outgoing.get(id) ?? []) visit(e.target); visiting.delete(id); visited.add(id); };
  for (const id of nodes.keys()) visit(id);
  return issues;
}
