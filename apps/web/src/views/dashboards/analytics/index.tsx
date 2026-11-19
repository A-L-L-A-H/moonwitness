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
  CardTitle,
  CutoutArtwork,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface PerformanceSummaryPayload {
  data?: {
    totalKpis?: number;
    healthyCount?: number;
    warningCount?: number;
    breachedCount?: number;
    healthScorePercent?: number;
  };
}

interface CabSummaryPayload {
  data?: {
    totalRequests?: number;
    pendingApproval?: number;
    approvedCount?: number;
    emergencyCount?: number;
  };
}

export function AnalyticsDashboardView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("performance.kpi");
  const [perf, setPerf] = useState<PerformanceSummaryPayload["data"] | null>(null);
  const [cab, setCab] = useState<CabSummaryPayload["data"] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      requestApiJson<PerformanceSummaryPayload>("/api/v1/performance/summary").catch(() => null),
      requestApiJson<CabSummaryPayload>("/api/v1/cab/summary").catch(() => null),
    ]).then(([perfRes, cabRes]) => {
      if (!active) return;
      if (perfRes?.data) setPerf(perfRes.data);
      if (cabRes?.data) setCab(cabRes.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const models = [
    { id: "performance.kpi", label: "Performance KPIs" },
    { id: "performance.sla", label: "SLA Contracts" },
    { id: "command.directive", label: "Command Directives" },
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
          <SkinOrnament slot="corner" className="left-2 top-2" />
          <CutoutArtwork
            id="oscilloscope-crt"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">ENTERPRISE TELEMETRY</Badge>
              <Badge variant="default">SLA HEALTH: {perf?.healthScorePercent ?? 100}%</Badge>
            </div>
            <CardTitle className="text-lg uppercase">{dictionary.dashboards.analyticsTitle}</CardTitle>
            <CardDescription>{dictionary.dashboards.analyticsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">TOTAL KPIS</div>
              <div className="mt-1 font-brush text-2xl">{perf?.totalKpis ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">HEALTHY / BREACHED</div>
              <div className="mt-1 font-brush text-2xl">
                {perf?.healthyCount ?? 0} / {perf?.breachedCount ?? 0}
              </div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">CAB REQUESTS</div>
              <div className="mt-1 font-brush text-2xl">{cab?.totalRequests ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">PENDING CAB</div>
              <div className="mt-1 font-brush text-2xl">{cab?.pendingApproval ?? 0}</div>
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
