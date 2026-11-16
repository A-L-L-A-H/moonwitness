// Moonwitness Console Shell (Living Story Console L1 — HUD Console)
'use client';

import type { ReactNode } from 'react';
import { CommandStrip, SideRail, TopRail } from '../primitives/hud-chrome';
import type { HudLinkComponent, HudNavItem } from '../primitives/hud-chrome';
import { cn } from '../lib/utils';

export interface ConsoleShellProps {
  title: string;
  brandHref?: string;
  subtitle?: string;
  navLabel?: string;
  items: HudNavItem[];
  active?: string;
  activeSection?: string | null;
  onNavigate?: () => void;
  railFooter?: ReactNode;
  headerStart?: ReactNode;
  headerActions?: ReactNode;
  commandLeft?: ReactNode;
  commandRight?: ReactNode;
  linkAs?: HudLinkComponent;
  className?: string;
  children: ReactNode;
}

export function ConsoleShell({
  title,
  brandHref,
  subtitle,
  navLabel,
  items,
  active,
  activeSection,
  onNavigate,
  railFooter,
  headerStart,
  headerActions,
  commandLeft,
  commandRight,
  linkAs,
  className,
  children,
}: ConsoleShellProps) {
  const NavLink = linkAs ?? 'a';
  return (
    <div className={cn('flex min-h-screen', className)}>
      <div className="fixed inset-y-0 left-0 z-40 hidden w-16 lg:block">
        <SideRail
          items={items}
          active={active}
          activeSection={activeSection}
          onNavigate={onNavigate}
          navLabel={navLabel}
          footer={railFooter}
          linkAs={linkAs}
          className="hud-edge-right w-16"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-16">
        <TopRail
          title={title}
          brandHref={brandHref}
          subtitle={subtitle}
          start={headerStart}
          actions={headerActions}
          linkAs={linkAs}
        />

        <main id="main" className="min-h-0 min-w-0 flex-1">
          {children}
        </main>

        <CommandStrip left={commandLeft} right={commandRight} />
      </div>

      {/* Mobile: rail jadi strip ikon horizontal di bawah layar */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <nav
          aria-label={navLabel ?? 'Empire'}
          className="hud-panel hud-edge-top flex items-stretch justify-around overflow-x-auto"
        >
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
                  'flex min-h-12 min-w-12 flex-1 items-center justify-center text-zinc-300',
                  isActive && 'text-[var(--pink)]',
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
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
        </nav>
      </div>
    </div>
  );
}
