"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  skin?: SkinName;
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    return (
      <LabelPrimitive.Root
        ref={ref}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(
          "text-sm font-medium leading-none text-[var(--foreground)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className,
        )}
        {...props}
      />
    );
  },
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
