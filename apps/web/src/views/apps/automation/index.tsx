"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  Input,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface KhidraSummary {
  data?: {
    totalRules?: number;
    activeRules?: number;
    totalLogs?: number;
    successLogs?: number;
  };
}

export function AutomationKhidraView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<
    "khidra.rule" | "khidra.log" | "mail.message" | "mail.tracking.value"
  >("khidra.rule");
  const [summary, setSummary] = useState<KhidraSummary["data"] | null>(null);
  const [triggerEvent, setTriggerEvent] = useState("record.updated");
  const [triggerModel, setTriggerModel] = useState("timeline.event");
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  async function loadSummary() {
    const res = await requestApiJson<KhidraSummary>("/api/v1/khidra/summary").catch(() => null);
    if (res?.data) setSummary(res.data);
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  async function handleFireTrigger(e: FormEvent) {
    e.preventDefault();
    setTriggerStatus(null);
    try {
      const res = await requestApiJson<{ data?: { matchedRules?: number } }>(
        "/api/v1/khidra/trigger",
        {
          method: "POST",
          body: JSON.stringify({
            trigger_event: triggerEvent.trim(),
            target_model: triggerModel.trim(),
            payload: { source: "automation-studio" },
          }),
        },
      );
      setTriggerStatus(
        `Dispatched ${triggerEvent} on ${triggerModel} (matched ${res?.data?.matchedRules ?? 0} rule(s)).`,
      );
      await loadSummary();
    } catch (err) {
      setTriggerStatus(err instanceof Error ? err.message : "Failed to dispatch Khidra trigger.");
    }
  }

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.automation}
      plane="creator"
      activeOverride="automation"
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
            id="patch-cable-jack"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">KHIDRA AUTOMATION ENGINE</Badge>
              <Badge variant="default">ACTIVE RULES: {summary?.activeRules ?? 0}</Badge>
              <Badge variant="secondary">EXECUTIONS: {summary?.totalLogs ?? 0}</Badge>
            </div>
            <CardTitle className="text-lg uppercase">{dictionary.apps.automationTitle}</CardTitle>
            <CardDescription>{dictionary.apps.automationSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              onSubmit={(e) => void handleFireTrigger(e)}
              className="flex flex-wrap items-center gap-2 border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <Input
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                placeholder="Trigger Event"
                aria-label="Trigger Event"
                className="max-w-xs"
              />
              <Input
                value={triggerModel}
                onChange={(e) => setTriggerModel(e.target.value)}
                placeholder="Target Model"
                aria-label="Target Model"
                className="max-w-xs"
              />
              <Button type="submit" size="sm">
                Dispatch Event Trigger
              </Button>
            </form>
            {triggerStatus ? (
              <div className="font-mono text-xs text-[var(--primary)]">{triggerStatus}</div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "khidra.rule", label: "Automation Rules" },
                  { id: "khidra.log", label: "Execution Logs" },
                  { id: "mail.message", label: "Chatter Messages" },
                  { id: "mail.tracking.value", label: "Field Tracking Diffs" },
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
          </CardContent>
        </Card>

        <AutoModelConsole
          model={activeModel}
          searchQuery={search}
          domainIcon="khidra"
          cutoutId="patch-cable-jack"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default AutomationKhidraView;
