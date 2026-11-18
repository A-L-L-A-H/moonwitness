// Moonwitness HUD chrome primitives (Living Story Console L1)
"use client";

import type { ComponentType, KeyboardEvent, ReactNode } from "react";
import { Crown } from "../icons";
import { cn } from "../lib/utils";
import { useSkin } from "../skin";

/** Link injector: default 'a'. Consumer Next.js bisa melewati next/link. */
export type HudLinkComponent = ComponentType<{
  href: string;
  className?: string | undefined;
  onClick?: (() => void) | undefined;
  "aria-current"?: "page" | "location" | undefined;
  title?: string | undefined;
  children?: ReactNode | undefined;
}>;

export interface HudNavItem {
  id: string;
  label: string;
  /** Stroke path SVG (viewBox 0 0 24 24), pola yang sama dengan Sidebar apps/web. */
  iconPath: string;
  href: string;
  /** Omitted for ordinary route links. */
  kind?: "route" | "section" | "module";
}

export interface TopRailProps {
  title: string;
  brandHref?: string | undefined;
  subtitle?: string | undefined;
  start?: ReactNode | undefined;
  search?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  linkAs?: HudLinkComponent | undefined;
  className?: string | undefined;
}

export function TopRail({
  title,
  brandHref = "/",
  subtitle,
  start,
  search,
  actions,
  linkAs,
  className,
}: TopRailProps) {
  const BrandLink = linkAs ?? "a";
  const { getClasses } = useSkin();
  return (
    <header
      className={cn(
        "hud-panel hud-edge-bottom hud-top-rail sticky top-0 z-40 shrink-0",
        getClasses("hudPanel"),
        className,
      )}
    >
      <BrandLink href={brandHref} className="hud-brand flex min-h-11 items-center gap-2">
        <Crown className="h-5 w-8 shrink-0 text-[var(--primary)]" />
        <span className="font-brush text-sm leading-none text-[var(--foreground)] sm:text-lg">
          MOON<span className="text-[var(--primary)]">WITNESS</span>
        </span>
        {subtitle ? (
          <span className="hidden font-hand text-sm text-[var(--muted-foreground)] 2xl:inline">
            {subtitle}
          </span>
        ) : null}
      </BrandLink>
      {actions ? <div className="hud-top-actions">{actions}</div> : null}
      <div className="hud-breadcrumb flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--foreground)]">
        {start}
        <span className="min-w-0 break-words font-medium">{title}</span>
      </div>
      {search ? <div className="hud-top-search">{search}</div> : null}
    </header>
  );
}

export interface SideRailProps {
  items: HudNavItem[];
  active?: string | undefined;
  activeSection?: string | null | undefined;
  onNavigate?: (() => void) | undefined;
  navLabel?: string | undefined;
  footer?: ReactNode | undefined;
  linkAs?: HudLinkComponent | undefined;
  className?: string | undefined;
}

function navigateRail(event: KeyboardEvent<HTMLDivElement>) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const index = links.findIndex((link) => link === event.target);
  if (index < 0) return;
  let next: number;
  switch (event.key) {
    case "ArrowDown":
    case "ArrowRight":
      next = (index + 1) % links.length;
      break;
    case "ArrowUp":
    case "ArrowLeft":
      next = (index - 1 + links.length) % links.length;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = links.length - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  links[next]?.focus();
}

export function SideRail({
  items,
  active,
  activeSection,
  onNavigate,
  navLabel = "Empire",
  footer,
  linkAs,
  className,
}: SideRailProps) {
  const NavLink = linkAs ?? "a";
  const { getClasses } = useSkin();
  return (
    <nav
      aria-label={navLabel}
      className={cn("hud-panel hud-side-rail", getClasses("hudPanel"), className)}
    >
      <div className="hud-nav-items" onKeyDown={navigateRail}>
        {items.map((item) => {
          const current =
            item.kind === "section"
              ? item.id === (activeSection ?? active)
                ? "location"
                : undefined
              : item.kind !== "module" && item.id === active
                ? "page"
                : undefined;
          return (
            <NavLink
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              aria-current={current}
              className="hud-nav-link"
            >
              <svg
                aria-hidden="true"
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
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      {footer ? (
        <div className="hud-rail-footer border-t-2 border-[var(--line)] p-2">{footer}</div>
      ) : null}
    </nav>
  );
}

export interface CommandStripProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function CommandStrip({ left, right, className }: CommandStripProps) {
  const { getClasses } = useSkin();
  return (
    <footer
      className={cn(
        "hud-panel hud-edge-top flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[10px] tracking-widest text-[var(--muted-foreground)]",
        getClasses("hudPanel"),
        className,
      )}
    >
      <span className="min-w-0 break-words">{left}</span>
      <span className="flex min-w-0 items-center gap-2">{right}</span>
    </footer>
  );
}

export interface CornerBracketsProps {
  children: ReactNode;
  className?: string;
}

export function CornerBrackets({ children, className }: CornerBracketsProps) {
  return (
    <div className={cn("hud-bracket", className)}>
      <span aria-hidden="true" className="hud-corner hud-corner-tl" />
      <span aria-hidden="true" className="hud-corner hud-corner-tr" />
      <span aria-hidden="true" className="hud-corner hud-corner-bl" />
      <span aria-hidden="true" className="hud-corner hud-corner-br" />
      {children}
    </div>
  );
}

const TONE_TEXT: Record<string, string> = {
  pink: "text-[var(--pink)]",
  blue: "text-[var(--blue)]",
  yellow: "text-[var(--yellow)]",
  green: "text-[var(--green)]",
};
const TONE_BAR: Record<string, string> = {
  pink: "bg-[var(--pink)]",
  blue: "bg-[var(--blue)]",
  yellow: "bg-[var(--yellow)]",
  green: "bg-[var(--green)]",
};

export interface GaugeProps {
  label: string;
  value: string;
  tone?: "pink" | "blue" | "yellow" | "green";
  percent?: number;
  className?: string;
}

export function Gauge({ label, value, tone = "pink", percent, className }: GaugeProps) {
  const clamped = percent === undefined ? null : Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-mono text-[10px] tracking-[0.18em] text-[var(--paper)]">
          {label}
        </span>
        <span className={cn("font-mono text-sm font-bold", TONE_TEXT[tone])}>{value}</span>
      </div>
      {clamped !== null ? (
        <div className="mt-1 h-1 w-full bg-[var(--line)]" role="presentation">
          <div className={cn("h-full", TONE_BAR[tone])} style={{ width: clamped + "%" }} />
        </div>
      ) : null}
    </div>
  );
}
