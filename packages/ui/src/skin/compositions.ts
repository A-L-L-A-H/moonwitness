// Moonwitness Skin Layer -- Composite Skin Recipes
// Component-level skin compositions built from variants + effects

import { cva, type VariantProps } from '../lib/utils';
import { halftone, grain, cmykSlip, duotone, sticker, brushUnderline, composeEffects } from './effects';

/**
 * EventCard skin compositions
 * Maps skin names to complete visual recipes
 */
export const eventCardVariants = cva(
  'zine-card relative overflow-hidden transition-all duration-300',
  {
    variants: {
      skin: {
        default: '',
        riot: composeEffects(halftone({ color: { hex: '#ff2d78' }, opacity: 0.22 }), grain({ opacity: 0.18 }), cmykSlip()),
        editorial: composeEffects(duotone({ opacity: 0.6 }), brushUnderline({ color: { hex: '#ffd21f' } })),
        technical: 'border-l-4 border-[var(--blue)] bg-[var(--panel)]/50',
        archive: composeEffects(grain({ opacity: 0.3 }), 'border-2 border-[var(--paper)]'),
        transmission: composeEffects(halftone({ color: { hex: '#2ea8ff' }, opacity: 0.15 }), 'border-t-2 border-[var(--blue)]'),
        sanctuary: 'border border-[var(--primary)]/50 bg-[var(--card)]',
        brutalist: 'rounded-none border-4 border-[var(--border)] bg-[var(--card)] shadow-[6px_6px_0_var(--border)]',
        noir: composeEffects(grain({ opacity: 0.28 }), 'border border-[var(--border)] bg-[var(--card)] grayscale'),
        kinetic: 'border-2 border-[var(--primary)] -skew-x-1 hover:skew-x-0 transition-transform',
      },
      density: {
        compact: 'p-3',
        comfortable: 'p-5',
        spacious: 'p-8',
      },
    },
    compoundVariants: [
      { skin: 'riot', density: 'comfortable', className: 'shadow-[var(--shadow-zine)]' },
      { skin: 'editorial', density: 'spacious', className: 'font-brush' },
    ],
    defaultVariants: { skin: 'default', density: 'comfortable' },
  }
);

/**
 * KanbanColumn skin compositions
 */
export const kanbanColumnVariants = cva(
  'flex flex-col gap-3 min-h-[200px] rounded-lg p-3 transition-all duration-200',
  {
    variants: {
      skin: {
        default: 'bg-[var(--panel)] border border-[var(--line)]',
        riot: composeEffects(grain({ opacity: 0.2 }), 'bg-[var(--panel-2)] border-2 border-[var(--pink)] shadow-[var(--shadow-cmyk)]'),
        editorial: 'bg-[var(--paper)]/10 border-2 border-[var(--pink)] font-brush',
        technical: 'bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--accent)] font-mono',
        archive: 'bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--border)] font-hand',
        transmission: 'bg-[var(--panel)] border border-[var(--blue)] bg-gradient-to-b from-[var(--blue)]/5 to-transparent',
        sanctuary: 'bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--primary)]/45 font-serif',
        brutalist: 'rounded-none bg-[var(--card)] text-[var(--card-foreground)] border-4 border-[var(--border)] shadow-[5px_5px_0_var(--border)]',
        noir: 'bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] font-mono grayscale',
        kinetic: 'bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--primary)] font-brush',
      },
      compact: {
        true: 'gap-1.5 p-2',
        false: 'gap-3 p-3',
      },
    },
    defaultVariants: { skin: 'default', compact: false },
  }
);

/**
 * ModuleCard skin compositions
 */
