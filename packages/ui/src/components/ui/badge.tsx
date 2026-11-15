import * as React from "react";
import { cva, type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[var(--pink)] bg-[var(--pink)]/10 text-[var(--pink)] hover:bg-[var(--pink)]/20",
        secondary:
          "border-[var(--yellow)] bg-[var(--yellow)]/10 text-[var(--yellow)] hover:bg-[var(--yellow)]/20",
        destructive:
          "border-[var(--red)] bg-[var(--red)]/10 text-[var(--red)] hover:bg-[var(--red)]/20",
        outline: "border-[var(--line)] text-[var(--foreground)] hover:bg-[var(--panel)]",
        pink: "border-[var(--pink)] bg-[var(--pink)] text-[var(--ink)]",
        yellow: "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]",
        blue: "border-[var(--blue)] bg-[var(--blue)] text-[var(--ink)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
