"use client";

import * as React from "react";
import { GripVertical } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

interface ResizableContextValue {
  direction: "horizontal" | "vertical";
  sizes: number[];
  adjustByHandle: (deltaPercent: number) => void;
}

const ResizableContext = React.createContext<ResizableContextValue | null>(null);

export interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
  defaultSizes?: readonly number[];
  onSizesChange?: (sizes: number[]) => void;
  skin?: SkinName;
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  (
    {
      className,
      direction = "horizontal",
      defaultSizes = [50, 50],
      onSizesChange,
      skin,
      children,
      ...props
    },
    ref,
  ) => {
    const [sizes, setSizes] = React.useState<number[]>(() => [...defaultSizes]);
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);

    const adjustByHandle = React.useCallback(
      (deltaPercent: number) => {
        setSizes((prev) => {
          if (prev.length < 2) return prev;
          const nextFirst = Math.max(15, Math.min(85, prev[0]! + deltaPercent));
          const nextSecond = 100 - nextFirst;
          const updated = [nextFirst, nextSecond, ...prev.slice(2)];
          onSizesChange?.(updated);
          return updated;
        });
      },
      [onSizesChange],
    );

    return (
      <ResizableContext.Provider value={{ direction, sizes, adjustByHandle }}>
        <div
          ref={ref}
          data-panel-group-direction={direction}
          data-skin={resolvedSkin}
          data-dna={dnaId}
          className={cn(
            "flex h-full w-full overflow-hidden rounded-[var(--mw-card-radius,0.5rem)] border border-[var(--border)]",
            direction === "vertical" && "flex-col",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </ResizableContext.Provider>
    );
  },
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index?: number; defaultSize?: number }
>(({ className, index = 0, defaultSize, style, ...props }, ref) => {
  const ctx = React.useContext(ResizableContext);
  const basis = ctx?.sizes[index] ?? defaultSize ?? 50;
  return (
    <div
      ref={ref}
      style={{ flexBasis: `${basis}%`, flexGrow: 1, flexShrink: 1, ...style }}
      className={cn("min-w-0 min-h-0 overflow-auto p-3", className)}
      {...props}
    />
  );
});
ResizablePanel.displayName = "ResizablePanel";

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { withHandle?: boolean }
>(({ className, withHandle = false, onKeyDown, ...props }, ref) => {
  const ctx = React.useContext(ResizableContext);
  const isVertical = ctx?.direction === "vertical";
  const current = Math.round(ctx?.sizes[0] ?? 50);

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      aria-orientation={isVertical ? "horizontal" : "vertical"}
      aria-valuenow={current}
      aria-valuemin={15}
      aria-valuemax={85}
      aria-label="Resize panel"
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          ctx?.adjustByHandle(-5);
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          ctx?.adjustByHandle(5);
        }
      }}
      className={cn(
        "relative flex items-center justify-center bg-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        isVertical ? "h-1.5 w-full cursor-row-resize" : "w-1.5 cursor-col-resize",
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 flex h-6 w-4 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--card)]">
          <GripVertical aria-hidden="true" className="h-3 w-3" />
        </div>
      ) : null}
    </div>
  );
});
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
