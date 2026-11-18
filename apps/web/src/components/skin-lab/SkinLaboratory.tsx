"use client";

import { useMemo, useState } from "react";
import {
  BRAND_LOGO_IDS,
  Badge,
  Button,
  CUTOUT_ARTWORK_IDS,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CutoutArtwork,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DnaBrandLogo,
  EmptyStateArt,
  LoadingConstellation,
  ScrollArea,
  SkinArtworkFrame,
  SkinBackdrop,
  SkinMatrixCompare,
  SkinOrnament,
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
  listPresets,
  skinPresets,
  useSkin,
  type CanonicalDensity,
  type MasterDnaId,
  type ThemeMode,
} from "@moonwitness/ui";
import {
  ArsyRelay,
  MemoryTapeNode,
  MtimeHorizon,
  MyceliumSpore,
  RadiusKey,
  ScriptureFolio,
  SimpulNode,
  SkinPalette,
  SnmpProbe,
  StorageBucket,
  SyslogStream,
  VpnTunnel,
} from "@moonwitness/ui/icons";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";

const SOVEREIGN_DOMAIN_ICONS = [
  { id: "vpn", label: "VPN Tunnel", Icon: VpnTunnel },
  { id: "syslog", label: "Syslog Stream", Icon: SyslogStream },
  { id: "snmp", label: "SNMP Probe", Icon: SnmpProbe },
  { id: "storage", label: "Storage Bucket", Icon: StorageBucket },
  { id: "radius", label: "RADIUS Key", Icon: RadiusKey },
  { id: "mtime", label: "MTIME Horizon", Icon: MtimeHorizon },
  { id: "scripture", label: "Scripture Folio", Icon: ScriptureFolio },
  { id: "memory", label: "Memory Tape", Icon: MemoryTapeNode },
  { id: "arsy", label: "Arsy Relay", Icon: ArsyRelay },
  { id: "simpul", label: "Simpul Node", Icon: SimpulNode },
  { id: "mycelium", label: "Mycelium Spore", Icon: MyceliumSpore },
  { id: "skin-palette", label: "Skin Palette", Icon: SkinPalette },
] as const;

