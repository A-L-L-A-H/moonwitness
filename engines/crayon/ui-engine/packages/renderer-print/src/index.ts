import type { RIRDocument, RIRMark, RIRPath } from "allah-crayon-rir";

export interface PrintSection {
  id: string;
  heading: string;
  semanticRef?: string;
  lines: readonly string[];
  keepTogether: boolean;
}

export interface PrintProjection {
  version: "0";
  situationId: string;
  title: string;
  sections: readonly PrintSection[];
  rendererGrantsAuthority: false;
}

export function renderRIRForPrint(document: RIRDocument): PrintProjection {
  const sections: PrintSection[] = [];
  for (const node of document.nodes) {
    if (node.kind === "anchor") {
      sections.push(section(node.id, "Current orientation", node.semanticRef ?? node.subjectId, [node.label, `type: ${node.entityType}`]));
    } else if (node.kind === "mark") {
      sections.push(markSection(node));
    } else if (node.kind === "path") {
      sections.push(pathSection(node));
    }
  }
  return deepFreeze({
    version: "0" as const,
    situationId: document.situationId,
    title: `CRAYON — ${document.situationId}`,
    sections,
    rendererGrantsAuthority: false as const,
  });
}

function markSection(mark: RIRMark): PrintSection {
  const lines = [
    `role: ${mark.role}`,
    `value: ${stringify(mark.value)}`,
    mark.epistemic ? `epistemic: ${mark.epistemic}` : undefined,
    mark.temporal?.phase ? `phase: ${mark.temporal.phase}` : undefined,
    mark.temporal?.status ? `witness: ${mark.temporal.status}` : undefined,
  ].filter((value): value is string => Boolean(value));
  return section(mark.id, mark.label, mark.semanticRef, lines);
}

function pathSection(path: RIRPath): PrintSection {
  return section(path.id, `Possibility — ${path.intent}`, path.semanticRef ?? path.possibilityId, [
    `availability: ${path.availability}`,
    `resistance: ${path.resistance.mode}:${path.resistance.score}`,
    `authority: ${path.requirements?.authorityCapabilities?.join(", ") || "none"}`,
    `consequence marks: ${path.consequenceMarks.join(", ") || "none"}`,
  ]);
}

function section(id: string, heading: string, semanticRef: string | undefined, lines: readonly string[]): PrintSection {
  return deepFreeze({ id, heading, semanticRef, lines: [...lines], keepTogether: true });
}

function stringify(value: unknown): string {
  if (value === undefined) return "unknown";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