export const moduleCardVariants = cva(
  'relative group overflow-hidden rounded-xl border transition-all duration-300',
  {
    variants: {
      skin: {
        default: 'border-[var(--line)] bg-[var(--panel)] hover:border-[var(--pink)] hover:shadow-[var(--shadow-zine-hover)]',
        riot: composeEffects(
          'border-2 border-[var(--line)] bg-[var(--panel)]',
          halftone({ color: { hex: '#ff2d78' }, opacity: 0.15 }),
          grain({ opacity: 0.15 }),
          'hover:border-[var(--pink)] hover:shadow-[var(--shadow-cmyk)] hover:-translate-y-1'
        ),
        editorial: composeEffects(
          'border-2 border-[var(--pink)] bg-transparent',
          'hover:bg-[var(--pink)]/5 font-brush'
        ),
        technical: 'border border-[var(--blue)] bg-[var(--panel)]/50 hover:border-[var(--blue)] hover:shadow-[0_0_20px_rgba(46,168,255,0.3)] font-mono',
        archive: composeEffects(
          'border-2 border-[var(--ink)] bg-[var(--paper)] font-hand',
          grain({ opacity: 0.2 }),
          'hover:border-[var(--yellow)] hover:bg-[var(--yellow)]/10'
        ),
        transmission: composeEffects(
          'border border-[var(--blue)] bg-gradient-to-br from-[var(--blue)]/10 to-[var(--panel)]',
          halftone({ color: { hex: '#2ea8ff' }, opacity: 0.1 }),
          'hover:border-[var(--blue)] hover:shadow-[0_0_24px_rgba(46,168,255,0.4)]'
        ),
        sanctuary: 'border border-[var(--primary)]/50 bg-[var(--card)] font-serif hover:border-[var(--primary)]',
        brutalist: 'rounded-none border-4 border-[var(--border)] bg-[var(--card)] shadow-[6px_6px_0_var(--border)] hover:-translate-x-1 hover:-translate-y-1',
        noir: 'border border-[var(--border)] bg-[var(--card)] grayscale hover:grayscale-0 transition-all',
        kinetic: 'border-2 border-[var(--primary)] bg-[var(--card)] -skew-x-1 hover:skew-x-0 hover:scale-[1.02]',
      },
      size: {
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
        xl: 'p-8',
      },
      elevated: {
        true: 'shadow-[var(--shadow-zine)] hover:shadow-[var(--shadow-zine-hover)]',
        false: '',
      },
    },
    compoundVariants: [
      { skin: 'riot', elevated: true, className: 'shadow-[var(--shadow-zine-rough)]' },
      { skin: 'archive', size: 'lg', className: 'sticker' },
    ],
    defaultVariants: { skin: 'default', size: 'md', elevated: true },
  }
);

/**
 * Button skin compositions (extending variants.ts buttonVariants)
 */
export const buttonSkinCompositions = {
  riot: {
    base: 'relative overflow-hidden',
    effects: composeEffects(
      halftone({ color: { hex: '#ff2d78' }, opacity: 0.2 }),
      cmykSlip({ offset: '1.5px' })
    ),
    hover: 'brightness-110 -translate-y-0.5 rotate-[-0.5deg]',
    active: 'translate-y-1',
  },
  editorial: {
    base: 'font-brush tracking-wider',
    effects: cmykSlip(),
    hover: 'bg-[var(--pink)]/10',
  },
  technical: {
    base: 'font-mono tracking-normal',
    effects: '',
    hover: 'bg-[var(--blue)]/10 shadow-[0_0_16px_rgba(46,168,255,0.3)]',
  },
  archive: {
    base: 'font-hand',
    effects: composeEffects(grain({ opacity: 0.2 }), sticker({ rotation: '-1deg' })),
    hover: 'bg-[var(--yellow)]/20',
  },
  transmission: {
    base: 'font-mono',
    effects: halftone({ color: { hex: '#2ea8ff' }, opacity: 0.15 }),
    hover: 'shadow-[0_0_20px_rgba(46,168,255,0.4)]',
  },
  sanctuary: {
    base: 'font-serif tracking-widest uppercase',
    effects: '',
    hover: 'border-[var(--primary)]',
  },
  brutalist: {
    base: 'rounded-none border-4 font-bold uppercase tracking-widest',
    effects: '',
    hover: '-translate-x-0.5 -translate-y-0.5',
  },
  noir: {
    base: 'font-mono tracking-wider',
    effects: grain({ opacity: 0.2 }),
    hover: 'brightness-110',
  },
  kinetic: {
    base: 'font-brush uppercase -skew-x-3',
    effects: '',
    hover: 'skew-x-0 scale-105',
  },
};

/**
 * Input skin compositions
 */
