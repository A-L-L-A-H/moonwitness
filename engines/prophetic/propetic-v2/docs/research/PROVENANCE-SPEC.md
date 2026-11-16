# Provenance Specification

## Claim object

A claim is the smallest auditable research statement.

Recommended contract:

```ts
interface ProvenanceClaim {
  id: string;
  prophet_id: string;
  category: string;
  statement: string;
  source_id: 'quran'|'taurat'|'zabur'|'injil'|'model';
  ref?: string;
  evidence: EvidenceClass;
  confidence: number;
  lexical?: {
    token?: string;
    lemma?: string;
    root?: string;
    language?: string;
    edition_id?: string;
  };
  relation_to_quran?: string;
  uncertainty_reason?: string;
  alternatives?: string[];
}
```

## Provenance chain

`CLAIM → SOURCE → PASSAGE → EDITION → TOKEN/ROOT → GRAPH EDGE → SCORE CONTRIBUTION`

Every score contribution must be traceable backward to this chain.

## Independence rule

Derived tools that read the same evidence do not create new independent evidence. For example, a semantic matcher can increase reproducibility confidence but cannot be counted as an independent Qur'anic witness.
