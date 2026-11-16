import type { RIRAnchor, RIRDocument, RIRMark, RIRPath, RIRPortal } from "allah-crayon-rir";

export interface AgentRepresentation {
  version: "0";
  situationId: string;
  orientation: { subjectId?: string; label: string; entityType?: string };
  knowledge: Array<{ key: string; value?: unknown; epistemic?: string }>;
  possibilities: Array<{
    id: string;
    intent: string;
    availability: RIRPath["availability"];
    resistance: RIRPath["resistance"];
    constraints: string[];
    authorityRequirements: string[];
    consequences: Array<{ label: string; value?: unknown }>;
  }>;
  context: Array<{ targetId: string; label: string; relation?: string }>;
  history: Array<{ phase?: string; at?: string; witnessId?: string; witnessStatus?: string; label: string; value?: unknown; epistemic?: string; evidenceIds: string[] }>;
  authority: { rendererGrantsAuthority: false };
}

export function renderRIRForAgent(document: RIRDocument): AgentRepresentation {
  const anchor = document.nodes.find((node): node is RIRAnchor => node.kind === "anchor");
  const marks = document.nodes.filter((node): node is RIRMark => node.kind === "mark");
  const paths = document.nodes.filter((node): node is RIRPath => node.kind === "path");
  const portals = document.nodes.filter((node): node is RIRPortal => node.kind === "portal");
  return {
    version: "0",
    situationId: document.situationId,
    orientation: { subjectId: anchor?.subjectId, label: anchor?.label ?? document.situationId, entityType: anchor?.entityType },
    knowledge: marks.filter((mark) => mark.role === "knowledge").map((mark) => ({ key: mark.label, value: structuredClone(mark.value), epistemic: mark.epistemic })),
    possibilities: paths.map((path) => ({
      id: path.possibilityId,
      intent: path.intent,
      availability: path.availability,
      resistance: structuredClone(path.resistance),
      constraints: [...(path.requirements?.constraintIds ?? [])],
      authorityRequirements: [...(path.requirements?.authorityCapabilities ?? [])],
      consequences: path.consequenceMarks.flatMap((id) => {
        const mark = marks.find((candidate) => candidate.id === id);
        return mark ? [{ label: mark.label, value: structuredClone(mark.value) }] : [];
      }),
    })),
    context: portals.map((portal) => ({ targetId: portal.targetSubjectId, label: portal.label, relation: portal.relation })),
    history: marks.filter((mark) => mark.temporal).map((mark) => ({ phase: mark.temporal?.phase, at: mark.temporal?.at, witnessId: mark.temporal?.witnessId, witnessStatus: mark.temporal?.status, label: mark.label, value: structuredClone(mark.value), epistemic: mark.epistemic, evidenceIds: [...(mark.temporal?.evidenceIds ?? [])] })),
    authority: { rendererGrantsAuthority: false },
  };
}