export const inputSkinCompositions = {
  riot: 'zine-input border-[var(--primary)] focus:ring-[var(--primary)] focus:ring-2',
  editorial: 'zine-input border-[var(--line)] focus:border-[var(--primary)] focus:ring-[var(--primary)] font-brush',
  technical: 'zine-input border-[var(--accent)] focus:border-[var(--accent)] focus:ring-[var(--accent)] font-mono bg-[var(--background)] text-[var(--foreground)]',
  archive: 'zine-input border-[var(--border)] focus:border-[var(--secondary)] focus:ring-[var(--secondary)] font-hand bg-[var(--card)] text-[var(--card-foreground)]',
  transmission: 'zine-input border-[var(--accent)] focus:border-[var(--accent)] focus:ring-[var(--accent)] font-mono bg-[var(--card)] text-[var(--card-foreground)]',
  sanctuary: 'zine-input border-[var(--primary)]/60 focus:border-[var(--primary)] font-serif bg-[var(--background)] text-[var(--foreground)]',
  brutalist: 'rounded-none border-4 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-bold',
  noir: 'zine-input border-[var(--border)] focus:border-[var(--primary)] font-mono bg-[var(--background)] text-[var(--foreground)]',
  kinetic: 'zine-input border-2 border-[var(--primary)] focus:border-[var(--accent)] font-mono bg-[var(--background)] text-[var(--foreground)] -skew-x-2 focus:skew-x-0',
};

/**
 * Badge skin compositions
 */
export const badgeSkinCompositions = {
  riot: 'bg-[var(--pink)]/20 text-[var(--pink)] border border-[var(--pink)]/30 halftone-pink',
  editorial: 'bg-transparent text-[var(--pink)] border-2 border-[var(--pink)] font-brush',
  technical: 'bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)] font-mono',
  archive: 'bg-[var(--paper)] text-[var(--ink)] border-2 border-[var(--ink)] font-hand',
  transmission: 'bg-[var(--blue)]/20 text-[var(--blue)] border border-[var(--blue)] font-mono',
  sanctuary: 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/50 font-serif tracking-widest',
  brutalist: 'rounded-none border-2 border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] font-bold uppercase',
  noir: 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] font-mono',
  kinetic: 'bg-[var(--primary)] text-[var(--primary-foreground)] -skew-x-6 font-brush uppercase',
};

/**
 * Card skin compositions
 */
export const cardSkinCompositions = {
  riot: composeEffects(
    'zine-card',
    halftone({ color: { hex: '#ff2d78' }, opacity: 0.1 }),
    grain({ opacity: 0.1 })
  ),
  editorial: composeEffects(
    'border-2 border-[var(--pink)] bg-transparent',
    'hover:bg-[var(--pink)]/5'
  ),
  technical: 'bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--accent)] hover:border-[var(--accent)] hover:shadow-[0_0_20px_rgba(46,168,255,0.2)]',
  archive: composeEffects(
    'bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--border)]',
    grain({ opacity: 0.25 }),
    'hover:border-[var(--secondary)]'
  ),
  transmission: composeEffects(
    'bg-[var(--panel)] border border-[var(--blue)]',
    halftone({ color: { hex: '#2ea8ff' }, opacity: 0.08 }),
    'hover:shadow-[0_0_24px_rgba(46,168,255,0.3)]'
  ),
  sanctuary: 'bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--primary)]/45 font-serif',
  brutalist: 'rounded-none bg-[var(--card)] text-[var(--card-foreground)] border-4 border-[var(--border)] shadow-[6px_6px_0_var(--border)]',
  noir: composeEffects(
    'bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)]',
    grain({ opacity: 0.22 })
  ),
  kinetic: 'bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--primary)] -skew-x-1 hover:skew-x-0 transition-transform',
};

/**
 * Composite skin type for external use
 */
export type SkinName =
  | 'default'
  | 'riot'
  | 'editorial'
  | 'technical'
  | 'archive'
  | 'transmission'
  | 'sanctuary'
  | 'brutalist'
  | 'noir'
  | 'kinetic';

export type EventCardSkin = VariantProps<typeof eventCardVariants>;
export type KanbanColumnSkin = VariantProps<typeof kanbanColumnVariants>;
export type ModuleCardSkin = VariantProps<typeof moduleCardVariants>;
