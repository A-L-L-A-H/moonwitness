"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  Collection,
  FeedItem,
  MissionAlert,
  Module,
  PipelineCard,
  PipelineColumn,
  Project,
  QuickAction,
  WorkspaceItem,
  Workflow,
} from "@moonwitness/contracts/types";
import {
  collections,
  feedItems,
  initialAlerts,
  initialWorkflows,
  modules,
  pipeline,
  projects,
  workspaceItems,
} from "@/lib/data";
import {
  CommandCenterApiError,
  type CommandCenterStats,
  createCommandCenterWorkflow,
  dismissCommandCenterAlert,
  fetchCommandCenterState,
  fetchCommandCenterStats,
  toggleCommandCenterWorkflow,
} from "@/lib/api/command-center";
import type { ItemDrawerDetail } from "./item-drawer";

export interface CommandCenterState {
  query: string;
  setQuery: (v: string) => void;
  openModule: Module | null;
  detail: ItemDrawerDetail | null;
  toast: string | null;
  selectedCity: string | null;
  setSelectedCity: (id: string) => void;
  closeOverlays: () => void;
  alerts: MissionAlert[];
  visible: {
    workspace: WorkspaceItem[];
    pipeline: PipelineColumn[];
    collections: Collection[];
    projects: Project[];
    feed: FeedItem[];
    workflows: Workflow[];
  };
  onAction: (a: QuickAction) => void;
  onOpenModule: (m: Module) => void;
  onOpenWorkspaceItem: (id: string) => void;
  onOpenCard: (card: PipelineCard) => void;
  onOpenCollection: (id: string) => void;
  onQueue: (m: Module) => void;
  onDismissAlert: (id: string) => void;
  onToggleWorkflow: (id: string) => void;
  stats: CommandCenterStats | null;
  statsStatus: "loading" | "live" | "offline";
  previousFocus: HTMLElement | null;
  setPreviousFocus: (el: HTMLElement | null) => void;
}

const LIVE_FEED_COLORS: Record<string, string> = {
  TIMELINE: "var(--pink)",
  IDENTITY: "var(--blue)",
  "COMMAND-CENTER": "var(--yellow)",
  RADIUS: "var(--green)",
  CONTROL: "var(--primary)",
};

