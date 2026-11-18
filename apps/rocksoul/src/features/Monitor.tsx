import React from "react";
import {
  Activity,
  ArrowUpRight,
  Cpu,
  ExternalLink,
  FolderGit2,
  GitBranch,
  HardDrive,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
} from "lucide-react";
import { FOUR_ENTRY_DOORS, PRIME_CODE_AXIOMS, SUPREME_IDENTITY } from "@moonwitness/canon";
import { thumbSignalUrl } from "../assets/art";
import { KatanaSkyHud } from "../components/ui/KatanaSkyHud";
import { AnarchyStarSigil } from "../components/ui/RocksoulVectors";
import type { DevServiceEntry, DevServiceTarget, MonitorSnapshot } from "../lib/contracts";

export interface MonitorProps {
  snapshot: MonitorSnapshot | null;
  devServices?: DevServiceEntry[];
  devActionTarget?: string | null;
  devActionError?: string;
  loading: boolean;
  error: string;
  autoMonitor: boolean;
  desktop: boolean;
  onToggleAuto: (enabled: boolean) => void;
  onRefresh: () => void;
  onInspectRepoPatch: (repositoryId: string) => void;
  onOpenUrl: (url: string) => void;
  onStartDev?: (target: DevServiceTarget) => void;
  onStopDev?: (target: DevServiceTarget) => void;
}

const SERVICE_FALLBACKS = [
  { id: "allah", name: "A-L-L-A-H Sanctuary", url: "http://127.0.0.1:3000" },
  { id: "web", name: "MoonWitness Web", url: "http://127.0.0.1:3000/moonwitness" },
  { id: "api", name: "Core API", url: "http://127.0.0.1:3002" },
  { id: "arsy", name: "ARSY Control Plane", url: "http://127.0.0.1:8787" },
  { id: "memory", name: "Memory Engine", url: "http://127.0.0.1:8000" },
] as const;

