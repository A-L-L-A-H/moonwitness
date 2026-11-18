"use client";

import { useMemo, useState } from "react";
import { OperationsShell } from "@/components/shell";
import { useCurrentUser } from "@/lib/api/onboarding";
import { normalizeRole } from "@/lib/roles";
import {
  useSnmpDevices,
  useSnmpLatestSample,
  useSnmpStats,
  useSnmpTargets,
  type SnmpTarget,
} from "@/lib/api/snmp-poller";
import { sanitizeSnmpDevices, type SafeSnmpDevice } from "@/views/operations/security";
import {
  CreateTargetForm,
  DeviceManagementActions,
  SnmpManagementHeader,
  TargetManagementActions,
} from "@/views/operations/snmp-management";

function SnmpMonitor() {
  const [query, setQuery] = useState("");
  const devices = useSnmpDevices();
  const stats = useSnmpStats();
  const identity = useCurrentUser();
  const canWrite = normalizeRole(identity.data?.user?.role) === "admin";
  const visibleDevices = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const safeDevices = sanitizeSnmpDevices(devices.data ?? []);
    if (!needle) return safeDevices;
    return safeDevices.filter(
      (device) =>
        device.name.toLocaleLowerCase().includes(needle) ||
        device.host.toLocaleLowerCase().includes(needle),
    );
  }, [devices.data, query]);

  return (
    <OperationsShell
      breadcrumb="SNMP Monitor"
      search={{ value: query, onChange: setQuery, placeholder: "Search devices…" }}
    >
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-8">
        <header className="border-b-2 border-[var(--line)] pb-5">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--blue)]">
            OPERATIONS / {canWrite ? "MANAGEMENT" : "READ ONLY"}
          </p>
          <h1 className="mt-2 font-brush text-4xl text-zinc-100">SNMP MONITOR</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Device, target, and polling summaries from the authenticated SNMP service.
            {canWrite
              ? " You can create and delete devices and targets."
              : " Your role is read-only for SNMP mutations."}
          </p>
        </header>

        {canWrite && (
          <div className="flex justify-end">
            <SnmpManagementHeader canWrite={canWrite} />
          </div>
        )}

        {stats.isLoading ? (
          <p
            className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-zinc-400"
            role="status"
          >
            Loading SNMP statistics…
          </p>
        ) : stats.isError ? (
          <section
            className="border-2 border-[var(--yellow)]/50 bg-[var(--panel)] p-5"
            role="alert"
          >
            <h2 className="font-brush text-xl text-[var(--yellow)]">SNMP SERVICE UNAVAILABLE</h2>
            <p className="mt-2 text-sm text-zinc-300">{(stats.error as Error).message}</p>
            <button
              type="button"
              onClick={() => void stats.refetch()}
              className="mt-3 min-h-11 text-xs text-[var(--blue)] underline"
            >
              Retry statistics
            </button>
          </section>
        ) : (
          <section
            aria-label="SNMP statistics"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Stat label="Devices" value={stats.data?.total_devices} />
            <Stat label="Enabled devices" value={stats.data?.enabled_devices} />
            <Stat label="Targets" value={stats.data?.total_targets} />
            <Stat label="Samples" value={stats.data?.total_samples} />
          </section>
        )}

        {devices.isLoading ? (
          <p
            className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-zinc-400"
            role="status"
          >
            Loading devices…
          </p>
        ) : devices.isError ? (
          <section
            className="border-2 border-[var(--yellow)]/50 bg-[var(--panel)] p-5"
            role="alert"
          >
            <h2 className="font-brush text-xl text-[var(--yellow)]">DEVICES UNAVAILABLE</h2>
            <p className="mt-2 text-sm text-zinc-300">{(devices.error as Error).message}</p>
            <button
              type="button"
              onClick={() => void devices.refetch()}
              className="mt-3 min-h-11 text-xs text-[var(--blue)] underline"
            >
              Retry devices
            </button>
          </section>
        ) : visibleDevices.length === 0 ? (
          <p
            className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-zinc-400"
            role="status"
          >
            {devices.data?.length
              ? "No devices match this search."
              : "No SNMP devices are configured."}
          </p>
        ) : (
          <section aria-label="SNMP devices" className="space-y-4">
            {devices.isFetching && (
              <p className="text-xs text-zinc-500" role="status">
                Refreshing device data; showing the previous results.
              </p>
            )}
            {visibleDevices.map((device) => (
              <DeviceCard key={device.id} device={device} canWrite={canWrite} />
            ))}
          </section>
        )}
      </main>
    </OperationsShell>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 font-brush text-3xl text-zinc-100">{value ?? "—"}</p>
    </div>
  );
}

