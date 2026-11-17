"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { skin?: SkinName }
>(({ className, value = 0, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={clamped}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--muted)]",
        (resolvedSkin === "riot" || resolvedSkin === "technical") && "rounded-[2px]",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-[var(--primary)] transition-all duration-500 data-[state=complete]:bg-[var(--primary)]"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
