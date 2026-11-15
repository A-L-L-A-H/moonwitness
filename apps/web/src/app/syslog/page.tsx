"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { OperationsShell } from "@/components/shell";
import { useCurrentUser } from "@/lib/api/onboarding";
import { useSyslogMessages, type SyslogMessage } from "@/lib/api/syslog";

const severityNames = [
  "Emergency",
  "Alert",
  "Critical",
  "Error",
  "Warning",
  "Notice",
  "Informational",
  "Debug",
];

function OperatorSession({ children }: { children: (authorized: boolean) => ReactNode }) {
  const identity = useCurrentUser();

  if (identity.isLoading) {
    return (
      <p className="p-5 text-sm text-zinc-400" role="status">
        Verifying operator session…
      </p>
    );
  }
  if (identity.isError) {
    return (
      <p className="p-5 text-sm text-zinc-400" role="status">
        Sign in through the Control Center to view Syslog messages.
      </p>
    );
  }
  return <>{children(true)}</>;
}

function SyslogExplorer() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const filters = useMemo(
    () => ({
      limit: 100,
      ...(severity ? { severity: Number(severity) } : {}),
      ...(query.trim() ? { q: query.trim() } : {}),
    }),
    [query, severity],
  );

  return (
    <OperationsShell
      breadcrumb="Syslog Explorer"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search messages…",
      }}
    >
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-8">
        <header className="border-b-2 border-[var(--line)] pb-5">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--blue)]">
            OPERATIONS / READ ONLY
          </p>
          <h1 className="mt-2 font-brush text-4xl text-zinc-100">SYSLOG EXPLORER</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Recent messages from the authenticated Syslog service. This view does not stream live
            events.
          </p>
        </header>

        <section
          aria-label="Syslog filters"
          className="flex flex-col gap-3 border-2 border-[var(--line)] bg-[var(--panel)] p-4 sm:flex-row sm:items-end"
        >
          <label className="block flex-1 text-xs text-zinc-400">
            Message search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={200}
              className="mt-1 min-h-11 w-full border-2 border-[var(--line)] bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-[var(--blue)]"
            />
          </label>
          <label className="block text-xs text-zinc-400 sm:w-56">
            Severity
            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="mt-1 min-h-11 w-full border-2 border-[var(--line)] bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-[var(--blue)]"
            >
              <option value="">All severities</option>
              {severityNames.map((name, value) => (
                <option key={name} value={value}>
                  {value} · {name}
                </option>
              ))}
            </select>
          </label>
        </section>
        <button
          type="button"
          onClick={() => setRefreshVersion((version) => version + 1)}
          className="min-h-11 text-xs text-[var(--blue)] underline"
        >
          Refresh messages
        </button>

        <OperatorSession>
          {(authorized) => (
            <SyslogMessages
              filters={filters}
              authorized={authorized}
              refreshVersion={refreshVersion}
            />
          )}
        </OperatorSession>
      </main>
    </OperationsShell>
  );
}

function SyslogMessages({
  filters,
  authorized,
  refreshVersion,
}: {
  filters: { limit: number; severity?: number; q?: string };
  authorized: boolean;
  refreshVersion: number;
}) {
  const messages = useSyslogMessages(filters, { enabled: authorized });
  const { refetch } = messages;
  useEffect(() => {
    if (refreshVersion > 0) void refetch();
  }, [refetch, refreshVersion]);
  if (!authorized) {
    return (
      <p
        className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-zinc-400"
        role="status"
      >
        Complete instance setup before viewing Syslog messages.
      </p>
    );
  }
  if (messages.isLoading) {
    return (
      <p
        className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-zinc-400"
        role="status"
      >
        Loading recent messages…
      </p>
    );
  }
  if (messages.isError) {
    return (
      <section className="border-2 border-[var(--yellow)]/50 bg-[var(--panel)] p-5" role="alert">
        <h2 className="font-brush text-xl text-[var(--yellow)]">SYSLOG UNAVAILABLE</h2>
        <p className="mt-2 text-sm text-zinc-300">
          {(messages.error as Error).message || "The Syslog service could not return messages."}
        </p>
        <button
          type="button"
          onClick={() => void messages.refetch()}
          className="mt-3 min-h-11 text-xs text-[var(--blue)] underline"
        >
          Retry query
        </button>
      </section>
    );
  }
  if (messages.isFetching && messages.data) {
    return <MessageList messages={messages.data} stale />;
  }
  if (messages.data?.length === 0) {
    return (
      <p
        className="border-2 border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-zinc-400"
        role="status"
      >
        No messages match these filters.
      </p>
    );
  }
  return <MessageList messages={messages.data ?? []} stale={messages.isFetching} />;
}

function MessageList({ messages, stale }: { messages: SyslogMessage[]; stale: boolean }) {
  return (
    <section aria-label="Recent Syslog messages" className="space-y-3">
      {stale && (
        <p className="text-xs text-zinc-500" role="status">
          Showing previously loaded results while refreshing.
        </p>
      )}
      <div className="overflow-x-auto border-2 border-[var(--line)] bg-[var(--panel)]">
        <table className="w-full min-w-[42rem] text-left text-xs">
          <thead className="bg-black/30 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            <tr>
              <th scope="col" className="p-3">
                Received
              </th>
              <th scope="col" className="p-3">
                Source
              </th>
              <th scope="col" className="p-3">
                Severity
              </th>
              <th scope="col" className="p-3">
                Application
              </th>
              <th scope="col" className="p-3">
                Message
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] text-zinc-300">
            {messages.map((message) => (
              <tr key={message.id}>
                <td className="whitespace-nowrap p-3">
                  {new Date(message.received_at).toLocaleString()}
                </td>
                <td className="p-3 font-mono">
                  {message.hostname ?? message.source_ip ?? "Unknown"}
                </td>
                <td className="whitespace-nowrap p-3">
                  {message.severity === null
                    ? "Unknown"
                    : `${message.severity} · ${severityNames[message.severity] ?? "Other"}`}
                </td>
                <td className="p-3">{message.app_name ?? "—"}</td>
                <td className="max-w-xl whitespace-pre-wrap break-words p-3">{message.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">Showing at most 100 messages.</p>
    </section>
  );
}

export default function SyslogPage() {
  return <SyslogExplorer />;
}
