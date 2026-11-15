import type { FeedItem, MissionAlert, Workflow } from "@moonwitness/types";
import { Card, Button } from "@moonwitness/ui";
import { Bolt, Crown } from "@moonwitness/ui/icons";
import { SectionHeading } from "./section-heading";

export interface MissionLogProps {
  feed: FeedItem[];
  alerts: MissionAlert[];
  workflows: Workflow[];
  onDismissAlert: (id: string) => void;
  onToggleWorkflow: (id: string) => void;
}

const STATUS_TEXT: Record<Workflow["status"], string> = {
  Running: "text-[var(--green)]",
  Queued: "text-[var(--blue)]",
  Paused: "text-[var(--yellow)]",
  Succeeded: "text-[var(--green)]",
  Failed: "text-[var(--red)]",
  Cancelled: "text-[var(--yellow)]",
};

export function MissionLog({
  feed,
  alerts,
  workflows,
  onDismissAlert,
  onToggleWorkflow,
}: MissionLogProps) {
  const running = workflows.filter((w) => w.status === "Running").length;
  return (
    <section aria-labelledby="cc-log" className="scroll-mt-24">
      <SectionHeading id="cc-log" title="MISSION" accent="LOG" note={`${running} running`} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-brush text-lg text-white">
            ACTIVE WORKFLOWS <Crown className="h-4 w-6 text-[var(--yellow)]" />
          </h3>
          <div className="divide-y divide-[var(--line)]">
            {workflows.map((w) => (
              <div key={w.id} className="flex items-center gap-3 py-2.5">
                <Bolt className={`h-4 w-3 shrink-0 ${STATUS_TEXT[w.status]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-zinc-200">{w.name}</p>
                  <p className="truncate text-[10px] text-zinc-500">
                    {w.status === "Paused"
                      ? "Paused by operator"
                      : w.status === "Succeeded"
                        ? "Completed successfully"
                        : w.status === "Failed"
                          ? "Failed; review the mission log"
                          : w.status === "Cancelled"
                            ? "Cancelled by operator"
                            : w.detail}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] ${STATUS_TEXT[w.status]}`}>
                  <span
                    className={`h-1.5 w-1.5 rounded-full bg-current ${w.status === "Running" || w.status === "Queued" ? "pulse-dot" : ""}`}
                  />
                  {w.status}
                </span>
                {(w.status === "Queued" || w.status === "Running" || w.status === "Paused") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleWorkflow(w.id)}
                    aria-label={w.status === "Paused" ? `Resume ${w.name}` : `Pause ${w.name}`}
                    className="min-h-11 rounded px-3 text-[10px]"
                  >
                    {w.status === "Paused" ? "Run" : "Pause"}
                  </Button>
                )}
              </div>
            ))}
            {workflows.length === 0 && (
              <p className="py-4 text-sm text-zinc-500">No workflows match.</p>
            )}
          </div>
        </Card>

        <Card className="min-w-0 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-brush text-lg text-white">
            COMMAND FEED <Crown className="h-4 w-6 text-[var(--yellow)]" />
          </h3>
          <div className="divide-y divide-[var(--line)]">
            {feed.map((f) => (
              <div key={f.id} className="flex items-start gap-2 py-2">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: f.color }}
                />
                <p className="min-w-0 flex-1 text-xs leading-snug text-zinc-300">{f.text}</p>
                <span className="shrink-0 text-[10px] text-zinc-600">{f.ago}</span>
              </div>
            ))}
            {feed.length === 0 && (
              <p className="py-4 text-sm text-zinc-500">No feed items match.</p>
            )}
          </div>
        </Card>

        <Card className="min-w-0 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-brush text-lg text-white">
            MISSION ALERTS <Crown className="h-4 w-6 text-[var(--yellow)]" />
          </h3>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2"
              >
                <span
                  className={`font-brush text-sm ${a.level === "high" ? "text-[var(--red)]" : a.level === "medium" ? "text-[var(--yellow)]" : "text-[var(--blue)]"}`}
                >
                  !
                </span>
                <p className="min-w-0 flex-1 text-xs text-zinc-300">{a.text}</p>
                <span className="text-[10px] text-zinc-600">{a.ago}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismissAlert(a.id)}
                  aria-label={`Dismiss alert: ${a.text}`}
                  className="min-h-11 min-w-11 text-zinc-500"
                >
                  ✕
                </Button>
              </div>
            ))}
            {alerts.length === 0 && (
              <p className="py-2 text-xs text-zinc-500">All clear. The sky is quiet.</p>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
