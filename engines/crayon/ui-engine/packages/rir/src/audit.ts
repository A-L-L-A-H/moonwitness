import type { RIRDocument, RIRMark, RIRPath } from "./model.js";

export type RepresentationAuditDimension = "orientation" | "truthfulness" | "consequence" | "explainability" | "accessibility" | "witness" | "cross-renderer";
export interface RepresentationAuditFinding { dimension: RepresentationAuditDimension; code: string; severity: "error" | "warning"; nodeId?: string; detail: string; }
export interface RepresentationAudit { passed: boolean; findings: RepresentationAuditFinding[]; }

export function auditRepresentation(document: RIRDocument): RepresentationAudit {
  const findings: RepresentationAuditFinding[] = [];
  const anchors = document.nodes.filter((node) => node.kind === "anchor");
  const marks = document.nodes.filter((node): node is RIRMark => node.kind === "mark");
  const paths = document.nodes.filter((node): node is RIRPath => node.kind === "path");

  if (anchors.length !== 1) findings.push(error("orientation", "ANCHOR_CARDINALITY", `Expected exactly one current orientation anchor, found ${anchors.length}.`));

  for (const mark of marks) {
    if (mark.role === "knowledge" && !mark.epistemic) findings.push(error("truthfulness", "KNOWLEDGE_WITHOUT_EPISTEMIC_STATE", `${mark.id} exposes knowledge without epistemic state.`, mark.id));
    if (mark.temporal && !mark.temporal.at) findings.push(error("witness", "TEMPORAL_WITHOUT_TIME", `${mark.id} lacks temporal identity.`, mark.id));
    if (mark.temporal?.phase === "observation" && mark.value === undefined && mark.epistemic !== "unknown") findings.push(error("truthfulness", "MISSING_OBSERVATION_NOT_UNKNOWN", `${mark.id} has no observed value but is not explicitly unknown.`, mark.id));
  }

  for (const path of paths) {
    if (path.consequenceMarks.length === 0) findings.push(error("consequence", "ACTION_WITHOUT_CONSEQUENCE", `${path.id} exposes actionability without consequence marks.`, path.id));
    if (!path.requirements || path.requirements.authorityCapabilities.length === 0) findings.push(error("cross-renderer", "ACTION_WITHOUT_AUTHORITY_REQUIREMENT", `${path.id} would lose authority requirements in non-Web renderers.`, path.id));
    if (path.resistance.score >= 0.45 && !path.physics?.disclosure) findings.push(error("consequence", "MATERIAL_ACTION_WITHOUT_DISCLOSURE", `${path.id} has material resistance but no disclosure signal.`, path.id));
  }

  for (const node of document.nodes) {
    if (!node.physics) continue;
    for (const [name, metric] of Object.entries(node.physics)) {
      if (metric && metric.explanation.length === 0) findings.push(error("explainability", "UNEXPLAINED_PHYSICS", `${node.id}.${name} has a score without explanation.`, node.id));
    }
  }

  const temporal = marks.filter((mark) => mark.temporal);
  if (temporal.length > 0 && !temporal.some((mark) => mark.role === "witness")) findings.push(error("witness", "HISTORY_WITHOUT_WITNESS", "Temporal facts exist without a witness mark."));
  if (temporal.some((mark) => ["unknown", "conflicted", "uncertain"].includes(mark.epistemic ?? "")) && !document.nodes.some((node) => node.kind === "layer" && node.purpose === "history")) findings.push(error("accessibility", "UNRESOLVED_HISTORY_NOT_ORIENTED", "Unresolved temporal state must remain in an addressable history layer."));

  return { passed: !findings.some((finding) => finding.severity === "error"), findings };
}

function error(dimension: RepresentationAuditDimension, code: string, detail: string, nodeId?: string): RepresentationAuditFinding {
  return { dimension, code, severity: "error", nodeId, detail };
}
