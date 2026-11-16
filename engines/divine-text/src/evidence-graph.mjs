import fs from 'node:fs';
import { claims as localClaims } from './claims.mjs';

export function buildEvidenceGraph(claimsFile) {
  let claims = localClaims;
  // If explicitly requested to parse a different file (e.g., tests), we can attempt it,
  // but we prefer localClaims for unification.
  if (claimsFile && !claimsFile.endsWith('claims.json')) {
    try {
      const payload = JSON.parse(fs.readFileSync(claimsFile, 'utf8'));
      if (payload && payload.claims) claims = payload.claims;
    } catch (e) {}
  }

  const nodes = claims.map(c => ({
    id: c.claim_id ?? c.id,
    type: 'claim',
    status: c.status ?? 'UNKNOWN',
    source_type: c.source_type ?? c.sourceType ?? c.source?.type ?? null,
    reference: c.reference ?? c.source?.reference ?? null,
    text: c.claim ?? null,
    tags: c.tags ?? []
  }));
  const edges = [];
  for (const c of claims) {
    const id = c.claim_id ?? c.id;
    for (const rel of (c.relations ?? [])) edges.push({ from: id, to: rel.to, type: rel.type ?? 'related' });
  }
  return { nodes, edges, node_count: nodes.length, edge_count: edges.length };
}
