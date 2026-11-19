"use client";

import { useEffect, useState } from "react";
import { requestApiJson } from "@moonwitness/contracts/sdk";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CutoutArtwork,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

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

export function AnalyticsDashboardView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("px.system");
  const [perf, setPerf] = useState<PerformanceSummaryPayload | null>(null);
  const [cab, setCab] = useState<CabSummaryPayload | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      requestApiJson<PerformanceSummaryPayload>("/api/v1/performance/summary").catch(() => null),
      requestApiJson<CabSummaryPayload>("/api/v1/cab/summary").catch(() => null),
    ]).then(([perfRes, cabRes]) => {
      if (!active) return;
      if (perfRes) setPerf(perfRes);
      if (cabRes) setCab(cabRes);
    });
    return () => {
      active = false;
    };
  }, []);

  const models = [
    { id: "px.system", label: "Runtime Snapshots" },
    { id: "ir.dashboard.widget", label: "Dashboard Widgets" },
    { id: "command.workflow", label: "Command Workflows" },
    { id: "command.alert", label: "Command Alerts" },
    { id: "audit.log", label: "Audit Trail" },
  ] as const;

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
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="start-2 top-2" />
          <CutoutArtwork
            id="oscilloscope-crt"
            decorative
            className="pointer-events-none absolute -top-2 hidden h-24 w-24 opacity-20 sm:block ltr:-right-4 rtl:-left-4"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">ENTERPRISE TELEMETRY</Badge>
              <Badge variant="default">UPTIME: {perf?.runtime?.uptimeSec ?? 0}s</Badge>
            </div>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.dashboards.analyticsTitle}
            </h1>
            <CardDescription>{dictionary.dashboards.analyticsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                HEAP / RSS (MB)
              </div>
              <div className="mt-1 font-brush text-2xl">
                {perf?.runtime?.heapUsedMb ?? 0} / {perf?.runtime?.rssMb ?? 0}
              </div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                ACTIVE WIDGETS
              </div>
              <div className="mt-1 font-brush text-2xl">{perf?.widgets?.length ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                CAB CHANGES
              </div>
              <div className="mt-1 font-brush text-2xl">{cab?.changes ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                APPROVED / SUBMITTED
              </div>
              <div className="mt-1 font-brush text-2xl">
                {cab?.metrics?.approved ?? 0} / {cab?.metrics?.submitted ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={activeModel === m.id ? "default" : "outline"}
              onClick={() => setActiveModel(m.id)}
            >
              {m.label} ({m.id})
            </Button>
          ))}
        </div>

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
