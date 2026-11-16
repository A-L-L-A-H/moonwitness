"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  SkinRoot,
  SkinScope,
  dnaWorldCssVariables,
  getDnaWorld,
  listDnaWorlds,
  useDnaWorld,
  type DnaWorldPalette,
  type MasterDnaId,
  type MasterDnaWorldSpec,
  type SkinRootProps,
  type SkinScopeProps,
} from "./dna-worlds";
import {
  CrescentStarIcon,
  DiamondStarOrnament,
  OctagramMandalaIcon,
  SacredCornerBrackets,
  SearchLensIcon,
} from "./imperium-icons";

export {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  SkinRoot,
  SkinScope,
  dnaWorldCssVariables,
  getDnaWorld,
  listDnaWorlds,
  useDnaWorld,
  type DnaWorldPalette,
  type MasterDnaId,
  type MasterDnaWorldSpec,
  type SkinRootProps,
  type SkinScopeProps,
};

export {
  CrescentStarIcon,
  DiamondStarOrnament,
  OctagramMandalaIcon,
  SacredCornerBrackets,
  SearchLensIcon,
};

export interface DnaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly tone?: "primary" | "secondary";
}

/**
 * Shared DNA-adaptive action button.
 * Renders brass beveled `.btn-chamfer` / `.btn-luxe-secondary` inside `01-imperium-lumen`
 * and adapts automatically to `world.buttonClass` across the remaining Master DNA Worlds.
 */
export const DnaButton = React.forwardRef<HTMLButtonElement, DnaButtonProps>(
  ({ tone = "secondary", type = "button", className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const baseClass = isImperium
      ? tone === "primary"
        ? "btn-chamfer font-monument inline-flex items-center justify-center gap-2.5 text-[#fff6df] uppercase cursor-pointer"
        : "btn-luxe-secondary inline-flex items-center justify-center gap-2 text-[#e6decb] uppercase cursor-pointer"
      : tone === "primary"
        ? cn("mw-dna-button inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2", world.buttonClass)
        : "mw-dna-button-secondary inline-flex min-h-[44px] items-center justify-center gap-2 border px-4 py-2 text-xs uppercase";

    return (
      <button ref={ref} type={type} className={cn(baseClass, className)} {...props}>
        {children}
      </button>
    );
  },
);
DnaButton.displayName = "DnaButton";

export interface DnaChamberProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly cornerBrackets?: boolean;
}

/**
 * Shared chamber container rendering `.octa-bevel-shell` inside Imperium Lumen or `world.cardClass`.
 */
export const DnaChamber = React.forwardRef<HTMLDivElement, DnaChamberProps>(
  ({ cornerBrackets = false, className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const baseClass = isImperium
      ? "octa-bevel-shell relative"
      : cn("mw-dna-surface relative border", world.cardClass);

    return (
      <div ref={ref} className={cn(baseClass, className)} {...props}>
        {cornerBrackets && isImperium ? <SacredCornerBrackets /> : null}
        {children}
      </div>
    );
  },
);
DnaChamber.displayName = "DnaChamber";

export type DnaPortalArchProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Shared selectable portal arch card (`portal-arch-card` in Imperium Lumen, `world.cardClass` elsewhere).
 */
export const DnaPortalArch = React.forwardRef<HTMLButtonElement, DnaPortalArchProps>(
  ({ type = "button", className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const baseClass = isImperium
      ? "portal-arch-card relative border cursor-pointer"
      : cn("mw-dna-surface relative border cursor-pointer", world.cardClass);

    return (
      <button ref={ref} type={type} className={cn(baseClass, className)} {...props}>
        {children}
      </button>
    );
  },
);
DnaPortalArch.displayName = "DnaPortalArch";

export type DnaBadgeProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * Shared DNA-scoped status pill / provenance badge.
 */
export function DnaBadge({ className, children, ...props }: DnaBadgeProps) {
  const world = useDnaWorld();
  return (
    <span
      className={cn(
        "mw-dna-badge inline-flex items-center px-2.5 py-0.5 text-[10.5px] border",
        world.badgeClass,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
