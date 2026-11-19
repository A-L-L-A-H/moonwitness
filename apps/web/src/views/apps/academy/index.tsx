"use client";

import { useEffect, useState, type FormEvent } from "react";
import { requestApiJson } from "@moonwitness/contracts/sdk";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CutoutArtwork,
  Input,
  SkinOrnament,
  Textarea,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface WitnessModuleEntry {
  code: string;
  name: string;
  stage: number;
  description?: string;
}

interface WitnessRunResult {
  data?: {
    run_key?: string;
    verdict?: string;
    confidence?: number;
    output_hash?: string;
    stages?: Array<{ code: string; status: string; score?: number }>;
  };
}

interface MizanEvaluateResult {
  data?: {
    decision_id?: string;
    top_option?: string;
    verdict?: string;
    rankings?: Array<{ option: string; score: number }>;
  };
}

export function AcademyWitnessMizanView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<string>("witness.claim");
  const [modules, setModules] = useState<WitnessModuleEntry[]>([]);
  const [claimText, setClaimText] = useState(
    "All primary witness testimonies require explicit provenance hashes and non-coercion.",
  );
  const [sourceRef, setSourceRef] = useState("QS 2:256 / P18-CANON");
  const [runResult, setRunResult] = useState<WitnessRunResult["data"] | null>(null);
  const [replayStatus, setReplayStatus] = useState<string | null>(null);
  const [mizanTitle, setMizanTitle] = useState("Select primary archive replication strategy");
  const [mizanOptions, setMizanOptions] = useState("D1-Edge-Replica, Local-SQLite-Vault, R2-Cold-Snapshot");
  const [mizanResult, setMizanResult] = useState<MizanEvaluateResult["data"] | null>(null);

  useEffect(() => {
    let active = true;
    requestApiJson<{ data?: WitnessModuleEntry[] }>("/api/v1/witness/engine/modules")
      .then((res) => {
        if (active && Array.isArray(res?.data)) setModules(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleRunWitnessEngine(e: FormEvent) {
    e.preventDefault();
    setReplayStatus(null);
    try {
      const res = await requestApiJson<WitnessRunResult>("/api/v1/witness/engine/run", {
        method: "POST",
        body: JSON.stringify({
          claim: claimText.trim(),
          source_ref: sourceRef.trim(),
        }),
      });
      if (res?.data) setRunResult(res.data);
    } catch (err) {
      setReplayStatus(err instanceof Error ? err.message : "Witness engine run failed.");
    }
  }

  async function handleReplayRun() {
    if (!runResult?.run_key) return;
    try {
      const res = await requestApiJson<{ data?: { verified?: boolean; output_hash?: string } }>(
        `/api/v1/witness/engine/runs/${encodeURIComponent(runResult.run_key)}/replay`,
        { method: "POST" },
      );
      setReplayStatus(
        res?.data?.verified
          ? `DETERMINISTIC REPLAY VERIFIED (SHA-256: ${res.data.output_hash ?? runResult.output_hash})`
          : "Replay completed.",
      );
    } catch (err) {
      setReplayStatus(err instanceof Error ? err.message : "Replay request failed.");
    }
  }

  async function handleEvaluateMizan(e: FormEvent) {
    e.preventDefault();
    const opts = mizanOptions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await requestApiJson<MizanEvaluateResult>("/api/v1/mizan/evaluate", {
        method: "POST",
        body: JSON.stringify({
          title: mizanTitle.trim(),
          criteria: [
            { name: "Provenance Integrity", weight: 0.45 },
            { name: "Sovereign Availability", weight: 0.35 },
            { name: "Operational Cost", weight: 0.2 },
          ],
          options: opts.map((opt, idx) => ({
            name: opt,
            scores: {
              "Provenance Integrity": Math.max(0.5, 0.95 - idx * 0.1),
              "Sovereign Availability": Math.max(0.5, 0.9 - idx * 0.08),
              "Operational Cost": Math.min(0.95, 0.7 + idx * 0.1),
            },
          })),
        }),
      });
      if (res?.data) setMizanResult(res.data);
    } catch {
      // Handled gracefully
    }
  }

  const models = [
    { id: "witness.claim", label: "Witness Claims" },
    { id: "witness.engine.run", label: "9-Module Engine Runs" },
    { id: "mizan.decision", label: "Mizan Decisions" },
    { id: "mizan.criterion", label: "Mizan Criteria" },
    { id: "scripture.chunk", label: "Scripture Chunks" },
  ] as const;

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.academy}
      plane="creator"
      activeOverride="academy"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: dictionary.shell.searchPlaceholder,
      }}
    >
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="left-2 top-2" />
          <CutoutArtwork
            id="witness-silhouette"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">9-MODULE WITNESS ENGINE (WX-01..09)</Badge>
              <Badge variant="default">MIZAN MCDA</Badge>
              {modules.length > 0 ? (
                <Badge variant="secondary">{modules.length} ACTIVE MODULES</Badge>
              ) : null}
            </div>
            <CardTitle className="text-lg uppercase">{dictionary.apps.academyTitle}</CardTitle>
            <CardDescription>{dictionary.apps.academySubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <form
              onSubmit={(e) => void handleRunWitnessEngine(e)}
              className="space-y-2.5 border border-[var(--border)] bg-[var(--background)] p-4"
            >
              <div className="font-mono text-xs font-bold text-[var(--primary)]">
                WITNESS 9-MODULE DETERMINISTIC PIPELINE
              </div>
              <Textarea
                rows={2}
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="Witness claim statement…"
                aria-label="Witness claim statement"
              />
              <Input
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                placeholder="Primary source reference…"
                aria-label="Primary source reference"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" size="sm">
                  Execute WX-01..09 Pipeline
                </Button>
                {runResult?.run_key ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void handleReplayRun()}>
                    Verify SHA-256 Replay ({runResult.run_key})
                  </Button>
                ) : null}
              </div>
              {runResult ? (
                <div className="border border-[var(--border)] p-2.5 font-mono text-xs">
                  <div>
                    VERDICT: <strong>{runResult.verdict}</strong> · CONFIDENCE:{" "}
                    {runResult.confidence}
                  </div>
                  <div className="truncate text-[10px] text-[var(--muted-foreground)]">
                    HASH: {runResult.output_hash}
                  </div>
                </div>
              ) : null}
              {replayStatus ? (
                <div className="font-mono text-xs text-[var(--primary)]">{replayStatus}</div>
              ) : null}
            </form>

            <form
              onSubmit={(e) => void handleEvaluateMizan(e)}
              className="space-y-2.5 border border-[var(--border)] bg-[var(--background)] p-4"
            >
              <div className="font-mono text-xs font-bold text-[var(--primary)]">
                MIZAN MULTI-CRITERIA DECISION EVALUATOR (MCDA)
              </div>
              <Input
                value={mizanTitle}
                onChange={(e) => setMizanTitle(e.target.value)}
                placeholder="Decision title…"
                aria-label="Mizan decision title"
              />
              <Input
                value={mizanOptions}
                onChange={(e) => setMizanOptions(e.target.value)}
                placeholder="Comma-separated options…"
                aria-label="Mizan candidate options"
              />
              <Button type="submit" size="sm">
                Evaluate Mizan Balance
              </Button>
              {mizanResult ? (
                <div className="border border-[var(--border)] p-2.5 font-mono text-xs">
                  <div>
                    TOP OPTION: <strong>{mizanResult.top_option}</strong> · VERDICT:{" "}
                    {mizanResult.verdict}
                  </div>
                  {mizanResult.rankings?.map((r) => (
                    <div key={r.option} className="text-[11px] text-[var(--muted-foreground)]">
                      {r.option}: {r.score}
                    </div>
                  ))}
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={activeModel === m.id ? "default" : "outline"}
              onClick={() => setActiveModel(m.id)}
            >
              {m.label} ({m.id})
            </Button>
          ))}
        </div>

        <AutoModelConsole
          model={activeModel}
          searchQuery={search}
          domainIcon="memory"
          cutoutId="witness-silhouette"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default AcademyWitnessMizanView;
