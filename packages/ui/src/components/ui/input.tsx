"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  skin?: SkinName;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    return (
      <input
        type={type}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(
          "flex min-h-11 w-full px-3 py-2 text-sm ring-offset-[var(--background)] file:border-[var(--border)] file:bg-[var(--card)] file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 aria-[invalid=true]:border-[var(--destructive)] aria-[invalid=true]:focus-visible:ring-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50",
          recipe.input,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
