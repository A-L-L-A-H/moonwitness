"use client";

import { useEffect, useState } from "react";
import {
  DOCK_TELEMETRY_NODES,
  WORLD_DOMAINS,
  type DockNodeTelemetry,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { WorldEmblemById } from "./sacred-icons";

export function DockMatrixSection({
  onLaunchWorld,
}: {
  readonly onLaunchWorld: (worldId: WorldIdentifier) => void;
}) {
  const [telemetryState, setTelemetryState] = useState<readonly DockNodeTelemetry[]>(
    DOCK_TELEMETRY_NODES
  );
  const [syncPulse, setSyncPulse] = useState<number>(0);

  // Micro-fluctuations in live latency to reflect real-time active carrier telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setSyncPulse((prev) => prev + 1);
      setTelemetryState((currentList) =>
        currentList.map((node) => {
          const jitter = (Math.random() - 0.5) * 1.2;
          const newLatency = Math.max(1, Math.min(9, Math.round((node.latencyMs + jitter) * 10) / 10));
          return {
            ...node,
            latencyMs: newLatency,
          };
        })
      );
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="the-dock"
      aria-labelledby="dock-heading"
      className="relative border-t border-[#d6b46c]/25 bg-[#040509] py-24 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
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
            Real-time synchronization across the five gateways of the Empire. Every dock terminal
            maintains optical and cryptographic coherence with the Central Gate.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 border border-[#d6b46c]/30 bg-[#080b14] px-3.5 py-1 text-xs font-mono text-[#d6b46c]">
            <span className="h-2 w-2 rounded-full bg-[#3ddc84] animate-ping" />
            <span>TELEMETRY PULSE: CYCLE 1448.{syncPulse} · QUIC/SIGV4 ENCRYPTED</span>
          </div>
        </div>

        <div className="mt-12 overflow-hidden border border-[#d6b46c]/30 bg-[#080b14]/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="grid grid-cols-1 divide-y divide-[#d6b46c]/20 md:grid-cols-5 md:divide-y-0 md:divide-x">
            {telemetryState.map((telemetryNode) => {
              const matchedWorld = WORLD_DOMAINS.find(
                (domain) => domain.id === telemetryNode.worldId
              );
              return (
                <div
                  key={telemetryNode.nodeCode}
                  className="flex flex-col justify-between p-6 hover:bg-[#d6b46c]/6 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#d6b46c]">
                      <span>{telemetryNode.nodeCode}</span>
                      <span className="inline-flex items-center gap-1.5 text-[#f7dfa0]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f7dfa0] animate-pulse" />
                        {telemetryNode.state}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <WorldEmblemById worldId={telemetryNode.worldId} className="h-10 w-10" />
                      <div>
                        <div className="font-serif text-base tracking-[0.16em] text-[#fff6df]">
                          {matchedWorld?.name ?? telemetryNode.designation}
                        </div>
                        <div className="text-xs text-[#bfb59e]">{telemetryNode.designation}</div>
                      </div>
                    </div>

                    <dl className="mt-6 space-y-2 border-t border-[#d6b46c]/15 pt-4 text-xs font-mono">
                      <div className="flex justify-between">
                        <dt className="text-[#8e8572]">PROTOCOL</dt>
                        <dd className="text-[#e6decb]">{telemetryNode.protocol}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#8e8572]">BEARING</dt>
                        <dd className="text-[#e6decb]">{telemetryNode.orbitalBearing}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#8e8572]">COHERENCE</dt>
                        <dd className="text-[#f5e3b8]">
                          {telemetryNode.integrityPercent}% · {telemetryNode.latencyMs}ms
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLaunchWorld(telemetryNode.worldId)}
                    className="mt-6 w-full border border-[#d6b46c]/40 bg-[#d6b46c]/12 py-2 font-serif text-xs tracking-[0.2em] text-[#f8eac6] uppercase hover:border-[#f8eac6] hover:bg-[#d6b46c]/25 transition-all cursor-pointer"
                  >
                    ENTER {matchedWorld?.name} &rsaquo;
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
