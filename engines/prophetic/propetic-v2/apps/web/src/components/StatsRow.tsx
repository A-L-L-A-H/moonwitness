import { useI18n } from "../i18n";
import { Badge } from "./ui/badge";

export function StatsRow({ contextScore, evidenceLevel, layerCount, auditResult, curatedRoots }: { contextScore: number | null; evidenceLevel: string | null; layerCount: number; auditResult: string | null; curatedRoots: string[] }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="stats-card">
        <div className="eyebrow">{t("muhammad.contextScore")}</div>
        <div className="metric">{contextScore ?? "—"}</div>
      </div>
      <div className="stats-card">
        <div className="eyebrow">{t("muhammad.evidenceLevel")}</div>
        <div className="metric">{evidenceLevel ?? "—"}</div>
      </div>
      <div className="stats-card">
        <div className="eyebrow">{t("muhammad.identityLayers")}</div>
        <div className="metric">{layerCount}</div>
      </div>
      <div className="stats-card">
        <div className="eyebrow">{t("muhammad.profileAudit")}</div>
        <div className="mt-1">
          {auditResult ? <Badge className="border-emerald-500/40 text-emerald-300">{auditResult}</Badge> : "—"}
        </div>
        {curatedRoots.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {curatedRoots.map((root) => (
              <span key={root} className="rounded-full border px-2 py-0.5 text-[10px]">{root}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
