"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { DnaBadge } from "./primitives";

export interface EditorialFeatureProps {
  readonly media: React.ReactNode;
  readonly content: React.ReactNode;
  readonly mediaPosition?: "left" | "right";
  readonly className?: string;
}

/**
 * Two-column editorial layout balancing an illustration frame and legible reading content.
 */
export function EditorialFeature({
  media,
  content,
  mediaPosition = "right",
  className,
}: EditorialFeatureProps) {
  return (
    <div
      className={cn(
        "mw-editorial-feature grid grid-cols-1 items-start gap-8 lg:grid-cols-12",
        className,
      )}
    >
      <div className={cn("lg:col-span-6", mediaPosition === "left" ? "lg:order-2" : "lg:order-1")}>
        {media}
      </div>
      <div className={cn("lg:col-span-6", mediaPosition === "left" ? "lg:order-1" : "lg:order-2")}>
        {content}
      </div>
    </div>
  );
}

export interface WorldTileProps {
  readonly indexLabel?: string;
  readonly title: React.ReactNode;
  readonly tagline: React.ReactNode;
  readonly ctaLabel: React.ReactNode;
  readonly media?: React.ReactNode;
  readonly active?: boolean;
  readonly variant?: "default" | "highlight";
  readonly href?: string;
  readonly onClick?: () => void;
  readonly className?: string;
}

/**
 * Reusable illustrated world tile card. Accepts all text and artwork via props.
 */
export function WorldTile({
  indexLabel,
  title,
  tagline,
  ctaLabel,
  media,
  active = false,
  variant = "default",
  href,
  onClick,
  className,
}: WorldTileProps) {
  const content = (
    <>
      {media ? (
        <span className="mw-world-tile-media relative block w-full overflow-hidden">
          {media}
          {indexLabel ? (
            <span className="mw-world-tile-index" aria-hidden="true">
              {indexLabel}
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="mw-world-tile-body">
        <span className="mw-world-tile-title">{title}</span>
        <span className="mw-world-tile-tagline">{tagline}</span>
        <span className="mw-world-tile-cta">
          <span>{ctaLabel}</span>
          <span aria-hidden="true">&rarr;</span>
        </span>
      </span>
    </>
  );

  const classes = cn(
    "mw-world-tile portal-arch-card group relative flex min-w-0 flex-col overflow-hidden text-left cursor-pointer",
    variant === "highlight" && "is-highlighted",
    active && "is-active",
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

export interface WorldExplorerProps {
  readonly heading?: React.ReactNode;
  readonly trailing?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/**
 * Reusable bottom/section shelf framing a set of WorldTile cards.
 */
export function WorldExplorer({
  heading,
  trailing,
  children,
  className,
}: WorldExplorerProps) {
  return (
    <div className={cn("mw-world-explorer relative z-10 w-full", className)}>
      {heading || trailing ? (
        <div className="mw-world-explorer-header flex items-center justify-between gap-4">
          {heading ? <div className="mw-world-explorer-heading">{heading}</div> : null}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      ) : null}
      <div className="mw-world-explorer-grid">{children}</div>
    </div>
  );
}

export interface WorldAtlasItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly statusLabel?: string;
  readonly emblem?: React.ReactNode;
}

export interface WorldAtlasProps {
  readonly items: readonly WorldAtlasItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * Accessible horizontal/grid selector strip for switching between ecosystem worlds.
 */
export function WorldAtlas({
  items,
  activeId,
  onSelect,
  ariaLabel = "Select a destination world",
  className,
}: WorldAtlasProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "mw-world-atlas grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {items.map((item) => {
        const isSelected = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(item.id)}
            className={cn(
              "mw-world-atlas-tab portal-arch-card flex min-h-[44px] flex-col items-start gap-1.5 border p-4 text-left transition-colors cursor-pointer",
              isSelected && "is-active",
            )}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="font-bold tracking-wider uppercase text-sm">{item.title}</span>
              {item.emblem ? <span className="shrink-0">{item.emblem}</span> : null}
            </div>
            {item.subtitle ? (
              <span className="text-xs leading-snug opacity-85">{item.subtitle}</span>
            ) : null}
            {item.statusLabel ? (
              <DnaBadge className="mt-1 text-[10px]">{item.statusLabel}</DnaBadge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export interface IllustratedHeroProps {
  readonly id?: string;
  readonly labelledBy?: string;
  readonly backdrop: React.ReactNode;
  readonly kicker?: React.ReactNode;
  readonly title: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly callouts?: readonly string[];
  readonly description?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly asideContent?: React.ReactNode;
  readonly shelf?: React.ReactNode;
  readonly className?: string;
}

/**
 * Full-viewport illustrated hero container separating clear reading zones from illustration backdrop.
 */
export function IllustratedHero({
  id,
  labelledBy,
  backdrop,
  kicker,
  title,
  subtitle,
  callouts,
  description,
  actions,
  asideContent,
  shelf,
  className,
}: IllustratedHeroProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "mw-illustrated-hero relative flex min-h-screen w-full flex-col justify-between overflow-hidden",
        className,
      )}
    >
      <div className="mw-illustrated-hero-backdrop absolute inset-0">{backdrop}</div>

      <div className="wrap mw-illustrated-hero-inner relative z-10 flex flex-1 flex-col justify-between">
        <div className="mw-illustrated-hero-top flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="mw-illustrated-hero-copy">
            {kicker ? <div className="mw-illustrated-hero-kicker">{kicker}</div> : null}
            {title}
            {subtitle ? <div className="mw-illustrated-hero-subtitle">{subtitle}</div> : null}
            {callouts && callouts.length > 0 ? (
              <ul className="mw-illustrated-hero-callouts" aria-label="Highlights">
                {callouts.map((line) => (
                  <li key={line} className="mw-illustrated-hero-callout">
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
            {description ? <p className="mw-illustrated-hero-description">{description}</p> : null}
            {actions ? <div className="mw-illustrated-hero-actions">{actions}</div> : null}
          </div>

          {asideContent ? (
            <div className="mw-illustrated-hero-aside hidden lg:flex">{asideContent}</div>
          ) : null}
        </div>

        {shelf ? <div className="mw-illustrated-hero-shelf">{shelf}</div> : null}
      </div>
    </section>
  );
}

export interface MotionRevealProps {
  readonly children: React.ReactNode;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Lightweight transform & opacity reveal wrapper. Always remains readable at rest and under reduced motion.
 */
export function MotionReveal({ children, disabled = false, className }: MotionRevealProps) {
  return (
    <div className={cn("mw-motion-reveal", disabled && "is-static", className)}>{children}</div>
  );
}
