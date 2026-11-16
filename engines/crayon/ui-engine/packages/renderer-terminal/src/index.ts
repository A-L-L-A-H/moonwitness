import type { RIRDocument, RIRMark, RIRPath } from "allah-crayon-rir";

export interface TerminalProjection {
  version: "0";
  situationId: string;
  text: string;
  rendererGrantsAuthority: false;
}

export function renderRIRForTerminal(document: RIRDocument): TerminalProjection {
  const lines: string[] = [`CRAYON ${document.situationId}`];
  for (const node of document.nodes) {
    if (node.kind === "anchor") {
      lines.push(`ANCHOR ${node.semanticRef ?? node.subjectId} | ${node.label}`);
    } else if (node.kind === "mark") {
      lines.push(renderMark(node));
    } else if (node.kind === "path") {
      lines.push(renderPath(node));
    }
  }
  return Object.freeze({ version: "0", situationId: document.situationId, text: lines.join("\n"), rendererGrantsAuthority: false });
}

function renderMark(mark: RIRMark): string {
  const parts = [
    `MARK ${mark.role}`,
    mark.semanticRef ?? mark.id,
    mark.epistemic ? `epistemic=${mark.epistemic}` : undefined,
    `value=${stringify(mark.value)}`,
    mark.temporal?.status ? `witness=${mark.temporal.status}` : undefined,
  ].filter(Boolean);
  return parts.join(" | ");
}

function renderPath(path: RIRPath): string {
  const authority = path.requirements?.authorityCapabilities?.join(",") || "none";
  return [
    `PATH ${path.intent}`,
    path.semanticRef ?? path.possibilityId,
    `availability=${path.availability}`,
    `resistance=${path.resistance.mode}:${path.resistance.score}`,
    `authority=${authority}`,
    `consequenceMarks=${path.consequenceMarks.join(",")}`,
  ].join(" | ");
}

function stringify(value: unknown): string {
  if (value === undefined) return "unknown";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
