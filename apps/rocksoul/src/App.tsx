import React, { useEffect, useState } from "react";
import { Command, Search, X } from "lucide-react";
import { CreateIssueDialog, EditIssueDialog, RiotRail, SettingsDialog, Topbar } from "./components";
import { IllustratedStage } from "./components/ui/IllustratedStage";
import { Deck, Git, Monitor, Noise, Pit, WarRoom } from "./features";
import { isDesktop } from "./lib";
import { useAppStore } from "./store";
import { Awakening, PreviewRoom, RoomReturnButton, Threshold } from "./features/World";
import useMotionPreference from "./features/useMotionPreference";
import { pageRoutes, useWorldRouter } from "./router/useWorldRouter";
import type { Issue, IssueStatus, MilestoneStatus, UpdateIssueArgs } from "./lib/contracts";

const pageTitles: Record<string, string> = {
  deck: "WORKBENCH",
  monitor: "OVERSEER",
  pit: "THE PIT",
  git: "GIT JUNGLE",
  "war-room": "WAR ROOM",
  noise: "NOISE TAPE",
};

export default function App() {
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { reducedMotion, systemReducedMotion, toggleMotion } = useMotionPreference();
  const { destination, navigateDestination: navigateWorld, returnToThreshold } = useWorldRouter();
  const projectFilter = useAppStore((state) => state.projectFilter);
  const {
    page,
    setPage,
    refresh,
    refreshMonitor,
    openEcosystemUrl,
    loading,
    monitor,
    monitorLoading,
    monitorError,
    autoMonitor,
    gitPresetView,
    setAutoMonitor,
    setGitPresetView,
    issues,
    repositories,
    projects,
    milestones,
    events,
    selectedRepository,
    setSelectedRepository,
    setProjectFilter,
    createIssue,
    editIssue,
    deleteIssue,
    updateIssue,
    createProject,
    editProject,
    deleteProject,
    createMilestone,
    editMilestone,
    deleteMilestone,
    updateMilestone,
    addRepository,
    error,
  } = useAppStore();

  useEffect(() => {
    let active = true;
    Promise.all([refresh(), refreshMonitor()]).finally(() => {
      if (active) setHasLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [refresh, refreshMonitor]);

  useEffect(() => {
    if (!autoMonitor) return;
    if (destination !== "riot-deck" && !pageRoutes.includes(destination as any)) return;
    const interval = window.setInterval(() => {
      void refreshMonitor();
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [autoMonitor, destination, refreshMonitor]);

  useEffect(() => {
    if (pageRoutes.includes(destination as any)) {
      setPage(destination as any);
    }
  }, [destination, setPage]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCreateOpen(false);
        setSettingsOpen(false);
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runCommand = (item: string) => {
    setCommandOpen(false);
    setCommandQuery("");
    if (item === "create") setCreateOpen(true);
    else navigateDestination(item);
  };

  const removeIssue = async (issue: Issue) => {
    if (!window.confirm(`Delete ${issue.issue_key}: "${issue.title}"? This cannot be undone.`)) return;
    try {
      await deleteIssue(issue.id);
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : String(deleteError));
    }
  };

  const showProjectIssues = (projectId: string) => {
    setProjectFilter(projectId);
    navigateDestination("pit");
  };

  const setIssueStatus = async (issueId: string, status: IssueStatus) => {
    try {
      await updateIssue(issueId, status);
    } catch (statusError) {
      window.alert(statusError instanceof Error ? statusError.message : String(statusError));
    }
  };

  const setMilestoneStatus = async (milestoneId: string, status: MilestoneStatus) => {
    try {
      await updateMilestone(milestoneId, status);
    } catch (statusError) {
      window.alert(statusError instanceof Error ? statusError.message : String(statusError));
    }
  };

  const saveIssue = async (payload: UpdateIssueArgs) => {
    await editIssue(payload);
    setEditingIssue(null);
  };

  const navigateDestination = (dest: string) => {
    if (dest === "riot-deck" || pageRoutes.includes(dest as any)) {
      setPage(dest === "riot-deck" ? "deck" : (dest as any));
    }
    navigateWorld(dest as any);
  };

  const inspectRepoFromOverseer = (repositoryId: string, view: "status" | "patch" = "patch") => {
    setSelectedRepository(repositoryId);
    setGitPresetView(view);
    navigateDestination("git");
  };

  const refreshAll = async () => {
    await Promise.all([refresh(), refreshMonitor()]);
  };

  const primaryDisk = monitor?.disks?.[0];
  const onlineServices = monitor?.services?.filter((svc) => svc.status === "online").length ?? 0;
  const topbarMonitorSummary = monitor
    ? `${primaryDisk?.available ? `${primaryDisk.free_gb.toFixed(1)}G` : "LOCAL"} · ${onlineServices}/${monitor.services.length || 5}`
    : "OVERSEER";

  const filtered = Object.entries(pageTitles).filter(([key, title]) =>
    (title + " " + key).toLowerCase().includes(commandQuery.toLowerCase()),
  );

  if (destination === "awakening")
    return (
      <Awakening
        onEnter={() => navigateWorld("threshold")}
        reducedMotion={reducedMotion}
        onQuickWorkbench={() => navigateDestination("riot-deck")}
        onQuickMonitor={() => navigateDestination("monitor")}
      />
    );

  if (destination === "threshold")
    return (
      <>
        <Threshold
          onNavigate={navigateDestination}
          reducedMotion={reducedMotion}
          systemReducedMotion={systemReducedMotion}
          onToggleMotion={toggleMotion}
          onSettings={() => setSettingsOpen(true)}
          onCreateIssue={() => setCreateOpen(true)}
          recentIssue={issues[0] ?? null}
          recentIssueReady={hasLoaded && !loading && !error}
        />
        {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      </>
    );

  if (destination !== "riot-deck" && !pageRoutes.includes(destination as any))
    return (
      <PreviewRoom
        roomId={destination}
        onReturn={returnToThreshold}
        onNavigate={navigateDestination}
        reducedMotion={reducedMotion}
        systemReducedMotion={systemReducedMotion}
        onToggleMotion={toggleMotion}
      />
    );

  return (
    <div className="app-shell riot-room-shell" data-reduced-motion={reducedMotion}>
      <IllustratedStage scene="riot-deck" destination="riot-deck" reducedMotion={reducedMotion} subtle />
      <RiotRail page={page} onNavigate={navigateDestination} onSwitchboard={() => setCommandOpen(true)} />
      <div className="app-main">
        <Topbar
          repositories={repositories}
          selectedRepository={selectedRepository}
          onRepositoryChange={setSelectedRepository}
          onCommand={() => setCommandOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onOpenMonitor={() => navigateDestination("monitor")}
          onRefresh={() => {
            void refreshAll();
          }}
          monitorSummary={topbarMonitorSummary}
        />
        <RoomReturnButton
          onReturn={returnToThreshold}
          reducedMotion={reducedMotion}
          systemReducedMotion={systemReducedMotion}
          onToggleMotion={toggleMotion}
        />
        <div className="screen-heading">
          <span>
            THE RIOT DECK / <b>{pageTitles[page]}</b>
          </span>
          <span className="screen-clock">
            {isDesktop() ? "NATIVE DESKTOP / PRIVATE" : "BROWSER PREVIEW / LOCAL DATA"}
          </span>
        </div>
        {error && <div className="global-error">{error}</div>}
        {page === "deck" && (
          <Deck
            issues={issues}
            repositories={repositories}
            events={events}
            monitor={monitor}
            dataReady={hasLoaded && !loading && !error}
            loading={loading || !hasLoaded}
            onCreate={() => setCreateOpen(true)}
            onStatusChange={setIssueStatus}
            onNavigate={navigateDestination}
            onInspectRepo={(repoId) => inspectRepoFromOverseer(repoId, "status")}
            onOpenUrl={(url) => {
              void openEcosystemUrl(url);
            }}
          />
        )}
        {page === "monitor" && (
          <Monitor
            snapshot={monitor}
            loading={monitorLoading}
            error={monitorError}
            autoMonitor={autoMonitor}
            desktop={isDesktop()}
            onToggleAuto={setAutoMonitor}
            onRefresh={() => {
              void refreshMonitor();
            }}
            onInspectRepoPatch={(repoId) => inspectRepoFromOverseer(repoId, "patch")}
            onOpenUrl={(url) => {
              void openEcosystemUrl(url);
            }}
          />
        )}
        {page === "pit" && (
          <Pit
            issues={issues}
            projects={projects}
            projectFilter={projectFilter}
            onProjectFilter={setProjectFilter}
            onCreate={() => setCreateOpen(true)}
            onStatusChange={setIssueStatus}
            onEdit={setEditingIssue}
            onDelete={removeIssue}
          />
        )}
        {page === "git" && (
          <Git
            repositories={repositories}
            initialSelectedId={selectedRepository}
            initialView={gitPresetView ?? undefined}
            onAddRepository={addRepository}
            onRefresh={refreshAll}
          />
        )}
        {page === "war-room" && (
          <WarRoom
            projects={projects}
            milestones={milestones}
            issues={issues}
            onCreateProject={createProject}
            onUpdateProject={editProject}
            onDeleteProject={deleteProject}
            onCreateMilestone={createMilestone}
            onUpdateMilestone={editMilestone}
            onDeleteMilestone={deleteMilestone}
            onMilestoneStatus={setMilestoneStatus}
            onProjectIssues={showProjectIssues}
          />
        )}
        {page === "noise" && <Noise events={events} />}
        <footer className="app-footer">
          <span>
            ROCKSOUL - DX <b>0.1.0</b>
          </span>
          <span>YOUR MACHINE / YOUR CREW / YOUR RULES</span>
          <span>
            LOCAL FIRST <i />
          </span>
        </footer>
      </div>
      {createOpen && (
        <CreateIssueDialog
          onClose={() => setCreateOpen(false)}
          onCreate={createIssue}
          projects={projects}
          repositories={repositories}
        />
      )}
      {editingIssue && (
        <EditIssueDialog
          issue={editingIssue}
          projects={projects}
          repositories={repositories}
          onClose={() => setEditingIssue(null)}
          onSave={saveIssue}
        />
      )}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {commandOpen && (
        <div
          className="command-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setCommandOpen(false)}
        >
          <div className="command-panel">
            <div className="command-search">
              <Search />
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="WHERE TO, TROUBLEMAKER?"
              />
              <kbd>ESC</kbd>
              <button className="icon-button" onClick={() => setCommandOpen(false)}>
                <X size={17} />
              </button>
            </div>
            {filtered.map(([key, title]) => (
              <button className="command-option" key={key} onClick={() => runCommand(key)}>
                <span>{title}</span>
                <kbd>↵</kbd>
              </button>
            ))}
            <button className="command-option create-option" onClick={() => runCommand("create")}>
              <span>+ CREATE NEW CHAOS</span>
              <kbd>
                <Command size={12} /> N
              </kbd>
            </button>
            <div className="command-hint">COMMAND DECK / LOCAL ACTIONS ONLY</div>
          </div>
        </div>
      )}
    </div>
  );
}
