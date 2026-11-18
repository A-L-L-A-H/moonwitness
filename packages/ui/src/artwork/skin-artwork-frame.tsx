"use client";

import {
  DNA_WORLD_ARTWORK_MAP,
  SKIN_ARTWORK_MAP,
  type DnaWorldAssetId,
  type SkinAssetKey,
} from "@moonwitness/assets";
import { cn } from "../cn";
import { ZineImage } from "../primitives/zine-image";
import { useSkin, type MasterDnaId, type SkinName } from "../skin";
import { SkinBackdrop } from "./backdrop";
import { CutoutArtwork, type CutoutArtworkId } from "./cutouts";

export interface SkinArtworkFrameProps {
  /** Override active skin key (defaults to context `useSkin().skin`) */
  skin?: SkinName;
  /** Override active DNA world id (defaults to context `useSkin().dnaId`) */
  dnaId?: MasterDnaId;
  /** Prefer `DNA_WORLD_ARTWORK_MAP` artwork for the active DNA world when available */
  preferDnaArtwork?: boolean;
  /** Optional `artKey` override if caller supplies a canonical asset plate directly */
  artKey?: string;
  /** Whether to stamp the matching isolated vector cutout over the corner */
  showCutout?: boolean;
  /** Custom wrapper classes (typically `absolute inset-0 overflow-hidden pointer-events-none`) */
  className?: string;
  /** Custom scrim overlay classes */
  scrimClassName?: string;
  /** Custom cutout classes */
  cutoutClassName?: string;
  /** Responsive image sizes attribute */
  sizes?: string;
  /** Mark backing image as eager/high-priority */
  eager?: boolean;
  /** Layer opacity on the photographic raster plate */
  plateClassName?: string;
}

/**
 * Skin-reactive compound artwork surface pairing the responsive `<ZineImage>`
 * plate mapped for the active skin / DNA world with geometric `<SkinBackdrop>`,
 * a theme-safe semantic scrim (`--background`), and an optional vector `<CutoutArtwork>`.
 */
export function SkinArtworkFrame({
  skin: skinProp,
  dnaId: dnaProp,
  preferDnaArtwork = false,
  artKey: artKeyProp,
  showCutout = true,
  className,
  scrimClassName,
  cutoutClassName,
  sizes = "100vw",
  eager = false,
  plateClassName,
}: SkinArtworkFrameProps) {
  const ctx = useSkin();
  const skin = skinProp ?? ctx.skin;
  const dnaId = dnaProp ?? ctx.dnaId;

  const skinEntry =
    SKIN_ARTWORK_MAP[skin as SkinAssetKey] ?? SKIN_ARTWORK_MAP.default;
  const dnaEntry =
    preferDnaArtwork && dnaId in DNA_WORLD_ARTWORK_MAP
      ? DNA_WORLD_ARTWORK_MAP[dnaId as DnaWorldAssetId]
      : undefined;

  const resolvedArt = artKeyProp ?? dnaEntry?.artKey ?? skinEntry.artKey;
  const resolvedCutout = (dnaEntry?.cutoutId ??
    skinEntry.cutoutId) as CutoutArtworkId;

  return (
    <div
      data-skin={skin}
      data-dna={dnaId}
      data-mw-skin-frame="true"
      data-mw-art-key={resolvedArt}
      data-mw-cutout-key={resolvedCutout}
      className={cn(
        "pointer-events-none relative overflow-hidden select-none",
        className,
      )}
      aria-hidden="true"
    >
      <ZineImage
        art={resolvedArt}
        sizes={sizes}
        eager={eager}
        className={cn(
          "h-full w-full object-cover opacity-55 transition-opacity duration-500",
          plateClassName,
        )}
      />
      <SkinBackdrop
        skin={skin}
        dnaId={dnaId}
        className="opacity-70 mix-blend-normal"
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/65 to-[var(--background)]/35",
          scrimClassName,
        )}
      />
      {showCutout && (
        <CutoutArtwork
          id={resolvedCutout}
          decorative
          className={cn(
            "absolute right-4 bottom-4 h-20 w-20 text-[var(--primary)]/20 sm:h-24 sm:w-24",
            cutoutClassName,
          )}
        />
      )}
    </div>
  );
}
