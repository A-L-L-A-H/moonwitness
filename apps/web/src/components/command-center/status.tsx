import type { UniverseStat } from "@moonwitness/types";
import { StatBlock, Badge, SkinProvider } from "@moonwitness/ui";
import { SectionHeading } from "./section-heading";

export function UniverseStatus({ stats }: { stats: UniverseStat[] }) {
  return (
    <SkinProvider defaultSkin="technical">
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
          {stats.map((stat) => (
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
    </SkinProvider>
  );
}
