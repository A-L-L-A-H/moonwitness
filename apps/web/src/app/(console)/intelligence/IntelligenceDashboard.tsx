"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { SRGBL_V8_STAGES } from "@moonwitness/canon";
import { CutoutArtwork, RadialGauge, SkinOrnament, Sparkline , NativeSelect } from "@moonwitness/ui";
import { MtimeHorizon } from "@moonwitness/ui/icons";
import {
  useRiotAiChat,
  useRiotAiHealth,
  type RiotAiConfig,
  type RiotAiMessage,
  type RiotAiModel,
  type RiotAiUsageOverview,
  type RiotAiConfigHistoryEntry,
} from "@/lib/api/riot-ai";
import { ArchiveMemoryBridge } from "./ArchiveMemoryBridge";

type EpistemicFrameMode = "standard" | "srgbl-v8" | "p18-witness" | "offside-onside";

const EPISTEMIC_FRAME_OPTIONS: readonly {
  readonly id: EpistemicFrameMode;
  readonly label: string;
  readonly prefix: string;
}[] = [
  { id: "standard", label: "STANDARD PROMPT", prefix: "" },
  {
    id: "srgbl-v8",
    label: "SRGBL v8 (S1–L5)",
    prefix: `[EPISTEMIC FRAME: SRGBL v8 Pipeline — ${SRGBL_V8_STAGES.map((s) => s.stage).join(" -> ")}. Distinguish verified facts from UNKNOWN.]`,
  },
  {
    id: "p18-witness",
    label: "P18 KEY WITNESS",
    prefix:
      "[EPISTEMIC FRAME: P18 Key Witness v0 — Evaluate Artifact/Edition/Passage spine, cite provenance explicitly, never invent certainty.]",
  },
  {
    id: "offside-onside",
    label: "OFFSIDE → ONSIDE",
    prefix:
      "[EPISTEMIC FRAME: WSI Semantic Frame Audit — Expose hidden assumptions before inference and separate source category from witness claim.]",
  },
];

interface IntelligenceDashboardProps {
  models: RiotAiModel[];
  modelsLoading: boolean;
  modelsError: string | null;
  onRefreshModels: () => void;
  query: string;
  config: RiotAiConfig | null;
  configError: string | null;
  canEditConfig: boolean;
  canChat?: boolean;
  usage: RiotAiUsageOverview | null;
  usageError: string | null;
  onRefreshConfig: () => void;
  onRefreshUsage: () => void;
  usageEntries: {
    actorId: string;
    provider: string;
    model: string;
    outcome: "success" | "failure";
    durationMs: number;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    errorCode: string | null;
    occurredAt: string;
  }[];
  usageLoading: boolean;
  configHistory: RiotAiConfigHistoryEntry[];
  historyLoading: boolean;
  configHistoryError: string | null;
  onRefreshHistory: () => void;
  onSaveConfig: (input: {
    label: string;
    enabled: boolean;
    preferredModel: string | null;
  }) => Promise<void>;
}

interface ConversationMessage extends RiotAiMessage {
  id: string;
}

function statusLabel(status: string | undefined, loading: boolean, failed: boolean): string {
  if (loading) return "CHECKING";
  if (failed) return "UNAVAILABLE";
  if (status === "healthy") return "ONLINE";
  if (status === "unhealthy") return "OFFLINE";
  return "NOT CONFIGURED";
}

function isPermissionFailure(message: string | null): boolean {
  return message !== null && /\b(401|403)\b|not authenticated|forbidden/i.test(message);
}

