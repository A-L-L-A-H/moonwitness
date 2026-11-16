import type { RIRDocument, RIRLayer, RIRMark, RIRNode, RIRPath } from "./model.js";

export type SemanticDetailLevel = "compact" | "standard" | "expanded";

export function projectRIRDetail(document: RIRDocument, level: SemanticDetailLevel): RIRDocument {
  if (level === "expanded" || level === "standard") return structuredClone(document);
  const keep = new Set<string>();
  const byId = new Map(document.nodes.map((node) => [node.id, node]));

  for (const node of document.nodes) {
    if (node.kind === "field" || node.kind === "layer" || node.kind === "anchor" || node.kind === "path") keep.add(node.id);
    if (node.kind === "mark" && mustRemainVisible(node)) keep.add(node.id);
    if (node.kind === "portal" && (node.salience ?? 0) >= 0.65) keep.add(node.id);
  }

  for (const node of document.nodes) {
    if (node.kind !== "path") continue;
    const path = node as RIRPath;
    keep.add(path.to);
    const disclosure = path.physics?.disclosure?.score ?? 0;
    if (disclosure >= 0.45 || path.resistance.score >= 0.45) for (const id of path.consequenceMarks) keep.add(id);
  }

  const nodes = document.nodes.flatMap((node): RIRNode[] => {
    if (!keep.has(node.id)) return [];
    if (node.kind === "layer") {
      const layer = structuredClone(node) as RIRLayer;
      layer.members = layer.members.filter((id) => keep.has(id));
      return [layer];
    }
    if (node.kind === "field") {
      const field = structuredClone(node);
      field.children = field.children.filter((id) => keep.has(id));
      return [field];
    }
    return [structuredClone(node)];
  });

  for (const node of nodes) {
    if (node.kind === "path" && !byId.has(node.to)) throw new Error(`Invalid semantic projection: missing path target ${node.to}`);
  }
  return { ...structuredClone(document), nodes, explanation: [...document.explanation, "Compact semantic projection removes low-significance detail but preserves identity, actionability, material consequence, uncertainty, and witness state."] };
}

function mustRemainVisible(mark: RIRMark): boolean {
  if (mark.temporal) return true;
  if (mark.role === "retry" || mark.role === "witness") return true;
  if (mark.epistemic === "unknown" || mark.epistemic === "conflicted" || mark.epistemic === "uncertain") return true;
  if ((mark.physics?.disclosure?.score ?? 0) >= 0.45) return true;
  return (mark.salience ?? 0) >= 0.65;
}
