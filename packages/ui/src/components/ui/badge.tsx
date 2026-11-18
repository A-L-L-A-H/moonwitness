"use client";

import * as React from "react";
import { cva, type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--foreground)] hover:bg-[var(--primary)]/25",
        secondary:
          "border-[var(--secondary)] bg-[var(--secondary)]/15 text-[var(--foreground)] hover:bg-[var(--secondary)]/25",
        destructive:
          "border-[var(--destructive)] bg-[var(--destructive)] text-[var(--destructive-foreground)]",
        outline: "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]",
        pink: "border-[var(--pink)] bg-[var(--pink)] text-[var(--ink)]",
        yellow: "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]",
        blue: "border-[var(--blue)] bg-[var(--blue)] text-[var(--ink)]",
        dna: "mw-dna-badge rounded-none border-[var(--dna-border)] bg-[var(--dna-surface-elevated)] text-[var(--dna-focus)]",
        imperium:
          "rounded-none border-[var(--dna-border)] bg-[var(--dna-surface-elevated)] font-mono tracking-wider text-[var(--dna-focus)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  skin?: SkinName;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    return (
      <div
        ref={ref}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        data-variant={variant ?? "default"}
        className={cn(
          variant !== "dna" && variant !== "imperium" && recipe.badge,
          badgeVariants({ variant }),
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
