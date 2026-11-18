"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../../skin/variants";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "skin"> {
  asChild?: boolean;
  skin?: SkinName | undefined;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      skin,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    const isDisabled = Boolean(disabled || loading);

    return (
      <Comp
        data-skin={resolvedSkin}
        data-dna={dnaId}
        data-variant={variant ?? "default"}
        aria-busy={loading || undefined}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={asChild && isDisabled ? true : undefined}
        className={cn(
          buttonVariants({ variant, size, skin: resolvedSkin }),
          variant !== "dna" &&
            variant !== "imperiumPrimary" &&
            variant !== "imperiumSecondary" &&
            variant !== "link" &&
            variant !== "plain" &&
            recipe.button,
          className,
        )}
        ref={ref}
        {...props}
      >
        {loading && !asChild ? (
          <>
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
