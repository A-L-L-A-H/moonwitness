import { StatBlock, Badge } from "@moonwitness/ui";
import { SectionHeading } from "./section-heading";
import type { CommandCenterStats } from "@/lib/api/command-center";

function statBlocks(stats: CommandCenterStats | null) {
  if (!stats) return [];
  return [
    { label: "WORKFLOWS", value: String(stats.workflows), tone: "blue" as const, trend: "" },
    { label: "RUNNING", value: String(stats.running), tone: "green" as const, trend: "" },
    { label: "QUEUED", value: String(stats.queued), tone: "yellow" as const, trend: "" },
    { label: "ALERTS", value: String(stats.alerts), tone: "pink" as const, trend: "" },
  ];
}

export function UniverseStatus({ stats }: { stats: CommandCenterStats | null }) {
  const blocks = statBlocks(stats);
  const fallback = [{ label: "WORKFLOWS", value: "—", tone: "blue" as const, trend: "" }];
  return (
    <section aria-labelledby="cc-status-heading" className="scroll-mt-24">
      <SectionHeading
        id="cc-status-heading"
        title="UNIVERSE"
        accent="STATUS"
        note="live snapshot"
      />
      <div className="mb-3 flex justify-end">
        <Badge variant="default" className="bg-[#3ddc84] text-black">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current align-middle" />
          LIVE
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(blocks.length ? blocks : fallback).map((stat) => (
          <StatBlock
            key={stat.label}
            value={stat.value}
            label={stat.label}
            tone={stat.tone}
            trend={stat.trend}
          />
        ))}
      </div>
    </section>
  );
}
