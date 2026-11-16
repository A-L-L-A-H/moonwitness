"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyStateArt,
  LoadingConstellation,
  ScrollArea,
  SkinPlayground,
  SkinScope,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TokenInspector,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  WorldArtwork,
  auditDnaContrast,
  getDnaWorld,
  listDnaWorlds,
  type MasterDnaId,
} from "@moonwitness/ui";
import { EmpireShell } from "@/components/shell";

export function SkinLaboratory() {
  const worlds = useMemo(() => listDnaWorlds(), []);
  const [selectedDnaId, setSelectedDnaId] = useState<MasterDnaId>("05-riot-anarchy");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectValue, setSelectValue] = useState("witness");
  const [sampleInput, setSampleInput] = useState("Witness frame verification");
  const [labView, setLabView] = useState<"focus" | "compare" | "dx">("focus");

  const activeWorld = getDnaWorld(selectedDnaId);
  const activeAudit = useMemo(() => auditDnaContrast(activeWorld), [activeWorld]);

  const filteredWorlds = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return worlds;
    return worlds.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.metaphor.toLowerCase().includes(q) ||
        w.primaryIdentity.toLowerCase().includes(q),
    );
  }, [worlds, searchFilter]);

  return (
    <EmpireShell
      breadcrumb="Skin Laboratory"
      search={{
        value: searchFilter,
        onChange: setSearchFilter,
        placeholder: "Filter 7 Master DNA Worlds…",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
        <header className="flex flex-col justify-between gap-4 border-b-2 border-[var(--line)] pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] tracking-[0.28em] text-[var(--pink)]">
              MOONFRAME DESIGN ENGINE · 7 MASTER DNA WORLDS
            </p>
            <h1 className="mt-2 font-brush text-4xl text-zinc-100 sm:text-5xl">SKIN LABORATORY</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Interactive matrix verifying 9 shared primitives, abstract vector scenes, and measured
              WCAG 2.1 AA contrast ratios across all seven canonical worlds.
            </p>
          </div>
          <div
            className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0"
            role="tablist"
            aria-label="Skin laboratory mode"
          >
            {(
              [
                { id: "focus", label: "SINGLE WORLD" },
                { id: "compare", label: "7-WORLD AUDIT GRID" },
                { id: "dx", label: "TOKEN & PLAYGROUND" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={labView === mode.id}
                onClick={() => setLabView(mode.id)}
                className={`min-h-11 whitespace-nowrap border-2 px-3 py-2 font-mono text-[11px] tracking-wider transition-colors ${
                  labView === mode.id
                    ? "border-[var(--pink)] bg-[var(--pink)]/20 text-white"
                    : "border-[var(--line)] bg-[var(--panel)] text-zinc-400 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </header>

        {/* World Selector Strip */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {filteredWorlds.map((world) => {
            const active = world.id === selectedDnaId;
            return (
              <button
                key={world.id}
                type="button"
                onClick={() => setSelectedDnaId(world.id)}
                className={`min-h-16 border-2 p-3 text-left transition-all ${
                  active
                    ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                    : "border-[var(--line)] opacity-85 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: world.palette.surface,
                  color: world.palette.text,
                  borderColor: active ? world.palette.accent : world.palette.border,
                }}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span style={{ color: world.palette.mutedText }}>{world.numeral}</span>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: world.palette.accent }}
                  />
                </div>
                <div className="mt-1 font-mono text-xs font-bold tracking-wide">{world.name}</div>
              </button>
            );
          })}
        </div>

        {labView === "focus" && (
          <SkinScope
            dnaId={activeWorld.id}
            className="border p-5 sm:p-7 space-y-6 transition-colors"
          >
            <div
              className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center"
              style={{ borderColor: activeWorld.palette.border }}
            >
              <div>
                <div
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: activeWorld.palette.mutedText }}
                >
                  DNA {activeWorld.numeral} · {activeWorld.primaryIdentity}
                </div>
                <h2
                  className="mt-1 text-2xl font-bold tracking-wide"
                  style={{ color: activeWorld.palette.text }}
                >
                  {activeWorld.name}
                </h2>
                <p className="mt-1 text-sm" style={{ color: activeWorld.palette.mutedText }}>
                  {activeWorld.metaphor} — {activeWorld.shapeLanguage}
                </p>
              </div>
              <div className="w-full sm:w-72 shrink-0">
                <WorldArtwork dnaId={activeWorld.id} />
              </div>
            </div>

            {/* 9 Required Components Mapping (docs/dna/07-COMPONENT-MAPPING.md) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* 1. Button + 2. Badge */}
              <div className={`p-4 space-y-3 ${activeWorld.cardClass}`}>
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: activeWorld.palette.mutedText }}
                  >
                    01 BUTTON · 02 BADGE
                  </span>
                  <Badge className={activeWorld.badgeClass}>
                    {activeAudit.passed ? "WCAG AA PASS" : "CHECK"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button type="button" className={activeWorld.buttonClass}>
                    Primary Action
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    style={{
                      borderColor: activeWorld.palette.border,
                      color: activeWorld.palette.text,
                      backgroundColor: activeWorld.palette.surfaceElevated,
                    }}
                  >
                    Secondary
                  </Button>
                </div>
              </div>

              {/* 3. Card */}
              <Card className={activeWorld.cardClass}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base" style={{ color: activeWorld.palette.text }}>
                    03 CARD · World Container
                  </CardTitle>
                  <CardDescription style={{ color: activeWorld.palette.mutedText }}>
                    Motion: {activeWorld.motionGrammar}
                  </CardDescription>
                </CardHeader>
                <CardContent
                  className="p-4 pt-1 text-xs"
                  style={{ color: activeWorld.palette.mutedText }}
                >
                  Surface token paired cleanly with high-contrast ink.
                </CardContent>
              </Card>

              {/* 4. Input + 9. Native Select (D-012) */}
              <div className={`p-4 space-y-3 ${activeWorld.cardClass}`}>
                <div
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: activeWorld.palette.mutedText }}
                >
                  04 INPUT · 09 NATIVE SELECT
                </div>
                <input
                  type="text"
                  aria-label="DNA sample input"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  className={`min-h-11 w-full px-3 py-2 text-sm outline-none ${activeWorld.inputClass}`}
                />
                <select
                  aria-label="DNA sample lens"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  className={`min-h-11 w-full px-3 py-2 text-sm outline-none ${activeWorld.inputClass}`}
                >
                  <option value="witness">Lens 01 · Witness</option>
                  <option value="promise">Lens 02 · Heart &amp; Promise</option>
                  <option value="research">Lens 04 · Research &amp; Journey</option>
                </select>
              </div>

              {/* 5. Tabs */}
              <div className={`p-4 space-y-2 ${activeWorld.cardClass}`}>
                <div
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: activeWorld.palette.mutedText }}
                >
                  05 TABS
                </div>
                <Tabs defaultValue="telemetry">
                  <TabsList
                    className="grid w-full grid-cols-2"
                    style={{ backgroundColor: activeWorld.palette.surfaceElevated }}
                  >
                    <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
                    <TabsTrigger value="provenance">Provenance</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="telemetry"
                    className="pt-2 text-xs"
                    style={{ color: activeWorld.palette.text }}
                  >
                    Clean tab switch under {activeWorld.name} surface tokens.
                  </TabsContent>
                  <TabsContent
                    value="provenance"
                    className="pt-2 text-xs"
                    style={{ color: activeWorld.palette.mutedText }}
                  >
                    Preset mapping:{" "}
                    <span className="font-mono">{activeWorld.mappedSkinPreset}</span>
                  </TabsContent>
                </Tabs>
              </div>

              {/* 6. Dialog + 7. Tooltip */}
              <div className={`p-4 space-y-3 ${activeWorld.cardClass}`}>
                <div
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: activeWorld.palette.mutedText }}
                >
                  06 DIALOG · 07 TOOLTIP
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" className={activeWorld.buttonClass}>
                        Open Dialog
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      style={{
                        backgroundColor: activeWorld.palette.surface,
                        color: activeWorld.palette.text,
                        borderColor: activeWorld.palette.border,
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>{activeWorld.name} · Dialog Overlay</DialogTitle>
                        <DialogDescription style={{ color: activeWorld.palette.mutedText }}>
                          Keyboard-trapped modal surface inheriting {activeWorld.id} tokens.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          style={{
                            borderColor: activeWorld.palette.border,
                            color: activeWorld.palette.text,
                          }}
                        >
                          Hover / Focus Tip
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{activeWorld.metaphor}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* 8. ScrollArea + Artwork States */}
              <div className={`p-4 space-y-2 ${activeWorld.cardClass}`}>
                <div
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: activeWorld.palette.mutedText }}
                >
                  08 SCROLL AREA · ARTWORK STATES
                </div>
                <ScrollArea className="h-36 pr-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <EmptyStateArt className="w-24 shrink-0" />
                    <LoadingConstellation className="w-20 shrink-0" />
                    <ul className="space-y-1 font-mono text-[11px]">
                      {activeAudit.pairs.map((pair) => (
                        <li key={pair.pairName}>
                          {pair.pairName}: <strong>{pair.ratio}:1</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SkinScope>
        )}

        {labView === "compare" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorlds.map((world) => {
              const audit = auditDnaContrast(world);
              return (
                <div
                  key={world.id}
                  className={`p-4 space-y-3 ${world.cardClass}`}
                  style={{
                    backgroundColor: world.palette.canvas,
                    color: world.palette.text,
                    borderColor: world.palette.border,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">
                      {world.numeral} · {world.name}
                    </span>
                    <span className={world.badgeClass}>{audit.passed ? "ALL PASS" : "FAIL"}</span>
                  </div>
                  <WorldArtwork dnaId={world.id} />
                  <p className="text-xs" style={{ color: world.palette.mutedText }}>
                    {world.metaphor}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                    {audit.pairs.map((pair) => (
                      <div
                        key={pair.pairName}
                        className="border px-2 py-1"
                        style={{
                          borderColor: world.palette.border,
                          backgroundColor: world.palette.surface,
                        }}
                      >
                        <div style={{ color: world.palette.mutedText }}>{pair.pairName}</div>
                        <div>
                          {pair.ratio}:1 ({pair.passed ? "PASS" : "FAIL"})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {labView === "dx" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
              <h2 className="mb-4 font-brush text-2xl text-zinc-100">SKIN PLAYGROUND</h2>
              <SkinPlayground />
            </div>
            <div className="border-2 border-[var(--line)] bg-[var(--panel)] p-5">
              <h2 className="mb-4 font-brush text-2xl text-zinc-100">DNA TOKEN INSPECTOR</h2>
              <TokenInspector />
            </div>
          </div>
        )}
      </div>
    </EmpireShell>
  );
}
