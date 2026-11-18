"use client";

import * as React from "react";
import { cva, type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const typographyVariants = cva("text-[var(--foreground)]", {
  variants: {
    variant: {
      display: "font-brush text-4xl font-black tracking-tight sm:text-5xl",
      h1: "text-3xl font-bold tracking-tight sm:text-4xl",
      h2: "text-2xl font-semibold tracking-tight",
      h3: "text-xl font-semibold tracking-tight",
      lead: "text-lg leading-relaxed text-[var(--muted-foreground)]",
      body: "text-base leading-7",
      muted: "text-sm text-[var(--muted-foreground)]",
      code: "rounded-[var(--mw-badge-radius,0.25rem)] border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 font-mono text-sm",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

const TAG_MAP: Record<
  NonNullable<VariantProps<typeof typographyVariants>["variant"]>,
  keyof React.JSX.IntrinsicElements
> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  lead: "p",
  body: "p",
  muted: "p",
  code: "code",
};

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
  skin?: SkinName;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = "body", as, skin, ...props }, ref) => {
    const Comp = as ?? TAG_MAP[variant ?? "body"];
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    return (
      <Comp
        ref={ref}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn(typographyVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Typography.displayName = "Typography";

const Prose = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { skin?: SkinName }
>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <div
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "max-w-prose space-y-4 text-base leading-7 text-[var(--foreground)] [&_a]:text-[var(--primary)] [&_a]:underline [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_p]:text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
});
Prose.displayName = "Prose";

export { Typography, Prose, typographyVariants };
