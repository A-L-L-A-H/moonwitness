"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import { useDnaWorld } from "../dna-worlds";
import { SacredCornerBrackets } from "../imperium-icons";

/* ============================================================================
   CORE DNA-ADAPTIVE PRIMITIVES
   ============================================================================ */

export interface DnaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly tone?: "primary" | "secondary";
  readonly asChild?: boolean;
}

/**
 * Shared DNA-adaptive action button.
 */
export const DnaButton = React.forwardRef<HTMLButtonElement, DnaButtonProps>(
  ({ tone = "secondary", type = "button", asChild = false, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const baseClass = isImperium
      ? tone === "primary"
        ? "btn-chamfer inline-flex min-h-[44px] items-center justify-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-[0.06em] uppercase cursor-pointer"
        : "btn-luxe-secondary inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-sm font-medium uppercase cursor-pointer"
      : tone === "primary"
        ? cn(
            "mw-dna-button inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2",
            world.buttonClass,
          )
        : "mw-dna-button-secondary inline-flex min-h-[44px] items-center justify-center gap-2 border px-4 py-2 text-xs uppercase";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(baseClass, className)}
        {...props}
      >
        {children}
      </Comp>
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
 * Shared selectable portal arch card.
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
        "mw-dna-badge inline-flex items-center px-2.5 py-0.5 text-xs border",
        world.badgeClass,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* ============================================================================
   REUSABLE ILLUSTRATED UNIVERSE PRESENTATION COMPONENTS
   ============================================================================ */

export interface ActionControlProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly href?: string;
}

/**
 * Primary CTA control following the centralized DNA button contract.
 */
export const PrimaryAction = React.forwardRef<HTMLElement, ActionControlProps>(
  ({ href, className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const actionClass = isImperium
      ? "mw-primary-action btn-chamfer inline-flex min-h-[44px] items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold tracking-[0.06em] uppercase cursor-pointer"
      : cn("mw-dna-button inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2.5", world.buttonClass);

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(actionClass, className)}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    return (
      <DnaButton
        ref={ref as React.Ref<HTMLButtonElement>}
        tone="primary"
        className={cn(actionClass, className)}
        {...props}
      >
        {children}
      </DnaButton>
    );
  },
);
PrimaryAction.displayName = "PrimaryAction";

/**
 * Secondary control following the centralized DNA button contract.
 */
export const SecondaryAction = React.forwardRef<HTMLElement, ActionControlProps>(
  ({ href, className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const actionClass = isImperium
      ? "mw-secondary-action btn-luxe-secondary inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-sm font-medium uppercase cursor-pointer"
      : "mw-dna-button-secondary inline-flex min-h-[44px] items-center justify-center gap-2 border px-4 py-2 text-xs uppercase";

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(actionClass, className)}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    return (
      <DnaButton
        ref={ref as React.Ref<HTMLButtonElement>}
        tone="secondary"
        className={cn(actionClass, className)}
        {...props}
      >
        {children}
      </DnaButton>
    );
  },
);
SecondaryAction.displayName = "SecondaryAction";
