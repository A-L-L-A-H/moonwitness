"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  skin?: SkinName;
}

/** Skinned native `<select>`: the one sanctioned wrapper for browser-native dropdowns. */
const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, skin, children, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    return (
      <select
        ref={ref}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(
          "flex h-10 w-full px-3 py-2 text-sm text-[var(--foreground)] ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 aria-[invalid=true]:border-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50",
          recipe.input,
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
