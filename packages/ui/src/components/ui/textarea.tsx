"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  skin?: SkinName;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    return (
      <textarea
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(
          "flex min-h-[80px] w-full px-3 py-2 text-sm ring-offset-[var(--background)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 aria-[invalid=true]:border-[var(--destructive)] aria-[invalid=true]:focus-visible:ring-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50",
          recipe.input,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
