"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Badge,
  BarChart,
  Card,
  CutoutArtwork,
  DnaBrandLogo,
  Gauge,
  RadialGauge,
  Sticker,
  Tape,
  ZineCardRough,
  NativeSelect,
} from "@moonwitness/ui";
import { Crown, Star4 } from "@moonwitness/ui/icons";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import {
  useAuditLogs,
  useCreateUser,
  useCurrentUser as useAppCurrentUser,
  useDeleteUser,
  useUpdateUserRole,
  useUsers,
} from "@/lib/api/auth";
import type { CrewRoleName } from "@/lib/roles";
import {
  useControlAudit,
  useControlResources,
  useControlStatus,
  type HostMetrics,
  type Observation,
} from "@/lib/api/control";
import { useLogout } from "@/lib/api/onboarding";
import { ControlGate } from "./gate";

type Kind =
  | "systemd"
  | "docker"
  | "network"
  | "ssh"
  | "cert"
  | "mount"
  | "alert"
  | "gitdeploy"
  | "dockercompose"
  | "package"
  | "backup"
  | "kubernetes";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

function formatUptime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

type HostMetricTone = "pink" | "blue" | "yellow" | "green";

/** Host metric tile: product composition around the shared HUD Gauge primitive. */
function HostMetricCard({
  label,
  pct,
  detail,
  tone,
}: {
  label: string;
  pct: number;
  detail: string;
  tone: HostMetricTone;
}) {
  const clamped = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <Card className="relative overflow-hidden p-4">
      <Gauge label={label} value={`${clamped.toFixed(0)}%`} percent={clamped} tone={tone} />
      <div className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">{detail}</div>
    </Card>
  );
}

function CapabilityChip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`border px-2 py-0.5 text-[10px] tracking-widest ${
        on
          ? "border-[var(--green)]/50 bg-[var(--green)]/10 text-[var(--green)]"
          : "border-[var(--border)] text-[var(--muted-foreground)]"
      }`}
    >
      {label}
    </span>
  );
}

function ObservationRow({ name, obs }: { name: string; obs: Observation }) {
  const fields = obs.fields ?? {};
  const state = fields.state ?? fields.status ?? (obs.exists ? "present" : "missing");
  const good = obs.exists && !["stopped", "exited", "dead", "failed"].includes(state.toLowerCase());
  return (
    <tr className="border-b border-[var(--border)]/60 last:border-b-0">
      <td className="px-3 py-2 font-mono text-xs text-[var(--foreground)]">{name}</td>
      <td className="px-3 py-2">
        <span
          className={`inline-block border px-2 py-0.5 text-[10px] tracking-widest ${
            good
              ? "border-[var(--green)]/50 bg-[var(--green)]/10 text-[var(--green)]"
              : "border-[var(--red)]/50 bg-[var(--red)]/10 text-[var(--red)]"
          }`}
        >
          {state.toUpperCase()}
        </span>
      </td>
      <td className="px-3 py-2 text-[11px] text-[var(--muted-foreground)]">
        {Object.entries(fields)
          .filter(([key]) => !["state", "status"].includes(key))
          .map(([key, value]) => `${key}=${value}`)
          .join(" · ") ||
          (obs.detail ?? "—")}
      </td>
    </tr>
  );
}

