"use client";

import { useMemo, useState } from "react";
import {
  canonicalTokensToCssVariables,
  resolveCanonicalTokens,
  type CanonicalDensity,
  type CanonicalThemeMode,
} from "../dna/canonical";
import { cn } from "../cn";
import { SkinScope, listPresets, skinPresets, type SkinName } from "../skin";
import type { MasterDnaId } from "../skin/dna-worlds";
import { CutoutArtwork } from "../artwork/cutouts";
import { DnaBrandLogo, type BrandLogoId } from "../artwork/logos";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Sparkline } from "../components/ui/chart";
import { Input } from "../components/ui/input";
import { SkinPalette, VpnTunnel } from "../icons/modules";
import { SkinOrnament } from "../primitives/tactile-hardware";

export interface SkinMatrixCompareProps {
  dnaId?: MasterDnaId;
  mode?: CanonicalThemeMode;
  density?: CanonicalDensity;
  className?: string;
}

const SAMPLE_SERIES = [18, 24, 21, 35, 31, 46, 54, 49, 68] as const;

export function formatSkinTokensAsCss(
  dnaId: MasterDnaId,
  skin: SkinName,
  mode: CanonicalThemeMode,
  density: CanonicalDensity,
): string {
  const resolved = resolveCanonicalTokens({ dnaId, skin, mode, density });
  const vars = canonicalTokensToCssVariables(resolved);
  const body = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `[data-skin="${skin}"][data-dna="${dnaId}"][data-theme="${mode}"] {\n${body}\n}`;
}

export function formatSkinTokensAsJson(
  dnaId: MasterDnaId,
  skin: SkinName,
  mode: CanonicalThemeMode,
  density: CanonicalDensity,
): string {
  const resolved = resolveCanonicalTokens({ dnaId, skin, mode, density });
  const vars = canonicalTokensToCssVariables(resolved);
  return JSON.stringify({ dnaId, skin, mode, density, variables: vars }, null, 2);
}

export function SkinMatrixCompare({
  dnaId = "05-riot-anarchy",
  mode = "dark",
  density = "comfortable",
  className,
}: SkinMatrixCompareProps) {
  const skins = useMemo(() => listPresets(), []);
  const [exportSkin, setExportSkin] = useState<SkinName>("riot");
  const [exportFormat, setExportFormat] = useState<"css" | "json">("css");
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const exportPayload = useMemo(
    () =>
      exportFormat === "css"
        ? formatSkinTokensAsCss(dnaId, exportSkin, mode, density)
        : formatSkinTokensAsJson(dnaId, exportSkin, mode, density),
    [dnaId, exportSkin, mode, density, exportFormat],
  );

  async function handleCopyExport() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportPayload);
      }
      setCopiedNotice(`${exportSkin}.${exportFormat}`);
    } catch {
      setCopiedNotice("manual-select");
    }
  }

  return (
    <div className={cn("space-y-6", className)} data-mw-matrix-compare="true">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skins.map((skinName) => {
          const preset = skinPresets[skinName];
          const resolved = resolveCanonicalTokens({ dnaId, skin: skinName, mode, density });
          return (
            <SkinScope
              key={skinName}
              skin={skinName}
              dnaId={dnaId}
              mode={mode}
              density={density}
              className="border border-[var(--border)] bg-[var(--background)] p-4 text-[var(--foreground)]"
            >
              <Card skin={skinName} className="relative overflow-hidden">
                <SkinOrnament slot="corner" skin={skinName} className="right-2 top-2" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <DnaBrandLogo id={dnaId as BrandLogoId} variant="mark" size={26} decorative />
                    <SkinOrnament slot="tag" skin={skinName} label={preset.label} />
                  </div>
                  <CardTitle className="mt-2 flex items-center gap-2 text-base">
                    <VpnTunnel className="h-4 w-4 text-[var(--primary)]" />
                    <span>{preset.label}</span>
                  </CardTitle>
                  <CardDescription>{preset.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <Sparkline
                        data={SAMPLE_SERIES}
                        height={34}
                        ariaLabel={`${preset.label} telemetry sparkline`}
                      />
                    </div>
                    <CutoutArtwork id="signal-radio" className="h-12 w-12" decorative />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button skin={skinName} size="sm" type="button" onClick={() => setExportSkin(skinName)}>
                      Inspect CSS
                    </Button>
                    <Badge skin={skinName}>{resolved.atmosphere.ornament}</Badge>
                    <Badge skin={skinName} variant="outline">
                      {resolved.atmosphere.motionDuration}
                    </Badge>
                  </div>

                  <Input
                    skin={skinName}
                    aria-label={`${preset.label} sample input`}
                    defaultValue={`${resolved.typography.headingTransform} · stroke ${resolved.atmosphere.iconStroke}`}
                    readOnly
                  />
                </CardContent>
              </Card>
            </SkinScope>
          );
        })}
      </div>

      <div className="border-2 border-[var(--border)] bg-[var(--card)] p-4 text-[var(--foreground)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SkinPalette className="h-5 w-5 text-[var(--primary)]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              Token Export ({exportSkin} · {dnaId} · {mode} · {density})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["css", "json"] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={cn(
                  "border px-2.5 py-1 font-mono text-[10px] uppercase",
                  exportFormat === fmt
                    ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold"
                    : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]",
                )}
              >
                {fmt}
              </button>
            ))}
            <Button size="sm" type="button" onClick={() => void handleCopyExport()}>
              {copiedNotice ? `Copied (${copiedNotice})` : "Copy Tokens"}
            </Button>
          </div>
        </div>
        <pre
          data-testid="matrix-token-export"
          className="max-h-56 overflow-auto border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-[11px] leading-relaxed text-[var(--foreground)]"
        >
          {exportPayload}
        </pre>
      </div>
    </div>
  );
}
