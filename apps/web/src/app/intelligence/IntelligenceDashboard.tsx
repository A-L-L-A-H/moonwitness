"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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

interface IntelligenceDashboardProps {
  models: RiotAiModel[];
  modelsLoading: boolean;
  modelsError: string | null;
  onRefreshModels: () => void;
  query: string;
  config: RiotAiConfig | null;
  configError: string | null;
  canEditConfig: boolean;
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
    if (!canEditConfig) {
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
  }, [canEditConfig, models, selectedModel]);

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
    const content = draft.trim();
    if (!content || !selectedModel || pendingRequestRef.current) return;

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
      <header className="flex flex-col justify-between gap-5 border-b-2 border-[var(--line)] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-[var(--blue)]">
            LOCAL INFERENCE / OPERATOR CONSOLE
          </p>
          <h1 className="mt-2 font-brush text-4xl text-zinc-100 sm:text-5xl">RIOT INTELLIGENCE</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
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
        <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500">RUNTIME</p>
          <p className="mt-2 font-brush text-xl text-zinc-100">OLLAMA</p>
          <p
            className={`mt-1 text-xs ${
              health.data?.status === "healthy" ? "text-emerald-400" : "text-[var(--yellow)]"
            }`}
            role="status"
          >
            {statusLabel(health.data?.status, health.isLoading, health.isError)}
          </p>
        </div>
        <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500">RESPONSE TIME</p>
          <p className="mt-2 font-brush text-xl text-zinc-100">
            {health.data?.latencyMs != null ? `${health.data.latencyMs} ms` : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {health.data?.lastCheckAt
              ? `Checked ${new Date(health.data.lastCheckAt).toLocaleTimeString()}`
              : "Awaiting health check"}
          </p>
        </div>
        <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-4">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500">AVAILABLE MODELS</p>
          <p className="mt-2 font-brush text-xl text-zinc-100">{models.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Allowed by server configuration</p>
        </div>
      </section>

      {(healthFailure || runtimeConfigurationFailure || permissionError) && (
        <div
          className="border-2 border-[var(--yellow)]/50 bg-[var(--panel)] p-4 text-sm text-zinc-300"
          role="alert"
        >
          <p className="font-brush text-lg text-[var(--yellow)]">
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
        <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--blue)]">
                OPERATOR POLICY
              </p>
              <h2 className="mt-1 font-brush text-xl text-zinc-100">Runtime preference</h2>
            </div>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[10px] text-zinc-400">
              {config?.enabled ? "ENABLED" : "DISABLED"}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            The endpoint remains server-side; this panel only selects an approved model and runtime
            state.
          </p>
          {configError ? (
            <div className="mt-4 text-sm text-[var(--yellow)]" role="alert">
              <p>
                {isPermissionFailure(configError) ? "Operator settings unavailable." : configError}
              </p>
              <button
                type="button"
                onClick={onRefreshConfig}
                className="mt-2 min-h-11 text-xs text-[var(--blue)] underline"
              >
                Retry configuration
              </button>
            </div>
          ) : !config ? (
            <p className="mt-4 text-sm text-zinc-400" role="status">
              Loading operator settings…
            </p>
          ) : !canEditConfig ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] tracking-widest text-zinc-500">PROFILE</dt>
                <dd className="mt-1 text-zinc-200">{config.label}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-widest text-zinc-500">PREFERRED MODEL</dt>
                <dd className="mt-1 break-all font-mono text-xs text-zinc-200">
                  {config.preferredModel ?? "Not selected"}
                </dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={saveConfiguration} className="mt-4 space-y-3">
              <label className="block text-xs text-zinc-400">
                Profile label
                <input
                  value={configLabel}
                  onChange={(event) => setConfigLabel(event.target.value)}
                  maxLength={120}
                  required
                  className="mt-1 min-h-11 w-full border-2 border-[var(--line)] bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-[var(--blue)]"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Approved model preference
                <select
                  value={configModel}
                  onChange={(event) => setConfigModel(event.target.value)}
                  disabled={modelsLoading || models.length === 0}
                  className="mt-1 min-h-11 w-full border-2 border-[var(--line)] bg-black/30 px-3 text-sm text-zinc-100 outline-none focus:border-[var(--blue)] disabled:opacity-50"
                >
                  <option value="">No preferred model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.id})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-300">
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
              className="mt-5 border-t border-[var(--line)] pt-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-mono text-[10px] tracking-widest text-zinc-500">
                  CHANGE HISTORY
                </h3>
                <button
                  type="button"
                  onClick={onRefreshHistory}
                  className="min-h-11 text-xs text-[var(--blue)] underline"
                >
                  Refresh history
                </button>
              </div>
              {configHistoryError ? (
                <p className="mt-2 text-xs text-[var(--yellow)]" role="alert">
                  Audit history is unavailable: {configHistoryError}
                </p>
              ) : historyLoading ? (
                <p className="mt-2 text-xs text-zinc-500" role="status">
                  Loading audit history…
                </p>
              ) : configHistory.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-500" role="status">
                  No configuration changes are recorded yet.
                </p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {configHistory.map((entry) => (
                    <li
                      key={`${entry.entity_version}-${entry.action}`}
                      className="border border-[var(--line)] p-2 text-xs text-zinc-400"
                    >
                      <p>
                        {entry.action} · version {entry.entity_version} ·{" "}
                        {entry.changed_by ?? "System"} ·{" "}
                        {new Date(entry.changed_at).toLocaleString()}
                      </p>
                      <p className="mt-1 break-all font-mono text-[10px] text-zinc-500">
                        {entry.diff}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--pink)]">
                LAST 30 DAYS
              </p>
              <h2 className="mt-1 font-brush text-xl text-zinc-100">Usage summary</h2>
            </div>
            {canEditConfig && (
              <button
                type="button"
                onClick={onRefreshUsage}
                className="min-h-11 px-2 text-xs text-[var(--blue)] underline"
              >
                Refresh
              </button>
            )}
          </div>
          {!canEditConfig ? (
            <p className="mt-4 text-sm text-zinc-500">
              Usage summaries are restricted to administrators.
            </p>
          ) : usageError ? (
            <p className="mt-4 text-sm text-[var(--yellow)]" role="alert">
              {isPermissionFailure(usageError)
                ? "Administrator access is required to view usage."
                : usageError}
            </p>
          ) : !usage ? (
            <p className="mt-4 text-sm text-zinc-400" role="status">
              {usageLoading ? "Loading measured usage…" : "Usage summary is unavailable."}
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="border border-[var(--line)] p-3">
                <dt className="text-[10px] tracking-widest text-zinc-500">REQUESTS</dt>
                <dd className="mt-1 font-brush text-2xl text-zinc-100">
                  {usage.requests ?? "Unavailable"}
                </dd>
              </div>
              <div className="border border-[var(--line)] p-3">
                <dt className="text-[10px] tracking-widest text-zinc-500">FAILED</dt>
                <dd className="mt-1 font-brush text-2xl text-zinc-100">
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
                  <div key={label as string} className="border border-[var(--line)] p-3">
                    <dt className="text-[10px] tracking-widest text-zinc-500">{label as string}</dt>
                    <dd className="mt-1 font-mono text-sm text-zinc-200">
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
          )}
          {canEditConfig && !usageError && usage?.measurement === "estimated" && (
            <p className="mt-2 text-xs text-zinc-400" role="status">
              Token totals are lower-bound estimates because some requests omitted usage metrics.
            </p>
          )}
          {canEditConfig && !usageError && usage?.truncated && (
            <p className="mt-3 text-xs text-[var(--yellow)]" role="status">
              Showing the latest 5,000 records; exact totals are unavailable because older records
              are omitted. Displayed token lower bounds remain estimates.
            </p>
          )}
          {canEditConfig && !usageError && usageEntries.length > 0 && (
            <div className="mt-4 overflow-x-auto border border-[var(--line)]">
              <table className="w-full min-w-[32rem] text-left text-xs">
                <thead className="bg-black/30 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
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
                <tbody className="divide-y divide-[var(--line)] text-zinc-300">
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
              <p className="mt-3 text-xs text-zinc-500" role="status">
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
        <div className="border-2 border-[var(--line)] bg-[var(--panel)]">
          <div className="flex items-center justify-between border-b-2 border-[var(--line)] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--blue)]">
                APPROVED CATALOG
              </p>
              <h2 className="mt-1 font-brush text-xl text-zinc-100">Models</h2>
            </div>
            <span className="font-mono text-xs text-zinc-500">{visibleModels.length} shown</span>
          </div>
          {modelsLoading ? (
            <p className="p-5 text-sm text-zinc-400" role="status">
              Loading approved models…
            </p>
          ) : modelsError ? (
            <div className="p-5" role="alert">
              <p className="font-brush text-lg text-[var(--yellow)]">
                {permissionError ? "OPERATOR ACCESS REQUIRED" : "MODEL LIST UNAVAILABLE"}
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {permissionError
                  ? "Sign in with an authorized operator account to view approved models."
                  : modelsError}
              </p>
              {!permissionError && (
                <button
                  type="button"
                  onClick={onRefreshModels}
                  className="mt-3 min-h-11 text-xs text-[var(--blue)] underline"
                >
                  Retry model list
                </button>
              )}
            </div>
          ) : !canEditConfig ? (
            <p className="p-5 text-sm text-zinc-400">
              Administrator access is required to view approved model options.
            </p>
          ) : visibleModels.length === 0 ? (
            <p className="p-5 text-sm text-zinc-400">
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
                    disabled={!canEditConfig}
                    className={`min-h-16 w-full px-4 py-3 text-left transition-colors hover:bg-white/5 disabled:cursor-default ${
                      selectedModel === model.id ? "border-l-4 border-[var(--pink)] bg-white/5" : ""
                    }`}
                  >
                    <span className="block truncate text-sm font-medium text-zinc-100">
                      {model.name}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10px] text-zinc-500">
                      {model.id} · {model.provider}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-h-[32rem] flex-col border-2 border-[var(--line)] bg-[var(--panel)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--line)] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[var(--pink)]">
                SECURE SESSION
              </p>
              <h2 className="mt-1 font-brush text-xl text-zinc-100">Inference console</h2>
            </div>
            <span className="max-w-48 truncate rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[10px] text-zinc-400">
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
                <p className="font-brush text-2xl text-zinc-300">READY WHEN YOU ARE</p>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">
                  Select an approved model and send a prompt to begin a private inference session.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] whitespace-pre-wrap break-words border-2 p-3 text-sm ${
                  message.role === "user"
                    ? "ml-auto border-[var(--blue)]/50 bg-[var(--blue)]/10 text-zinc-100"
                    : "mr-auto border-[var(--line)] bg-black/20 text-zinc-200"
                }`}
              >
                <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                  {message.role}
                </p>
                {message.content}
              </article>
            ))}
            {(chat.isPending || streamingContent) && (
              <article className="mr-auto max-w-[90%] whitespace-pre-wrap break-words border-2 border-[var(--line)] bg-black/20 p-3 text-sm text-zinc-200">
                <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                  assistant
                </p>
                {streamingContent || <span className="animate-pulse text-zinc-500">Thinking…</span>}
              </article>
            )}
            <div ref={endRef} />
          </div>

          {chatError && (
            <div
              className="mx-4 mb-3 border border-red-500/50 bg-red-950/20 p-3 text-sm text-red-200"
              role="alert"
            >
              {chatError}
            </div>
          )}

          <form onSubmit={submitMessage} className="border-t-2 border-[var(--line)] p-4">
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
              disabled={
                !canEditConfig || !selectedModel || chat.isPending || pendingRequestRef.current
              }
              className="min-h-20 w-full resize-y border-2 border-[var(--line)] bg-black/30 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[var(--blue)] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] text-zinc-600">
                Shift+Enter for a new line · up to 48,000 characters
              </p>
              {chat.isPending || pendingRequestRef.current ? (
                canEditConfig && (
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
                  disabled={!canEditConfig || !draft.trim() || !selectedModel}
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
