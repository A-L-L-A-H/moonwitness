import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export type ComicPanelTone = "ink" | "paper" | "pink";

export interface ComicPanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: ComicPanelTone;
}

export function ComicPanel({ tone = "ink", className, ...props }: ComicPanelProps) {
  return (
    <div
      className={cn(
        "comic-panel border-[length:var(--mw-card-border-width,2px)] [clip-path:var(--mw-card-clip,none)] transition-transform duration-[var(--mw-motion-duration,200ms)]",
        `comic-panel-${tone}`,
        className,
      )}
      {...props}
    />
  );
}
