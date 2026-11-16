"use client";

import { useMemo, useState } from "react";
import { ECOSYSTEM_RUNTIME_CATALOG } from "@/data/empire-canon-codex";
import {
  DOCK_TELEMETRY_NODES,
  WORLD_DOMAINS,
  type DockNodeTelemetry,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { useEcosystemTelemetry } from "@/lib/use-ecosystem-telemetry";
import {
  ScrollChapterReveal,
  SpatialTiltCard,
  triggerSacredViewTransition,
} from "./motion-primitives";
import { DiamondStarOrnament, WorldEmblemById } from "./sacred-icons";
import {
  AstrolabeOrreryMap,
  GatewayWaveformSvg,
  SacredCornerBrackets,
} from "./sacred-illustrations";

const CONFIGURED_WEB_URL = process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/+$/, "") ?? null;

const LOCAL_WEB_ROUTES: readonly { readonly href: string; readonly label: string }[] = [
  { href: "/dock", label: "Chronicle Dock" },
  { href: "/mission-control", label: "Command Center" },
  { href: "/intelligence", label: "RIOT Intelligence" },
  { href: "/skin-lab", label: "7-DNA Skin Lab" },
];

type DockFilterState = "ALL" | DockNodeTelemetry["state"];

const DOCK_FILTER_OPTIONS: readonly { readonly id: DockFilterState; readonly label: string }[] = [
  { id: "ALL", label: "ALL GATEWAYS" },
  { id: "SYNCHRONIZED", label: "SYNCHRONIZED" },
  { id: "LUMINOUS", label: "LUMINOUS" },
  { id: "BROADCASTING", label: "BROADCASTING" },
] as const;

