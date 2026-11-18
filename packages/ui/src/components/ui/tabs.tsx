"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { skin?: SkinName }
>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
  return (
    <TabsPrimitive.List
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "inline-flex min-h-11 items-center justify-center p-1",
        recipe.tabsList,
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { skin?: SkinName }
>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "inline-flex min-h-9 items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm",
        recipe.tabsTrigger,
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { skin?: SkinName }
>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <TabsPrimitive.Content
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "mt-2 ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 data-[state=active]:animate-in data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=active]:fade-in-0 data-[state=inactive]:zoom-out-95 data-[state=active]:zoom-in-95",
        className,
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
