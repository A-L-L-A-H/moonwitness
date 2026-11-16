export type GraphNodeStatus = 'success' | 'failed' | 'cancelled' | 'skipped';
export type GraphNode<T = unknown> = {
  readonly id: string;
  readonly dependsOn?: readonly string[];
  readonly run: (results: Readonly<Record<string, unknown>>) => Promise<T>;
};
export type GraphNodeResult<T = unknown> = { readonly nodeId: string; readonly status: GraphNodeStatus; readonly value?: T; readonly error?: unknown };
export type GraphResult = { readonly graphId: string; readonly nodes: Readonly<Record<string, GraphNodeResult>> };

export async function runExecutionGraph(
  graphId: string,
  nodes: readonly GraphNode[],
): Promise<GraphResult> {
  if (!graphId.trim() || new Set(nodes.map(node => node.id)).size !== nodes.length) throw new Error('graph identity is invalid');
  const definitions = new Map(nodes.map(node => [node.id, node]));
  for (const node of nodes) for (const dependency of node.dependsOn ?? []) if (!definitions.has(dependency)) throw new Error(`unknown graph dependency: ${dependency}`);
  const results: Record<string, GraphNodeResult> = {};
  const values: Record<string, unknown> = {};
  const remaining = new Set(nodes.map(node => node.id));
  while (remaining.size) {
    const ready = nodes.filter(node => remaining.has(node.id) && (node.dependsOn ?? []).every(id => results[id]?.status));
    if (!ready.length) throw new Error('graph contains a cycle');
    const runnable = ready.filter(node => (node.dependsOn ?? []).every(id => results[id].status === 'success'));
    for (const node of ready.filter(candidate => !runnable.includes(candidate))) {
      results[node.id] = { nodeId: node.id, status: 'skipped', error: new Error('dependency failed') };
      remaining.delete(node.id);
    }
    const settled = await Promise.all(runnable.map(async node => {
      try { return { nodeId: node.id, status: 'success' as const, value: await node.run(values) }; }
      catch (error) { return { nodeId: node.id, status: 'failed' as const, error }; }
    }));
    for (const result of settled) {
      results[result.nodeId] = result;
      if (result.status === 'success') values[result.nodeId] = result.value;
      remaining.delete(result.nodeId);
    }
  }
  return { graphId, nodes: results };
}
