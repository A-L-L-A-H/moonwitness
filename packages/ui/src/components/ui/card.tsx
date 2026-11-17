"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { useComponentSkin, type ComponentSkinProp } from "./skin-adapter";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly skin?: ComponentSkinProp;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, skin, ...props }, ref) => {
  const { skin: resolvedSkin, legacySkin, dnaId, recipe } = useComponentSkin(skin);
  return (
    <div
      ref={ref}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        legacySkin === "imperium"
          ? "octa-bevel-shell relative rounded-none text-[var(--dna-text)]"
          : legacySkin === "dna"
            ? "mw-dna-surface rounded-none border border-[var(--dna-border)] bg-[var(--dna-surface)] text-[var(--dna-text)]"
            : recipe.card,
        className,
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-[var(--muted-foreground)]", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
