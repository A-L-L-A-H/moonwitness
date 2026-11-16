import type { RIRDocument, RIRMark, RIRPath } from "./model.js";

export function renderRIRAsText(document: RIRDocument): string {
  const marks = document.nodes.filter((node): node is RIRMark => node.kind === "mark");
  const paths = document.nodes.filter((node): node is RIRPath => node.kind === "path");
  const anchors = document.nodes.filter((node) => node.kind === "anchor");
  const lines = [`SITUATION ${document.situationId}`, ...anchors.map((node) => `ANCHOR ${node.label}`)];

  for (const mark of marks.filter((item) => item.role === "knowledge")) {
    lines.push(`KNOWLEDGE ${mark.label}: ${formatValue(mark.value)} [${mark.epistemic ?? "unspecified"}]`);
  }
  for (const path of paths) {
    const target = marks.find((mark) => mark.id === path.to);
    lines.push(`PATH ${path.intent} -> ${target?.label ?? path.to} [${path.availability}] resistance=${path.resistance.score.toFixed(2)}`);
    for (const consequenceId of path.consequenceMarks) {
      const mark = marks.find((item) => item.id === consequenceId);
      if (mark) lines.push(`EFFECT ${mark.label}: ${formatValue(mark.value)}`);
    }
  }

  const temporal = marks.filter((mark) => mark.temporal);
  if (temporal.length > 0) lines.push("HISTORY");
  for (const mark of temporal) {
    if (mark.role === "retry") { lines.push(`RETRY ${formatValue(mark.value)}`); continue; }
    const phase = mark.temporal?.phase.toUpperCase() ?? mark.role.toUpperCase();
    const status = mark.temporal?.status ? ` witness=${mark.temporal.status}` : "";
    const epistemic = mark.epistemic ? ` epistemic=${mark.epistemic}` : "";
    lines.push(`${phase} ${mark.temporal?.at ?? ""} ${mark.label}: ${formatValue(mark.value)}${epistemic}${status}`.trim());
  }
  return lines.join("\n");
}
function formatValue(value: unknown): string { return typeof value === "string" ? value : JSON.stringify(value); }
