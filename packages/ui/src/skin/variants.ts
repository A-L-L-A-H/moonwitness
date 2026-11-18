// Moonwitness Skin Layer -- Canonical Button Variants (Single Authority)
// CVA recipes consuming CSS custom properties mapped by DNA + Theme + Skin tokens.
import { cva } from "../lib/utils";

/**
 * Canonical Button variants consumed by both `components/ui/button.tsx` and `Skinned.Button`.
 * Supports functional variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`),
 * explicit skin variants (`riot`, `editorial`, `technical`, `archive`, `transmission`),
 * and Master DNA variants (`dna`, `imperiumPrimary`, `imperiumSecondary`).
 */
export const buttonVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-2 whitespace-normal text-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110 active:brightness-95",
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:brightness-110",
        outline:
          "border-2 border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-[var(--primary)]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:brightness-105",
        ghost: "bg-transparent hover:bg-[var(--muted)] text-[var(--foreground)]",
        link: "border-0 bg-transparent shadow-none text-[var(--primary)] underline-offset-4 hover:underline",
        riot: "bg-[var(--primary)] text-[var(--primary-foreground)] border-2 border-[var(--border)] shadow-[4px_4px_0_var(--ink)] hover:brightness-110",
        editorial:
          "bg-transparent border-2 border-[var(--primary)] text-[var(--foreground)] hover:bg-[var(--primary)]/10",
        technical:
          "bg-[var(--card)] border border-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/15",
        archive:
          "bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--border)] hover:bg-[var(--muted)]",
        transmission:
          "bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110",
        sanctuary:
          "border border-[var(--primary)] bg-transparent text-[var(--primary)] font-serif uppercase tracking-[0.18em] hover:bg-[var(--primary)]/12",
        brutalist:
          "rounded-none border-4 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-bold uppercase tracking-widest hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]",
        noir:
          "border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] font-mono uppercase tracking-wider hover:border-[var(--primary)]",
        kinetic:
          "border-2 border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] font-brush uppercase -skew-x-3 hover:skew-x-0 hover:scale-105",
        dna: "mw-dna-button rounded-none border border-[var(--dna-border)] bg-[var(--dna-accent)] text-[var(--dna-accent-fg)] hover:brightness-110",
        imperiumPrimary:
          "btn-chamfer font-monument rounded-none text-[var(--brand-ink)] tracking-[0.2em] uppercase",
        imperiumSecondary:
          "btn-luxe-secondary font-mono rounded-none text-[var(--brand-white)] tracking-[0.16em] uppercase",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-12 px-8 text-base",
        xl: "min-h-14 px-10 text-lg",
        icon: "h-11 w-11",
      },
      skin: {
        default: "",
        riot: "font-brush uppercase tracking-wider",
        editorial: "font-serif tracking-wide",
        technical: "font-mono uppercase tracking-wider",
        archive: "font-serif",
        transmission: "font-mono uppercase tracking-wider",
        sanctuary: "font-serif tracking-[0.16em] uppercase",
        brutalist: "font-bold uppercase tracking-widest rounded-none",
        noir: "font-mono tracking-wider",
        kinetic: "font-brush uppercase tracking-wide",
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
