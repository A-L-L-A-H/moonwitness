"use client";

import { useEffect, useState } from "react";

export interface EcosystemTelemetryState {
  readonly status: "checking" | "online" | "offline";
  readonly databaseStatus: string | null;
  readonly timelineTotal: number | null;
  readonly erasCount: number | null;
}

export function useEcosystemTelemetry(): EcosystemTelemetryState {
  const [state, setState] = useState<EcosystemTelemetryState>({
    status: "checking",
    databaseStatus: null,
    timelineTotal: null,
    erasCount: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);

    async function probe(): Promise<void> {
      try {
        const [healthRes, readyRes, statsRes, erasRes] = await Promise.all([
          fetch("/api/v1/healthz", { signal: controller.signal }),
          fetch("/api/v1/readyz", { signal: controller.signal }).catch(() => null),
          fetch("/api/v1/timeline/stats", { signal: controller.signal }).catch(() => null),
          fetch("/api/v1/timeline/eras", { signal: controller.signal }).catch(() => null),
        ]);

        if (!healthRes.ok) {
          setState({
            status: "offline",
            databaseStatus: null,
            timelineTotal: null,
            erasCount: null,
          });
          return;
        }

        let dbState: string | null = null;
        if (readyRes && readyRes.ok) {
          const readyJson = (await readyRes.json()) as { database?: string };
          dbState = readyJson.database ?? "ready";
        }

        let timelineTotal: number | null = null;
        if (statsRes && statsRes.ok) {
          const statsJson = (await statsRes.json()) as { data?: { total?: number } };
          timelineTotal = typeof statsJson.data?.total === "number" ? statsJson.data.total : null;
        }

        let erasCount: number | null = null;
        if (erasRes && erasRes.ok) {
          const erasJson = (await erasRes.json()) as { data?: unknown[] };
          erasCount = Array.isArray(erasJson.data) ? erasJson.data.length : null;
        }

        setState({
          status: "online",
          databaseStatus: dbState,
          timelineTotal,
          erasCount,
        });
      } catch {
        if (!controller.signal.aborted) {
          setState({
            status: "offline",
            databaseStatus: null,
            timelineTotal: null,
            erasCount: null,
          });
        }
      }
    }

    void probe();

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return state;
}
