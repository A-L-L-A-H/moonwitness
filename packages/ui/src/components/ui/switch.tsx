"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  skin?: SkinName;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    return (
      <SwitchPrimitive.Root
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-[var(--border)] bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]",
          (resolvedSkin === "riot" || resolvedSkin === "technical") && "rounded-[2px]",
          className,
        )}
        {...props}
        ref={ref}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-[var(--foreground)] shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=checked]:bg-[var(--primary-foreground)] data-[state=unchecked]:translate-x-0",
            (resolvedSkin === "riot" || resolvedSkin === "technical") && "rounded-[1px]",
          )}
        />
      </SwitchPrimitive.Root>
    );
  },
);
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
