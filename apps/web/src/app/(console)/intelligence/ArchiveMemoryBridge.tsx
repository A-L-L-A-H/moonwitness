"use client";

import { useState, type FormEvent } from "react";
import {
  formatMemoryContextPrompt,
  getMemoryExportUrl,
  useMemoryKnowledge,
  useMemoryStatus,
  type MemoryKnowledgeRecord,
} from "@/lib/api/memory";

interface ArchiveMemoryBridgeProps {
  onAttachContext: (snippet: string) => void;
}

export function ArchiveMemoryBridge({ onAttachContext }: ArchiveMemoryBridgeProps) {
  const status = useMemoryStatus();
  const [searchInput, setSearchInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [attachedId, setAttachedId] = useState<string | null>(null);

  const bridgeConfigured = status.data?.configured ?? false;
  const bridgeReachable = status.data?.reachable ?? false;
  const knowledge = useMemoryKnowledge(submittedQuery, bridgeConfigured && bridgeReachable, 8);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(searchInput.trim());
  }

  function handleAttach(record: MemoryKnowledgeRecord) {
    onAttachContext(formatMemoryContextPrompt(record));
    setAttachedId(record.id);
  }

  const badgeText = status.isLoading
    ? "CHECKING BRIDGE"
    : status.isError
      ? "BRIDGE UNAVAILABLE"
      : !bridgeConfigured
        ? "OPTIONAL / NOT CONFIGURED"
        : bridgeReachable
          ? `ONLINE · ${status.data?.counts?.knowledge ?? 0} RECORDS`
          : "CONFIGURED / OFFLINE";

  return (
    <section
      aria-label="Archive memory bridge"
      className="border-2 border-[var(--line)] bg-[var(--panel)] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-widest text-[var(--blue)]">
            SOVEREIGN KNOWLEDGE BRIDGE · PORT 8000 / 3005
          </p>
          <h2 className="mt-1 font-brush text-2xl text-zinc-100">Archive Memory</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Search distilled knowledge from local ChatGPT archives and attach verified context into
            your inference prompt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`border px-2.5 py-1 font-mono text-[10px] tracking-wider ${
              bridgeReachable
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-[var(--line)] bg-black/30 text-zinc-400"
            }`}
            role="status"
          >
            {badgeText}
          </span>
          {bridgeConfigured && bridgeReachable && (
            <a
              href={getMemoryExportUrl()}
              download="moonwitness-knowledge.ndjson"
              className="inline-flex min-h-11 items-center border border-[var(--line)] px-3 py-2 font-mono text-[10px] tracking-wider text-zinc-200 transition-colors hover:border-[var(--blue)] hover:text-white"
            >
              EXPORT NDJSON
            </a>
          )}
        </div>
      </div>

      {status.isError ? (
        <p className="mt-4 text-xs text-zinc-400">
          Archive memory bridge could not be queried right now. Core inference controls above remain
          available.
        </p>
      ) : !bridgeConfigured ? (
        <div className="mt-4 space-y-2 text-xs text-zinc-400">
          <p>
            Set <code className="font-mono text-zinc-200">MEMORY_API_URL</code> (for example{" "}
            <code className="font-mono text-zinc-200">http://127.0.0.1:8000</code>) on{" "}
            <code className="font-mono text-zinc-200">@moonwitness/api</code> to enable archive
            knowledge search from this console.
          </p>
          <p className="font-mono text-[11px] text-zinc-500">
            Vault ingest: launch <span className="text-zinc-300">apps/memory</span> stack (port 3005
            / API 8000) and upload{" "}
            <span className="text-zinc-300">chatgpt_mohrezzafahlevi.zip</span>.
          </p>
        </div>
      ) : !bridgeReachable ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--yellow)]">
            {status.data?.error ?? "Archive memory backend is offline."}
          </p>
          <button
            type="button"
            onClick={() => void status.refetch()}
            className="min-h-11 border border-[var(--line)] px-3 py-2 font-mono text-[10px] tracking-wider text-zinc-200 hover:border-[var(--blue)]"
          >
            RETRY BRIDGE
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {status.data?.counts && (
            <dl className="grid gap-3 sm:grid-cols-4">
              <div className="border border-[var(--line)] bg-black/20 px-3 py-2">
                <dt className="font-mono text-[9px] tracking-widest text-zinc-500">ARCHIVES</dt>
                <dd className="mt-1 font-brush text-lg text-zinc-100">
                  {status.data.counts.archives}
                </dd>
              </div>
              <div className="border border-[var(--line)] bg-black/20 px-3 py-2">
                <dt className="font-mono text-[9px] tracking-widest text-zinc-500">MESSAGES</dt>
                <dd className="mt-1 font-brush text-lg text-zinc-100">
                  {status.data.counts.messages}
                </dd>
              </div>
              <div className="border border-[var(--line)] bg-black/20 px-3 py-2">
                <dt className="font-mono text-[9px] tracking-widest text-zinc-500">KNOWLEDGE</dt>
                <dd className="mt-1 font-brush text-lg text-zinc-100">
                  {status.data.counts.knowledge}
                </dd>
              </div>
              <div className="border border-[var(--line)] bg-black/20 px-3 py-2">
                <dt className="font-mono text-[9px] tracking-widest text-zinc-500">EMBEDDINGS</dt>
                <dd className="mt-1 font-mono text-xs text-zinc-200">
                  {status.data.system?.embeddings_enabled
                    ? status.data.system.embedding_model
                    : "FTS ONLY"}
                </dd>
              </div>
            </dl>
          )}

          <form
            onSubmit={submitSearch}
            className="flex flex-wrap items-center gap-2"
            aria-label="Search archive knowledge"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search archive knowledge, decisions, architecture..."
              aria-label="Search archive knowledge"
              className="min-h-11 min-w-0 flex-1 border-2 border-[var(--line)] bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[var(--blue)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={knowledge.isFetching}
              className="btn-zine btn-blue min-h-11 px-4 py-2 text-xs disabled:opacity-50"
            >
              {knowledge.isFetching ? "SEARCHING..." : "SEARCH MEMORY"}
            </button>
            {submittedQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSubmittedQuery("");
                }}
                className="min-h-11 border border-[var(--line)] px-3 py-2 font-mono text-[10px] tracking-wider text-zinc-300 hover:border-zinc-400"
              >
                CLEAR
              </button>
            )}
          </form>

          {knowledge.isLoading ? (
            <p className="text-xs text-zinc-400" role="status">
              Loading archive knowledge...
            </p>
          ) : knowledge.isError ? (
            <p className="text-xs text-[var(--yellow)]" role="alert">
              {knowledge.error instanceof Error
                ? knowledge.error.message
                : "Could not load archive knowledge."}
            </p>
          ) : !knowledge.data || knowledge.data.records.length === 0 ? (
            <p className="text-xs text-zinc-500" role="status">
              {submittedQuery
                ? `No archive knowledge matched "${submittedQuery}".`
                : "No distilled archive knowledge records yet."}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {knowledge.data.records.map((record) => (
                <li
                  key={record.id}
                  className="flex min-w-0 flex-col justify-between gap-3 border border-[var(--line)] bg-black/25 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--pink)]">
                        {record.kind}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {Math.round(record.confidence * 100)}% conf
                      </span>
                    </div>
                    <h3 className="mt-1 break-words text-sm font-semibold text-zinc-100">
                      {record.title}
                    </h3>
                    {(record.summary || record.content) && (
                      <p className="mt-1 line-clamp-3 break-words text-xs text-zinc-400">
                        {record.summary || record.content}
                      </p>
                    )}
                    {record.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {record.tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="border border-[var(--line)] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleAttach(record)}
                      className="min-h-11 border border-[var(--line)] px-3 py-1.5 font-mono text-[10px] tracking-wider text-zinc-200 transition-colors hover:border-[var(--pink)] hover:text-white"
                    >
                      {attachedId === record.id ? "ATTACHED TO PROMPT" : "ATTACH TO PROMPT"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
