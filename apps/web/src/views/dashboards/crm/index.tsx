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

interface CrmSummaryPayload {
  data?: {
    totalLeads?: number;
    openLeads?: number;
    wonLeads?: number;
    totalExpectedRevenue?: number;
    weightedPipelineValue?: number;
  };
}

export function CrmDashboardView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<"crm.lead" | "res.partner" | "res.company">(
    "crm.lead",
  );
  const [summary, setSummary] = useState<CrmSummaryPayload["data"] | null>(null);

  useEffect(() => {
    let active = true;
    requestApiJson<CrmSummaryPayload>("/api/v1/crm/summary")
      .then((res) => {
        if (active && res?.data) setSummary(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
              <Badge variant="default">WON: {summary?.wonLeads ?? 0}</Badge>
            </div>
            <CardTitle className="text-lg uppercase">{dictionary.dashboards.crmTitle}</CardTitle>
            <CardDescription>{dictionary.dashboards.crmSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">TOTAL LEADS</div>
              <div className="mt-1 font-brush text-2xl">{summary?.totalLeads ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">OPEN PIPELINE</div>
              <div className="mt-1 font-brush text-2xl">{summary?.openLeads ?? 0}</div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">EXPECTED REVENUE</div>
              <div className="mt-1 font-brush text-2xl">
                {(summary?.totalExpectedRevenue ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="font-mono text-[10px] text-[var(--muted-foreground)]">WEIGHTED VALUE</div>
              <div className="mt-1 font-brush text-2xl">
                {(summary?.weightedPipelineValue ?? 0).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "crm.lead", label: "CRM Leads & Opportunities" },
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
