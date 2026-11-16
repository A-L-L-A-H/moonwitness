import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--pink)] text-[var(--ink)] hover:bg-[var(--pink)]/90 active:bg-[var(--pink)]/80 shadow-[0_4px_0_var(--ink)]",
        destructive:
          "bg-[var(--red)] text-white hover:bg-[var(--red)]/90 shadow-[0_4px_0_rgba(255,59,59,0.6)]",
        outline:
          "border-2 border-[var(--line)] bg-transparent hover:bg-[var(--panel)] hover:border-[var(--pink)] text-[var(--pink)]",
        secondary:
          "bg-[var(--yellow)] text-[var(--ink)] hover:bg-[var(--yellow)]/90 shadow-[0_4px_0_rgba(255,210,31,0.6)]",
        ghost: "bg-transparent hover:bg-[var(--panel)] text-[var(--paper)]",
        link: "text-[var(--pink)] underline-offset-4 hover:underline",
        dna: "mw-dna-button rounded-none border border-[var(--dna-border,#d6b46c)] bg-[var(--dna-accent,#d6b46c)] text-[var(--dna-accent-fg,#040509)] hover:brightness-110",
        imperiumPrimary:
          "btn-chamfer font-monument rounded-none text-[#fff6df] tracking-[0.2em] uppercase hover:text-white",
        imperiumSecondary:
          "btn-luxe-secondary font-mono rounded-none text-[#f0e5cf] tracking-[0.16em] uppercase hover:text-[#fff6df]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-md px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
