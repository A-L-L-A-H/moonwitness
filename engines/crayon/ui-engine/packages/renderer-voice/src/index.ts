import type { RIRAnchor, RIRDocument, RIRMark, RIRPath } from "allah-crayon-rir";

export interface VoiceRepresentation { version: "0"; situationId: string; segments: string[]; text: string; }

export function renderRIRForVoice(document: RIRDocument): VoiceRepresentation {
  const anchor = document.nodes.find((node): node is RIRAnchor => node.kind === "anchor");
  const marks = document.nodes.filter((node): node is RIRMark => node.kind === "mark");
  const paths = document.nodes.filter((node): node is RIRPath => node.kind === "path");
  const segments: string[] = [`You are at ${anchor?.label ?? document.situationId}.`];

  const uncertain = marks.filter((mark) => mark.role === "knowledge" && ["unknown", "uncertain", "conflicted"].includes(mark.epistemic ?? ""));
  for (const mark of uncertain) segments.push(`${mark.label} is ${mark.epistemic}; ${mark.value === undefined ? "its value is not established" : `current value is ${format(mark.value)}`}.`);

  for (const path of paths) {
    const requirement = path.requirements?.authorityCapabilities.length ? ` Required authority: ${path.requirements.authorityCapabilities.join(", ")}.` : "";
    segments.push(`${path.intent} is ${path.availability}. Commitment mode is ${path.resistance.mode}, resistance ${path.resistance.score.toFixed(2)}.${requirement}`);
    const consequence = path.consequenceMarks.flatMap((id) => { const mark = marks.find((candidate) => candidate.id === id); return mark ? [`${mark.label} becomes ${format(mark.value)}`] : []; });
    if (consequence.length > 0) segments.push(`Consequences: ${consequence.join("; ")}.`);
  }

  const temporal = marks.filter((mark) => mark.temporal);
  for (const mark of temporal) {
    if (mark.role === "retry") { segments.push(`Retry assessment: ${format(mark.value)}.`); continue; }
    segments.push(`${mark.temporal?.phase ?? mark.role} at ${mark.temporal?.at ?? "unknown time"}: ${mark.label} was ${format(mark.value)}${mark.epistemic ? `, epistemic state ${mark.epistemic}` : ""}${mark.temporal?.status ? `, witness ${mark.temporal.status}` : ""}.`);
  }
  return { version: "0", situationId: document.situationId, segments, text: segments.join(" ") };
}
function format(value: unknown): string { return typeof value === "string" ? value : value === undefined ? "unknown" : JSON.stringify(value); }
