"use client";

import { useState } from "react";
import {
  DOCK_TELEMETRY_NODES,
  WORLD_DOMAINS,
  type DockNodeTelemetry,
  type WorldIdentifier,
} from "@/data/empire-registry";
import {
  ScrollChapterReveal,
  SpatialTiltCard,
  triggerSacredViewTransition,
} from "./motion-primitives";
import { WorldEmblemById } from "./sacred-icons";

type DockFilterState = "ALL" | DockNodeTelemetry["state"];

const DOCK_FILTER_OPTIONS: readonly { readonly id: DockFilterState; readonly label: string }[] = [
  { id: "ALL", label: "ALL GATEWAYS" },
  { id: "SYNCHRONIZED", label: "SYNCHRONIZED" },
  { id: "LUMINOUS", label: "LUMINOUS" },
  { id: "BROADCASTING", label: "BROADCASTING" },
] as const;

export function DockMatrixSection({
  quietMode = false,
  onLaunchWorld,
}: {
  readonly quietMode?: boolean;
  readonly onLaunchWorld: (worldId: WorldIdentifier) => void;
}) {
  const [filterState, setFilterState] = useState<DockFilterState>("ALL");

  const visibleNodes =
    filterState === "ALL"
      ? DOCK_TELEMETRY_NODES
      : DOCK_TELEMETRY_NODES.filter((node) => node.state === filterState);

  return (
    <section
      id="the-dock"
      aria-labelledby="dock-heading"
      className="relative border-t border-[#d6b46c]/25 bg-[#040509] py-24 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4 text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
              <span>CELESTIAL HORIZON BRIDGE</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
            </div>
            <h2
              id="dock-heading"
              className="mt-4 font-serif text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
            >
              THE DOCK · SOVEREIGN MATRIX
            </h2>
            <p className="mt-3 max-w-2xl font-serif text-base sm:text-lg text-[#d6ceb8]/85">
              Unified gateway routing across the five realms of the Empire. Inspect protocol
              assignments and enter any sanctuary directly from the Horizon Matrix.
            </p>

            {/* Filter by Gateway Class */}
            <div
              role="group"
              aria-label="Filter gateways by state"
              className="mt-6 flex flex-wrap items-center justify-center gap-2"
            >
              {DOCK_FILTER_OPTIONS.map((option) => {
                const isActive = filterState === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() =>
                      triggerSacredViewTransition(() => {
                        setFilterState(option.id);
                      }, quietMode)
                    }
                    className={`min-h-[44px] border px-4 py-1.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors cursor-pointer ${
                      isActive
                        ? "border-[#f8eac6] bg-[#d6b46c]/20 text-[#fff6df]"
                        : "border-[#d6b46c]/30 bg-[#080b14] text-[#c8beaa] hover:border-[#d6b46c]/65 hover:text-[#fff6df]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollChapterReveal>

        <ScrollChapterReveal quietMode={quietMode}>
          <div
            className={`mt-10 grid grid-cols-1 gap-4 ${
              visibleNodes.length >= 5
                ? "md:grid-cols-2 lg:grid-cols-5"
                : visibleNodes.length === 2
                  ? "md:grid-cols-2 max-w-3xl mx-auto"
                  : "max-w-md mx-auto"
            }`}
          >
            {visibleNodes.map((telemetryNode) => {
              const matchedWorld = WORLD_DOMAINS.find(
                (domain) => domain.id === telemetryNode.worldId,
              );
              return (
                <SpatialTiltCard key={telemetryNode.nodeCode} disabled={quietMode} maxTiltDeg={3.5}>
                  <div className="flex h-full flex-col justify-between border border-[#d6b46c]/30 bg-[#080b14]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:border-[#d6b46c]/65 transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#d6b46c]">
                        <span>{telemetryNode.nodeCode}</span>
                        <span className="inline-flex items-center gap-1.5 text-[#f7dfa0]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#f7dfa0]" />
                          {telemetryNode.state}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-3">
                        <WorldEmblemById
                          worldId={telemetryNode.worldId}
                          className="h-10 w-10 shrink-0"
                        />
                        <div>
                          <div className="font-serif text-base tracking-[0.16em] text-[#fff6df]">
                            {matchedWorld?.name ?? telemetryNode.designation}
                          </div>
                          <div className="text-xs text-[#bfb59e]">{telemetryNode.designation}</div>
                        </div>
                      </div>

                      <dl className="mt-6 space-y-2 border-t border-[#d6b46c]/15 pt-4 text-xs font-mono">
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#8e8572]">PROTOCOL</dt>
                          <dd className="text-right text-[#e6decb]">{telemetryNode.protocol}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#8e8572]">BEARING</dt>
                          <dd className="text-right text-[#e6decb]">
                            {telemetryNode.orbitalBearing}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#8e8572]">SPEC TARGET</dt>
                          <dd className="text-right text-[#f5e3b8]">
                            {telemetryNode.integrityPercent}% · {telemetryNode.latencyMs}ms
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLaunchWorld(telemetryNode.worldId)}
                      className="mt-6 min-h-[44px] w-full border border-[#d6b46c]/40 bg-[#d6b46c]/12 py-2 font-serif text-xs tracking-[0.2em] text-[#f8eac6] uppercase hover:border-[#f8eac6] hover:bg-[#d6b46c]/25 transition-all cursor-pointer"
                    >
                      ENTER {matchedWorld?.name} &rsaquo;
                    </button>
                  </div>
                </SpatialTiltCard>
              );
            })}
          </div>
        </ScrollChapterReveal>
      </div>
    </section>
  );
}
