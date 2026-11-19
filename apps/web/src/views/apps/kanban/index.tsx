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

interface CabSummary {
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

export function KanbanCabView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<
    | "cab.change"
    | "cab.decision"
    | "project.project"
    | "project.task"
    | "helpdesk.ticket"
    | "command.workflow"
    | "command.alert"
  >("cab.change");
  const [summary, setSummary] = useState<CabSummary | null>(null);

  useEffect(() => {
    let active = true;
    requestApiJson<CabSummary>("/api/v1/cab/summary")
      .then((res) => {
        if (active && res) setSummary(res);
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
              <Badge variant="default">APPROVED: {summary?.metrics?.approved ?? 0}</Badge>
              <Badge variant="secondary">SUBMITTED: {summary?.metrics?.submitted ?? 0}</Badge>
              <Badge variant="outline">
                PROJECTS: {summary?.projects ?? 0} · TICKETS: {summary?.tickets ?? 0}
              </Badge>
            </div>
            <h1 className="font-semibold leading-none tracking-tight text-lg uppercase">
              {dictionary.apps.kanbanTitle}
            </h1>
            <CardDescription>{dictionary.apps.kanbanSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(
              [
                { id: "cab.change", label: "CAB Changes" },
                { id: "cab.decision", label: "CAB Decisions" },
                { id: "project.project", label: "Projects" },
                { id: "project.task", label: "Project Tasks" },
                { id: "helpdesk.ticket", label: "Helpdesk Tickets" },
                { id: "command.workflow", label: "Command Workflows" },
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
