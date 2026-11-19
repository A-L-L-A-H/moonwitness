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

interface CrmSummaryPayload {
  stages?: number;
  leads?: number;
  plannedActivities?: number;
  byStage?: Array<{
    stage_key?: string;
    count?: number;
    revenue?: number;
  }>;
}

export function CrmDashboardView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<
    "crm.lead" | "crm.stage" | "mail.activity" | "res.partner" | "res.company"
  >("crm.lead");
  const [summary, setSummary] = useState<CrmSummaryPayload | null>(null);

  useEffect(() => {
    let active = true;
    requestApiJson<CrmSummaryPayload>("/api/v1/crm/summary")
      .then((res) => {
        if (active && res) setSummary(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const byStage = Array.isArray(summary?.byStage) ? summary.byStage : [];
  const wonLeads = Number(
    byStage.find((row) => row.stage_key === "won")?.count ?? 0,
  );
  const totalExpectedRevenue = byStage.reduce(
    (sum, row) => sum + Number(row.revenue ?? 0),
    0,
  );

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.crm}
      plane="creator"
      activeOverride="crm"
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
            id="city-block"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">COMMERCIAL PIPELINE</Badge>
              <Badge variant="default">WON: {wonLeads}</Badge>
            </div>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.dashboards.crmTitle}
            </h1>
            <CardDescription>{dictionary.dashboards.crmSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">TOTAL LEADS</div>
              <div className="mt-1 font-brush text-2xl">{summary?.leads ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                PIPELINE STAGES
              </div>
              <div className="mt-1 font-brush text-2xl">{summary?.stages ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                PLANNED ACTIVITIES
              </div>
              <div className="mt-1 font-brush text-2xl">{summary?.plannedActivities ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">
                EXPECTED REVENUE
              </div>
              <div className="mt-1 font-brush text-2xl">
                {totalExpectedRevenue.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "crm.lead", label: "CRM Leads & Opportunities" },
              { id: "crm.stage", label: "Pipeline Stages" },
              { id: "mail.activity", label: "Planned Activities" },
              { id: "res.partner", label: "Partner Directory" },
              { id: "res.company", label: "Tenant Companies" },
            ] as const
          ).map((m) => (
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
          domainIcon="crm"
          cutoutId="city-block"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default CrmDashboardView;
