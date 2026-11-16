import React from "react";
import { deriveSemanticTraversal, projectRIRDetail } from "allah-crayon-rir";
import type {
  RIRAnchor,
  RIRDocument,
  RIRMark,
  RIRPath,
  RIRPortal,
  RIRRegion,
  SemanticDetailLevel,
} from "allah-crayon-rir";

export type CommitmentInteraction = "direct" | "preview" | "deliberate";

export interface RIRViewProps {
  document: RIRDocument;
  detail?: SemanticDetailLevel;
}

export function deriveCommitmentInteraction(path: RIRPath): CommitmentInteraction {
  if (path.resistance.mode === "direct") return "direct";
  if (
    path.resistance.mode === "visible-consequence" ||
    path.resistance.mode === "explicit-preview"
  ) {
    return "preview";
  }
  return "deliberate";
}

export function RIRView({ document, detail = "standard" }: RIRViewProps) {
  const projected = projectRIRDetail(document, detail);
  const traversal = new Map(
    deriveSemanticTraversal(projected).map((entry, index) => [
      entry.nodeId,
      { ...entry, order: index + 1 },
    ]),
  );
  const anchors = select<RIRAnchor>(projected, "anchor");
  const paths = select<RIRPath>(projected, "path").sort(
    (left, right) => (traversal.get(left.id)?.order ?? Number.MAX_SAFE_INTEGER)
      - (traversal.get(right.id)?.order ?? Number.MAX_SAFE_INTEGER),
  );
  const marks = select<RIRMark>(projected, "mark");
  const regions = select<RIRRegion>(projected, "region");
  const portals = select<RIRPortal>(projected, "portal");
  const anchor = anchors[0];
  const temporal = marks
    .filter((mark) => mark.temporal)
    .sort((left, right) =>
      (left.temporal?.at ?? "").localeCompare(right.temporal?.at ?? ""),
    );

  return (
    <div
      className="crayon-representation"
      data-rir-version={projected.version}
      data-semantic-detail={detail}
      data-semantic-ref={projected.situationId}
    >
      <header
        className="crayon-representation__orientation"
        aria-label="Current orientation"
        data-semantic-ref={anchor?.semanticRef ?? anchor?.subjectId}
      >
        <span className="crayon-kicker">CURRENT ANCHOR</span>
        <strong>{anchor?.label ?? projected.situationId}</strong>
        <small>{anchor?.entityType ?? "situation"}</small>
      </header>

      <div className="crayon-representation__field">
        <section className="crayon-present" aria-label="Present state">
          <span className="crayon-state-dot" aria-hidden="true" />
          <div>
            <span className="crayon-kicker">PRESENT</span>
            <h2>{anchor?.label ?? "Current state"}</h2>
          </div>
          <div className="crayon-knowledge-stream">
            {marks
              .filter((mark) => mark.role === "knowledge")
              .slice(0, detail === "compact" ? 3 : 5)
              .map((mark) => (
                <div
                  className="crayon-knowledge"
                  key={mark.id}
                  data-semantic-ref={mark.semanticRef ?? mark.label}
                  data-epistemic={mark.epistemic}
                  data-redacted={isRedactionMarker(mark.value) ? "true" : undefined}
                  aria-label={`${shortLabel(mark.label)}: ${formatValue(mark.value)}; epistemic state ${mark.epistemic ?? "unspecified"}`}
                >
                  <span>{shortLabel(mark.label)}</span>
                  <strong>{formatValue(mark.value)}</strong>
                  {mark.epistemic && <small>{mark.epistemic}</small>}
                  {isRedactionMarker(mark.value) && <small>withheld by representation policy · not unknown</small>}
                </div>
              ))}
          </div>
        </section>

        <div
          className="crayon-trajectory-stack"
          aria-label="Available semantic trajectories"
        >
          {paths.map((path) => {
            const future = marks.find((mark) => mark.id === path.to);
            const effectMarks = path.consequenceMarks
              .map((id) => marks.find((mark) => mark.id === id))
              .filter(Boolean) as RIRMark[];
            const region = regions.find(
              (item) => item.semanticRef === path.possibilityId,
            );
            const interaction = deriveCommitmentInteraction(path);
            const traversalEntry = traversal.get(path.id);

            return (
              <article
                className={`crayon-trajectory crayon-trajectory--${path.availability}`}
                key={path.id}
                role="group"
                tabIndex={0}
                aria-disabled={path.availability === "unavailable" ? true : undefined}
                data-semantic-ref={path.semanticRef ?? path.possibilityId}
                data-availability={path.availability}
                data-resistance={path.resistance.mode}
                data-commitment-interaction={interaction}
                data-traversal-priority={traversalEntry?.priority}
                data-traversal-order={traversalEntry?.order}
                aria-label={`${path.intent}; ${path.availability}; commitment ${interaction}; resistance ${path.resistance.score.toFixed(2)}`}
              >
                <div className="crayon-vector">
                  <span className="crayon-vector__line" aria-hidden="true" />
                  <div className="crayon-vector__intent">
                    <span className="crayon-kicker">POSSIBILITY</span>
                    <strong>{path.intent}</strong>
                    <small>
                      {path.resistance.mode} · {interaction}
                    </small>
                  </div>
                  <div
                    className="crayon-vector__resistance"
                    aria-label={`Commitment resistance ${path.resistance.score.toFixed(2)}, ${path.resistance.mode}`}
                  >
                    <span
                      style={
                        {
                          "--resistance": path.resistance.score,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <span className="crayon-vector__arrow" aria-hidden="true">
                    ↓
                  </span>
                </div>

                <div className="crayon-consequence-field">
                  <span className="crayon-kicker">
                    {region?.label ?? "CONSEQUENCES"}
                  </span>
                  <div className="crayon-effect-grid">
                    {effectMarks.map((effect) => (
                      <div
                        className="crayon-effect"
                        key={effect.id}
                        data-semantic-ref={effect.semanticRef ?? effect.label}
                        data-redacted={isRedactionMarker(effect.value) ? "true" : undefined}
                      >
                        <span>{shortLabel(effect.label)}</span>
                        <strong>{formatValue(effect.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="crayon-future"
                  data-semantic-ref={future?.semanticRef ?? future?.label}
                >
                  <span
                    className="crayon-state-dot crayon-state-dot--future"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="crayon-kicker">POSSIBLE FUTURE</span>
                    <h3>{future?.label ?? "Future state"}</h3>
                    {future?.value !== undefined && (
                      <p>{formatFuture(future.value)}</p>
                    )}
                  </div>
                  <span
                    className={`crayon-availability crayon-availability--${path.availability}`}
                  >
                    {path.availability}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {temporal.length > 0 && (
        <section
          className="crayon-history"
          aria-label="Prediction, observation, reconciliation, and witness history"
        >
          <div className="crayon-history__heading">
            <span className="crayon-kicker">WITNESS TRACE</span>
            <strong>What was predicted, observed, and later established</strong>
          </div>
          <ol className="crayon-history__events">
            {temporal.map((mark) => (
              <li
                key={mark.id}
                className="crayon-history__event"
                data-semantic-ref={mark.semanticRef ?? mark.label}
                data-phase={mark.temporal?.phase}
                data-epistemic={mark.epistemic}
                data-witness-status={mark.temporal?.status}
                data-redacted={isRedactionMarker(mark.value) ? "true" : undefined}
              >
                <div>
                  <span className="crayon-history__phase">
                    {mark.role === "retry"
                      ? "retry / reconciliation"
                      : mark.temporal?.phase}
                  </span>
                  <time dateTime={mark.temporal?.at}>{mark.temporal?.at}</time>
                </div>
                <strong>{mark.label}</strong>
                <span>{formatValue(mark.value)}</span>
                {mark.epistemic && <small>certainty: {mark.epistemic}</small>}
                {isRedactionMarker(mark.value) && <small>withheld by representation policy · historical event retained</small>}
                {mark.temporal?.status && (
                  <small>witness: {mark.temporal.status}</small>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {portals.length > 0 && (
        <footer className="crayon-context-portals">
          <span className="crayon-kicker">RELATED CONTEXT</span>
          {portals.map((portal) => (
            <span
              className="crayon-portal"
              key={portal.id}
              data-semantic-ref={portal.semanticRef ?? portal.targetSubjectId}
            >
              {portal.relation ? `${portal.relation} → ` : ""}
              {portal.label}
            </span>
          ))}
        </footer>
      )}
    </div>
  );
}

function select<T>(document: RIRDocument, kind: string): T[] {
  return document.nodes.filter((node) => node.kind === kind) as T[];
}

function shortLabel(value: string): string {
  const parts = value.split(".");
  return parts.slice(-2).join(" · ");
}

function isRedactionMarker(value: unknown): value is { redacted: true; meaning: "withheld-not-unknown"; reason: string; classification?: string } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { redacted?: unknown; meaning?: unknown; reason?: unknown };
  return candidate.redacted === true
    && candidate.meaning === "withheld-not-unknown"
    && typeof candidate.reason === "string";
}

function formatValue(value: unknown): string {
  if (isRedactionMarker(value)) {
    const suffix = value.classification ? ` (${value.classification})` : "";
    return `withheld${suffix}`;
  }
  if (typeof value === "number") return new Intl.NumberFormat("en-US").format(value);
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "delta" in value) {
    const delta = (value as { delta: number }).delta;
    return delta >= 0
      ? `+${new Intl.NumberFormat("en-US").format(delta)}`
      : new Intl.NumberFormat("en-US").format(delta);
  }
  return value === undefined ? "unknown" : JSON.stringify(value);
}

function formatFuture(value: unknown): string {
  return Array.isArray(value) ? value.map(formatValue).join(" · ") : formatValue(value);
}
