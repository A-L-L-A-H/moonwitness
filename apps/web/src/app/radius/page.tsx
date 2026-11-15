"use client";

import { useEffect, useMemo, useState } from "react";
import { OperationsShell } from "@/components/shell";
import { useRadiusHealth, useRadiusLogs, useRadiusStats, type RadiusLog } from "@/lib/api/radius";
import { useCurrentUser } from "@/lib/api/onboarding";
import { normalizeRole } from "@/lib/roles";
import { RadiusUserManagement } from "@/views/operations/radius-users";

function RadiusConsole() {
  const [query, setQuery] = useState("");
  const health = useRadiusHealth();
  const stats = useRadiusStats();
  const logs = useRadiusLogs();
  const identity = useCurrentUser();
  const role = normalizeRole(identity.data?.user?.role);
  const canWrite = role === "admin";
  const { refetch: refetchHealth } = health;
  const { refetch: refetchStats } = stats;
  const { refetch: refetchLogs } = logs;
  const visibleLogs = useMemo(() => {
    const entries = logs.data ?? [];
    const needle = query.trim().toLocaleLowerCase();
    return needle
      ? entries.filter((entry) => JSON.stringify(entry).toLocaleLowerCase().includes(needle))
      : entries;
  }, [logs.data, query]);
  const refreshing = health.isFetching || stats.isFetching || logs.isFetching;

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refetchHealth();
      void refetchStats();
      void refetchLogs();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [refetchHealth, refetchStats, refetchLogs]);

  return (
    <OperationsShell
      breadcrumb="RADIUS Console"
      search={{ value: query, onChange: setQuery, placeholder: "Search RADIUS logs…" }}
    >
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-8">
        <header className="border-b-2 border-[var(--line)] pb-5">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--blue)]">
            OPERATIONS / READ ONLY
          </p>
          <h1 className="mt-2 font-brush text-4xl text-zinc-100">RADIUS CONSOLE</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Health, aggregate statistics, service logs, and role-gated user management. Passwords
            are never displayed after submission.
          </p>
        </header>

        {refreshing && (health.data || stats.data || logs.data) && (
          <p role="status" className="text-xs text-zinc-500">
            Refreshing service data; previously loaded results remain visible.
          </p>
        )}

        <section
          aria-label="RADIUS service health"
          className="border-2 border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-brush text-xl text-white">SERVICE HEALTH</h2>
            <button
              type="button"
              onClick={() => {
                void health.refetch();
                void stats.refetch();
                void logs.refetch();
              }}
              className="min-h-11 text-xs text-[var(--blue)] underline"
            >
              Refresh console
            </button>
          </div>
          {health.isLoading ? (
            <p className="mt-3 text-sm text-zinc-400" role="status">
              Checking RADIUS service…
            </p>
          ) : health.isError ? (
            <ErrorState
              message={(health.error as Error).message}
              onRetry={() => void health.refetch()}
            />
          ) : (
            <p className="mt-3 text-sm text-zinc-300">
              {health.data?.service ?? "RADIUS"} · {health.data?.status ?? "Status unavailable"}
              {health.data?.reachable === false ? " · Unreachable" : ""}
            </p>
          )}
        </section>

        <section aria-label="RADIUS statistics">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Aggregate statistics
          </h2>
          {stats.isLoading ? (
            <p
              className="border-2 border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-zinc-400"
              role="status"
            >
              Loading statistics…
            </p>
          ) : stats.isError ? (
            <ErrorState
              message={(stats.error as Error).message}
              onRetry={() => void stats.refetch()}
            />
          ) : Object.keys(stats.data ?? {}).length === 0 ? (
            <p
              className="border-2 border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-zinc-400"
              role="status"
            >
              No statistics are available.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(stats.data ?? {}).map(([key, value]) => (
                <div key={key} className="border-2 border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    {key.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 break-words font-brush text-2xl text-zinc-100">
                    {value ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="RADIUS logs">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Service logs
            </h2>
            {logs.data && <span className="text-xs text-zinc-500">{visibleLogs.length} shown</span>}
          </div>
          {logs.isLoading ? (
            <p
              className="border-2 border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-zinc-400"
              role="status"
            >
              Loading service logs…
            </p>
          ) : logs.isError ? (
            <ErrorState
              message={(logs.error as Error).message}
              onRetry={() => void logs.refetch()}
            />
          ) : visibleLogs.length === 0 ? (
            <p
              className="border-2 border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-zinc-400"
              role="status"
            >
              {logs.data?.length ? "No logs match this search." : "No service logs are available."}
            </p>
          ) : (
            <LogList entries={visibleLogs} />
          )}
        </section>

        <RadiusUserManagement canWrite={canWrite} />
      </main>
    </OperationsShell>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-3 border-2 border-[var(--yellow)]/50 bg-[var(--panel)] p-4">
      <p className="text-sm text-zinc-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 min-h-11 text-xs text-[var(--blue)] underline"
      >
        Retry
      </button>
    </div>
  );
}

function LogList({ entries }: { entries: RadiusLog[] }) {
  return (
    <div className="overflow-x-auto border-2 border-[var(--line)] bg-[var(--panel)]">
      <table className="w-full min-w-[36rem] text-left text-xs">
        <thead className="bg-black/30 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
          <tr>
            <th scope="col" className="p-3">
              Time
            </th>
            <th scope="col" className="p-3">
              Level
            </th>
            <th scope="col" className="p-3">
              Message
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)] text-zinc-300">
          {entries.map((entry, index) => (
            <tr key={String(entry.id ?? entry.timestamp ?? index)}>
              <td className="whitespace-nowrap p-3">
                {String(entry.timestamp ?? entry.time ?? "—")}
              </td>
              <td className="p-3">{String(entry.level ?? entry.severity ?? "—")}</td>
              <td className="max-w-3xl whitespace-pre-wrap break-words p-3">
                {String(entry.message ?? entry.msg ?? safeLogSummary(entry))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function safeLogSummary(entry: RadiusLog): string {
  return Object.entries(entry)
    .filter(([key]) => !/password|secret|credential|token|hash/i.test(key))
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default function RadiusPage() {
  return <RadiusConsole />;
}
