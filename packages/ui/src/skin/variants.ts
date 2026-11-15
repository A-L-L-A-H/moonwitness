// Moonwitness Skin Layer -- Component Visual Variants
// CVA recipes powered by DNA tokens
import { cva } from "../lib/utils";

/**
 * Button skin variants mapping to DNA tokens  
 * Each skin applies a complete visual expression from the design system  
 */
export const buttonVariants = cva(
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
        riot: "bg-[var(--pink)] text-[var(--ink)] hover:bg-[var(--pink)]/90 shadow-[var(--shadow-cmyk)] border-2 border-[var(--line)]",
        editorial:
          "bg-transparent border-2 border-[var(--pink)] text-[var(--pink)] hover:bg-[var(--pink)]/10",
        technical:
          "bg-[var(--panel)] border border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue)]/10",
        archive:
          "bg-[var(--paper)] text-[var(--ink)] border-2 border-[var(--ink)] hover:bg-[var(--yellow)]/20",
        transmission:
          "bg-[var(--blue)] text-[var(--ink)] hover:bg-[var(--blue)]/90 shadow-[0_4px_0_rgba(46,168,255,0.6)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-md px-10 text-lg",
        icon: "h-10 w-10",
      },
      skin: {
        default: "",
        riot: "relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[var(--pink)] before:opacity-0 before:transition-opacity hover:before:opacity-5 before:mix-blend-multiply",
        editorial: "font-brush tracking-wider",
        technical: "font-mono tracking-normal",
        archive: "font-hand",
        transmission: "font-mono",
      },
    },
    compoundVariants: [
      { variant: "riot", skin: "riot", className: "halftone" },
      { variant: "editorial", skin: "editorial", className: "cmyk-slip" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      skin: "default",
    },
  },
);
