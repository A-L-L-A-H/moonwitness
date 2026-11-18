"use client";

import * as React from "react";
import { cva, type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const alertVariants = cva(
  "relative w-full p-4 text-sm [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]",
        destructive:
          "border-2 border-[var(--destructive)] bg-[var(--destructive)]/15 text-[var(--foreground)]",
        warning: "border-2 border-[var(--yellow)] bg-[var(--yellow)]/15 text-[var(--foreground)]",
        success: "border-2 border-[var(--green)] bg-[var(--green)]/15 text-[var(--foreground)]",
        info: "border-2 border-[var(--blue)] bg-[var(--blue)]/15 text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  skin?: SkinName;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, skin, role = "alert", ...props }, ref) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    return (
      <div
        ref={ref}
        role={role}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        data-variant={variant ?? "default"}
        className={cn(recipe.card, alertVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[var(--muted-foreground)] [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
