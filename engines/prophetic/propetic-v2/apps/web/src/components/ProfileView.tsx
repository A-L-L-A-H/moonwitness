import { useI18n } from "../i18n";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { IdentityTimeline } from "./IdentityTimeline";
import { KeyEventsSection } from "./KeyEventsSection";

const EVIDENCE_ACCENT: Record<string, string> = {
  Q5: "border-emerald-500/30 bg-emerald-500/5",
  Q4: "border-emerald-500/20 bg-emerald-500/5",
  Q3: "border-sky-500/30 bg-sky-500/5",
  Q2: "border-indigo-500/20 bg-indigo-500/5",
  Q1: "border-slate-500/20 bg-slate-500/5",
  S3: "border-orange-500/20 bg-orange-500/5",
  S2: "border-orange-500/20 bg-orange-500/5",
  S1: "border-orange-500/20 bg-orange-500/5",
  T1: "border-amber-500/30 bg-amber-500/5",
  E0: "border-red-500/20 bg-red-500/5",
};

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  established: { className: "border-emerald-500/40 text-emerald-300", label: "established" },
  established_compound: { className: "border-emerald-500/40 text-emerald-300", label: "established" },
  established_semantic_family: { className: "border-emerald-500/40 text-emerald-300", label: "established" },
  unknown: { className: "border-muted-foreground/40 text-muted-foreground", label: "unknown" },
  disputed: { className: "border-amber-500/40 text-amber-300", label: "disputed" },
  probable: { className: "border-sky-500/40 text-sky-300", label: "probable" },
  lexical_name: { className: "border-purple-500/40 text-purple-300", label: "lexical" },
  lexical_title: { className: "border-purple-500/40 text-purple-300", label: "lexical" },
  semantic_family: { className: "border-teal-500/40 text-teal-300", label: "semantic family" },
  traditional_etymology: { className: "border-sky-500/40 text-sky-300", label: "traditional" },
  traditional_cross_language_mapping: { className: "border-sky-500/40 text-sky-300", label: "cross-language" },
};

const CLASSIFICATION_STYLES: Record<string, { accent: string; icon: string }> = {
  RASUL_EXPLICIT: { accent: "border-sky-500/30 bg-sky-500/5", icon: "✦" },
  NABI_EXPLICIT: { accent: "border-indigo-500/30 bg-indigo-500/5", icon: "✦" },
  RASUL_AND_NABI_EXPLICIT: { accent: "border-violet-500/30 bg-violet-500/5", icon: "✦" },
  NABI_AND_RASUL_EXPLICIT: { accent: "border-violet-500/30 bg-violet-500/5", icon: "✦" },
  "RASUL_EXPLICIT + SEAL_OF_PROPHETS": { accent: "border-amber-500/40 bg-amber-500/10", icon: "✧" },
  "RASUL_EXPLICIT + REVELATION_LINE": { accent: "border-sky-500/30 bg-sky-500/5", icon: "✦" },
  COLLECTIVE_PROPHETHOOD: { accent: "border-teal-500/30 bg-teal-500/5", icon: "◈" },
  "COLLECTIVE_PROPHETHOOD + RASUL_CONTEXT": { accent: "border-teal-500/30 bg-teal-500/5", icon: "◈" },
  "COLLECTIVE_PROPHETHOOD + ZABUR_RECIPIENT": { accent: "border-teal-500/30 bg-teal-500/5", icon: "◈" },
  "COLLECTIVE_PROPHETHOOD + REVELATION_LINE": { accent: "border-teal-500/30 bg-teal-500/5", icon: "◈" },
  PROPHETHOOD_DEBATED: { accent: "border-amber-500/30 bg-amber-500/5", icon: "?" },
  TRADITIONAL_PROPHET_STATUS_NOT_DIRECTLY_LABELED_NABI_RASUL_IN_QURAN: { accent: "border-slate-500/30 bg-slate-500/5", icon: "○" },
};

