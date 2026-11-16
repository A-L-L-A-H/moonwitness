import { useI18n } from "../i18n";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { SealBadge } from "./SealBadge";
import { StatsRow } from "./StatsRow";
import { EtymologyHero } from "./EtymologyHero";
import { IdentityTimeline } from "./IdentityTimeline";
import { KeyEventsSection } from "./KeyEventsSection";

export function MuhammadProfileView({ profile }: { profile: Record<string, unknown> }) {
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
  const keyEvents = Array.isArray(profile.key_events) ? profile.key_events : [];
  const lifespan = typeof profile.lifespan_years === "number" ? profile.lifespan_years : null;
  const revelationPhase = typeof profile.revelation_phase === "string" ? profile.revelation_phase : "";
  const audit = typeof profile.profile_audit === "object" && profile.profile_audit !== null && !Array.isArray(profile.profile_audit)
    ? (profile.profile_audit as Record<string, unknown>)
    : {};
  const curatedRoots = Array.isArray(audit.curated_asma_roots) ? audit.curated_asma_roots.map(String) : [];

  const contextScore = typeof context.context_score === "number" ? context.context_score : null;

  return (
    <div className="space-y-4">
      <Card className="profile-special">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="eyebrow">{t("muhammad.selected")}</div>
              <CardTitle className="text-3xl">
                {String(profile.display_name ?? "—")} <span className="font-normal text-muted-foreground">· {String(profile.quranic_name ?? "—")}</span>
              </CardTitle>
              <CardDescription className="mt-2">{String(profile.signature ?? "")}</CardDescription>
            </div>
            <SealBadge />
          </div>
        </CardHeader>
      </Card>

      <StatsRow
        contextScore={contextScore}
        evidenceLevel={typeof status.evidence === "string" ? status.evidence : null}
        layerCount={identityLayers.length}
        auditResult={typeof audit.result === "string" ? audit.result : null}
        curatedRoots={curatedRoots}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("muhammad.nameRoot")}</CardTitle>
          <CardDescription>{t("muhammad.ridPositive")}</CardDescription>
        </CardHeader>
        <CardContent>
          <EtymologyHero nameRoot={nameRoot} rid={rid} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("muhammad.identityStack")}</CardTitle>
          <CardDescription>{t("muhammad.identityStackDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <IdentityTimeline layers={identityLayers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("muhammad.missionLifecycle")}</CardTitle></CardHeader>
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

      <Card>
        <CardHeader>
          <CardTitle>{t("muhammad.contextGraph")}</CardTitle>
          <CardDescription>{t("muhammad.contextDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {["religion", "people_region", "language"].map((key) => {
            const value = typeof context[key] === "object" && context[key] !== null ? (context[key] as Record<string, unknown>) : {};
            return (
              <div key={key} className="rounded-lg border p-4">
                <div className="eyebrow">{t(`profile.${key === "people_region" ? "peopleRegion" : key}`)}</div>
                <div className="mt-2 text-sm leading-6">{String(value.summary ?? value.people ?? "—")}</div>
                {typeof value.historical_region === "string" && value.historical_region ? <div className="mt-2 text-xs text-muted-foreground">{value.historical_region}</div> : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {worldTraits.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>{t("muhammad.worldTraits")}</CardTitle></CardHeader>
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
