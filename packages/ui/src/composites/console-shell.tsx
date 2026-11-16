// Moonwitness Console Shell (Living Story Console L1)
"use client";

import type { ReactNode } from "react";
import { CommandStrip, SideRail, TopRail } from "../primitives/hud-chrome";
import type { HudLinkComponent, HudNavItem } from "../primitives/hud-chrome";
import { cn } from "../lib/utils";

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
  headerSearch?: ReactNode;
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
  headerSearch,
  headerActions,
  commandLeft,
  commandRight,
  linkAs,
  className,
  children,
}: ConsoleShellProps) {
  return (
    <div className={cn("console-shell flex min-h-screen", className)}>
      <div className="console-shell-rail">
        <SideRail
          items={items}
          active={active}
          activeSection={activeSection}
          onNavigate={onNavigate}
          navLabel={navLabel}
          footer={railFooter}
          linkAs={linkAs}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-48">
        <TopRail
          title={title}
          brandHref={brandHref}
          subtitle={subtitle}
          start={headerStart}
          search={headerSearch}
          actions={headerActions}
          linkAs={linkAs}
        />

        <main id="main" className="min-h-0 min-w-0 flex-1">
          {children}
        </main>

        <CommandStrip left={commandLeft} right={commandRight} />
      </div>
    </div>
  );
}
