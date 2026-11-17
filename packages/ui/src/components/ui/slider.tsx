"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { skin?: SkinName }
>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <SliderPrimitive.Root
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn("relative flex min-h-6 w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--muted)]">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--primary)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--background)] bg-[var(--primary)] ring-offset-[var(--background)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      {props.children}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
