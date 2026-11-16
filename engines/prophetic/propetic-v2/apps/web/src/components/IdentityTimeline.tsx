import { useI18n } from "../i18n";

export function IdentityTimeline({ layers }: { layers: Array<[string, Record<string, unknown>]> }) {
  const { t } = useI18n();
  return (
    <div className="identity-timeline">
      <div className="flex flex-wrap gap-3">
        {layers.map(([level, raw]) => {
          const item = typeof raw === "object" && raw !== null ? raw : {};
          const value = typeof item.value === "string" ? item.value : "—";
          const evidence = typeof item.evidence === "string" ? item.evidence : "";
          const note = typeof item.note === "string" ? item.note : "";
          const refs = Array.isArray(item.quran_refs) ? item.quran_refs.map(String) : [];
          return (
            <div key={level} className="timeline-node">
              <div className="timeline-node-header">
                <span className="timeline-node-level">{level}</span>
                {evidence ? <span className="timeline-node-evidence">{evidence}</span> : null}
              </div>
              <div className="timeline-node-value">{value}</div>
              {note ? <div className="timeline-node-note">{note}</div> : null}
              {refs.length > 0 ? <div className="timeline-node-refs">{refs.map((ref) => `QS ${ref}`).join(" · ")}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