export function ProfileView({ prophet: profile }: { prophet: Record<string, unknown> }) {
  const { t } = useI18n();
  const identityLayers = typeof profile.identity_layers === "object" && profile.identity_layers !== null && !Array.isArray(profile.identity_layers)
    ? Object.entries(profile.identity_layers as Record<string, Record<string, unknown>>)
    : [];
  const missions = typeof profile.mission === "object" && profile.mission !== null && !Array.isArray(profile.mission)
    ? Object.entries(profile.mission as Record<string, Record<string, unknown>>)
    : [];
  const context = typeof profile.context === "object" && profile.context !== null && !Array.isArray(profile.context)
    ? (profile.context as Record<string, unknown>)
    : {};
  const status = typeof profile.quranic_status === "object" && profile.quranic_status !== null && !Array.isArray(profile.quranic_status)
    ? (profile.quranic_status as Record<string, unknown>)
    : {};
  const nameRoot = typeof profile.name_root === "object" && profile.name_root !== null && !Array.isArray(profile.name_root)
    ? (profile.name_root as Record<string, unknown>)
    : {};
  const rid = typeof profile.rid === "object" && profile.rid !== null && !Array.isArray(profile.rid)
    ? (profile.rid as Record<string, unknown>)
    : {};
  const worldTraits = Array.isArray(profile.world_traits) ? profile.world_traits : [];
  const witnesses = Array.isArray(profile.supplemental_witnesses) ? profile.supplemental_witnesses : [];
  const keyEvents = Array.isArray(profile.key_events) ? profile.key_events : [];
  const lifespan = typeof profile.lifespan_years === "number" ? profile.lifespan_years : null;
  const revelationPhase = typeof profile.revelation_phase === "string" ? profile.revelation_phase : "";

  const evidence = typeof status.evidence === "string" ? status.evidence : "";
  const classification = typeof status.classification === "string" ? status.classification : "";
  const accentClass = EVIDENCE_ACCENT[evidence] || "border-border";
  const classStyle = CLASSIFICATION_STYLES[classification] || { accent: "border-border", icon: "·" };

  return (
    <div className="space-y-4">
      <Card className={`${accentClass} ${classStyle.accent}`}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="eyebrow">{t("profile.selected")}</div>
              <CardTitle className="mt-1 text-3xl">
                {String(profile.display_name ?? "—")} <span className="font-normal text-muted-foreground">· {String(profile.quranic_name ?? "—")}</span>
              </CardTitle>
              <CardDescription className="mt-2">{String(profile.signature ?? "")}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <Badge className={`${classStyle.accent}`}>{classification || "—"}</Badge>
              </div>
              <Badge>{evidence || "—"}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={accentClass}>
          <CardHeader><div className="eyebrow">{t("profile.nameRoot")}</div><CardTitle className="break-words text-xl">{String(nameRoot.root ?? "—")}</CardTitle><CardDescription>{String(nameRoot.name_root_source_language ?? "")} · {String(nameRoot.confidence ?? "")}</CardDescription></CardHeader>
        </Card>
        <Card className={accentClass}>
          <CardHeader><div className="eyebrow">{t("profile.ridPositive")}</div><CardTitle className="break-words text-xl">{String(rid.root ?? "—")}</CardTitle><CardDescription>{String(rid.meaning ?? "")} · {String(rid.language ?? "")}</CardDescription></CardHeader>
        </Card>
        <Card className={accentClass}>
          <CardHeader><div className="eyebrow">{t("profile.quranicStatus")}</div><CardTitle className="break-words text-xl">{String(status.classification ?? "—")}</CardTitle><CardDescription>{Array.isArray(status.refs) ? (status.refs as string[]).map((ref: string) => `QS ${ref}`).join(" · ") : "—"}</CardDescription></CardHeader>
        </Card>
        <Card className={accentClass}>
          <CardHeader><div className="eyebrow">{t("profile.identityLayers")}</div><CardTitle className="text-xl">{identityLayers.length}</CardTitle><CardDescription>{missions.length} mission slots · {worldTraits.length} traits · {witnesses.length} witnesses</CardDescription></CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.identityStack")}</CardTitle>
          <CardDescription>{t("profile.identityStackDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <IdentityTimeline layers={identityLayers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("profile.missionLifecycle")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {missions.map(([slot, raw]) => {
              const item = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};
              return (
                <div key={slot} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="eyebrow">{slot}</div>
                    <Badge>{String(item.evidence ?? "—")}</Badge>
                  </div>
                  <div className="mt-2 text-sm font-medium">{String(item.summary ?? "—")}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{Array.isArray(item.refs) ? (item.refs as string[]).join(" · ") : "—"}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {worldTraits.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>{t("profile.worldTraits")}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {worldTraits.map((trait: Record<string, unknown>) => (
              <div key={String(trait.trait)} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{String(trait.trait ?? "—")}</div>
                  <Badge>{String(trait.evidence ?? "—")}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{String(trait.note ?? "")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {witnesses.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>{t("profile.supplementalWitnesses")}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {witnesses.map((w: Record<string, unknown>) => (
              <div key={String(w.source_book)} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Badge>{String(w.source_book)}</Badge>
                  <Badge>{String(w.evidence)}</Badge>
                </div>
                <div className="mt-2 text-sm font-medium">{String(w.claim)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{String(w.ref)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.contextGraph")}</CardTitle>
          <CardDescription>{t("profile.contextDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="eyebrow">{t("profile.religion")}</div>
            <div className="mt-2 text-sm leading-6">{String((context.religion as Record<string, unknown>)?.summary ?? "—")}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="eyebrow">{t("profile.peopleRegion")}</div>
            <div className="mt-2 text-sm leading-6">{String((context.people_region as Record<string, unknown>)?.people ?? "—")}</div>
            <div className="mt-2 text-xs text-muted-foreground">{String((context.people_region as Record<string, unknown>)?.historical_region ?? "")}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="eyebrow">{t("profile.language")}</div>
            <div className="mt-2 text-sm leading-6">{String((context.language as Record<string, unknown>)?.summary ?? "—")}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><div className="eyebrow">{t("profile.lifespan")}</div><CardTitle className="text-xl">{lifespan ?? "—"}</CardTitle><CardDescription>{lifespan !== null ? "years" : ""}</CardDescription></CardHeader>
        </Card>
        <Card>
          <CardHeader><div className="eyebrow">{t("profile.revelationPhase")}</div><CardTitle className="text-xl">{revelationPhase || "—"}</CardTitle></CardHeader>
        </Card>
      </div>

      <KeyEventsSection events={keyEvents} />
    </div>
  );
}
