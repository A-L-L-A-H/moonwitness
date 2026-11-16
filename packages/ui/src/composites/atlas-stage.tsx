"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";
import { useSkin } from "../skin";

export interface AtlasStageProps extends HTMLAttributes<HTMLDivElement> {
  backdrop?: ReactNode;
  effects?: ReactNode;
  controls?: ReactNode;
  details?: ReactNode;
}

export function AtlasStage({
  backdrop,
  effects,
  controls,
  details,
  children,
  className,
  ...props
}: AtlasStageProps) {
  const { getClasses } = useSkin();
  return (
    <div {...props} data-atlas-stage className={cn("atlas-stage @container min-w-0", className)}>
      <div
        className={cn("grid min-w-0 gap-4", details && "@[40rem]:grid-cols-[minmax(0,1fr)_18rem]")}
      >
        <div
          className={cn(
            "atlas-frame relative isolate min-w-0 overflow-hidden p-4",
            getClasses("atlasStage"),
          )}
        >
          {backdrop && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
              {backdrop}
              <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--ink)_55%,transparent)]" />
            </div>
          )}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {effects}
          </div>
          <div className="relative min-w-0">{children}</div>
          {controls && <div className="relative mt-3">{controls}</div>}
        </div>
        {details && <div className="min-w-0">{details}</div>}
      </div>
    </div>
  );
}