export function SkinLaboratory() {
  const worlds = useMemo(() => listDnaWorlds(), []);
  const presets = useMemo(() => listPresets(), []);
  const {
    skin: activeSkin,
    setSkin,
    dnaId: globalDnaId,
    setDna,
    mode: activeTheme,
    resolvedMode,
    setMode,
    density: activeDensity,
    setDensity,
  } = useSkin();
  const [selectedDnaId, setSelectedDnaId] = useState<MasterDnaId>("05-riot-anarchy");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectValue, setSelectValue] = useState("witness");
  const [sampleInput, setSampleInput] = useState("Witness frame verification");
  const [labView, setLabView] = useState<"focus" | "compare" | "matrix" | "assets" | "dx">("focus");

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
    <ConsoleShellAdapter
      plane="creator"
      breadcrumb="Skin Laboratory"
      search={{
        value: searchFilter,
        onChange: setSearchFilter,
        placeholder: "Filter 7 Master DNA Worlds…",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
        <header className="relative overflow-hidden border-2 border-[var(--border)] bg-[var(--card)] p-5">
          <SkinBackdrop skin={activeSkin} dnaId={selectedDnaId} />
          <SkinOrnament slot="corner" className="right-3 top-3" />
          <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.28em] text-[var(--primary)]">
                MOONFRAME 8-AXIS SKIN ENGINE · 7 MASTER DNA WORLDS
              </p>
              <h1 className="mt-2 font-brush text-4xl text-[var(--foreground)] sm:text-5xl">
                SKIN LABORATORY
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
                Interactive matrix verifying 8-axis skin presets, 18 brand logos, 24 vector cutouts,
                12 domain icons, and measured WCAG 2.1 AA contrast across all 140 DNA combinations.
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
                  { id: "matrix", label: "10-SKIN MATRIX" },
                  { id: "assets", label: "LOGOS & CUTOUTS" },
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
                      ? "border-[var(--primary)] bg-[var(--primary)]/20 text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Global 4-Axis Skin Engine Controls */}
          <div className="relative mt-5 grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Global Surface Skin ({activeSkin})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((key) => {
                  const preset = skinPresets[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSkin(key)}
                      className={`border px-2.5 py-1 font-mono text-[10px] uppercase transition-colors ${
                        activeSkin === key
                          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold"
                          : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Theme Mode ({activeTheme}) &amp; Density ({activeDensity})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["dark", "light", "system"] as const satisfies readonly ThemeMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`border px-2.5 py-1 font-mono text-[10px] uppercase transition-colors ${
                      activeTheme === m
                        ? "border-[var(--primary)] bg-[var(--primary)]/20 text-[var(--foreground)] font-bold"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
                {(
                  [
                    "compact",
                    "comfortable",
                    "spacious",
                  ] as const satisfies readonly CanonicalDensity[]
                ).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    className={`border px-2.5 py-1 font-mono text-[10px] uppercase transition-colors ${
                      activeDensity === d
                        ? "border-[var(--secondary)] bg-[var(--secondary)]/20 text-[var(--foreground)] font-bold"
                        : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                Sync Global DNA ({globalDnaId})
              </div>
              <div className="flex items-center gap-2">
                <DnaBrandLogo id={selectedDnaId} variant="mark" size={28} />
                <button
                  type="button"
                  onClick={() => setDna(selectedDnaId)}
                  className="border border-[var(--primary)] bg-[var(--primary)]/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-[var(--foreground)] hover:bg-[var(--primary)]/25"
                >
                  Apply {selectedDnaId} Globally
                </button>
              </div>
            </div>
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
                    ? "border-[var(--foreground)] shadow-[0_0_20px_rgba(255,255,255,0.12)]"
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
              <div className="w-full sm:w-72 shrink-0 space-y-2">
                <WorldArtwork dnaId={activeWorld.id} />
                <SkinArtworkFrame
                  skin={activeSkin}
                  dnaId={activeWorld.id}
                  preferDnaArtwork
                  sizes="288px"
                  className="h-24 w-full border border-[var(--border)]"
                />
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
                  <Badge
                    variant={activeWorld.id === "01-imperium-lumen" ? "imperium" : "dna"}
                    className={activeWorld.badgeClass}
                  >
                    {activeAudit.passed ? "WCAG AA PASS" : "CHECK"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant={activeWorld.id === "01-imperium-lumen" ? "imperiumPrimary" : "dna"}
                    className={
                      activeWorld.id === "01-imperium-lumen" ? "px-6" : activeWorld.buttonClass
                    }
                  >
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
              <Card
                skin={activeWorld.id === "01-imperium-lumen" ? "imperium" : "dna"}
                className={activeWorld.cardClass}
              >
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

        {labView === "matrix" && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <div>
                <h2 className="font-brush text-2xl text-[var(--foreground)]">
                  10-SKIN LIVE MATRIX DIFF
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Simultaneous comparison of Default, Riot, Editorial, Technical, Archive, and
                  Transmission for {selectedDnaId} ({resolvedMode} · {activeDensity}).
                </p>
              </div>
              <SkinOrnament slot="tag" label={`${selectedDnaId} · ${resolvedMode.toUpperCase()}`} />
            </div>
            <SkinMatrixCompare dnaId={selectedDnaId} mode={resolvedMode} density={activeDensity} />
          </section>
        )}

        {labView === "assets" && (
          <div className="space-y-6">
            <section className="relative overflow-hidden border-2 border-[var(--border)] bg-[var(--card)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-brush text-2xl text-[var(--foreground)]">
                  18 CANONICAL BRAND LOGO LOCKUPS
                </h2>
                <SkinOrnament slot="tag" label={`${activeSkin.toUpperCase()} · ${globalDnaId}`} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {BRAND_LOGO_IDS.map((logoId) => (
                  <div
                    key={logoId}
                    className="flex flex-col items-start justify-between gap-3 border border-[var(--border)] bg-[var(--background)] p-3"
                  >
                    <DnaBrandLogo id={logoId} variant="mark" size={40} />
                    <DnaBrandLogo id={logoId} variant="lockup" size={28} className="max-w-full" />
                    <span className="font-mono text-[10px] uppercase text-[var(--muted-foreground)]">
                      {logoId}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-2 border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="mb-4 font-brush text-2xl text-[var(--foreground)]">
                24 ISOLATED VECTOR CUTOUTS
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {CUTOUT_ARTWORK_IDS.map((cutoutId) => (
                  <div
                    key={cutoutId}
                    className="flex flex-col items-center gap-2 border border-[var(--border)] bg-[var(--background)] p-3 text-center"
                  >
                    <CutoutArtwork id={cutoutId} className="h-24 w-24" />
                    <span className="font-mono text-[10px] uppercase text-[var(--muted-foreground)]">
                      {cutoutId}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-2 border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="mb-4 font-brush text-2xl text-[var(--foreground)]">
                12 SOVEREIGN DOMAIN ICONS
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {SOVEREIGN_DOMAIN_ICONS.map(({ id, label, Icon }) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 border border-[var(--border)] bg-[var(--background)] px-3 py-2.5"
                  >
                    <Icon className="h-6 w-6 shrink-0 text-[var(--primary)]" />
                    <span className="font-mono text-[11px] text-[var(--foreground)]">{label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {labView === "dx" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-2 border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="mb-4 font-brush text-2xl text-[var(--foreground)]">SKIN PLAYGROUND</h2>
              <SkinPlayground />
            </div>
            <div className="border-2 border-[var(--border)] bg-[var(--card)] p-5">
              <h2 className="mb-4 font-brush text-2xl text-[var(--foreground)]">
                DNA TOKEN INSPECTOR
              </h2>
              <TokenInspector />
            </div>
          </div>
        )}
      </div>
    </ConsoleShellAdapter>
  );
}