function shortSessionId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Monitor({
  snapshot,
  devServices = [],
  devActionTarget = null,
  devActionError = "",
  loading,
  error,
  autoMonitor,
  desktop,
  onToggleAuto,
  onRefresh,
  onInspectRepoPatch,
  onOpenUrl,
  onStartDev,
  onStopDev,
}: MonitorProps) {
  const disks = snapshot?.disks ?? [];
  const primaryDisk = disks[0];
  const secondaryDisk = disks[1];
  const services = snapshot?.services?.length
    ? snapshot.services
    : SERVICE_FALLBACKS.map((svc) => ({
        ...svc,
        status: "offline",
        http_status: null,
        latency_ms: null,
      }));
  const onlineServices = services.filter((svc) => svc.status === "online").length;
  const totalDirty = (snapshot?.repositories ?? []).reduce((acc, repo) => acc + repo.dirty_count, 0);
  const sessions = snapshot?.agent_sessions ?? [];
  const plans = snapshot?.plans ?? [];
  const devByTarget = new Map(devServices.map((entry) => [entry.id, entry]));
  const anyDevRunning =
    devServices.some((entry) => entry.managed || entry.listening) ||
    services.some((svc) => (svc.id === "allah" || svc.id === "web" || svc.id === "api") && svc.status !== "offline");
  const allDevRunning =
    (devServices.length > 0 && devServices.every((entry) => entry.managed || entry.listening)) ||
    (["web", "api"].every((id) => services.some((svc) => svc.id === id && svc.status !== "offline")));

  const resolveDevTarget = (serviceId: string): "web" | "api" | null => {
    if (serviceId === "allah" || serviceId === "web") return "web";
    if (serviceId === "api") return "api";
    return null;
  };

  return (
    <section className="page-content workspace-page monitor-page">
      <header className="workspace-title">
        <div className="workspace-title-copy">
          <span className="eyebrow">00 / LIVE OVERSEER &amp; AGENT TELEMETRY</span>
          <h1>OVERSEER</h1>
          <p>
            Read-only real-time monitor for agent activity, active checkouts, C:/Z: disk pressure, and MoonWitness ecosystem ports.
          </p>
        </div>
        <div className="workspace-title-aside">
          <div className="workspace-art-plate" aria-hidden="true">
            <img src={thumbSignalUrl} alt="" loading="lazy" />
            <div className="workspace-art-scrim" />
            <div className="workspace-art-meta">
              <AnarchyStarSigil className="rs-anarchy-sigil workspace-art-sigil" />
              <span>SECTOR 00 // OVERSEER</span>
            </div>
          </div>
          <div className="monitor-head-actions">
            <button
              type="button"
              className={`outline-button ${autoMonitor ? "selected" : ""}`}
              aria-pressed={autoMonitor}
              onClick={() => onToggleAuto(!autoMonitor)}
            >
              <Activity size={14} /> AUTO 10S {autoMonitor ? "ON" : "OFF"}
            </button>
            <button type="button" className="riot-button" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} /> REFRESH
            </button>
          </div>
        </div>
      </header>

      {error && <p className="inline-notice error-output">{error}</p>}
      {!desktop && (
        <p className="inline-notice">
          BROWSER PREVIEW MODE — Native C:/Z: disk steward, Antigravity session scanner, and live loopback TCP probes run inside the desktop Tauri app.
        </p>
      )}

      <KatanaSkyHud monitor={snapshot} mode="astrolabe" onOpenUrl={onOpenUrl} />

      <div className="monitor-summary-grid">
        <article className="riot-panel monitor-stat-card">
          <span className="eyebrow">SYSTEM DRIVE ({primaryDisk?.drive ?? "C:"})</span>
          <strong className={`monitor-stat-value tier-${primaryDisk?.tier ?? "unavailable"}`}>
            {primaryDisk?.available ? `${primaryDisk.free_gb.toFixed(2)} GB` : "DESKTOP ONLY"}
          </strong>
          <small>
            {primaryDisk?.available
              ? `${primaryDisk.used_pct.toFixed(0)}% used · ${(primaryDisk.tier || "calm").toUpperCase()} · Z: ${secondaryDisk?.available ? `${secondaryDisk.free_gb.toFixed(1)} GB free` : "N/A"}`
              : "Disk telemetry available in native Windows build"}
          </small>
        </article>
        <article className="riot-panel monitor-stat-card">
          <span className="eyebrow">WORKING TREE DELTA</span>
          <strong className="monitor-stat-value">{totalDirty} CHANGED</strong>
          <small>
            {(snapshot?.repositories.length ?? 0)} connected checkout(s) tracked live
          </small>
        </article>
        <article className="riot-panel monitor-stat-card">
          <span className="eyebrow">AGENT SESSIONS</span>
          <strong className="monitor-stat-value">{sessions.length} RECENT</strong>
          <small>
            {sessions[0]
              ? `Latest: ${sessions[0].last_tool} (${sessions[0].step_count} steps)`
              : "No recent local session logs detected"}
          </small>
        </article>
        <article className="riot-panel monitor-stat-card">
          <span className="eyebrow">ECOSYSTEM STACK</span>
          <strong className="monitor-stat-value">
            {onlineServices} / {services.length} ONLINE
          </strong>
          <small>
            Last poll: {snapshot?.generated_at ? formatTime(snapshot.generated_at) : "not polled"}
          </small>
        </article>
      </div>

      <div className="monitor-grid">
        <section className="riot-panel monitor-panel-wide">
          <div className="panel-heading cream">
            <span>
              <Cpu size={15} /> LIVE GIT WORKTREES &amp; AGENT CHANGES
            </span>
            <span>READ-ONLY SNAPSHOT</span>
          </div>
          <div className="monitor-panel-body">
            {snapshot?.repositories.length ? (
              snapshot.repositories.map((repo) => (
                <article className="monitor-repo-card" key={repo.id}>
                  <header className="monitor-repo-head">
                    <div>
                      <strong className="monitor-repo-title">
                        <GitBranch size={15} /> {repo.name}
                      </strong>
                      <small className="monitor-repo-path">{repo.path}</small>
                    </div>
                    <div className="monitor-repo-badges">
                      <span className="monitor-badge branch">⑂ {repo.branch || "HEAD"}</span>
                      <span className={`monitor-badge ${repo.dirty_count > 0 ? "dirty" : "clean"}`}>
                        {repo.dirty_count} DIRTY ({repo.staged_count} STAGED · {repo.untracked_count} NEW)
                      </span>
                      <span className="monitor-badge">{repo.worktree_count} WORKTREE</span>
                      <button
                        type="button"
                        className="outline-button"
                        onClick={() => onInspectRepoPatch(repo.id)}
                      >
                        INSPECT PATCH <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </header>
                  {repo.head_subject && (
                    <div className="monitor-head-commit">
                      <code>{repo.head_hash}</code>
                      <span>{repo.head_subject}</span>
                      <time>{repo.head_age}</time>
                    </div>
                  )}
                  <div className="monitor-repo-columns">
                    <div>
                      <span className="eyebrow">CHANGED FILES ({repo.changed_files.length})</span>
                      {repo.changed_files.length ? (
                        <ul className="monitor-code-list">
                          {repo.changed_files.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="monitor-muted">Working tree is clean.</p>
                      )}
                    </div>
                    <div>
                      <span className="eyebrow">RECENT COMMITS</span>
                      {repo.recent_commits.length ? (
                        <ul className="monitor-commit-list">
                          {repo.recent_commits.map((entry) => (
                            <li key={entry}>{entry}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="monitor-muted">No commits read.</p>
                      )}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state compact-empty">
                <b>NO CHECKOUTS CONNECTED.</b>
                <span>Connect moonwitness in GIT to watch live diffs, worktrees, and commits.</span>
              </div>
            )}
          </div>
        </section>

        <section className="riot-panel">
          <div className="panel-heading pink">
            <span>
              <Activity size={15} /> ANTIGRAVITY AGENT SESSIONS &amp; PLANS
            </span>
            <span>{sessions.length} SESSIONS</span>
          </div>
          <div className="monitor-panel-body">
            {sessions.length ? (
              <div className="monitor-session-list">
                {sessions.map((session) => (
                  <div className="monitor-session-row" key={session.session_id}>
                    <div>
                      <b>{shortSessionId(session.session_id)}</b>
                      <small>
                        {session.last_type} · {session.last_tool}
                      </small>
                    </div>
                    <div className="monitor-session-meta">
                      <span className="monitor-badge">{session.step_count} STEPS</span>
                      <span className="monitor-badge clean">{session.last_status}</span>
                      <time>{formatTime(session.updated_at)}</time>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="monitor-muted">
                No local Antigravity transcript logs found under ~/.gemini/antigravity/brain.
              </p>
            )}

            {plans.length > 0 && (
              <div className="monitor-plans-block">
                <span className="eyebrow">WORKSPACE PLANS &amp; CHECKLISTS ({plans.length})</span>
                {plans.map((plan) => (
                  <div className="monitor-plan-row" key={plan.path}>
                    <span>{plan.name}</span>
                    <b>
                      {plan.completed_tasks}/{plan.total_tasks} DONE
                      {plan.partial_tasks > 0 ? ` (${plan.partial_tasks} PARTIAL)` : ""}
                    </b>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="riot-panel">
          <div className="panel-heading purple-head">
            <span>
              <HardDrive size={15} /> WORKSTATION DISK STEWARD (READ-ONLY)
            </span>
            <span>SAFE OBSERVER</span>
          </div>
          <div className="monitor-panel-body">
            {disks.length ? (
              <div className="monitor-disk-list">
                {disks.map((disk) => (
                  <div className="monitor-disk-row" key={disk.mount_path}>
                    <div className="monitor-disk-head">
                      <b>
                        {disk.drive} ({disk.mount_path})
                      </b>
                      <span className={`monitor-tier tier-${disk.tier}`}>{disk.tier.toUpperCase()}</span>
                    </div>
                    <div className="monitor-bar">
                      <span
                        className={`tier-bg-${disk.tier}`}
                        style={{ width: `${Math.min(100, Math.max(0, disk.used_pct))}%` }}
                      />
                    </div>
                    <small>
                      {disk.available
                        ? `${disk.free_gb.toFixed(2)} GB free of ${disk.total_gb.toFixed(2)} GB (${disk.used_pct.toFixed(1)}% used)`
                        : "Drive unavailable"}
                    </small>
                  </div>
                ))}
                {primaryDisk?.available && primaryDisk.free_gb < 10 && (
                  <p className="inline-notice">
                    C: below 10 GB calm buffer — review npm/Playwright/Chrome caches after closing active sessions. Steward never auto-deletes files.
                  </p>
                )}
              </div>
            ) : (
              <p className="monitor-muted">
                Disk steward volume metrics activate in the Windows desktop app.
              </p>
            )}
          </div>
        </section>

        <section className="riot-panel monitor-panel-wide">
          <div className="panel-heading cream">
            <span>
              <FolderGit2 size={15} /> MOONWITNESS ECOSYSTEM NODES &amp; A-L-L-A-H CANON BRIDGE
            </span>
            <div className="monitor-dev-controls">
              {desktop && onStartDev && (
                <button
                  type="button"
                  disabled={Boolean(devActionTarget) || allDevRunning}
                  onClick={() => onStartDev("all")}
                  title="Start Web (:3000) and Core API (:3002) dev servers"
                >
                  <Play size={11} /> {devActionTarget === "all" ? "WORKING…" : "START DEV"}
                </button>
              )}
              {desktop && onStopDev && (
                <button
                  type="button"
                  disabled={Boolean(devActionTarget) || !anyDevRunning}
                  onClick={() => onStopDev("all")}
                  title="Stop Web (:3000) and Core API (:3002) dev servers"
                >
                  <Square size={11} /> STOP DEV
                </button>
              )}
              <span>{onlineServices} ACTIVE PORT(S)</span>
            </div>
          </div>
          <div className="monitor-panel-body monitor-services-wrap">
            {devActionError && <p className="inline-notice error-output">{devActionError}</p>}
            <div className="monitor-services-grid">
              {services.map((svc) => {
                const target = resolveDevTarget(svc.id);
                const managedEntry = target ? devByTarget.get(target) : undefined;
                const isRunning = Boolean(
                  managedEntry?.managed || managedEntry?.listening || svc.status !== "offline",
                );
                const lastLog = managedEntry?.recent_logs?.[managedEntry.recent_logs.length - 1];
                return (
                  <div className="monitor-service-card" key={svc.id}>
                    <div className="monitor-service-top">
                      <b>{svc.name}</b>
                      <span className={`monitor-badge ${svc.status === "online" ? "clean" : svc.status === "degraded" ? "dirty" : ""}`}>
                        {svc.status === "offline" && managedEntry?.managed
                          ? "BOOTING"
                          : svc.status.toUpperCase()}
                        {svc.latency_ms !== null ? ` · ${svc.latency_ms}ms` : ""}
                      </span>
                    </div>
                    <small>{svc.url}</small>
                    {managedEntry?.pid && (
                      <small className="monitor-service-meta">PID {managedEntry.pid}</small>
                    )}
                    {managedEntry?.last_error && (
                      <small className="error-output">{managedEntry.last_error}</small>
                    )}
                    {!managedEntry?.last_error && lastLog && (
                      <small className="monitor-service-log" title={lastLog}>
                        {lastLog}
                      </small>
                    )}
                    <div className="monitor-service-actions">
                      <button type="button" className="outline-button" onClick={() => onOpenUrl(svc.url)}>
                        LAUNCH <ExternalLink size={12} />
                      </button>
                      {desktop && target && onStartDev && onStopDev && (
                        isRunning ? (
                          <button
                            type="button"
                            className="outline-button monitor-stop-btn"
                            disabled={Boolean(devActionTarget)}
                            onClick={() => onStopDev(target)}
                          >
                            <Square size={11} /> STOP
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="outline-button monitor-start-btn"
                            disabled={Boolean(devActionTarget)}
                            onClick={() => onStartDev(target)}
                          >
                            <Play size={11} /> START
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="monitor-canon-strip">
              <div className="monitor-canon-head">
                <span>
                  <ShieldCheck size={14} /> @MOONWITNESS/CANON SSOT · {SUPREME_IDENTITY.creativeFormula}
                </span>
                <small>{PRIME_CODE_AXIOMS.length} PRIME AXIOMS</small>
              </div>
              <div className="monitor-doors-row">
                {FOUR_ENTRY_DOORS.map((door) => (
                  <div className="monitor-door-chip" key={door.id}>
                    <b>{door.numeral}</b>
                    <span>{door.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
