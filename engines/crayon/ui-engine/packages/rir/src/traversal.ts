import type { RIRDocument, RIRMark, RIRNode, RIRPath } from "./model.js";

export interface SemanticTraversalEntry {
  nodeId: string;
  priority: number;
  reason: string;
}

export function deriveSemanticTraversal(document: RIRDocument): SemanticTraversalEntry[] {
  return document.nodes
    .flatMap((node) => traversalEntry(node))
    .sort((left, right) => right.priority - left.priority || left.nodeId.localeCompare(right.nodeId));
}

function traversalEntry(node: RIRNode): SemanticTraversalEntry[] {
  if (node.kind === "field" || node.kind === "layer" || node.kind === "line" || node.kind === "region") return [];
  if (node.kind === "anchor") return [{ nodeId: node.id, priority: 100, reason: "Current orientation anchor is first." }];
  if (node.kind === "path") {
    const path = node as RIRPath;
    const availability = path.availability === "available" ? 82 : path.availability === "unknown" ? 68 : 42;
    const significance = Math.round((path.salience ?? 0) * 10);
    return [{ nodeId: path.id, priority: availability + significance, reason: `Possibility is ${path.availability}; semantic significance adjusts traversal priority.` }];
  }
  if (node.kind === "mark") {
    const mark = node as RIRMark;
    const epistemic = mark.epistemic === "conflicted" ? 76 : mark.epistemic === "unknown" ? 72 : mark.epistemic === "uncertain" ? 66 : 48;
    const temporal = mark.role === "retry" ? 80 : mark.role === "witness" || mark.role === "reconciliation" ? 70 : mark.temporal ? 62 : 0;
    return [{ nodeId: mark.id, priority: Math.max(epistemic, temporal) + Math.round((mark.salience ?? 0) * 8), reason: mark.temporal ? "Temporal evidence and unresolved outcomes remain reachable." : "Knowledge priority follows epistemic relevance." }];
  }
  if (node.kind === "portal") return [{ nodeId: node.id, priority: 36 + Math.round((node.salience ?? 0) * 8), reason: "Related context follows current meaning and actionable paths." }];
  return [];
}