export function useCommandCenter(): CommandCenterState {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [openModule, setOpenModule] = useState<Module | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [alerts, setAlerts] = useState<MissionAlert[]>(initialAlerts);
  const [feed, setFeed] = useState<FeedItem[]>(feedItems);
  const [stats, setStats] = useState<CommandCenterStats | null>(null);
  const [statsStatus, setStatsStatus] = useState<"loading" | "live" | "offline">("loading");
  const [toast, setToast] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [detail, setDetail] = useState<ItemDrawerDetail | null>(null);
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const m = modules.find((mod) => mod.id === params.get("module"));
    if (m) setOpenModule(m);
  }, [params]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetchCommandCenterState(controller.signal),
      fetchCommandCenterStats(controller.signal),
    ])
      .then(([snapshot, statsSnapshot]) => {
        setWorkflows(snapshot.workflows);
        setAlerts(snapshot.alerts);
        if (Array.isArray(snapshot.feed) && snapshot.feed.length > 0) {
          setFeed(
            snapshot.feed.map((entry, idx) => ({
              id: `live-feed-${idx}-${entry.tag}`,
              text: `[${entry.tag}] ${entry.msg}`,
              ago: entry.time,
              color: LIVE_FEED_COLORS[entry.tag] ?? "var(--blue)",
            })),
          );
        }
        setStats(statsSnapshot);
        setStatsStatus("live");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setStatsStatus("offline");
        if (error instanceof CommandCenterApiError && error.status === 401) {
          setToast("Read-only preview: sign in via /shadow to save workflows and alerts.");
          return;
        }
        const message = error instanceof Error ? error.message : "Backend unavailable";
        setToast(`Offline command state fallback (${message}).`);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const closeOverlays = useCallback(() => {
    setOpenModule(null);
    setDetail(null);
    if (previousFocus) {
      previousFocus.focus();
      setPreviousFocus(null);
    }
  }, [previousFocus]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeOverlays();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeOverlays]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => ({
      workspace: q
        ? workspaceItems.filter((w) => w.title.toLowerCase().includes(q))
        : workspaceItems,
      pipeline: q
        ? pipeline.map((c) => ({
            ...c,
            items: c.items.filter((i) => i.title.toLowerCase().includes(q)),
          }))
        : pipeline,
      collections: q ? collections.filter((c) => c.name.toLowerCase().includes(q)) : collections,
      projects: q ? projects.filter((p) => p.title.toLowerCase().includes(q)) : projects,
      feed: q ? feed.filter((f) => f.text.toLowerCase().includes(q)) : feed,
      workflows: q
        ? workflows.filter((w) => `${w.name} ${w.detail}`.toLowerCase().includes(q))
        : workflows,
    }),
    [feed, q, workflows],
  );

  function onAction(a: QuickAction) {
    const m = modules.find((mod) => mod.id === a.moduleId);
    if (m) {
      setPreviousFocus(document.activeElement as HTMLElement);
      setOpenModule(m);
    }
  }

  function onOpenModule(m: Module) {
    setPreviousFocus(document.activeElement as HTMLElement);
    setOpenModule(m);
  }

  function onOpenWorkspaceItem(id: string) {
    const item = workspaceItems.find((w) => w.id === id);
    if (!item) return;
    setPreviousFocus(document.activeElement as HTMLElement);
    setDetail({
      title: item.title,
      subtitle: item.kind,
      rows: [
        { label: "STATUS", value: item.status },
        { label: "UPDATED", value: item.updatedAt },
      ],
    });
  }

  function onOpenCard(card: PipelineCard) {
    setPreviousFocus(document.activeElement as HTMLElement);
    setDetail({
      title: card.title,
      subtitle: card.type,
      art: card.thumb,
      rows: [{ label: "TYPE", value: card.type }],
    });
  }

  function onOpenCollection(id: string) {
    const c = collections.find((x) => x.id === id);
    if (!c) return;
    setPreviousFocus(document.activeElement as HTMLElement);
    setDetail({
      title: c.name,
      subtitle: "COLLECTION",
      art: c.cover,
      rows: [{ label: "EPISODES", value: String(c.episodes) }],
    });
  }

  function formatMutationError(error: unknown, fallback: string): string {
    if (error instanceof CommandCenterApiError && error.status === 401) {
      return "Sign in via /shadow to persist Command Center changes.";
    }
    return error instanceof Error ? error.message : fallback;
  }

  function onQueue(m: Module) {
    setOpenModule(null);
    void createCommandCenterWorkflow({
      name: `${m.name} Run`,
      detail: "Queued from module console…",
      status: "Queued",
    })
      .then((wf) => {
        setWorkflows((ws) => [wf, ...ws]);
        setStats((s) => (s ? { ...s, workflows: s.workflows + 1, queued: s.queued + 1 } : s));
        setToast(`${m.name}: new run queued and saved.`);
      })
      .catch((error: unknown) => {
        setToast(formatMutationError(error, `Could not queue ${m.name}.`));
      });
  }

  function onDismissAlert(id: string) {
    void dismissCommandCenterAlert(id)
      .then(() => {
        setAlerts((list) => list.filter((a) => a.id !== id));
        setStats((s) => (s ? { ...s, alerts: Math.max(0, s.alerts - 1) } : s));
        setToast("Alert dismissed.");
      })
      .catch((error: unknown) => {
        setToast(formatMutationError(error, "Could not dismiss alert."));
      });
  }

  function onToggleWorkflow(id: string) {
    void toggleCommandCenterWorkflow(id)
      .then((updated) => {
        setWorkflows((ws) => ws.map((w) => (w.id === id ? updated : w)));
        setStats((s) => {
          if (!s) return s;
          const previous = workflows.find((w) => w.id === id);
          if (!previous) return s;
          const statusKey = (status: Workflow["status"]) =>
            status.charAt(0).toLowerCase() + status.slice(1);
          const before = statusKey(previous.status) as keyof CommandCenterStats;
          const after = statusKey(updated.status) as keyof CommandCenterStats;
          return {
            ...s,
            [before]: Math.max(0, (s[before] as number) - 1),
            [after]: (s[after] as number) + 1,
          };
        });
        setToast(`${updated.name}: ${updated.status}.`);
      })
      .catch((error: unknown) => {
        setToast(formatMutationError(error, "Could not update workflow status."));
      });
  }

  return {
    query,
    setQuery,
    openModule,
    detail,
    toast,
    selectedCity,
    setSelectedCity,
    closeOverlays,
    alerts,
    visible,
    onAction,
    onOpenModule,
    onOpenWorkspaceItem,
    onOpenCard,
    onOpenCollection,
    onQueue,
    onDismissAlert,
    onToggleWorkflow,
    stats,
    statsStatus,
    previousFocus,
    setPreviousFocus,
  };
}
