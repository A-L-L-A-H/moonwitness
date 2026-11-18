"use client";

import { useState } from "react";
import {
  BarChart,
  Card,
  CutoutArtwork,
  DnaBrandLogo,
  RadialGauge,
  Sticker,
  ZineButton,
  ZineCardRough,
} from "@moonwitness/ui";
import { Crown } from "@moonwitness/ui/icons";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useControlStatus } from "@/lib/api/control";
import { useLogout } from "@/lib/api/onboarding";
import {
  AuditPanel,
  formatBytes,
  HostCard,
  HostMetricCard,
  OnboardingPanel,
  ResourcePanel,
} from "./control-panels";
import { CrewAndPlatformAuditSection } from "./crew-audit-section";
import { ControlGate } from "./gate";

export function ControlCenter() {
  return (
    <ControlGate>
      <ControlDashboard />
    </ControlGate>
  );
}

function ControlDashboard() {
  const [query, setQuery] = useState("");
  const status = useControlStatus();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => window.location.reload(),
      onError: () => window.location.reload(),
    });
  }

  return (
    <ConsoleShellAdapter
      plane="operations"
      breadcrumb="Control Plane"
      search={{ value: query, onChange: setQuery, placeholder: "Filter host state…" }}
    >
      <div className="space-y-6 px-4 py-6 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <DnaBrandLogo id="noc-gateway" variant="mark" size={44} decorative />
            <div>
              <h1 className="font-brush text-3xl text-[var(--foreground)] sm:text-4xl">
                ARSY <span className="text-[var(--primary)]">CONTROL PLANE</span>
              </h1>
              <p className="mt-1 max-w-xl font-hand text-xl text-[var(--muted-foreground)]">
                Observe the server, reconcile declared state, keep the empire honest.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sticker tone="yellow" className="-rotate-2 px-3 py-1 font-brush text-xs">
              <Crown className="mr-1 inline h-3 w-5" /> WEB → API → ARSY
            </Sticker>
            <ZineButton
              type="button"
              tone="paper"
              onClick={handleLogout}
              className="px-3 py-2 text-[11px]"
            >
              KELUAR
            </ZineButton>
          </div>
        </header>

        {status.isLoading ? (
          <div className="flex h-[40vh] items-center justify-center font-brush text-xl text-[var(--primary)]">
            REACHING THE CONTROL PLANE…
          </div>
        ) : status.isError ? (
          <>
            <OnboardingPanel reachable={false} />
            <ZineCardRough className="p-6">
              <h2 className="font-brush text-2xl text-[var(--red)]">ARSY UNREACHABLE</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
                {(status.error as Error).message}. Jalankan <code>arsy serve</code> di host, lalu
                pastikan <code>ARSY_URL</code> dan token read-only diatur pada apps/api.
              </p>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Dashboard hanya membaca; aksi tulis tetap lewat CLI atau{" "}
                <code>ARSY_PROXY_ADMIN=1</code>.
              </p>
            </ZineCardRough>
          </>
        ) : (
          status.data && (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <HostCard host={status.data.host} metrics={status.data.metrics} />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <HostMetricCard
                      label="CPU"
                      pct={status.data.metrics.cpu_pct}
                      detail={`load ${status.data.metrics.load1.toFixed(2)} / ${status.data.metrics.load5.toFixed(2)} / ${status.data.metrics.load15.toFixed(2)}`}
                      tone="pink"
                    />
                    <HostMetricCard
                      label="MEMORY"
                      pct={status.data.metrics.mem_pct}
                      detail={
                        status.data.metrics.mem_total > 0
                          ? `${formatBytes(status.data.metrics.mem_used)} / ${formatBytes(status.data.metrics.mem_total)}`
                          : `${formatBytes(status.data.metrics.mem_used)} · total tidak tersedia`
                      }
                      tone="blue"
                    />
                    <HostMetricCard
                      label="DISK"
                      pct={status.data.metrics.disk_pct}
                      detail={
                        status.data.metrics.disk_total > 0
                          ? `${formatBytes(status.data.metrics.disk_used)} / ${formatBytes(status.data.metrics.disk_total)}`
                          : `${status.data.metrics.disk_path} · total tidak tersedia`
                      }
                      tone="yellow"
                    />
                    <HostMetricCard
                      label="SWAP"
                      pct={
                        status.data.metrics.swap_total > 0
                          ? (status.data.metrics.swap_used / status.data.metrics.swap_total) * 100
                          : 0
                      }
                      detail={
                        status.data.metrics.swap_total > 0
                          ? `${formatBytes(status.data.metrics.swap_used)} / ${formatBytes(status.data.metrics.swap_total)}`
                          : "no swap"
                      }
                      tone="green"
                    />
                  </div>
                  <Card className="grid grid-cols-1 items-center gap-4 p-4 sm:grid-cols-[auto_1fr_auto]">
                    <RadialGauge
                      value={status.data.metrics.cpu_pct}
                      label="CPU"
                      size={84}
                      colorVar="var(--primary)"
                      ariaLabel="Live host CPU utilization"
                    />
                    <div className="min-w-0">
                      <p className="mb-1 font-mono text-[10px] tracking-[0.2em] text-[var(--muted-foreground)]">
                        LIVE RESOURCE TELEMETRY (%)
                      </p>
                      <BarChart
                        height={92}
                        ariaLabel="Host CPU, memory, disk and swap utilization percentages"
                        data={[
                          {
                            label: "CPU",
                            value: Math.round(status.data.metrics.cpu_pct),
                            colorVar: "var(--primary)",
                          },
                          {
                            label: "MEM",
                            value: Math.round(status.data.metrics.mem_pct),
                            colorVar: "var(--accent)",
                          },
                          {
                            label: "DISK",
                            value: Math.round(status.data.metrics.disk_pct),
                            colorVar: "var(--secondary)",
                          },
                          {
                            label: "SWAP",
                            value:
                              status.data.metrics.swap_total > 0
                                ? Math.round(
                                    (status.data.metrics.swap_used /
                                      status.data.metrics.swap_total) *
                                      100,
                                  )
                                : 0,
                            colorVar: "var(--green)",
                          },
                        ]}
                      />
                    </div>
                    <CutoutArtwork
                      id="server-rack"
                      className="hidden h-20 w-20 text-[var(--primary)] opacity-80 sm:block"
                      decorative
                    />
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ResourcePanel kind="systemd" />
                <ResourcePanel kind="docker" />
                <ResourcePanel kind="network" />
                <ResourcePanel kind="ssh" />
                <ResourcePanel kind="cert" />
                <ResourcePanel kind="mount" />
                <ResourcePanel kind="alert" />
                <ResourcePanel kind="gitdeploy" />
                <ResourcePanel kind="dockercompose" />
                <ResourcePanel kind="package" />
                <ResourcePanel kind="backup" />
                <ResourcePanel kind="kubernetes" />
              </div>

              <AuditPanel />
              <CrewAndPlatformAuditSection />
            </>
          )
        )}
      </div>
    </ConsoleShellAdapter>
  );
}