export function DockMatrixSection({
  quietMode = false,
  onLaunchWorld,
}: {
  readonly quietMode?: boolean;
  readonly onLaunchWorld: (worldId: WorldIdentifier) => void;
}) {
  const telemetry = useEcosystemTelemetry();
  const [filterState, setFilterState] = useState<DockFilterState>("ALL");
  const [selectedNodeCode, setSelectedNodeCode] = useState<string>(
    DOCK_TELEMETRY_NODES[0]?.nodeCode ?? "GATE-01",
  );

  const visibleNodes = useMemo(
    () =>
      filterState === "ALL"
        ? DOCK_TELEMETRY_NODES
        : DOCK_TELEMETRY_NODES.filter((node) => node.state === filterState),
    [filterState],
  );

  const visibleCodeSet = useMemo(
    () => new Set(visibleNodes.map((node) => node.nodeCode)),
    [visibleNodes],
  );

  const activeNode =
    visibleNodes.find((node) => node.nodeCode === selectedNodeCode) ??
    visibleNodes[0] ??
    DOCK_TELEMETRY_NODES[0]!;

  const matchedWorld = WORLD_DOMAINS.find((domain) => domain.id === activeNode.worldId);
  const activeNodeIdx = Math.max(
    0,
    DOCK_TELEMETRY_NODES.findIndex((node) => node.nodeCode === activeNode.nodeCode),
  );

  const handleSelectFilter = (optionId: DockFilterState) => {
    triggerSacredViewTransition(() => {
      setFilterState(optionId);
      const nextVisible =
        optionId === "ALL"
          ? DOCK_TELEMETRY_NODES
          : DOCK_TELEMETRY_NODES.filter((node) => node.state === optionId);
      if (nextVisible.length > 0 && !nextVisible.some((n) => n.nodeCode === selectedNodeCode)) {
        setSelectedNodeCode(nextVisible[0]!.nodeCode);
      }
    }, quietMode);
  };

  const handleSelectNode = (nodeCode: string) => {
    triggerSacredViewTransition(() => {
      setSelectedNodeCode(nodeCode);
    }, quietMode);
  };

  return (
    <section
      id="the-dock"
      aria-labelledby="dock-heading"
      className="scroll-mt-16 relative overflow-x-clip border-t border-[#d6b46c]/25 bg-[#040509]/95 py-24 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="flex flex-col items-center text-center">
            <div className="font-monument flex items-center gap-4 text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
              <span>CELESTIAL HORIZON BRIDGE</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
            </div>
            <h2
              id="dock-heading"
              className="font-monument mt-4 text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
            >
              THE DOCK · SOVEREIGN MATRIX
            </h2>
            <p className="mt-3 max-w-2xl font-serif text-base sm:text-lg text-[#dfd6c3]/90 leading-relaxed">
              Interactive heliocentric astrolabe plotting the five Empire gateways around one
              monocentric light core. Select any orbital node to lock sextant telemetry and launch.
            </p>

            {/* Filter by Gateway Class */}
            <div
              role="group"
              aria-label="Filter gateways by state"
              className="mt-6 flex flex-wrap items-center justify-center gap-2"
            >
              {DOCK_FILTER_OPTIONS.map((option) => {
                const isActive = filterState === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectFilter(option.id)}
                    className={`btn-luxe-secondary px-4.5 py-1.5 font-mono text-[11px] tracking-[0.18em] uppercase cursor-pointer ${
                      isActive ? "text-[#fff6df]" : "text-[#c8beaa] hover:text-[#fff6df]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollChapterReveal>

        {/* Dual-Perspective Orbital Orrery Observatory + Telemetry Aperture */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="mt-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left: Astronomical Orbital Orrery Stage */}
            <div className="lg:col-span-6 relative border border-[#d6b46c]/30 bg-gradient-to-b from-[#070a14] via-[#05070e] to-[#080b14] p-6 sm:p-8 shadow-[0_24px_65px_rgba(0,0,0,0.85)]">
              <SacredCornerBrackets />
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-[#dfc07b] uppercase">
                <span>ASTROLABE ORRERY // SEXTANT LOCK</span>
                <span>
                  {visibleNodes.length} OF {DOCK_TELEMETRY_NODES.length} ACTIVE
                </span>
              </div>

              <AstrolabeOrreryMap
                nodes={DOCK_TELEMETRY_NODES}
                visibleCodes={visibleCodeSet}
                selectedCode={activeNode.nodeCode}
                quietMode={quietMode}
                onSelectNode={handleSelectNode}
              />
            </div>

            {/* Right: Gateway Switcher Rail + Active Aperture Inspector */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              {/* Compact Synchronized Gateway Selector Rail */}
              <div
                role="tablist"
                aria-label="Select a Gateway Satellite"
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
              >
                {visibleNodes.map((node) => {
                  const isSelected = node.nodeCode === activeNode.nodeCode;
                  const worldMeta = WORLD_DOMAINS.find((w) => w.id === node.worldId);
                  return (
                    <button
                      key={node.nodeCode}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => handleSelectNode(node.nodeCode)}
                      className="btn-luxe-secondary min-h-[54px] px-3 py-2 text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-mono text-[9.5px] text-[#dfc07b]">
                        <span>{node.nodeCode}</span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full bg-[#f7dfa0] ${
                            quietMode ? "" : "animate-pulse"
                          }`}
                        />
                      </div>
                      <div className="font-monument mt-1 truncate text-[11px] tracking-[0.08em] text-[#fff6df]">
                        {worldMeta?.name ?? node.designation}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Gateway Beveled Telemetry Aperture */}
              <SpatialTiltCard disabled={quietMode} maxTiltDeg={2.8}>
                <div className="octa-bevel-shell relative p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-4 font-mono text-[11px] text-[#d6b46c]">
                    <span>TELEMETRY LOCK // {activeNode.nodeCode}</span>
                    <span className="inline-flex items-center gap-1.5 text-[#f7dfa0]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full bg-[#f7dfa0] ${
                          quietMode ? "" : "animate-pulse"
                        }`}
                      />
                      {activeNode.state}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#dfc07b]/40 bg-[#080b15]">
                      <WorldEmblemById worldId={activeNode.worldId} className="h-11 w-11" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <h3 className="font-monument text-2xl sm:text-3xl tracking-[0.14em] text-[#fff8e6]">
                          {matchedWorld?.name ?? activeNode.designation}
                        </h3>
                        {matchedWorld && (
                          <span dir="rtl" lang="ar" className="text-lg text-[#dfc07b]">
                            {matchedWorld.arabicEpithet}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-serif text-sm text-[#e0d7c4]">
                        {activeNode.designation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-y border-[#d6b46c]/15 py-3">
                    <div className="mb-1.5 flex justify-between font-mono text-[10px] tracking-[0.16em] text-[#9c927d] uppercase">
                      <span>HARMONIC CARRIER WAVE</span>
                      <span className="text-[#f5dfa6]">
                        {matchedWorld?.harmonicFrequency ?? "COVENANT SYNC"}
                      </span>
                    </div>
                    <GatewayWaveformSvg variant={activeNodeIdx + 1} />
                  </div>

                  <dl className="mt-5 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-3">
                    <div className="border border-[#d6b46c]/20 bg-[#060911] p-3">
                      <dt className="text-[10px] text-[#8e8572]">PROTOCOL</dt>
                      <dd className="mt-1 text-[#fff4d2] break-words">{activeNode.protocol}</dd>
                    </div>
                    <div className="border border-[#d6b46c]/20 bg-[#060911] p-3">
                      <dt className="text-[10px] text-[#8e8572]">ORBITAL BEARING</dt>
                      <dd className="mt-1 text-[#fff4d2]">{activeNode.orbitalBearing}</dd>
                    </div>
                    <div className="border border-[#d6b46c]/20 bg-[#060911] p-3">
                      <dt className="text-[10px] text-[#8e8572]">SPEC TARGET</dt>
                      <dd className="mt-1 text-[#f5e3b8]">
                        {activeNode.integrityPercent}% · {activeNode.latencyMs}ms
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="font-serif text-xs text-[#c8beaa] max-w-xs">
                      {matchedWorld?.primaryDirective ??
                        "Enter calibrated sanctum chamber directly via Sovereign Matrix."}
                    </p>
                    <button
                      type="button"
                      onClick={() => onLaunchWorld(activeNode.worldId)}
                      className="btn-chamfer font-monument group inline-flex items-center gap-2.5 px-7 py-2.5 text-xs tracking-[0.2em] text-[#fff6df] uppercase hover:text-white cursor-pointer"
                    >
                      <DiamondStarOrnament className="h-2.5 w-2.5 text-[#dfc07b] transition-transform duration-500 group-hover:rotate-45" />
                      <span>ENTER {matchedWorld?.name ?? activeNode.designation} &rsaquo;</span>
                    </button>
                  </div>

                  {/* Live Multi-Node Observatory, Cloudflare Edges & Portal Bridges */}
                  <div className="mt-5 border-t border-[#d6b46c]/20 pt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                      <span className="text-[#dfc07b]">ECOSYSTEM TOPOLOGY BRIDGE</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`border px-2 py-0.5 ${
                            telemetry.status === "online"
                              ? "border-[#e6c987]/55 bg-[#d6b46c]/15 text-[#fff6df]"
                              : "border-[#d6b46c]/25 bg-[#080a12] text-[#d8ceba]"
                          }`}
                        >
                          {telemetry.status === "checking"
                            ? "PROBING ECOSYSTEM…"
                            : telemetry.status === "online"
                              ? `API ONLINE · DB:${(telemetry.databaseStatus ?? "OK").toUpperCase()} · ${telemetry.timelineTotal ?? 0} EVENTS · ${telemetry.erasCount ?? 0} ERAS`
                              : telemetry.runtimeMode === "cloudflare-edge"
                                ? "CLOUDFLARE EDGE · ORIGIN API STANDBY"
                                : "CANON SPEC MODE · LOCAL API STANDBY"}
                        </span>
                        <button
                          type="button"
                          onClick={telemetry.refresh}
                          disabled={telemetry.refreshing}
                          className="btn-luxe-secondary min-h-[34px] px-3 py-0.5 font-mono text-[10px] tracking-[0.14em] text-[#f5dfa6] hover:text-white disabled:opacity-50 cursor-pointer"
                        >
                          {telemetry.refreshing ? "PROBING…" : "REFRESH"}
                        </button>
                      </div>
                    </div>

                    {/* Real Live Public Cloudflare Edge Portals */}
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 font-mono text-[10px]">
                      {ECOSYSTEM_RUNTIME_CATALOG.liveEdges
                        .filter((edge) => edge.id !== "sanctuary")
                        .map((edge) => {
                          const liveProbe = telemetry.edges.find((e) => e.id === edge.id);
                          const isUp = liveProbe?.status === "online";
                          return (
                            <a
                              key={edge.id}
                              href={edge.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between border border-[#d6b46c]/30 bg-[#090d18] px-3 py-2 text-[#fff6df] hover:border-[#fff4d2] hover:bg-[#12182b] transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold truncate">{edge.hostname} ↗</div>
                                <div className="text-[9.5px] text-[#cfc5b0] truncate">
                                  {edge.workerName}
                                </div>
                              </div>
                              <span
                                className={`shrink-0 border px-1.5 py-0.5 text-[9.5px] ${
                                  isUp
                                    ? "border-[#e6c987]/55 bg-[#d6b46c]/20 text-[#fff8e6]"
                                    : "border-[#d6b46c]/25 bg-[#080a12] text-[#cfc5b0]"
                                }`}
                              >
                                {liveProbe
                                  ? isUp
                                    ? `LIVE · ${liveProbe.latencyMs ?? 0}ms`
                                    : liveProbe.status.toUpperCase()
                                  : "EDGE"}
                              </span>
                            </a>
                          );
                        })}
                    </div>

                    {telemetry.services.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 font-mono text-[10px]">
                        {telemetry.services.map((svc) => (
                          <div
                            key={svc.id}
                            className={`border px-2.5 py-1.5 ${
                              svc.status === "online"
                                ? "border-[#e6c987]/45 bg-[#d6b46c]/10 text-[#fff6df]"
                                : svc.status === "degraded"
                                  ? "border-[#e6c987]/35 bg-[#1a1408] text-[#f5dfa6]"
                                  : "border-[#d6b46c]/20 bg-[#060911] text-[#cfc5b0]"
                            }`}
                          >
                            <div className="font-bold tracking-[0.04em]">
                              {svc.name.toUpperCase()}
                            </div>
                            <div className="mt-0.5 text-[10px]">
                              {svc.status === "online"
                                ? `ONLINE · ${svc.latencyMs ?? 0}ms`
                                : telemetry.runtimeMode === "cloudflare-edge"
                                  ? "LOCAL STACK"
                                  : svc.status.toUpperCase()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {telemetry.git?.available && (
                      <div className="flex flex-wrap items-center justify-between gap-2 border border-[#d6b46c]/20 bg-[#060911] px-3 py-2 font-mono text-[10px] text-[#e0d7c4]">
                        <span>
                          GIT WORKSPACE:{" "}
                          <strong className="text-[#fff6df]">
                            {telemetry.git.branch ?? "HEAD"} ({telemetry.git.headShort ?? "—"})
                          </strong>
                        </span>
                        <span className="text-[#f5dfa6]">
                          {telemetry.git.dirtyCount > 0
                            ? `${telemetry.git.dirtyCount} CHANGED FILES`
                            : "CLEAN TREE"}
                          {telemetry.git.lastCommitSubject
                            ? ` · ${telemetry.git.lastCommitSubject}`
                            : ""}
                        </span>
                      </div>
                    )}

                    {(CONFIGURED_WEB_URL ||
                      telemetry.services.find((s) => s.id === "web")?.status === "online") && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {LOCAL_WEB_ROUTES.map((link) => (
                          <a
                            key={link.href}
                            href={`${CONFIGURED_WEB_URL ?? "http://localhost:3000"}${link.href}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-luxe-secondary inline-flex items-center px-3.5 py-1 font-mono text-[10px] tracking-[0.12em] text-[#e6decb] uppercase hover:text-[#fff6df]"
                          >
                            {link.label} ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SpatialTiltCard>
            </div>
          </div>
        </ScrollChapterReveal>
      </div>
    </section>
  );
}
