import type {ClaimType, CrayonInput, Domain, EvidenceClass, RgblLevel, SourceType} from "./types.js";

const DOMAINS = new Set<Domain>(["allah", "human", "nature", "justice", "general"]);
const LEVELS = new Set<RgblLevel>(["R1","G2","B3","L4"]);
const SOURCE_TYPES = new Set<SourceType>(["observation", "measurement", "document", "testimony", "reasoning", "revelation", "other"]);
const CLAIM_TYPES = new Set<ClaimType>(["observation","measurement","source-statement","pattern","relation","model","causal-hypothesis","inference","interpretation","entity","agency","intention","impact","value","decision","caution","theological-claim"]);
const EVIDENCE_CLASSES = new Set<EvidenceClass>(["empirical","testimonial","documentary","philosophical","revelation","mixed","unspecified"]);
const ARRAY_FIELDS = ["observations","evidence","assumptions","patterns","relations","actors","intentions","impacts","values","interpretations","problems","risks","possibilities","benefits","cautions","nextActions"] as const;

export class CrayonValidationError extends Error {
  readonly code = "CRAYON_INPUT_INVALID";
  constructor(message: string) { super(message); this.name = "CrayonValidationError"; }
}

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const validConfidence = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export function validateCrayonInput(input: CrayonInput): void {
  if (!input || typeof input !== "object") throw new CrayonValidationError("Input must be an object.");
  if (typeof input.question !== "string" || input.question.trim().length === 0) throw new CrayonValidationError("`question` must be a non-empty string.");
  if (input.domain !== undefined && !DOMAINS.has(input.domain)) throw new CrayonValidationError(`Unsupported domain: ${String(input.domain)}`);
  if (input.confidence !== undefined && !validConfidence(input.confidence)) throw new CrayonValidationError("`confidence` must be a finite number between 0 and 1.");
  for (const field of ARRAY_FIELDS) {
    const value = input[field];
    if (value !== undefined && !isStringArray(value)) throw new CrayonValidationError(`\`${field}\` must be an array of strings.`);
  }
  if (input.sources !== undefined) {
    if (!Array.isArray(input.sources)) throw new CrayonValidationError("`sources` must be an array.");
    for (const [index, source] of input.sources.entries()) {
      if (!source || typeof source !== "object") throw new CrayonValidationError(`sources[${index}] must be an object.`);
      if (source.id !== undefined && (typeof source.id !== "string" || !source.id.trim())) throw new CrayonValidationError(`sources[${index}].id must be non-empty when provided.`);
      if (typeof source.label !== "string" || source.label.trim().length === 0) throw new CrayonValidationError(`sources[${index}].label must be non-empty.`);
      if (!SOURCE_TYPES.has(source.type)) throw new CrayonValidationError(`sources[${index}].type is unsupported.`);
    }
  }
  if (input.levelConfidence !== undefined) {
    if (!input.levelConfidence || typeof input.levelConfidence !== "object") throw new CrayonValidationError("`levelConfidence` must be an object.");
    for (const level of LEVELS) {
      const value = input.levelConfidence[level];
      if (value !== undefined && !validConfidence(value)) throw new CrayonValidationError(`levelConfidence.${level} must be between 0 and 1.`);
    }
  }
  if (input.structuredClaims !== undefined) {
    if (!Array.isArray(input.structuredClaims)) throw new CrayonValidationError("`structuredClaims` must be an array.");
    for (const [index, claim] of input.structuredClaims.entries()) {
      if (!claim || typeof claim !== "object") throw new CrayonValidationError(`structuredClaims[${index}] must be an object.`);
      if (typeof claim.id !== "string" || !claim.id.trim()) throw new CrayonValidationError(`structuredClaims[${index}].id must be non-empty.`);
      if (typeof claim.text !== "string" || !claim.text.trim()) throw new CrayonValidationError(`structuredClaims[${index}].text must be non-empty.`);
      if (!LEVELS.has(claim.level)) throw new CrayonValidationError(`structuredClaims[${index}].level is unsupported.`);
      if (!CLAIM_TYPES.has(claim.type)) throw new CrayonValidationError(`structuredClaims[${index}].type is unsupported.`);
      if (claim.evidenceClass !== undefined && !EVIDENCE_CLASSES.has(claim.evidenceClass)) throw new CrayonValidationError(`structuredClaims[${index}].evidenceClass is unsupported.`);
      if (claim.confidence !== undefined && !validConfidence(claim.confidence)) throw new CrayonValidationError(`structuredClaims[${index}].confidence must be between 0 and 1.`);
      if (claim.sourceRefs !== undefined && !isStringArray(claim.sourceRefs)) throw new CrayonValidationError(`structuredClaims[${index}].sourceRefs must be an array of strings.`);
      if (claim.dependsOn !== undefined && !isStringArray(claim.dependsOn)) throw new CrayonValidationError(`structuredClaims[${index}].dependsOn must be an array of strings.`);
    }
  }
  if (input.conflicts !== undefined) {
    if (!Array.isArray(input.conflicts)) throw new CrayonValidationError("`conflicts` must be an array.");
    for (const [index, conflict] of input.conflicts.entries()) {
      if (!conflict || typeof conflict !== "object") throw new CrayonValidationError(`conflicts[${index}] must be an object.`);
      if (typeof conflict.description !== "string" || !conflict.description.trim()) throw new CrayonValidationError(`conflicts[${index}].description must be non-empty.`);
      if (conflict.claimIds !== undefined && !isStringArray(conflict.claimIds)) throw new CrayonValidationError(`conflicts[${index}].claimIds must be an array of strings.`);
      if (conflict.sourceRefs !== undefined && !isStringArray(conflict.sourceRefs)) throw new CrayonValidationError(`conflicts[${index}].sourceRefs must be an array of strings.`);
    }
  }
}
