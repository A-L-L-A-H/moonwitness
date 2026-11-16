export type ResearchDomain =
  | 'STORY'
  | 'EVENT'
  | 'PERSON'
  | 'TEXT'
  | 'LAW'
  | 'PERSPECTIVE';

export type RelationshipDomain = 'RELATIONSHIP';

export interface ResearchResourceAdapter {
  readonly domain: ResearchDomain;
  readonly repository: string;
  readonly prefix: string;
  readonly canonicalBranch: 'main';
  readonly ownership: 'FOREIGN_CANONICAL';
}

export interface RelationshipResourceAdapter {
  readonly domain: RelationshipDomain;
  readonly repository: 'rocksoul-correlation';
  readonly prefix: 'correlation:';
  readonly canonicalBranch: 'main';
  readonly ownership: 'FOREIGN_CANONICAL';
}

export const researchResourceAdapters = Object.freeze([
  { domain: 'STORY', repository: 'rocksoul-mftl', prefix: 'mftl:', canonicalBranch: 'main', ownership: 'FOREIGN_CANONICAL' },
  { domain: 'EVENT', repository: 'rocksoul-legend', prefix: 'legend:', canonicalBranch: 'main', ownership: 'FOREIGN_CANONICAL' },
  { domain: 'PERSON', repository: 'rocksoul-superhero', prefix: 'superhero:', canonicalBranch: 'main', ownership: 'FOREIGN_CANONICAL' },
  { domain: 'TEXT', repository: 'rocksoul-rgbl', prefix: 'rgbl:', canonicalBranch: 'main', ownership: 'FOREIGN_CANONICAL' },
  { domain: 'LAW', repository: 'rocksoul-aws', prefix: 'aws:', canonicalBranch: 'main', ownership: 'FOREIGN_CANONICAL' },
  { domain: 'PERSPECTIVE', repository: 'rocksoul-jizz', prefix: 'jizz:', canonicalBranch: 'main', ownership: 'FOREIGN_CANONICAL' },
] satisfies readonly ResearchResourceAdapter[]);

export const relationshipResourceAdapter: RelationshipResourceAdapter = Object.freeze({
  domain: 'RELATIONSHIP',
  repository: 'rocksoul-correlation',
  prefix: 'correlation:',
  canonicalBranch: 'main',
  ownership: 'FOREIGN_CANONICAL',
});

const byDomain = new Map<ResearchDomain, ResearchResourceAdapter>(
  researchResourceAdapters.map((adapter) => [adapter.domain, adapter]),
);

const byPrefix = new Map<string, ResearchResourceAdapter | RelationshipResourceAdapter>([
  ...researchResourceAdapters.map((adapter) => [adapter.prefix, adapter] as const),
  [relationshipResourceAdapter.prefix, relationshipResourceAdapter],
]);

export function resolveResearchResource(domain: ResearchDomain): ResearchResourceAdapter {
  const adapter = byDomain.get(domain);
  if (!adapter) throw new Error(`Unsupported research domain: ${domain}`);
  return adapter;
}

export function qualifyResearchRef(domain: ResearchDomain, recordId: string): string {
  if (!recordId) throw new Error('recordId is required');
  return `${resolveResearchResource(domain).prefix}${recordId}`;
}

export function parseResearchRef(value: string): {
  domain: ResearchDomain | RelationshipDomain;
  repository: string;
  recordId: string;
} | null {
  for (const [prefix, adapter] of byPrefix) {
    if (!value.startsWith(prefix)) continue;
    const recordId = value.slice(prefix.length);
    if (!recordId) return null;
    return { domain: adapter.domain, repository: adapter.repository, recordId };
  }
  return null;
}

/**
 * Crayon is an operational consumer. This guard prevents local workspace state
 * from being mistaken for canonical research ownership.
 */
export function assertCanonicalResearchOwner(domain: ResearchDomain, repository: string): void {
  const expected = resolveResearchResource(domain).repository;
  if (repository !== expected) {
    throw new Error(`Canonical owner mismatch for ${domain}: ${repository}; expected ${expected}`);
  }
}
