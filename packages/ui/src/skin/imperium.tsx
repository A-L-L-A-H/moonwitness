"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  SkinRoot,
  SkinScope,
  dnaWorldCssVariables,
  getDnaWorld,
  listDnaWorlds,
  useDnaWorld,
  type DnaWorldPalette,
  type MasterDnaId,
  type MasterDnaWorldSpec,
  type SkinRootProps,
  type SkinScopeProps,
} from "./dna-worlds";
import {
  CrescentStarIcon,
  CrownEmblemIcon,
  DiamondStarOrnament,
  OctagramMandalaIcon,
  SacredCornerBrackets,
  SearchLensIcon,
} from "./imperium-icons";

export {
  MASTER_DNA_IDS,
  MASTER_DNA_WORLDS,
  SkinRoot,
  SkinScope,
  dnaWorldCssVariables,
  getDnaWorld,
  listDnaWorlds,
  useDnaWorld,
  type DnaWorldPalette,
  type MasterDnaId,
  type MasterDnaWorldSpec,
  type SkinRootProps,
  type SkinScopeProps,
};

export {
  CrescentStarIcon,
  CrownEmblemIcon,
  DiamondStarOrnament,
  OctagramMandalaIcon,
  SacredCornerBrackets,
  SearchLensIcon,
};

import {
  IMPERIUM_LUMEN_TOKENS,
  LIVING_LIGHT_MOTION,
  LIVING_LIGHT_PALETTE,
  LIVING_LIGHT_TYPOGRAPHY,
  SACRED_VISUAL_COVENANT,
  type RenderingCapabilityTier,
  type SpringPhysicsPreset,
} from "./imperium-tokens";

export {
  IMPERIUM_LUMEN_TOKENS,
  LIVING_LIGHT_MOTION,
  LIVING_LIGHT_PALETTE,
  LIVING_LIGHT_TYPOGRAPHY,
  SACRED_VISUAL_COVENANT,
  type RenderingCapabilityTier,
  type SpringPhysicsPreset,
};

/* ============================================================================
   CORE DNA-ADAPTIVE PRIMITIVES
   ============================================================================ */

export interface DnaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly tone?: "primary" | "secondary";
}

/**
 * Shared DNA-adaptive action button.
 */
export const DnaButton = React.forwardRef<HTMLButtonElement, DnaButtonProps>(
  ({ tone = "secondary", type = "button", className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const baseClass = isImperium
      ? tone === "primary"
        ? "btn-chamfer inline-flex min-h-[44px] items-center justify-center gap-2.5 px-5 py-2.5 text-sm font-bold tracking-[0.06em] uppercase cursor-pointer"
        : "btn-luxe-secondary inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-sm font-medium uppercase cursor-pointer"
      : tone === "primary"
        ? cn(
            "mw-dna-button inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2",
            world.buttonClass,
          )
        : "mw-dna-button-secondary inline-flex min-h-[44px] items-center justify-center gap-2 border px-4 py-2 text-xs uppercase";

    return (
      <button ref={ref} type={type} className={cn(baseClass, className)} {...props}>
        {children}
      </button>
    );
  },
);
DnaButton.displayName = "DnaButton";

export interface DnaChamberProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly cornerBrackets?: boolean;
}

/**
 * Shared chamber container rendering `.octa-bevel-shell` inside Imperium Lumen or `world.cardClass`.
 */
export const DnaChamber = React.forwardRef<HTMLDivElement, DnaChamberProps>(
  ({ cornerBrackets = false, className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const baseClass = isImperium
      ? "octa-bevel-shell relative"
      : cn("mw-dna-surface relative border", world.cardClass);

    return (
      <div ref={ref} className={cn(baseClass, className)} {...props}>
        {cornerBrackets && isImperium ? <SacredCornerBrackets /> : null}
        {children}
      </div>
    );
  },
);
DnaChamber.displayName = "DnaChamber";

export type DnaPortalArchProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Shared selectable portal arch card.
 */
export const DnaPortalArch = React.forwardRef<HTMLButtonElement, DnaPortalArchProps>(
  ({ type = "button", className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const baseClass = isImperium
      ? "portal-arch-card relative border cursor-pointer"
      : cn("mw-dna-surface relative border cursor-pointer", world.cardClass);

    return (
      <button ref={ref} type={type} className={cn(baseClass, className)} {...props}>
        {children}
      </button>
    );
  },
);
DnaPortalArch.displayName = "DnaPortalArch";

export type DnaBadgeProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * Shared DNA-scoped status pill / provenance badge.
 */
export function DnaBadge({ className, children, ...props }: DnaBadgeProps) {
  const world = useDnaWorld();
  return (
    <span
      className={cn(
        "mw-dna-badge inline-flex items-center px-2.5 py-0.5 text-xs border",
        world.badgeClass,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* ============================================================================
   REUSABLE ILLUSTRATED UNIVERSE PRESENTATION COMPONENTS
   ============================================================================ */

export interface ActionControlProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly href?: string;
}

/**
 * Primary CTA control following the centralized DNA button contract.
 */
export const PrimaryAction = React.forwardRef<HTMLElement, ActionControlProps>(
  ({ href, className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const actionClass = isImperium
      ? "mw-primary-action btn-chamfer inline-flex min-h-[44px] items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold tracking-[0.06em] uppercase cursor-pointer"
      : cn("mw-dna-button inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2.5", world.buttonClass);

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(actionClass, className)}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    return (
      <DnaButton
        ref={ref as React.Ref<HTMLButtonElement>}
        tone="primary"
        className={cn(actionClass, className)}
        {...props}
      >
        {children}
      </DnaButton>
    );
  },
);
PrimaryAction.displayName = "PrimaryAction";

/**
 * Secondary control following the centralized DNA button contract.
 */
export const SecondaryAction = React.forwardRef<HTMLElement, ActionControlProps>(
  ({ href, className, children, ...props }, ref) => {
    const world = useDnaWorld();
    const isImperium = world.id === "01-imperium-lumen";
    const actionClass = isImperium
      ? "mw-secondary-action btn-luxe-secondary inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-2 text-sm font-medium uppercase cursor-pointer"
      : "mw-dna-button-secondary inline-flex min-h-[44px] items-center justify-center gap-2 border px-4 py-2 text-xs uppercase";

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn(actionClass, className)}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    return (
      <DnaButton
        ref={ref as React.Ref<HTMLButtonElement>}
        tone="secondary"
        className={cn(actionClass, className)}
        {...props}
      >
        {children}
      </DnaButton>
    );
  },
);
SecondaryAction.displayName = "SecondaryAction";

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
      <div className="wrap mw-site-nav-inner mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8 lg:px-16">
        <div className="shrink-0">{brand}</div>

        <nav
          aria-label={navLabel}
          className="mw-site-nav-links hidden min-w-0 items-center gap-2 lg:flex xl:gap-4"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={item.onSelect}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "mw-site-nav-link relative inline-flex min-h-[44px] items-center whitespace-nowrap px-3 py-1.5 text-sm font-bold tracking-[0.06em] uppercase transition-colors",
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