function DeviceCard({ device, canWrite }: { device: SafeSnmpDevice; canWrite: boolean }) {
  const { id: deviceId, name, host, port, version, enabled } = device;
  const targets = useSnmpTargets(deviceId);
  return (
    <article className="border-2 border-[var(--line)] bg-[var(--panel)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
        <div>
          <h2 className="font-brush text-xl text-white">{name}</h2>
          <p className="mt-1 font-mono text-xs text-zinc-400">
            {host}:{port} · {version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">{enabled ? "Enabled" : "Disabled"}</span>
          <DeviceManagementActions device={device} canWrite={canWrite} />
        </div>
      </header>
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Targets and samples
          </h3>
          {canWrite && <CreateTargetForm deviceId={deviceId} />}
        </div>
        {targets.isLoading ? (
          <p className="mt-3 text-sm text-zinc-400" role="status">
            Loading targets…
          </p>
        ) : targets.isError ? (
          <div className="mt-3" role="alert">
            <p className="text-sm text-zinc-400">{(targets.error as Error).message}</p>
            <button
              type="button"
              onClick={() => void targets.refetch()}
              className="mt-2 min-h-11 text-xs text-[var(--blue)] underline"
            >
              Retry targets
            </button>
          </div>
        ) : targets.data?.length ? (
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {targets.data.map((target) => (
              <TargetRow key={target.id} target={target} canWrite={canWrite} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-400" role="status">
            No targets are configured for this device.
          </p>
        )}
      </div>
    </article>
  );
}

function TargetRow({ target, canWrite }: { target: SnmpTarget; canWrite: boolean }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm text-zinc-200">{target.name}</p>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          {target.oid} · {target.enabled ? "Enabled" : "Disabled"}
        </p>
      </div>
      <div className="flex items-center gap-3 text-right">
        <TargetManagementActions
          targetId={target.id}
          targetName={target.name}
          canWrite={canWrite}
        />
        <div>
          <p className="text-xs text-zinc-400">
            {target.poll_interval === null
              ? "Default polling interval"
              : `Poll every ${target.poll_interval}s`}
          </p>
          <LatestSample targetId={target.id} />
        </div>
      </div>
    </li>
  );
}

function LatestSample({ targetId }: { targetId: string }) {
  const latest = useSnmpLatestSample(targetId);
  if (latest.isLoading)
    return (
      <p className="mt-1 text-[10px] text-zinc-500" role="status">
        Loading latest sample…
      </p>
    );
  if (latest.isError)
    return (
      <p className="mt-1 text-[10px] text-[var(--yellow)]" role="status">
        Latest sample unavailable
      </p>
    );
  if (!latest.data)
    return (
      <p className="mt-1 text-[10px] text-zinc-500" role="status">
        No samples yet
      </p>
    );
  return (
    <p className="mt-1 font-mono text-[10px] text-zinc-500">
      {latest.data.rate === null ? "Rate unavailable" : `${latest.data.rate} / s`} ·{" "}
      {new Date(latest.data.ts * 1000).toLocaleString()}
    </p>
  );
}

export default function SnmpPage() {
  return <SnmpMonitor />;
}
