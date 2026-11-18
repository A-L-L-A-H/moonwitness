"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  skin?: SkinName;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(
          "rounded-[var(--mw-card-radius,0.375rem)] bg-[var(--muted)] motion-safe:animate-pulse",
          className,
        )}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
