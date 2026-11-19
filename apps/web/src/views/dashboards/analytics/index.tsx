"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";
import { getLocaleFromPath, getLocalizedUrl } from "@/utils/i18n";

interface PerformanceSummaryPayload {
  runtime?: {
    rssMb?: number;
    heapUsedMb?: number;
    heapTotalMb?: number;
    uptimeSec?: number;
  };
  widgets?: Array<Record<string, unknown>>;
}

interface CabSummaryPayload {
  projects?: number;
  tasks?: number;
  changes?: number;
  tickets?: number;
  metrics?: {
    submitted?: number;
    approved?: number;
    implemented?: number;
  };
}

const ANALYTICS_MODELS = [
  { id: "px.system", label: "Runtime Snapshots" },
  { id: "ir.dashboard.widget", label: "Dashboard Widgets" },
  { id: "command.workflow", label: "Command Workflows" },
  { id: "command.alert", label: "Command Alerts" },
  { id: "audit.log", label: "Audit Trail" },
] as const;

export function AnalyticsDashboardView() {
  const pathname = usePathname() ?? "";
  const urlLocale = getLocaleFromPath(pathname);
  const { direction, dictionary } = useTranslation();

  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("px.system");
  const [perf, setPerf] = useState<PerformanceSummaryPayload | null>(null);
  const [cab, setCab] = useState<CabSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const requestSeq = useRef(0);

  const loadTelemetry = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    setUnavailable(false);

    const [perfResult, cabResult] = await Promise.allSettled([
      requestApiJson<PerformanceSummaryPayload>("/api/v1/performance/summary"),
      requestApiJson<CabSummaryPayload>("/api/v1/cab/summary"),
    ]);

    if (seq !== requestSeq.current) return;

    const nextPerf = perfResult.status === "fulfilled" ? perfResult.value : null;
    const nextCab = cabResult.status === "fulfilled" ? cabResult.value : null;

    if (nextPerf) setPerf(nextPerf);
    if (nextCab) setCab(nextCab);

    if (perfResult.status === "rejected" && cabResult.status === "rejected") {
      const reason = perfResult.reason ?? cabResult.reason;
      setError(reason instanceof Error ? reason.message : dictionary.errors.networkOffline);
    } else if (!nextPerf && !nextCab) {
      setUnavailable(true);
    }

    setLoading(false);
  }, [dictionary.errors.networkOffline]);

  useEffect(() => {
    void loadTelemetry();
  }, [loadTelemetry]);

  const workbenchHref = urlLocale
    ? getLocalizedUrl(`/apps/addons?model=${encodeURIComponent(activeModel)}`, urlLocale)
    : `/addons?model=${encodeURIComponent(activeModel)}`;

  const modelCountLabel = dictionary.operations.workspace.liveModelsCount.replace(
    "{count}",
    String(ANALYTICS_MODELS.length),
  );

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.analytics}
      plane="creator"
      activeOverride="analytics"
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
            id="oscilloscope-crt"
            decorative
            className="pointer-events-none absolute -top-2 hidden h-24 w-24 opacity-20 sm:block ltr:-right-4 rtl:-left-4"
          />
          <CardHeader className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{dictionary.operations.workspace.planeLabel}</Badge>
                <Badge variant="secondary">{dictionary.operations.workspace.healthStatus}</Badge>
                <Badge variant="default" dir="ltr" className="font-mono">
                  UPTIME: {perf?.runtime?.uptimeSec ?? 0}s
                </Badge>
              </div>
              <h1 className="text-lg font-semibold uppercase leading-none tracking-tight">
                {dictionary.dashboards.analyticsTitle}
              </h1>
              <CardDescription>{dictionary.dashboards.analyticsSubtitle}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => void loadTelemetry()}
              >
                {loading
                  ? dictionary.common.loading
                  : dictionary.operations.workspace.telemetryRefresh}
              </Button>
              <Button asChild size="sm" variant="default">
                <Link href={workbenchHref}>{dictionary.addons.workbenchCta} ↗</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{dictionary.errors.networkOffline}</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                  <span>{error}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void loadTelemetry()}
                  >
                    {dictionary.operations.workspace.telemetryRefresh}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            {loading && !perf && !cab ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-2 border border-[var(--border)] bg-[var(--background)] p-3"
                  >
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                ))}
              </div>
            ) : unavailable ? (
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
                    onClick={() => void loadTelemetry()}
                  >
                    {dictionary.common.refresh}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                    HEAP / RSS (MB)
                  </div>
                  <div dir="ltr" className="mt-1 font-mono text-xl font-bold">
                    {perf?.runtime?.heapUsedMb ?? 0} / {perf?.runtime?.rssMb ?? 0}
                  </div>
                </div>
                <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                    ACTIVE WIDGETS
                  </div>
                  <div dir="ltr" className="mt-1 font-mono text-xl font-bold">
                    {perf?.widgets?.length ?? 0}
                  </div>
                </div>
                <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                    CAB CHANGES
                  </div>
                  <div dir="ltr" className="mt-1 font-mono text-xl font-bold">
                    {cab?.changes ?? 0}
                  </div>
                </div>
                <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                    APPROVED / SUBMITTED
                  </div>
                  <div dir="ltr" className="mt-1 font-mono text-xl font-bold">
                    {cab?.metrics?.approved ?? 0} / {cab?.metrics?.submitted ?? 0}
                  </div>
                </div>
              </div>
            )}
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
                <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                  {modelCountLabel}
                </span>
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
              {ANALYTICS_MODELS.map((m) => (
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
          domainIcon="cab"
          cutoutId="oscilloscope-crt"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default AnalyticsDashboardView;
