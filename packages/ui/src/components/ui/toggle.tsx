"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--mw-btn-radius,0.375rem)] text-sm font-medium ring-offset-[var(--background)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[var(--primary)] data-[state=on]:text-[var(--primary-foreground)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--background)] border border-[var(--border)]",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] hover:text-[var(--foreground)] data-[state=on]:bg-[var(--primary)] data-[state=on]:border-[var(--primary)] data-[state=on]:text-[var(--primary-foreground)]",
      },
      size: {
        default: "min-h-11 px-3",
        sm: "min-h-9 px-2.5",
        lg: "min-h-12 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ToggleProps
  extends
    React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {
  skin?: SkinName;
}

const Toggle = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ className, variant, size, skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    return (
      <TogglePrimitive.Root
        ref={ref}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(toggleVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
