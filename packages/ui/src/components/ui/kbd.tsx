"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  skin?: SkinName;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <kbd
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-[var(--mw-badge-radius,0.25rem)] border border-[var(--border)] bg-[var(--muted)] px-1.5 font-mono text-[11px] font-medium text-[var(--foreground)] shadow-sm",
        className,
      )}
      {...props}
    />
  );
});
Kbd.displayName = "Kbd";

export { Kbd };
