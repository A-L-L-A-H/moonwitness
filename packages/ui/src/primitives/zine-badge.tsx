import type { HTMLAttributes } from "react";
import { SOURCE_PROBE_CLASS } from "../probe";
import { cn } from "../cn";

export interface ZineBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color: string;
  /** true bila warna latarnya terang sehingga teks harus gelap. */
  dark?: boolean;
  /** Optional semantic foreground CSS variable overriding light/dark heuristic. */
  foreground?: string;
}

export function ZineBadge({
  color,
  dark = false,
  foreground,
  className,
  style,
  ...props
}: ZineBadgeProps) {
  return (
    <span
      className={cn(SOURCE_PROBE_CLASS, "px-2 py-0.5 font-brush text-[10px]", className)}
      style={{
        background: color,
        color:
          foreground ?? (dark ? "var(--ink, currentColor)" : "var(--brand-white, currentColor)"),
        ...style,
      }}
      {...props}
    />
  );
}
