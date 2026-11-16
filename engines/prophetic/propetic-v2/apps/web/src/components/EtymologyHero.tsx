import { useI18n } from "../i18n";

export function EtymologyHero({ nameRoot, rid }: { nameRoot: Record<string, unknown>; rid: Record<string, unknown> }) {
  const { t } = useI18n();
  const root = typeof nameRoot.root === "string" ? nameRoot.root : "—";
  const script = typeof nameRoot.script === "string" ? nameRoot.script : "";
  const meaning = typeof rid.meaning === "string" ? rid.meaning : t("muhammad.ridMeaning");
  const confidence = typeof nameRoot.confidence === "string" ? nameRoot.confidence : "";
  const status = typeof nameRoot.status === "string" ? nameRoot.status : "";

  return (
    <div className="etymology-hero">
      <div className="eyebrow">{t("muhammad.nameRootHero")}</div>
      <div className="mt-3 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="etymology-script">
          <span className="etymology-root">{root}</span>
          {script ? <span className="etymology-script-sub">{script}</span> : null}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-semibold tracking-tight">{meaning}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {confidence ? <span className="rounded-full border px-2 py-0.5">{confidence}</span> : null}
            {status ? <span className="rounded-full border px-2 py-0.5">{status}</span> : null}
            {typeof rid.language === "string" && rid.language ? <span className="rounded-full border px-2 py-0.5">{rid.language}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
