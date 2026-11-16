import React from "react";
import type { RIRDocument, SemanticDetailLevel } from "allah-crayon-rir";
import { RIRView } from "./index.js";

export type WebRIRInputReasonCode =
  | "INVALID_DOCUMENT"
  | "UNSUPPORTED_VERSION"
  | "MISSING_SITUATION_ID"
  | "MISSING_ROOT"
  | "MISSING_NODES"
  | "ROOT_NODE_MISSING";

export interface WebRIRInputIssue {
  code: WebRIRInputReasonCode;
  explanation: string;
}

export interface SafeRIRViewProps {
  document: unknown;
  detail?: SemanticDetailLevel;
  direction?: "ltr" | "rtl" | "auto";
}

export function validateWebRIRInput(document: unknown): {
  valid: boolean;
  situationId?: string;
  issues: readonly WebRIRInputIssue[];
} {
  const issues: WebRIRInputIssue[] = [];
  if (!document || typeof document !== "object") {
    return { valid: false, issues: [{ code: "INVALID_DOCUMENT", explanation: "RIR input must be an object." }] };
  }

  const candidate = document as Partial<RIRDocument>;
  const situationId = nonEmpty(candidate.situationId) ? candidate.situationId : undefined;
  if (candidate.version !== "0") issues.push({ code: "UNSUPPORTED_VERSION", explanation: "Web renderer accepts RIR version 0 only." });
  if (!situationId) issues.push({ code: "MISSING_SITUATION_ID", explanation: "RIR situation identity is required." });
  if (!nonEmpty(candidate.root)) issues.push({ code: "MISSING_ROOT", explanation: "RIR root node identity is required." });
  if (!Array.isArray(candidate.nodes)) issues.push({ code: "MISSING_NODES", explanation: "RIR nodes must be an array." });
  if (Array.isArray(candidate.nodes) && nonEmpty(candidate.root) && !candidate.nodes.some((node) => node?.id === candidate.root)) {
    issues.push({ code: "ROOT_NODE_MISSING", explanation: `RIR root ${candidate.root} is not present in nodes.` });
  }

  return Object.freeze({ valid: issues.length === 0, situationId, issues: Object.freeze(issues) });
}

export function SafeRIRView({ document, detail = "standard", direction = "auto" }: SafeRIRViewProps) {
  const validation = validateWebRIRInput(document);
  if (!validation.valid) {
    return <RIRSystemLimitation situationId={validation.situationId} issues={validation.issues} direction={direction} />;
  }

  return (
    <div dir={direction} data-crayon-direction={direction}>
      <RIRClientBoundary situationId={validation.situationId} direction={direction}>
        <RIRView document={document as RIRDocument} detail={detail} />
      </RIRClientBoundary>
    </div>
  );
}

class RIRClientBoundary extends React.Component<
  { situationId?: string; direction: "ltr" | "rtl" | "auto"; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Rendering failure is intentionally not converted into domain evidence/outcome.
  }

  render() {
    if (this.state.failed) {
      return <RIRSystemLimitation situationId={this.props.situationId} issues={[]} direction={this.props.direction} />;
    }
    return this.props.children;
  }
}

function RIRSystemLimitation({
  situationId,
  issues,
  direction,
}: {
  situationId?: string;
  issues: readonly WebRIRInputIssue[];
  direction: "ltr" | "rtl" | "auto";
}) {
  return (
    <section
      className="crayon-system-limitation"
      role="status"
      aria-live="polite"
      dir={direction}
      data-system-limitation="renderer"
      data-semantic-ref={situationId}
    >
      <span className="crayon-kicker">SYSTEM LIMITATION</span>
      <strong>Representation unavailable</strong>
      <p>
        CRAYON could not render this representation safely. This is a renderer/system limitation, not evidence that the domain action failed or succeeded.
      </p>
      {situationId && <small>Situation: {situationId}</small>}
      {issues.length > 0 && (
        <ul>
          {issues.map((item) => <li key={`${item.code}:${item.explanation}`}>{item.code}: {item.explanation}</li>)}
        </ul>
      )}
    </section>
  );
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
