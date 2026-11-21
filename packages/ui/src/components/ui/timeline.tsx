"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface TimelineItem {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly timestamp?: string;
  readonly label?: string;
  readonly description?: React.ReactNode;
  readonly status?: string;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly items: readonly TimelineItem[];
  readonly ariaLabel?: string;
  readonly emptyMessage?: string;
  readonly density?: "compact" | "comfortable";
  readonly skin?: SkinName;
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  (
    {
      items,
      ariaLabel = "Timeline",
      emptyMessage = "No events to display.",
      density = "comfortable",
      skin,
      className,
      ...props
    },
    ref,
  ) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    const isCompact = density === "compact";

    return (
      <div
        ref={ref}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        data-density={density}
        className={cn("min-w-0", recipe.card, className)}
        {...props}
      >
        {items.length === 0 ? (
          <p
            role="status"
            className={cn(
              "border border-dashed border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]",
              isCompact ? "px-3 py-4" : "px-4 py-7",
            )}
          >
            {emptyMessage}
          </p>
        ) : (
          <ol
            aria-label={ariaLabel}
            className={cn("m-0 list-none p-0", isCompact ? "space-y-3" : "space-y-5")}
          >
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const timestampLabel = item.timestamp ?? item.label;

              return (
                <li key={item.id} className="flex min-w-0 gap-3">
                  <span
                    aria-hidden="true"
                    className="relative flex w-3 shrink-0 self-stretch justify-center"
                  >
                    <span
                      className={cn(
                        "relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--primary)] bg-[var(--background)]",
                      )}
                    />
                    {!isLast ? (
                      <span
                        className={cn(
                          "absolute bottom-[-1.25rem] top-4 w-px bg-[var(--border)]",
                          isCompact && "bottom-[-0.75rem]",
                        )}
                      />
                    ) : null}
                  </span>
                  <div className={cn("min-w-0 flex-1", isCompact ? "pb-0" : "pb-1")}>
                    <div
                      className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm")}
                    >
                      <span className="min-w-0 font-semibold text-[var(--foreground)]">
                        {item.title}
                      </span>
                      {timestampLabel ? (
                        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                          {timestampLabel}
                        </span>
                      ) : null}
                      {item.status ? (
                        <span
                          data-status={item.status}
                          className="border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]"
                        >
                          {item.status}
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <div
                        className={cn(
                          "text-[var(--muted-foreground)]",
                          isCompact ? "mt-1 text-xs" : "mt-1.5 text-sm",
                        )}
                      >
                        {item.description}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  },
);
Timeline.displayName = "Timeline";

export { Timeline };
