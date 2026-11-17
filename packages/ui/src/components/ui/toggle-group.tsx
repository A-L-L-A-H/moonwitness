"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & { skin?: SkinName }
>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
});
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & { skin?: SkinName }
>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "inline-flex min-h-11 items-center justify-center border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium ring-offset-[var(--background)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[var(--primary)] data-[state=on]:border-[var(--primary)] data-[state=on]:text-[var(--primary-foreground)]",
        recipe.button,
        className,
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
