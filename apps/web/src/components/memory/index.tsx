"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge, Button, Card, CardContent, SkinOrnament } from "@moonwitness/ui";
import { Download, MemoryTapeNode, RefreshCw } from "@moonwitness/ui/icons";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import {
  fetchMemoryServiceArchives,
  fetchMemoryServiceDashboard,
  fetchMemoryServiceJobs,
  fetchMemoryServiceKnowledge,
  fetchMemoryServiceSources,
  fetchMemoryServiceSystem,
  formatMemoryContextPrompt,
  getMemoryServiceExportUrl,
  resumeMemoryJob,
  triggerArchiveBackup,
  uploadMemoryArchive,
  type MemoryArchive,
  type MemoryCounts,
  type MemoryJob,
  type MemoryKnowledgeRecord,
  type MemorySourceData,
  type MemorySystemInfo,
} from "@/lib/api/memory";
import { ArchiveUploadPanel } from "./archive-upload-panel";
import { CorpusSearchPanel } from "./corpus-search-panel";
import { JobQueuePanel } from "./job-queue-panel";
import { MemoryInspectorDrawer } from "./memory-inspector-drawer";

type MemoryTab = "knowledge" | "vault" | "queue";

export function MemoryWorkspace() {
  const [tab, setTab] = useState<MemoryTab>("knowledge");
  const [shellSearch, setShellSearch] = useState("");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [counts, setCounts] = useState<MemoryCounts>({
    archives: 0,
    messages: 0,
    knowledge: 0,
    active_jobs: 0,
    failed_jobs: 0,
  });
  const [system, setSystem] = useState<MemorySystemInfo | null>(null);
  const [archives, setArchives] = useState<MemoryArchive[]>([]);
  const [jobs, setJobs] = useState<MemoryJob[]>([]);
  const [knowledge, setKnowledge] = useState<MemoryKnowledgeRecord[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("");
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [backupBusyId, setBackupBusyId] = useState<string | null>(null);
  const [resumeBusyId, setResumeBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MemoryKnowledgeRecord | null>(null);
  const [sources, setSources] = useState<MemorySourceData | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const [sys, dash, arc, jb, know] = await Promise.all([
        fetchMemoryServiceSystem(),
        fetchMemoryServiceDashboard(),
        fetchMemoryServiceArchives(200),
        fetchMemoryServiceJobs(200),
        fetchMemoryServiceKnowledge({ q: submittedQuery || undefined, limit: 30 }),
      ]);
      setSystem(sys);
      setCounts(dash);
      setArchives(arc);
      setJobs(jb);
      setKnowledge(know);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [submittedQuery]);

  useEffect(() => {
    void refreshAll();
    const timer = window.setInterval(() => void refreshAll(), 15_000);
    return () => window.clearInterval(timer);
  }, [refreshAll]);

  const archiveById = useMemo(() => new Map(archives.map((item) => [item.id, item])), [archives]);
  const kinds = useMemo(
    () =>
      Array.from(new Set(knowledge.map((item) => (item.kind || "concept").toLowerCase()))).sort(),
    [knowledge],
  );
  const visibleKnowledge = useMemo(() => {
    const shellNeedle = shellSearch.trim().toLowerCase();
    return knowledge.filter((item) => {
      const kindOk = kindFilter === "all" || (item.kind || "concept").toLowerCase() === kindFilter;
      const needleOk =
        !shellNeedle ||
        item.title.toLowerCase().includes(shellNeedle) ||
        item.summary.toLowerCase().includes(shellNeedle);
      return kindOk && needleOk;
    });
  }, [kindFilter, knowledge, shellSearch]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    try {
      const results = await fetchMemoryServiceKnowledge({ q: trimmed || undefined, limit: 30 });
      setKnowledge(results);
      setNotice(`${results.length} knowledge record(s) loaded.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleClearSearch() {
    setQuery("");
    setSubmittedQuery("");
    setKindFilter("all");
    setSearching(true);
    try {
      const latest = await fetchMemoryServiceKnowledge({ limit: 30 });
      setKnowledge(latest);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to load knowledge.");
    } finally {
      setSearching(false);
    }
  }

  async function handleUpload(file: File) {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "zip" && ext !== "json") {
      setNotice("Unsupported file type: upload a .zip export or conversations.json.");
      return;
    }
    setUploading(true);
    setUploadName(file.name);
    setUploadProgress(0);
    try {
      const res = await uploadMemoryArchive(file, (pct) => setUploadProgress(pct));
      setNotice(
        res.duplicate
          ? "Duplicate archive already stored in Vault."
          : "Archive queued for indexing.",
      );
      await refreshAll();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadName(null);
    }
  }

  async function handleBackup(archiveId: string) {
    setBackupBusyId(archiveId);
    try {
      const res = await triggerArchiveBackup(archiveId);
      setNotice(
        res.status === "already_uploaded" ? "Archive already backed up." : "Drive backup queued.",
      );
      await refreshAll();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Backup failed.");
    } finally {
      setBackupBusyId(null);
    }
  }

  async function handleResume(jobId: string) {
    setResumeBusyId(jobId);
    try {
      await resumeMemoryJob(jobId);
      setNotice("Job resumed from saved checkpoint.");
      await refreshAll();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Resume failed.");
    } finally {
      setResumeBusyId(null);
    }
  }

  async function handleInspect(record: MemoryKnowledgeRecord) {
    setSelected(record);
    setSources(null);
    setSourceError(null);
    setSourceLoading(true);
    try {
      setSources(await fetchMemoryServiceSources(record.id));
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "Source provenance lookup failed.");
    } finally {
      setSourceLoading(false);
    }
  }

  async function handleCopy(record: MemoryKnowledgeRecord) {
    try {
      await navigator.clipboard.writeText(formatMemoryContextPrompt(record));
      setNotice(`Copied "${record.title}" context snippet.`);
    } catch {
      setNotice("Clipboard permission blocked by browser.");
    }
  }

  return (
    <ConsoleShellAdapter
      plane="creator"
      breadcrumb="Memory Vault"
      search={{
        value: shellSearch,
        onChange: setShellSearch,
        placeholder: "Filter visible memory records…",
      }}
    >
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="left-2 top-2" />
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <MemoryTapeNode className="h-5 w-5 text-[var(--primary)]" />
                <Badge variant="outline">
                  {online === null
                    ? "CHECKING SERVICE"
                    : online
                      ? "MEMORY ONLINE"
                      : "SERVICE OFFLINE"}
                </Badge>
                {system?.gemini_configured && (
                  <Badge variant="outline">{system.gemini_model}</Badge>
                )}
                {system?.embeddings_enabled && <Badge variant="outline">VECTORS ON</Badge>}
              </div>
              <h1 className="font-brush text-2xl text-[var(--card-foreground)]">
                HOW U REMIND ME — ARCHIVE MEMORY
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void refreshAll()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={getMemoryServiceExportUrl()} download="moonwitness-knowledge.ndjson">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export NDJSON
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {notice && (
          <p
            role="status"
            className="border border-[var(--border)] bg-[var(--card)] px-3 py-2 font-mono text-xs text-[var(--card-foreground)]"
          >
            {notice}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "ARCHIVES", value: counts.archives },
            { label: "MESSAGES", value: counts.messages },
            { label: "KNOWLEDGE", value: counts.knowledge },
            { label: "ACTIVE JOBS", value: counts.active_jobs },
            { label: "FAILED JOBS", value: counts.failed_jobs },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="py-3">
                <p className="font-mono text-[10px] tracking-widest text-[var(--muted-foreground)]">
                  {stat.label}
                </p>
                <p className="mt-1 font-brush text-2xl text-[var(--card-foreground)]">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Memory workspace sections">
          {(
            [
              { id: "knowledge", label: "Knowledge Corpus" },
              { id: "vault", label: `Vault & Upload (${archives.length})` },
              { id: "queue", label: `Worker Queue (${jobs.length})` },
            ] as const
          ).map((item) => (
            <Button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              variant={tab === item.id ? "default" : "outline"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {tab === "knowledge" && (
          <CorpusSearchPanel
            query={query}
            onQueryChange={setQuery}
            searching={searching}
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            kinds={kinds}
            records={visibleKnowledge}
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            onInspect={handleInspect}
            onCopy={handleCopy}
          />
        )}

        {tab === "vault" && (
          <ArchiveUploadPanel
            archives={archives}
            uploading={uploading}
            uploadName={uploadName}
            uploadProgress={uploadProgress}
            backupBusyId={backupBusyId}
            driveConfigured={Boolean(system?.drive_configured)}
            onUpload={handleUpload}
            onBackup={handleBackup}
          />
        )}

        {tab === "queue" && (
          <JobQueuePanel
            jobs={jobs}
            archiveById={archiveById}
            resumeBusyId={resumeBusyId}
            onResume={handleResume}
          />
        )}

        <MemoryInspectorDrawer
          record={selected}
          sources={sources}
          loading={sourceLoading}
          error={sourceError}
          onClose={() => setSelected(null)}
        />
      </div>
    </ConsoleShellAdapter>
  );
}
