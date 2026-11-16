import type { RIRDocument, RIRMark, RIRPath } from "allah-crayon-rir";

export interface StaticHTMLProjection {
  version: "0";
  situationId: string;
  html: string;
  rendererGrantsAuthority: false;
}

export function renderRIRAsStaticHTML(document: RIRDocument): StaticHTMLProjection {
  const body = document.nodes.map((node) => {
    if (node.kind === "anchor") {
      return `<header data-semantic-ref="${escapeAttr(node.semanticRef ?? node.subjectId)}"><strong>${escapeHtml(node.label)}</strong></header>`;
    }
    if (node.kind === "mark") return markHtml(node);
    if (node.kind === "path") return pathHtml(node);
    return "";
  }).join("");
  const html = `<article data-crayon-static="0" data-semantic-ref="${escapeAttr(document.situationId)}">${body}</article>`;
  return Object.freeze({ version: "0", situationId: document.situationId, html, rendererGrantsAuthority: false });
}

function markHtml(mark: RIRMark): string {
  return `<section data-kind="mark" data-role="${escapeAttr(mark.role)}" data-semantic-ref="${escapeAttr(mark.semanticRef ?? mark.id)}"${mark.epistemic ? ` data-epistemic="${escapeAttr(mark.epistemic)}"` : ""}><strong>${escapeHtml(mark.label)}</strong><span>${escapeHtml(stringify(mark.value))}</span>${mark.temporal?.status ? `<small>witness: ${escapeHtml(mark.temporal.status)}</small>` : ""}</section>`;
}

function pathHtml(path: RIRPath): string {
  const authority = path.requirements?.authorityCapabilities?.join(", ") || "none";
  return `<section data-kind="path" data-semantic-ref="${escapeAttr(path.semanticRef ?? path.possibilityId)}" data-availability="${escapeAttr(path.availability)}" data-resistance="${escapeAttr(path.resistance.mode)}"><strong>${escapeHtml(path.intent)}</strong><span>availability: ${escapeHtml(path.availability)}</span><span>resistance: ${escapeHtml(`${path.resistance.mode}:${path.resistance.score}`)}</span><span>authority: ${escapeHtml(authority)}</span><span>consequence marks: ${escapeHtml(path.consequenceMarks.join(", "))}</span></section>`;
}

function stringify(value: unknown): string {
  if (value === undefined) return "unknown";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
