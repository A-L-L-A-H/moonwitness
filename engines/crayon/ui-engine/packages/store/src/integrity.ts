import type { TemporalRecord } from "allah-crayon-kernel";

export interface TemporalIntegrityLink {
  version: "0";
  sequence: number;
  recordId: string;
  previousDigest: string | null;
  digest: string;
}

export type TemporalIntegrityVerification =
  | { valid: true; count: number; headDigest: string | null }
  | { valid: false; index: number; reason: "SEQUENCE_MISMATCH" | "PREVIOUS_DIGEST_MISMATCH" | "DIGEST_MISMATCH" };

/**
 * Corruption/reordering detector only. This is deliberately NOT an authenticity
 * signature, MAC, trusted timestamp, or proof of who produced a record.
 */
export function buildTemporalIntegrityChain(records: readonly TemporalRecord[]): readonly TemporalIntegrityLink[] {
  let previousDigest: string | null = null;
  return Object.freeze(records.map((record, sequence) => {
    const digest = checksum(canonicalStringify({ sequence, previousDigest, record }));
    const link = Object.freeze({
      version: "0" as const,
      sequence,
      recordId: record.id,
      previousDigest,
      digest,
    });
    previousDigest = digest;
    return link;
  }));
}

export function verifyTemporalIntegrityChain(
  records: readonly TemporalRecord[],
  links: readonly TemporalIntegrityLink[],
): TemporalIntegrityVerification {
  if (records.length !== links.length) {
    return { valid: false, index: Math.min(records.length, links.length), reason: "SEQUENCE_MISMATCH" };
  }
  let previousDigest: string | null = null;
  for (let index = 0; index < records.length; index += 1) {
    const link = links[index];
    if (link.sequence !== index || link.recordId !== records[index].id) {
      return { valid: false, index, reason: "SEQUENCE_MISMATCH" };
    }
    if (link.previousDigest !== previousDigest) {
      return { valid: false, index, reason: "PREVIOUS_DIGEST_MISMATCH" };
    }
    const expected = checksum(canonicalStringify({ sequence: index, previousDigest, record: records[index] }));
    if (link.digest !== expected) return { valid: false, index, reason: "DIGEST_MISMATCH" };
    previousDigest = link.digest;
  }
  return { valid: true, count: records.length, headDigest: previousDigest };
}

function canonicalStringify(value: unknown): string {
  return JSON.stringify(sort(value));
}

function sort(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sort);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, sort(record[key])]));
}

// FNV-1a-style deterministic checksum. It detects accidental/tampered content
// changes but intentionally carries no cryptographic authenticity claim.
function checksum(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}