export function IntelligenceDashboard({
  models,
  modelsLoading,
  modelsError,
  onRefreshModels,
  query,
  config,
  configError,
  canEditConfig,
  canChat = canEditConfig,
  usage,
  usageError,
  onRefreshConfig,
  onRefreshUsage,
  usageEntries,
  usageLoading,
  configHistory,
  historyLoading,
  configHistoryError,
  onRefreshHistory,
  onSaveConfig,
}: IntelligenceDashboardProps) {
  const health = useRiotAiHealth();
  const chat = useRiotAiChat();
  const [selectedModel, setSelectedModel] = useState("");
  const [epistemicFrame, setEpistemicFrame] = useState<EpistemicFrameMode>("standard");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [configLabel, setConfigLabel] = useState("Local inference");
  const [configEnabled, setConfigEnabled] = useState(false);
  const [configModel, setConfigModel] = useState("");
  const [configSaving, setConfigSaving] = useState(false);
  const [configNotice, setConfigNotice] = useState<string | null>(null);
  const [configFailure, setConfigFailure] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingRequestRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const visibleModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? models.filter((model) => `${model.name} ${model.id}`.toLowerCase().includes(needle))
      : models;
  }, [models, query]);
  const activeModel = models.find((model) => model.id === selectedModel);
  const permissionError = isPermissionFailure(modelsError);
  const healthFailure = health.isError || health.data?.status === "unhealthy";
  const runtimeConfigurationFailure =
    health.data?.status === "misconfigured" || health.data?.status === "unconfigured";

  useEffect(() => {
    if (!config) return;
    setConfigLabel(config.label);
    setConfigEnabled(config.enabled);
    setConfigModel(config.preferredModel ?? "");
  }, [config]);

  useEffect(() => {
    if (!canChat) {
      setSelectedModel("");
      return;
    }
    if (models.length === 0) {
      setSelectedModel("");
      return;
    }
    if (!models.some((model) => model.id === selectedModel)) {
      setSelectedModel(models[0]?.id ?? "");
    }
  }, [canChat, models, selectedModel]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingContent]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawContent = draft.trim();
    if (!rawContent || !selectedModel || pendingRequestRef.current) return;

    const frameSpec = EPISTEMIC_FRAME_OPTIONS.find((opt) => opt.id === epistemicFrame);
    const content = frameSpec?.prefix ? `${frameSpec.prefix}\n\n${rawContent}` : rawContent;

    const nextMessages: ConversationMessage[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "user", content },
    ];
    setMessages(nextMessages);
    setDraft("");
    setChatError(null);
    setStreamingContent("");

    const controller = new AbortController();
    abortRef.current = controller;
    pendingRequestRef.current = true;
    try {
      const response = await chat.mutateAsync({
        model: selectedModel,
        messages: nextMessages.map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        })),
        signal: controller.signal,
        onContent: (chunk) => setStreamingContent((current) => current + chunk),
      });
      const answer = response.choices[0]?.message.content ?? "";
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: answer },
      ]);
      setStreamingContent("");
    } catch (error) {
      if (!controller.signal.aborted) {
        setChatError(error instanceof Error ? error.message : "Inference request failed.");
      }
      setStreamingContent("");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        pendingRequestRef.current = false;
      }
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  async function saveConfiguration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEditConfig || configSaving || (configEnabled && !configModel)) return;
    setConfigSaving(true);
    setConfigFailure(null);
    setConfigNotice(null);
    try {
      await onSaveConfig({
        label: configLabel.trim(),
        enabled: configEnabled,
        preferredModel: configModel || null,
      });
      setConfigNotice("Operator settings saved.");
      onRefreshConfig();
      onRefreshModels();
      void health.refetch();
    } catch (error) {
      setConfigFailure(
        error instanceof Error ? error.message : "Could not save operator settings.",
      );
    } finally {
      setConfigSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
      <header className="relative overflow-hidden flex flex-col justify-between gap-5 border-b-2 border-[var(--border)] pb-6 sm:flex-row sm:items-end">
        <CutoutArtwork
          id="oscilloscope-crt"
          decorative
          className="pointer-events-none absolute right-24 top-0 hidden h-24 w-24 text-[var(--primary)]/15 md:block"
        />
        <CutoutArtwork
          id="radar-sweep"
          decorative
          className="pointer-events-none absolute right-2 top-0 hidden h-24 w-24 text-[var(--accent)]/15 lg:block"
        />
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-[var(--primary)]">
            <MtimeHorizon className="h-4 w-4" />
            <span>LOCAL INFERENCE / OPERATOR CONSOLE</span>
          </p>
          <h1 className="mt-2 font-brush text-4xl text-[var(--foreground)] sm:text-5xl">
            RIOT INTELLIGENCE
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Inspect the configured local runtime and run an authenticated model conversation.
            Prompts are sent only to the operator-configured inference endpoint.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void health.refetch();
            onRefreshModels();
          }}
          disabled={health.isFetching || modelsLoading}
          className="btn-zine btn-blue min-h-11 px-4 py-2 text-xs disabled:cursor-wait disabled:opacity-50"
        >
          {health.isFetching || modelsLoading ? "REFRESHING…" : "REFRESH STATUS"}
        </button>
      </header>

      <section aria-label="Inference runtime status" className="grid gap-3 sm:grid-cols-3">
        <div className="border-2 border-[var(--border)] bg-[var(--card)] p-4">
          <p className="font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
            RUNTIME
          </p>
          <p className="mt-2 font-brush text-xl text-[var(--foreground)]">OLLAMA</p>
          <p
            className={`mt-1 text-xs ${
              health.data?.status === "healthy" ? "text-emerald-400" : "text-[var(--primary)]"
            }`}
            role="status"
          >
            {statusLabel(health.data?.status, health.isLoading, health.isError)}
          </p>
        </div>
        <div className="border-2 border-[var(--border)] bg-[var(--card)] p-4">
          <p className="font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
            RESPONSE TIME
          </p>
          <p className="mt-2 font-brush text-xl text-[var(--foreground)]">
            {health.data?.latencyMs != null ? `${health.data.latencyMs} ms` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {health.data?.lastCheckAt
              ? `Checked ${new Date(health.data.lastCheckAt).toLocaleTimeString()}`
              : "Awaiting health check"}
          </p>
        </div>
        <div className="border-2 border-[var(--border)] bg-[var(--card)] p-4">
          <p className="font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
            AVAILABLE MODELS
          </p>
          <p className="mt-2 font-brush text-xl text-[var(--foreground)]">{models.length}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Allowed by server configuration
          </p>
        </div>
      </section>

      {(healthFailure || runtimeConfigurationFailure || permissionError) && (
        <div
          className="border-2 border-[var(--yellow)]/50 bg-[var(--card)] p-4 text-sm text-[var(--foreground)]"
          role="alert"
        >
          <p className="font-brush text-lg text-[var(--primary)]">
            {permissionError
              ? "OPERATOR ACCESS REQUIRED"
              : health.data?.status === "misconfigured"
                ? "INFERENCE CONFIGURATION INVALID"
                : health.data?.status === "unconfigured"
                  ? "INFERENCE RUNTIME NOT CONFIGURED"
                  : "INFERENCE RUNTIME UNAVAILABLE"}
          </p>
          <p className="mt-1">
            {permissionError
              ? "Your account cannot access RIOT Intelligence. Sign in with an authorized operator account."
              : runtimeConfigurationFailure
                ? "An operator must configure a valid approved local inference endpoint before it can be used."
                : health.isError
                  ? health.error instanceof Error
                    ? health.error.message
                    : "Could not check the local inference runtime."
                  : (health.data?.error ?? "The configured runtime did not pass its health check.")}
          </p>
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="border-2 border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
                OPERATOR POLICY
              </p>
              <h2 className="mt-1 font-brush text-xl text-[var(--foreground)]">
                Runtime preference
              </h2>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-[10px] text-[var(--muted-foreground)]">
              {config?.enabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            The endpoint remains server-side; this panel only selects an approved model and runtime
            state.
          </p>
          {configError ? (
            <div className="mt-4 text-sm text-[var(--primary)]" role="alert">
              <p>
                {isPermissionFailure(configError) ? "Operator settings unavailable." : configError}
              </p>
              <button
                type="button"
                onClick={onRefreshConfig}
                className="mt-2 min-h-11 text-xs text-[var(--primary)] underline"
              >
                Retry configuration
              </button>
            </div>
          ) : !config ? (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]" role="status">
              Loading operator settings…
            </p>
          ) : !canEditConfig ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] tracking-widest text-[var(--muted-foreground)]">
                  PROFILE
                </dt>
                <dd className="mt-1 text-[var(--foreground)]">{config.label}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-widest text-[var(--muted-foreground)]">
                  PREFERRED MODEL
                </dt>
                <dd className="mt-1 break-all font-mono text-xs text-[var(--foreground)]">
                  {config.preferredModel ?? "Not selected"}
                </dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={saveConfiguration} className="mt-4 space-y-3">
              <label className="block text-xs text-[var(--muted-foreground)]">
                Profile label
                <input
                  value={configLabel}
                  onChange={(event) => setConfigLabel(event.target.value)}
                  maxLength={120}
                  required
                  className="mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)]"
                />
              </label>
              <label className="block text-xs text-[var(--muted-foreground)]">
                Approved model preference
                <NativeSelect
                  value={configModel}
                  onChange={(event) => setConfigModel(event.target.value)}
                  disabled={modelsLoading || models.length === 0}
                  className="mt-1 min-h-11 w-full border-2 border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--blue)] disabled:opacity-50"
                >
                  <option value="">No preferred model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.id})
                    </option>
                  ))}
                </NativeSelect>
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={configEnabled}
                  onChange={(event) => setConfigEnabled(event.target.checked)}
                  className="h-4 w-4 accent-[var(--pink)]"
                />
                Enable local inference for authorized operators
              </label>
              {configFailure && (
                <p className="text-sm text-red-300" role="alert">
                  {configFailure}
                </p>
              )}
              {configNotice && (
                <p className="text-sm text-emerald-400" role="status">
                  {configNotice}
                </p>
              )}
              <button
                type="submit"
                disabled={configSaving || (configEnabled && (!configModel || models.length === 0))}
                className="btn-zine btn-blue min-h-11 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {configSaving ? "SAVING…" : "SAVE OPERATOR SETTINGS"}
              </button>
            </form>
          )}
          {canEditConfig && (
            <section
              aria-label="Configuration audit history"
              className="mt-5 border-t border-[var(--border)] pt-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
                  CHANGE HISTORY
                </h3>
                <button
                  type="button"
                  onClick={onRefreshHistory}
                  className="min-h-11 text-xs text-[var(--primary)] underline"
                >
                  Refresh history
                </button>
              </div>
              {configHistoryError ? (
                <p className="mt-2 text-xs text-[var(--primary)]" role="alert">
                  Audit history is unavailable: {configHistoryError}
                </p>
              ) : historyLoading ? (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]" role="status">
                  Loading audit history…
                </p>
              ) : configHistory.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]" role="status">
                  No configuration changes are recorded yet.
                </p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {configHistory.map((entry) => (
                    <li
                      key={`${entry.entity_version}-${entry.action}`}
                      className="border border-[var(--border)] p-2 text-xs text-[var(--muted-foreground)]"
                    >
                      <p>
                        {entry.action} · version {entry.entity_version} ·{" "}
                        {entry.changed_by ?? "System"} ·{" "}
                        {new Date(entry.changed_at).toLocaleString()}
                      </p>
                      <p className="mt-1 break-all font-mono text-[10px] text-[var(--muted-foreground)]">
                        {entry.diff}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <div className="border-2 border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
                LAST 30 DAYS
              </p>
              <h2 className="mt-1 font-brush text-xl text-[var(--foreground)]">Usage summary</h2>
            </div>
            {canEditConfig && (
              <button
                type="button"
                onClick={onRefreshUsage}
                className="min-h-11 px-2 text-xs text-[var(--primary)] underline"
              >
                Refresh
              </button>
            )}
          </div>
          {!canEditConfig ? (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              Usage summaries are restricted to administrators.
            </p>
          ) : usageError ? (
            <p className="mt-4 text-sm text-[var(--primary)]" role="alert">
              {isPermissionFailure(usageError)
                ? "Administrator access is required to view usage."
                : usageError}
            </p>
          ) : !usage ? (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]" role="status">
              {usageLoading ? "Loading measured usage…" : "Usage summary is unavailable."}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {typeof usage.requests === "number" && usage.requests > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="flex items-center gap-3">
                    <RadialGauge
                      value={Math.max(0, usage.requests - (usage.failed ?? 0))}
                      max={usage.requests}
                      size={72}
                      label="OK RATE"
                      unit={`/${usage.requests}`}
                    />
                    <div>
                      <SkinOrnament slot="tag" label="TELEMETRY PULSE" />
                      <p className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">
                        {usageEntries.length > 0
                          ? `Latency trace (${usageEntries.length} calls)`
                          : "Awaiting per-call latency trace"}
                      </p>
                    </div>
                  </div>
                  {usageEntries.length > 0 && (
                    <div className="w-40">
                      <Sparkline
                        data={usageEntries.slice(0, 16).map((entry) => entry.durationMs)}
                        height={36}
                        ariaLabel="Inference request latency trend"
                      />
                    </div>
                  )}
                </div>
              )}
              <dl className="grid grid-cols-2 gap-3">
                <div className="border border-[var(--border)] p-3">
                  <dt className="text-[10px] tracking-widest text-[var(--muted-foreground)]">
                    REQUESTS
                  </dt>
                  <dd className="mt-1 font-brush text-2xl text-[var(--foreground)]">
                    {usage.requests ?? "Unavailable"}
                  </dd>
                </div>
                <div className="border border-[var(--border)] p-3">
                  <dt className="text-[10px] tracking-widest text-[var(--muted-foreground)]">
                    FAILED
                  </dt>
                  <dd className="mt-1 font-brush text-2xl text-[var(--foreground)]">
                    {usage.failed ?? "Unavailable"}
                  </dd>
                </div>
                {[
                  ["PROMPT TOKENS", usage.promptTokens],
                  ["COMPLETION TOKENS", usage.completionTokens],
                  ["TOTAL TOKENS", usage.totalTokens],
                ].map(([label, measurement]) => {
                  const tokenCount = measurement as RiotAiUsageOverview["totalTokens"];
                  return (
                    <div key={label as string} className="border border-[var(--border)] p-3">
                      <dt className="text-[10px] tracking-widest text-[var(--muted-foreground)]">
                        {label as string}
                      </dt>
                      <dd className="mt-1 font-mono text-sm text-[var(--foreground)]">
                        {tokenCount.measurement === "measured"
                          ? tokenCount.value
                          : tokenCount.measurement === "estimated"
                            ? `At least ${tokenCount.estimatedValue}`
                            : "Unavailable"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}
          {canEditConfig && !usageError && usage?.measurement === "estimated" && (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]" role="status">
              Token totals are lower-bound estimates because some requests omitted usage metrics.
            </p>
          )}
          {canEditConfig && !usageError && usage?.truncated && (
            <p className="mt-3 text-xs text-[var(--primary)]" role="status">
              Showing the latest 5,000 records; exact totals are unavailable because older records
              are omitted. Displayed token lower bounds remain estimates.
            </p>
          )}
          {canEditConfig && !usageError && usageEntries.length > 0 && (
            <div className="mt-4 overflow-x-auto border border-[var(--border)]">
              <table className="w-full min-w-[32rem] text-left text-xs">
                <thead className="bg-[var(--background)] font-mono text-[9px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  <tr>
                    <th scope="col" className="p-3">
                      Time
                    </th>
                    <th scope="col" className="p-3">
                      Actor
                    </th>
                    <th scope="col" className="p-3">
                      Model
                    </th>
                    <th scope="col" className="p-3">
                      Outcome
                    </th>
                    <th scope="col" className="p-3">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--foreground)]">
                  {usageEntries.map((entry) => (
                    <tr key={`${entry.actorId}-${entry.occurredAt}-${entry.model}`}>
                      <td className="whitespace-nowrap p-3">
                        {new Date(entry.occurredAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono">{entry.actorId}</td>
                      <td className="p-3 font-mono">{entry.model}</td>
                      <td className="p-3">{entry.outcome}</td>
                      <td className="p-3">{entry.durationMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canEditConfig &&
            !usageError &&
            usage?.measurement === "measured" &&
            usage.requests === 0 &&
            !usage.truncated && (
              <p className="mt-3 text-xs text-[var(--muted-foreground)]" role="status">
                No inference requests have been recorded in the reporting period.
              </p>
            )}
        </div>
      </section>

      <ArchiveMemoryBridge
        onAttachContext={(snippet) =>
          setDraft((previous) =>
            previous.trim() ? `${previous.trimEnd()}\n\n${snippet}` : snippet,
          )
        }
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
        <div className="border-2 border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between border-b-2 border-[var(--border)] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
                APPROVED CATALOG
              </p>
              <h2 className="mt-1 font-brush text-xl text-[var(--foreground)]">Models</h2>
            </div>
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              {visibleModels.length} shown
            </span>
          </div>
          {modelsLoading ? (
            <p className="p-5 text-sm text-[var(--muted-foreground)]" role="status">
              Loading approved models…
            </p>
          ) : modelsError ? (
            <div className="p-5" role="alert">
              <p className="font-brush text-lg text-[var(--primary)]">
                {permissionError ? "OPERATOR ACCESS REQUIRED" : "MODEL LIST UNAVAILABLE"}
              </p>
              <p className="mt-1 text-sm text-[var(--foreground)]">
                {permissionError
                  ? "Sign in with an authorized operator account to view approved models."
                  : modelsError}
              </p>
              {!permissionError && (
                <button
                  type="button"
                  onClick={onRefreshModels}
                  className="mt-3 min-h-11 text-xs text-[var(--primary)] underline"
                >
                  Retry model list
                </button>
              )}
            </div>
          ) : !canChat ? (
            <p className="p-5 text-sm text-[var(--muted-foreground)]">
              Editor or administrator access is required to view approved models and chat.
            </p>
          ) : visibleModels.length === 0 ? (
            <p className="p-5 text-sm text-[var(--muted-foreground)]">
              {models.length === 0
                ? "No approved models are available. Configure RIOT_AI_MODEL and verify the inference runtime."
                : "No approved models match this search."}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {visibleModels.map((model) => (
                <li key={model.id}>
                  <button
                    type="button"
                    aria-pressed={selectedModel === model.id}
                    onClick={() => setSelectedModel(model.id)}
                    disabled={!canChat}
                    className={`min-h-16 w-full px-4 py-3 text-left transition-colors hover:bg-white/5 disabled:cursor-default ${
                      selectedModel === model.id ? "border-l-4 border-[var(--pink)] bg-white/5" : ""
                    }`}
                  >
                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                      {model.name}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10px] text-[var(--muted-foreground)]">
                      {model.id} · {model.provider}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-h-[32rem] flex-col border-2 border-[var(--border)] bg-[var(--card)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--border)] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--primary)]">
                SECURE SESSION
              </p>
              <h2 className="mt-1 font-brush text-xl text-[var(--foreground)]">
                Inference console
              </h2>
            </div>
            <span className="max-w-48 truncate rounded-full border border-[var(--border)] px-3 py-1 font-mono text-[10px] text-[var(--muted-foreground)]">
              {activeModel?.id ?? "NO MODEL SELECTED"}
            </span>
          </div>

          <div
            className="flex-1 space-y-4 overflow-y-auto p-4"
            aria-label="Conversation"
            aria-live="polite"
          >
            {messages.length === 0 && !streamingContent && (
              <div className="flex min-h-56 flex-col items-center justify-center text-center">
                <p className="font-brush text-2xl text-[var(--foreground)]">READY WHEN YOU ARE</p>
                <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
                  Select an approved model and send a prompt to begin a private inference session.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] whitespace-pre-wrap break-words border-2 p-3 text-sm ${
                  message.role === "user"
                    ? "ml-auto border-[var(--blue)]/50 bg-[var(--blue)]/10 text-[var(--foreground)]"
                    : "mr-auto border-[var(--border)] bg-[var(--muted)]/60 text-[var(--foreground)]"
                }`}
              >
                <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  {message.role}
                </p>
                {message.content}
              </article>
            ))}
            {(chat.isPending || streamingContent) && (
              <article className="mr-auto max-w-[90%] whitespace-pre-wrap break-words border-2 border-[var(--border)] bg-[var(--muted)]/60 p-3 text-sm text-[var(--foreground)]">
                <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  assistant
                </p>
                {streamingContent || (
                  <span className="animate-pulse text-[var(--muted-foreground)]">Thinking…</span>
                )}
              </article>
            )}
            <div ref={endRef} />
          </div>

          {chatError && (
            <div
              className="mx-4 mb-3 border border-[var(--red)]/50 bg-[var(--red)]/10 p-3 text-sm text-[var(--red)]"
              role="alert"
            >
              {chatError}
            </div>
          )}

          <form onSubmit={submitMessage} className="border-t-2 border-[var(--border)] p-4">
            <div
              className="mb-3 flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Epistemic prompt framing"
            >
              <span className="mr-1 font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
                FRAME:
              </span>
              {EPISTEMIC_FRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={epistemicFrame === opt.id}
                  onClick={() => setEpistemicFrame(opt.id)}
                  className={`min-h-8 border px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors ${
                    epistemicFrame === opt.id
                      ? "border-[var(--blue)] bg-[var(--blue)]/20 text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--muted)]/60 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label htmlFor="riot-ai-prompt" className="sr-only">
              Message the selected inference model
            </label>
            <textarea
              id="riot-ai-prompt"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={48_000}
              rows={3}
              placeholder={
                selectedModel ? "Write a message… (Enter to send)" : "No approved model available"
              }
              disabled={!canChat || !selectedModel || chat.isPending || pendingRequestRef.current}
              className="min-h-20 w-full resize-y border-2 border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--blue)] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Shift+Enter for a new line · up to 48,000 characters
              </p>
              {chat.isPending || pendingRequestRef.current ? (
                canChat && (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="btn-zine min-h-11 border-red-400 px-5 py-2 text-xs text-red-300"
                  >
                    STOP GENERATION
                  </button>
                )
              ) : (
                <button
                  type="submit"
                  disabled={!canChat || !draft.trim() || !selectedModel}
                  className="btn-zine btn-pink min-h-11 px-5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  SEND PROMPT
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
