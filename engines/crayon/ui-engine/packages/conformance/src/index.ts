import type { RIRDocument, RIRMark, RIRNode, RIRPath } from "allah-crayon-rir";

export type RendererClaimKind =
  | "semantic-ref"
  | "epistemic"
  | "availability"
  | "consequence"
  | "authority"
  | "resistance"
  | "witness"
  | "retry";

export interface RendererClaim {
  id: string;
  kind: RendererClaimKind;
  semanticRef?: string;
  value: string;
}

export type RendererConformanceReason =
  | "MISSING_CLAIM"
  | "VALUE_MISMATCH"
  | "UNEXPECTED_AUTHORITY_GRANT";

export interface RendererConformanceFinding {
  reason: RendererConformanceReason;
  claimId: string;
  expected?: string;
  actual?: string;
}

export interface RendererConformanceReport {
  conforms: boolean;
  required: RendererClaim[];
  findings: RendererConformanceFinding[];
}

function stringify(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function markClaims(node: RIRMark): RendererClaim[] {
  const claims: RendererClaim[] = [];
  if (node.semanticRef) {
    claims.push({ id: `${node.id}:semantic-ref`, kind: "semantic-ref", semanticRef: node.semanticRef, value: node.semanticRef });
  }
  if (node.epistemic) {
    claims.push({ id: `${node.id}:epistemic`, kind: "epistemic", semanticRef: node.semanticRef, value: node.epistemic });
  }
  if (node.role === "effect") {
    claims.push({ id: `${node.id}:consequence`, kind: "consequence", semanticRef: node.semanticRef, value: stringify(node.value) });
  }
  if (node.role === "witness") {
    claims.push({ id: `${node.id}:witness`, kind: "witness", semanticRef: node.semanticRef, value: stringify(node.value) });
  }
  if (node.role === "retry") {
    claims.push({ id: `${node.id}:retry`, kind: "retry", semanticRef: node.semanticRef, value: stringify(node.value) });
  }
  return claims;
}

function pathClaims(node: RIRPath): RendererClaim[] {
  const claims: RendererClaim[] = [
    { id: `${node.id}:availability`, kind: "availability", semanticRef: node.semanticRef, value: node.availability },
    { id: `${node.id}:resistance`, kind: "resistance", semanticRef: node.semanticRef, value: `${node.resistance.mode}:${node.resistance.score}` },
  ];
  for (const capability of node.requirements?.authorityCapabilities ?? []) {
    claims.push({ id: `${node.id}:authority:${capability}`, kind: "authority", semanticRef: node.semanticRef, value: capability });
  }
  return claims;
}

function nodeClaims(node: RIRNode): RendererClaim[] {
  if (node.kind === "mark") return markClaims(node);
  if (node.kind === "path") return pathClaims(node);
  if (node.semanticRef) return [{ id: `${node.id}:semantic-ref`, kind: "semantic-ref", semanticRef: node.semanticRef, value: node.semanticRef }];
  return [];
}

export function deriveRequiredRendererClaims(document: RIRDocument): RendererClaim[] {
  return document.nodes.flatMap(nodeClaims).sort((a, b) => a.id.localeCompare(b.id));
}

export function validateRendererClaims(
  document: RIRDocument,
  observedClaims: readonly RendererClaim[],
  options: { rendererGrantsAuthority?: boolean } = {},
): RendererConformanceReport {
  const required = deriveRequiredRendererClaims(document);
  const observed = new Map(observedClaims.map((claim) => [claim.id, claim]));
  const findings: RendererConformanceFinding[] = [];

  if (options.rendererGrantsAuthority === true) {
    findings.push({ reason: "UNEXPECTED_AUTHORITY_GRANT", claimId: "renderer:authority" });
  }

  for (const claim of required) {
    const actual = observed.get(claim.id);
    if (!actual) {
      findings.push({ reason: "MISSING_CLAIM", claimId: claim.id, expected: claim.value });
      continue;
    }
    if (actual.value !== claim.value || actual.kind !== claim.kind) {
      findings.push({ reason: "VALUE_MISMATCH", claimId: claim.id, expected: `${claim.kind}:${claim.value}`, actual: `${actual.kind}:${actual.value}` });
    }
  }

  return { conforms: findings.length === 0, required, findings };
}
