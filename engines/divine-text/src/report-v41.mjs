import fs from 'node:fs';

export function writeV41Report(root, graph, gap) {
  const report = {
    release: '4.1.0',
    generated_at: new Date().toISOString(),
    runtime: 'Node.js ESM zero-dependency',
    evidence_graph: { nodes: graph.node_count, edges: graph.edge_count },
    corpus_gaps: gap.missing_or_pending,
    invariants: [
      'Revelation claim is not identical to text identity.',
      'Text identity is not identical to textual preservation.',
      'PENDING is not scored as zero.',
      'Raw source text is preserved before normalization.'
    ]
  };
  fs.writeFileSync(`${root}/outputs/V4_1_REPORT.json`, JSON.stringify(report, null, 2));
  return report;
}
