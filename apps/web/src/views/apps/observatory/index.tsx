"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestApiJson } from "@moonwitness/contracts/sdk";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CutoutArtwork,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Input,
  Skeleton,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { MTimeInteractiveEngine } from "@/components/mtime-observatory";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface CelestialNowPayload {
  lunar?: {
    phaseName?: string;
    illumination?: number;
    elongationDeg?: number;
  };
}

interface PrayerTimesPayload {
  date?: string;
  fajr?: string;
  sunrise?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  qibla_bearing?: number;
}

interface HilalPayload {
  altitude_deg?: number;
  elongation_deg?: number;
  mabims_criterion?: { status?: string; passed?: boolean; description?: string };
  overall_verdict?: string;
}

interface ObservatorySummaryPayload {
  feeds?: number;
  operations?: number;
}

const OBSERVATORY_MODELS = [
  { id: "observatory.feed", label: "Observatory Feeds" },
  { id: "celestial.snapshot", label: "Celestial Snapshots" },
  { id: "sg.operation", label: "Scripture Operations" },
] as const;

export function ObservatoryAppView() {
  const { direction, dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("observatory.feed");
  const [lat, setLat] = useState("-6.2088");
  const [lon, setLon] = useState("106.8456");
  const [prayers, setPrayers] = useState<PrayerTimesPayload | null>(null);
  const [hilal, setHilal] = useState<HilalPayload | null>(null);
  const [obsSummary, setObsSummary] = useState<ObservatorySummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const requestSeq = useRef(0);

  const loadCelestialTelemetry = useCallback(
    async (latitude: string, longitude: string) => {
      const seq = ++requestSeq.current;
      setLoading(true);
      setError(null);
      setUnavailable(false);

      const q = `lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`;
      const [nowResult, prayerResult, obsResult] = await Promise.allSettled([
        requestApiJson<CelestialNowPayload>(`/api/v1/celestial/now?${q}`),
        requestApiJson<PrayerTimesPayload>(`/api/v1/celestial/prayer-times?${q}`),
        requestApiJson<ObservatorySummaryPayload>("/api/v1/observatory/summary"),
      ]);

      if (seq !== requestSeq.current) return;

      const nowRes = nowResult.status === "fulfilled" ? nowResult.value : null;
      const pRes = prayerResult.status === "fulfilled" ? prayerResult.value : null;
      const oRes = obsResult.status === "fulfilled" ? obsResult.value : null;

      const elong = Number.isFinite(nowRes?.lunar?.elongationDeg)
        ? Number(nowRes!.lunar!.elongationDeg).toFixed(2)
        : "6.80";

      const hRes = await requestApiJson<HilalPayload>(
        `/api/v1/celestial/hilal?altitude=3.50&elongation=${encodeURIComponent(elong)}&width=0.35`,
      ).catch(() => null);

      if (seq !== requestSeq.current) return;

      if (pRes) setPrayers(pRes);
      if (hRes) setHilal(hRes);
      if (oRes) setObsSummary(oRes);

      if (
        nowResult.status === "rejected" &&
        prayerResult.status === "rejected" &&
        obsResult.status === "rejected"
      ) {
        const reason = prayerResult.reason ?? nowResult.reason ?? obsResult.reason;
        setError(reason instanceof Error ? reason.message : dictionary.errors.networkOffline);
      } else if (!nowRes && !pRes && !oRes && !hRes) {
        setUnavailable(true);
      }

      setLoading(false);
    },
    [dictionary.errors.networkOffline],
  );

  useEffect(() => {
    void loadCelestialTelemetry(lat, lon);
  }, [lat, lon, loadCelestialTelemetry]);

  const prayerEntries = prayers
    ? (
        [
          ["Fajr", prayers.fajr],
          ["Sunrise", prayers.sunrise],
          ["Dhuhr", prayers.dhuhr],
          ["Asr", prayers.asr],
          ["Maghrib", prayers.maghrib],
          ["Isha", prayers.isha],
        ] as Array<[string, string | undefined]>
      ).filter((entry): entry is [string, string] => Boolean(entry[1]))
    : [];

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.observatory}
      plane="creator"
      activeOverride="observatory"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: dictionary.shell.searchPlaceholder,
      }}
    >
      <div dir={direction} className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="start-2 top-2" />
          <CutoutArtwork
            id="astrolabe-disc"
            decorative
            className="pointer-events-none absolute -top-2 hidden h-24 w-24 opacity-20 sm:block ltr:-right-4 rtl:-left-4"
          />
          <CardHeader className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{dictionary.operations.workspace.planeLabel}</Badge>
                <Badge variant="secondary">{dictionary.sanctuary.mtime.criteriaLabel}</Badge>
                <Badge variant="default" dir="ltr" className="font-mono">
                  HILAL:{" "}
                  {hilal?.overall_verdict ??
                    (hilal?.mabims_criterion?.passed ? "MABIMS PASS" : "BELOW THRESHOLD")}
                </Badge>
                <Badge variant="secondary" dir="ltr" className="font-mono">
                  FEEDS: {obsSummary?.feeds ?? 0} · OPS: {obsSummary?.operations ?? 0}
                </Badge>
              </div>
              <h1 className="text-lg font-semibold uppercase leading-none tracking-tight">
                {dictionary.apps.observatoryTitle}
              </h1>
              <CardDescription>{dictionary.apps.observatorySubtitle}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => void loadCelestialTelemetry(lat, lon)}
              >
                {loading
                  ? dictionary.common.loading
                  : dictionary.operations.workspace.telemetryRefresh}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border border-[var(--border)] bg-[var(--background)] p-3">
              <Input
                value={lat}
                dir="ltr"
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                aria-label="Observer Latitude"
                className="max-w-[140px] font-mono"
              />
              <Input
                value={lon}
                dir="ltr"
                onChange={(e) => setLon(e.target.value)}
                placeholder="Longitude"
                aria-label="Observer Longitude"
                className="max-w-[140px] font-mono"
              />
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={() => void loadCelestialTelemetry(lat, lon)}
              >
                {dictionary.common.refresh}
              </Button>
              {prayers?.qibla_bearing !== undefined ? (
                <Badge variant="outline">
                  {dictionary.sanctuary.mtime.azimuthLabel}:{" "}
                  <span dir="ltr" className="ms-1 font-mono">
                    {prayers.qibla_bearing}°
                  </span>
                </Badge>
              ) : null}
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{dictionary.errors.networkOffline}</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                  <span>{error}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void loadCelestialTelemetry(lat, lon)}
                  >
                    {dictionary.operations.workspace.telemetryRefresh}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            {loading && prayerEntries.length === 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6" aria-busy="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-2 border border-[var(--border)] bg-[var(--background)] p-2.5"
                  >
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : unavailable || (!loading && !error && prayerEntries.length === 0) ? (
              <Empty className="border border-dashed border-[var(--border)] py-6">
                <EmptyHeader>
                  <EmptyTitle>{dictionary.common.noRecords}</EmptyTitle>
                  <EmptyDescription>{dictionary.errors.networkOffline}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void loadCelestialTelemetry(lat, lon)}
                  >
                    {dictionary.operations.workspace.telemetryRefresh}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-6">
                {prayerEntries.map(([name, time]) => (
                  <div
                    key={name}
                    className="border border-[var(--border)] bg-[var(--background)] p-2.5"
                  >
                    <div className="text-[10px] uppercase text-[var(--muted-foreground)]">
                      {name}
                    </div>
                    <div dir="ltr" className="mt-1 font-mono font-bold">
                      {time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <MTimeInteractiveEngine compact />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase text-[var(--muted-foreground)]">
                  {dictionary.operations.workspace.activeModuleLabel}:
                </span>
                <Badge dir="ltr" variant="outline" className="font-mono">
                  {activeModel}
                </Badge>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={dictionary.shell.searchPlaceholder}
                  aria-label={dictionary.shell.searchPlaceholder}
                  className="h-9 min-w-[200px] sm:w-64"
                />
                {search ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSearch("")}>
                    {dictionary.common.reset}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase text-[var(--muted-foreground)]">
                {dictionary.common.filter}:
              </span>
              {OBSERVATORY_MODELS.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  size="sm"
                  variant={activeModel === m.id ? "default" : "outline"}
                  onClick={() => setActiveModel(m.id)}
                >
                  <span>{m.label}</span>
                  <span dir="ltr" className="ms-1.5 font-mono text-[11px] opacity-80">
                    ({m.id})
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <AutoModelConsole
          model={activeModel}
          searchQuery={search}
          domainIcon="mtime"
          cutoutId="lunar-disc"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default ObservatoryAppView;
