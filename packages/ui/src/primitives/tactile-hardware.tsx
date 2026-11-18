"use client";

import type { HTMLAttributes } from "react";
import { cn } from "../cn";
import { useSkin, type SkinName } from "../skin";

export interface TactileTapeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "black" | "yellow" | "masking";
  label?: string;
  width?: number | string;
}

export function TactileTape({
  variant = "black",
  label,
  width = 110,
  className,
  style,
  ...props
}: TactileTapeProps) {
  const isYellow = variant === "yellow";
  const tapeClass = isYellow ? "duct-tape-yellow" : "duct-tape-black";

  return (
    <span aria-hidden className={cn(tapeClass, className)} style={{ width, ...style }} {...props}>
      {label && <span className="truncate px-2">{label}</span>}
    </span>
  );
}

export interface StapleProps extends HTMLAttributes<HTMLSpanElement> {
  rotate?: number;
}

export function Staple({ rotate = 0, className, style, ...props }: StapleProps) {
  return (
    <span
      aria-hidden
      className={cn("staple-metal", className)}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      {...props}
    />
  );
}

export interface SkinOrnamentProps extends HTMLAttributes<HTMLSpanElement> {
  slot?: "corner" | "tag" | "divider";
  label?: string;
  skin?: SkinName;
}

/**
 * Skin-adaptive hardware ornament:
 * - riot: metal staple / hazard tape
 * - editorial: crisp gold/primary hairline / serif folio tag
 * - technical: CAD corner reticle / bracketed telemetry chip
 * - archive: brass pin / archival folio stamp
 * - transmission: glowing signal LED / live frequency badge
 * - default: subtle lunar corner tick
 */
export function SkinOrnament({
  slot = "corner",
  label,
  skin: explicitSkin,
  className,
  ...props
}: SkinOrnamentProps) {
  const { skin: ctxSkin } = useSkin();
  const activeSkin = explicitSkin ?? ctxSkin;

  if (slot === "divider") {
    if (activeSkin === "technical" || activeSkin === "transmission") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "block h-px w-full border-t border-dashed border-[var(--primary)]/60",
            className,
          )}
          {...props}
        />
      );
    }
    if (activeSkin === "archive") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn("block h-1 w-full border-y border-[var(--border)]", className)}
          {...props}
        />
      );
    }
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn("block h-px w-full bg-[var(--border)]", className)}
        {...props}
      />
    );
  }

  if (slot === "tag") {
    const tagText = label ?? activeSkin.toUpperCase();
    if (activeSkin === "riot") {
      return (
        <TactileTape
          variant="yellow"
          label={tagText}
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={className}
          {...props}
        />
      );
    }
    if (activeSkin === "technical") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center border border-[var(--primary)] bg-[var(--background)] px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-[var(--primary)] uppercase",
            className,
          )}
          {...props}
        >
          [{tagText}]
        </span>
      );
    }
    if (activeSkin === "editorial") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center border-b border-[var(--primary)] bg-[var(--card)]/90 px-2 py-0.5 font-serif text-[10px] italic tracking-wide text-[var(--primary)]",
            className,
          )}
          {...props}
        >
          {tagText}
        </span>
      );
    }
    if (activeSkin === "archive") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center border-2 border-double border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 font-serif text-[9px] tracking-widest text-[var(--foreground)] uppercase",
            className,
          )}
          {...props}
        >
          {tagText}
        </span>
      );
    }
    if (activeSkin === "transmission") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center gap-1.5 border border-[var(--primary)]/70 bg-[var(--background)]/90 px-2 py-0.5 font-mono text-[9px] tracking-widest text-[var(--primary)] uppercase",
            className,
          )}
          {...props}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          {tagText}
        </span>
      );
    }
    if (activeSkin === "sanctuary") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center border border-[var(--primary)]/60 bg-[var(--background)] px-2.5 py-0.5 font-serif text-[9px] tracking-[0.2em] text-[var(--primary)] uppercase",
            className,
          )}
          {...props}
        >
          ✦ {tagText}
        </span>
      );
    }
    if (activeSkin === "brutalist") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center border-2 border-[var(--border)] bg-[var(--foreground)] px-2 py-0.5 font-mono text-[9px] font-black tracking-widest text-[var(--background)] uppercase",
            className,
          )}
          {...props}
        >
          {tagText}
        </span>
      );
    }
    if (activeSkin === "noir") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 font-mono text-[9px] tracking-widest text-[var(--primary)] uppercase",
            className,
          )}
          {...props}
        >
          FRAME // {tagText}
        </span>
      );
    }
    if (activeSkin === "kinetic") {
      return (
        <span
          aria-hidden="true"
          data-mw-ornament={activeSkin}
          data-mw-ornament-slot={slot}
          className={cn(
            "pointer-events-none inline-flex items-center -skew-x-6 border border-[var(--primary)] bg-[var(--primary)] px-2 py-0.5 font-brush text-[9px] tracking-wider text-[var(--primary-foreground)] uppercase",
            className,
          )}
          {...props}
        >
          ▸ {tagText}
        </span>
      );
    }
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none inline-flex items-center border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 font-mono text-[9px] tracking-wider text-[var(--foreground)] uppercase",
          className,
        )}
        {...props}
      >
        {tagText}
      </span>
    );
  }

  // slot === "corner"
  if (activeSkin === "riot") {
    return (
      <Staple
        rotate={-14}
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={className}
        {...props}
      />
    );
  }
  if (activeSkin === "technical") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none absolute h-2.5 w-2.5 border-t-2 border-l-2 border-[var(--primary)]",
          className,
        )}
        {...props}
      />
    );
  }
  if (activeSkin === "editorial") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn("pointer-events-none absolute h-0.5 w-7 bg-[var(--primary)]", className)}
        {...props}
      />
    );
  }
  if (activeSkin === "archive") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none absolute h-2.5 w-2.5 rounded-full border border-[var(--background)] bg-[var(--primary)]",
          className,
        )}
        {...props}
      />
    );
  }
  if (activeSkin === "transmission") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none absolute h-1.5 w-4 rounded-full bg-[var(--green)] shadow-[0_0_8px_var(--green)]",
          className,
        )}
        {...props}
      />
    );
  }
  if (activeSkin === "sanctuary") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none absolute h-2.5 w-2.5 rotate-45 border border-[var(--primary)] bg-[var(--background)]",
          className,
        )}
        {...props}
      />
    );
  }
  if (activeSkin === "brutalist") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none absolute h-2.5 w-2.5 bg-[var(--border)]",
          className,
        )}
        {...props}
      />
    );
  }
  if (activeSkin === "noir") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none absolute h-3 w-1.5 border border-[var(--border)] bg-[var(--muted)]",
          className,
        )}
        {...props}
      />
    );
  }
  if (activeSkin === "kinetic") {
    return (
      <span
        aria-hidden="true"
        data-mw-ornament={activeSkin}
        data-mw-ornament-slot={slot}
        className={cn(
          "pointer-events-none absolute h-2 w-4 -skew-x-12 bg-[var(--primary)]",
          className,
        )}
        {...props}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      data-mw-ornament={activeSkin}
      data-mw-ornament-slot={slot}
      className={cn(
        "pointer-events-none absolute h-2 w-2 border-t border-l border-[var(--primary)]/75",
        className,
      )}
      {...props}
    />
  );
}
