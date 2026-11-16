// Moonwitness HUD chrome primitives (Living Story Console L1)
'use client';

import type { ComponentType, ReactNode } from 'react';
import { Crown } from '../icons';
import { cn } from '../lib/utils';

/** Link injector: default 'a'. Consumer Next.js bisa melewati next/link. */
export type HudLinkComponent = ComponentType<{
  href: string;
  className?: string;
  onClick?: () => void;
  'aria-current'?: 'page' | undefined;
  title?: string;
  children?: ReactNode;
}>;

export interface HudNavItem {
  id: string;
  label: string;
  /** Stroke path SVG (viewBox 0 0 24 24), pola yang sama dengan Sidebar apps/web. */
  iconPath: string;
  href: string;
}

export function TopRail({
  title,
  brandHref = '/',
  subtitle,
  start,
  actions,
  linkAs,
  className,
}: {
  title: string;
  brandHref?: string;
  subtitle?: string;
  start?: ReactNode;
  actions?: ReactNode;
  linkAs?: HudLinkComponent;
  className?: string;
}) {
  const BrandLink = linkAs ?? 'a';
  return (
    <header
      className={cn(
        'hud-panel hud-edge-bottom sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 px-4',
        className,
      )}
    >
      <BrandLink href={brandHref} className="flex min-w-0 items-center gap-2">
        <Crown className="h-5 w-8 shrink-0 text-[var(--yellow)]" />
        <span className="font-brush text-lg leading-none text-[var(--paper)]">
          MOON<span className="text-[var(--pink)]">WITNESS</span>
        </span>
        {subtitle ? (
          <span className="hidden font-hand text-sm text-zinc-400 md:inline">{subtitle}</span>
        ) : null}
      </BrandLink>
      {start ? (
        <div className="hidden items-center gap-2 text-sm text-zinc-400 sm:flex">{start}</div>
      ) : null}
      <h1 className="sr-only">{title}</h1>
      <span aria-hidden className="truncate text-sm font-medium text-[var(--paper)]">
        {title}
      </span>
      {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SideRail({
  items,
  active,
  activeSection,
  onNavigate,
  navLabel = 'Empire',
  footer,
  linkAs,
  className,
}: {
  items: HudNavItem[];
  active?: string;
  activeSection?: string | null;
  onNavigate?: () => void;
  navLabel?: string;
  footer?: ReactNode;
  linkAs?: HudLinkComponent;
  className?: string;
}) {
  const NavLink = linkAs ?? 'a';
  return (
    <nav aria-label={navLabel} className={cn('hud-panel flex h-full flex-col', className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {items.map((item) => {
          const isActive = item.id === active || item.id === activeSection;
          return (
            <NavLink
              key={item.id}
              href={item.href}
              onClick={() => onNavigate?.()}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              className={cn(
                'flex min-h-11 items-center justify-center gap-2 border border-transparent px-2 py-2 text-zinc-300 transition-colors hover:border-[var(--line)] hover:bg-[var(--panel)] hover:text-white',
                isActive && 'hud-edge-left border-[var(--line)] bg-[var(--panel)] text-[var(--pink)]',
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.iconPath} />
              </svg>
              <span className="sr-only">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      {footer ? <div className="border-t-2 border-[var(--line)] p-2">{footer}</div> : null}
    </nav>
  );
}

export function CommandStrip({
  left,
  right,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        'hud-panel hud-edge-top flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[10px] tracking-wider text-zinc-500',
        className,
      )}
    >
      <span className="min-w-0">{left}</span>
      <span className="flex min-w-0 items-center gap-2">{right}</span>
    </footer>
  );
}

export function CornerBrackets({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('hud-bracket', className)}>{children}</div>;
}

const TONE_TEXT: Record<string, string> = {
  pink: 'text-[var(--pink)]',
  blue: 'text-[var(--blue)]',
  yellow: 'text-[var(--yellow)]',
};
const TONE_BAR: Record<string, string> = {
  pink: 'bg-[var(--pink)]',
  blue: 'bg-[var(--blue)]',
  yellow: 'bg-[var(--yellow)]',
};

export function Gauge({
  label,
  value,
  tone = 'pink',
  percent,
  className,
}: {
  label: string;
  value: string;
  tone?: 'pink' | 'blue' | 'yellow';
  percent?: number;
  className?: string;
}) {
  const clamped = percent === undefined ? null : Math.max(0, Math.min(100, percent));
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-mono text-[10px] tracking-[0.18em] text-zinc-500">
          {label}
        </span>
        <span className={cn('font-mono text-sm font-bold', TONE_TEXT[tone])}>{value}</span>
      </div>
      {clamped !== null ? (
        <div className="mt-1 h-1 w-full bg-[var(--line)]" role="presentation">
          <div className={cn('h-full', TONE_BAR[tone])} style={{ width: clamped + '%' }} />
        </div>
      ) : null}
    </div>
  );
}
