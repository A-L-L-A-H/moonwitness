"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface SiteNavigationItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly active?: boolean;
  readonly onSelect?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export interface SiteNavigationProps {
  readonly brand: React.ReactNode;
  readonly items: readonly SiteNavigationItem[];
  readonly actions?: React.ReactNode;
  readonly mobileDrawer?: React.ReactNode;
  readonly mobileMenuOpen?: boolean;
  readonly navLabel?: string;
  readonly className?: string;
}

/**
 * Reusable top navigation bar scoped to the active DNA skin.
 */
export function SiteNavigation({
  brand,
  items,
  actions,
  mobileDrawer,
  mobileMenuOpen = false,
  navLabel = "Primary Navigation",
  className,
}: SiteNavigationProps) {
  return (
    <header
      className={cn(
        "mw-site-nav fixed inset-x-0 top-0 z-40",
        mobileMenuOpen && "is-menu-open",
        className,
      )}
    >
      <div className="wrap mw-site-nav-inner mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <div className="shrink-0">{brand}</div>

        <nav
          aria-label={navLabel}
          className="mw-site-nav-links hidden min-w-0 items-center gap-1 lg:flex xl:gap-3"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={item.onSelect}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "mw-site-nav-link relative inline-flex min-h-[44px] items-center whitespace-nowrap px-2 py-1.5 text-xs font-bold tracking-[0.05em] uppercase transition-colors xl:px-3 xl:text-sm xl:tracking-[0.06em]",
                item.active && "is-active",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {actions ? <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">{actions}</div> : null}
      </div>

      {mobileMenuOpen && mobileDrawer ? mobileDrawer : null}
    </header>
  );
}

export interface SectionHeadingProps {
  readonly id?: string;
  readonly kicker?: React.ReactNode;
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly trailing?: React.ReactNode;
  readonly align?: "left" | "center";
  readonly className?: string;
}

/**
 * Reusable editorial section heading with kicker, readable lead, and optional trailing slot.
 */
export function SectionHeading({
  id,
  kicker,
  title,
  description,
  trailing,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mw-section-heading flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <div className="flex w-full flex-wrap items-baseline justify-between gap-4">
        <div className={cn("space-y-2", align === "center" && "mx-auto")}>
          {kicker ? <div className="mw-section-kicker text-xs font-semibold uppercase">{kicker}</div> : null}
          <h2 id={id} className="mw-section-title text-2xl sm:text-4xl font-bold tracking-tight">
            {title}
          </h2>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      {description ? (
        <p className="mw-section-description max-w-2xl text-base leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

export interface StorySectionProps extends React.HTMLAttributes<HTMLElement> {
  readonly id?: string;
  readonly labelledBy?: string;
  readonly tone?: "canvas" | "surface" | "elevated";
}

/**
 * Semantic section wrapper applying `.wrap` gutters and DNA surface tone.
 */
export function StorySection({
  id,
  labelledBy,
  tone = "canvas",
  className,
  children,
  ...props
}: StorySectionProps) {
  const toneClass =
    tone === "surface"
      ? "mw-story-section--surface"
      : tone === "elevated"
        ? "mw-story-section--elevated"
        : "mw-story-section--canvas";

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("mw-story-section relative py-16 px-4 sm:px-8 lg:px-16", toneClass, className)}
      {...props}
    >
      <div className="wrap mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

export interface IllustrationFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly aspectRatio?: "hero" | "worldTile" | "editorialPlate" | "square" | "auto";
  readonly scrim?: boolean;
}

/**
 * Framed container for original illustrations and artwork plates.
 */
export function IllustrationFrame({
  aspectRatio = "editorialPlate",
  scrim = false,
  className,
  children,
  ...props
}: IllustrationFrameProps) {
  const ratioClass =
    aspectRatio === "hero"
      ? "aspect-video"
      : aspectRatio === "worldTile"
        ? "aspect-[16/10]"
        : aspectRatio === "editorialPlate"
          ? "aspect-[16/9]"
          : aspectRatio === "square"
            ? "aspect-square"
            : "";

  return (
    <div
      className={cn(
        "mw-illustration-frame relative w-full overflow-hidden",
        ratioClass,
        className,
      )}
      {...props}
    >
      {children}
      {scrim ? <div aria-hidden="true" className="mw-illustration-scrim pointer-events-none absolute inset-0" /> : null}
    </div>
  );
}

export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  readonly focalPosition?: string;
  readonly aspectRatio?: "hero" | "worldTile" | "editorialPlate" | "square" | "auto";
}

/**
 * Accessible responsive image wrapper inside an IllustrationFrame.
 */
export function ResponsiveImage({
  src,
  alt = "",
  focalPosition = "50% 50%",
  aspectRatio = "auto",
  className,
  style,
  ...props
}: ResponsiveImageProps) {
  return (
    <IllustrationFrame aspectRatio={aspectRatio} className={className}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{ objectPosition: focalPosition, ...style }}
        {...props}
      />
    </IllustrationFrame>
  );
}