function ResourcePanel({ kind }: { kind: Kind }) {
  const { data, isLoading, error } = useControlResources(kind);
  const payload: unknown = data?.[kind];
  // arsy mengirim { "<kind>": { error: "..." } } bila backend-nya tidak tersedia.
  const kindError =
    payload && typeof (payload as { error?: unknown }).error === "string"
      ? (payload as { error: string }).error
      : null;
  const rows = useMemo<[string, Observation][]>(
    () =>
      !payload || kindError
        ? []
        : Object.entries(payload as Record<string, Observation>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
    [payload, kindError],
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b-2 border-[var(--border)] px-4 py-3">
        <h2 className="font-brush text-lg text-[var(--foreground)]">
          {kind.toUpperCase()}{" "}
          <span className="text-[var(--primary)]">
            {kind === "systemd" || kind === "docker" ? "UNITS" : "RESOURCES"}
          </span>
        </h2>
        <Badge variant="default" className="bg-[var(--blue)] text-black">
          {isLoading ? "SYNCING" : error || kindError ? "UNAVAILABLE" : `${rows.length} SEEN`}
        </Badge>
      </div>
      {error || kindError ? (
        <p className="px-4 py-6 text-sm text-[var(--primary)]">
          {kindError ?? (error as Error).message}
        </p>
      ) : rows.length === 0 && !isLoading ? (
        <p className="px-4 py-6 text-sm text-[var(--muted-foreground)]">
          Tidak ada resource yang cocok allowlist.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[9px] tracking-[0.2em] text-[var(--muted-foreground)]">
                <th className="px-3 py-2 font-normal">NAME</th>
                <th className="px-3 py-2 font-normal">STATE</th>
                <th className="px-3 py-2 font-normal">FIELDS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, obs]) => (
                <ObservationRow key={name} name={name} obs={obs} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function HostCard({
  host,
  metrics,
}: {
  host: NonNullable<ReturnType<typeof useControlStatus>["data"]>["host"];
  metrics: HostMetrics;
}) {
  return (
    <ZineCardRough className="relative overflow-hidden p-5 skin-riot">
      <Star4 className="absolute right-4 top-4 h-6 w-6 text-[var(--primary)] opacity-70" />
      <p className="text-[10px] tracking-[0.25em] text-[var(--muted-foreground)]">HOST AGENT</p>
      <h2 className="mt-1 font-brush text-2xl text-[var(--foreground)]">
        {host.hostname || "unknown-host"}
      </h2>
      <p className="mt-1 font-hand text-lg text-[var(--primary)]">
        {host.distro || host.os}
        {host.wsl_distro ? ` · WSL ${host.wsl_distro}` : ""} · {host.arch}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
        <div>
          <dt className="text-[var(--muted-foreground)]">OS</dt>
          <dd className="text-[var(--foreground)]">{host.os}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">KERNEL</dt>
          <dd className="truncate text-[var(--foreground)]">{host.kernel || "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">ROOT</dt>
          <dd className={host.is_root ? "text-[var(--green)]" : "text-[var(--muted-foreground)]"}>
            {host.is_root ? "yes" : "no"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">UPTIME</dt>
          <dd className="text-[var(--foreground)]">{formatUptime(metrics.uptime_sec)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <CapabilityChip label="SYSTEMD" on={host.capabilities.systemd} />
        <CapabilityChip label="DOCKER" on={host.capabilities.docker} />
        <CapabilityChip label="FILES" on={host.capabilities.files} />
        <CapabilityChip label="CRON" on={host.capabilities.cron} />
        <CapabilityChip label="USERS" on={host.capabilities.users} />
        <CapabilityChip label="FIREWALL" on={host.capabilities.firewall} />
        <CapabilityChip label="METRICS" on={host.capabilities.host_metrics} />
        <CapabilityChip label="NETWORK" on={host.capabilities.network} />
        <CapabilityChip label="SSH" on={host.capabilities.ssh} />
        <CapabilityChip label="CERT" on={host.capabilities.cert} />
        <CapabilityChip label="MOUNT" on={host.capabilities.mount} />
        <CapabilityChip label="ALERT" on={host.capabilities.alert} />
        <CapabilityChip label="K8S" on={host.capabilities.kubernetes} />
      </div>
      {metrics.degraded && (
        <p className="mt-3 border border-[var(--yellow)]/40 bg-[var(--yellow)]/10 px-3 py-2 text-[11px] text-[var(--primary)]">
          Metrik host terdegradasi{metrics.notes?.length ? `: ${metrics.notes.join(", ")}` : ""}
        </p>
      )}
    </ZineCardRough>
  );
}

function AuditPanel() {
  const { data, isLoading } = useControlAudit(20);
  const entries = data ?? [];
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b-2 border-[var(--border)] px-4 py-3">
        <h2 className="font-brush text-lg text-[var(--foreground)]">
          AUDIT <span className="text-[var(--primary)]">TRAIL</span>
        </h2>
        <span className="text-[10px] tracking-widest text-[var(--muted-foreground)]">
          {isLoading ? "READING…" : `${entries.length} ENTRIES`}
        </span>
      </div>
      {entries.length === 0 && !isLoading ? (
        <p className="px-4 py-6 text-sm text-[var(--muted-foreground)]">
          Belum ada aktivitas tercatat.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)]/60">
          {entries.map((entry, i) => (
            <li
              key={`${entry.time}-${i}`}
              className="flex flex-wrap items-baseline gap-x-3 px-4 py-2"
            >
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                {new Date(entry.time).toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-[var(--foreground)]">
                {entry.method} {entry.path}
              </span>
              <span
                className={`text-[10px] tracking-widest ${
                  entry.result === "denied" || entry.result === "error"
                    ? "text-[var(--red)]"
                    : "text-[var(--green)]"
                }`}
              >
                {entry.result.toUpperCase()}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">{entry.role}</span>
              {entry.error && (
                <span className="text-[10px] text-[var(--muted-foreground)]">{entry.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function OnboardingPanel({ reachable }: { reachable: boolean }) {
  if (reachable) return null;
  const steps = [
    {
      n: "1",
      title: "Pasang arsy di VPS",
      body: "sudo ./install.sh --domain <host> --email <email> --with-app --with-caddy (atau --dry-run dulu)",
    },
    {
      n: "2",
      title: "Set env di apps/api",
      body: "ARSY_URL=http://127.0.0.1:8787 ARSY_TOKEN_READONLY=<token>",
    },
    {
      n: "3",
      title: "Jalankan arsy serve",
      body: "systemctl status arsy.service; journalctl -u arsy -n 50",
    },
    {
      n: "4",
      title: "Verifikasi",
      body: 'curl -H "Authorization: Bearer <token>" http://127.0.0.1:8787/v1/host',
    },
  ];
  return (
    <ZineCardRough className="relative overflow-hidden p-5">
      <Tape className="-top-3 left-10 -rotate-3" />
      <p className="text-[10px] tracking-[0.25em] text-[var(--muted-foreground)]">ONBOARDING</p>
      <h2 className="mt-1 font-brush text-2xl text-[var(--foreground)]">
        ARSY <span className="text-[var(--primary)]">BELUM TERHUBUNG</span>
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
        Ikuti langkah berikut untuk menghubungkan dashboard ke control plane. Semua aksi tetap lewat
        CLI; dashboard hanya membaca.
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.n} className="flex gap-3">
            <span className="font-brush text-xl text-[var(--primary)]">{step.n}</span>
            <div>
              <p className="text-xs font-bold tracking-wider text-[var(--foreground)]">
                {step.title}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </ZineCardRough>
  );
}
export function ControlCenter() {
  return (
    <ControlGate>
      <ControlDashboard />
    </ControlGate>
  );
}

function CrewAndPlatformAuditSection() {
  const me = useAppCurrentUser();
  const isAdmin = me.data?.user.role === "admin";
  const usersQuery = useUsers(isAdmin);
  const auditQuery = useAuditLogs({ limit: 25 }, isAdmin);
  const createUserMutation = useCreateUser();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CrewRoleName>("editor");
  const [crewNotice, setCrewNotice] = useState<string | null>(null);

  if (!isAdmin) return null;

  const users = usersQuery.data?.users ?? [];
  const logs = auditQuery.data?.logs ?? [];

  function submitNewUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCrewNotice(null);
    createUserMutation.mutate(
      {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        displayName: displayName.trim() || username.trim(),
        password,
        role,
      },
      {
        onSuccess: (res) => {
          setUsername("");
          setEmail("");
          setDisplayName("");
          setPassword("");
          setCrewNotice(`Created crew account @${res.user.username} (${res.user.role}).`);
        },
        onError: (err: Error) => setCrewNotice(err.message),
      },
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
              IDENTITY &amp; RBAC
            </p>
            <h2 className="font-brush text-2xl text-[var(--foreground)]">
              CREW &amp; ACCESS MANAGEMENT
            </h2>
          </div>
          <Badge>{users.length} crew</Badge>
        </div>

        {crewNotice && (
          <p className="mt-3 border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-[var(--primary)]">
            {crewNotice}
          </p>
        )}

        <form onSubmit={submitNewUser} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="min-h-10 border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)]"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@moonwitness.org"
            className="min-h-10 border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)]"
          />
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
            className="min-h-10 border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)]"
          />
          <NativeSelect
            value={role}
            onChange={(e) => setRole(e.target.value as CrewRoleName)}
            className="min-h-10 border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)]"
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </NativeSelect>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (12+ chars)"
            className="min-h-10 border border-[var(--border)] bg-[var(--background)] px-3 text-xs text-[var(--foreground)] sm:col-span-2"
          />
          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className="btn-zine btn-pink min-h-10 px-4 py-2 text-xs sm:col-span-2"
          >
            {createUserMutation.isPending ? "PROVISIONING…" : "+ ADD CREW MEMBER"}
          </button>
        </form>

        <div className="mt-4 divide-y divide-[var(--line)] border border-[var(--border)]">
          {users.map((crew) => {
            const isSelf = me.data?.user.id === crew.id;
            return (
              <div
                key={crew.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--foreground)]">
                    {crew.displayName}{" "}
                    <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                      @{crew.username}
                    </span>
                  </div>
                  <div className="truncate font-mono text-[10px] text-[var(--muted-foreground)]">
                    {crew.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <NativeSelect
                    aria-label={`Role for ${crew.username}`}
                    disabled={isSelf || updateRoleMutation.isPending}
                    value={crew.role}
                    onChange={(e) =>
                      updateRoleMutation.mutate(
                        { id: crew.id, role: e.target.value as CrewRoleName },
                        { onError: (err: Error) => setCrewNotice(err.message) },
                      )
                    }
                    className="min-h-9 border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[11px] text-[var(--foreground)] disabled:opacity-50"
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </NativeSelect>
                  {!isSelf && (
                    <button
                      type="button"
                      disabled={deleteUserMutation.isPending}
                      onClick={() =>
                        deleteUserMutation.mutate(crew.id, {
                          onError: (err: Error) => setCrewNotice(err.message),
                        })
                      }
                      className="min-h-9 border border-[var(--red)]/60 px-2 font-mono text-[10px] text-[var(--red)] hover:bg-[var(--red)]/10"
                    >
                      REMOVE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
              OPS_AUDIT_LOGS
            </p>
            <h2 className="font-brush text-2xl text-[var(--foreground)]">PLATFORM AUDIT LOG</h2>
          </div>
          <button
            type="button"
            onClick={() => void auditQuery.refetch()}
            className="font-mono text-xs text-[var(--primary)] underline"
          >
            REFRESH
          </button>
        </div>
        <div className="mt-4 max-h-96 divide-y divide-[var(--line)] overflow-y-auto border border-[var(--border)]">
          {logs.length === 0 ? (
            <p className="p-4 text-xs text-[var(--muted-foreground)]">
              No platform audit entries recorded yet.
            </p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="space-y-0.5 px-3 py-2 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--primary)]">
                    [{entry.domain}] {entry.action} · {entry.entity}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {new Date(entry.occurredAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
                  <span>id: {entry.entityId}</span>
                  <span>
                    actor: {entry.actorId ?? "system"} ({entry.outcome})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
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
            <button
              type="button"
              onClick={handleLogout}
              className="btn-zine btn-paper px-3 py-2 text-[11px]"
            >
              KELUAR
            </button>
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
