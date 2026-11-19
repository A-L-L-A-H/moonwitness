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

interface CabSummary {
  data?: {
    totalRequests?: number;
    pendingApproval?: number;
    approvedCount?: number;
    emergencyCount?: number;
  };
}

export function KanbanCabView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<
    "cab.request" | "command.directive" | "command.alert"
  >("cab.request");
  const [summary, setSummary] = useState<CabSummary["data"] | null>(null);

  useEffect(() => {
    let active = true;
    requestApiJson<CabSummary>("/api/v1/cab/summary")
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
      breadcrumb={dictionary.navigation.kanban}
      plane="creator"
      activeOverride="kanban"
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
            id="radar-sweep"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">CHANGE ADVISORY BOARD</Badge>
              <Badge variant="default">APPROVED: {summary?.approvedCount ?? 0}</Badge>
              <Badge variant="secondary">PENDING: {summary?.pendingApproval ?? 0}</Badge>
            </div>
            <CardTitle className="text-lg uppercase">{dictionary.apps.kanbanTitle}</CardTitle>
            <CardDescription>{dictionary.apps.kanbanSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(
              [
                { id: "cab.request", label: "CAB Change Requests" },
                { id: "command.directive", label: "Command Directives" },
                { id: "command.alert", label: "Command Alerts" },
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
          </CardContent>
        </Card>

        <AutoModelConsole
          model={activeModel}
          searchQuery={search}
          domainIcon="cab"
          cutoutId="radar-sweep"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default KanbanCabView;
