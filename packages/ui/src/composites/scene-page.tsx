"use client";

import { Children, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { useSkin } from "../skin";

export type ScenePageProps = HTMLAttributes<HTMLDivElement>;

export function ScenePage({ children, className, ...props }: ScenePageProps) {
  return (
    <div
      {...props}
      className={cn(
        "scene-page @container flex min-w-0 flex-col gap-10 @[48rem]:gap-16",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface ScenePanelProps extends HTMLAttributes<HTMLElement> {
  art?: ReactNode;
  effects?: ReactNode;
  scrim?: "left" | "right" | "bottom" | "none";
  caption?: ReactNode;
}

export function ScenePanel({
  art,
  effects,
  scrim = "left",
  caption,
  children,
  className,
  ...props
}: ScenePanelProps) {
  const { getClasses, effects: presetEffects } = useSkin();
  return (
    <article
      {...props}
      data-scene-panel
      data-scrim={scrim}
      className={cn(
        "scene-panel @container relative isolate min-w-0 overflow-hidden",
        getClasses("scenePanel"),
        className,
      )}
    >
      {art && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          {art}
          {scrim !== "none" && <div className="scene-scrim absolute inset-0" />}
        </div>
      )}
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", presetEffects)}>
        {effects}
      </div>
      <div className="relative min-w-0">{children}</div>
      {caption && (
        <footer className="relative border-t border-[var(--line)] px-5 py-3 font-mono text-xs text-[var(--paper)]">
          {caption}
        </footer>
      )}
    </article>
  );
}

export interface ChapterBannerProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  chapter: ReactNode;
  title: ReactNode;
  headingAs?: "h2" | "h3";
  meta?: ReactNode;
  actions?: ReactNode;
}

export function ChapterBanner({
  chapter,
  title,
  headingAs: Heading = "h2",
  meta,
  actions,
  className,
  ...props
}: ChapterBannerProps) {
  return (
    <header
      {...props}
      className={cn(
        "@container flex min-w-0 flex-wrap items-end gap-x-6 gap-y-4 border-b-2 border-dashed border-[var(--line)] pb-6",
        className,
      )}
    >
      <span
        className="font-brush text-7xl leading-none text-[var(--yellow)] @[40rem]:text-9xl cmyk-slip select-none"
        style={{ textShadow: "4px 4px 0 var(--ink)" }}
      >
        {chapter}
      </span>
      <div className="min-w-0 flex-1 basis-64 relative">
        {meta && (
          <div className="mb-2 font-mono text-xs tracking-widest text-[var(--paper)]">{meta}</div>
        )}
        <Heading className="font-brush text-4xl leading-tight text-[var(--paper)] @[40rem]:text-6xl brush-underline">
          {title}
        </Heading>
        <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-[var(--pink)] via-[var(--yellow)] to-[var(--blue)] opacity-60" />
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export interface FilmStripProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function FilmStrip({ label, children, className, ...props }: FilmStripProps) {
  return (
    <div
      {...props}
      data-film-strip
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "film-strip min-w-0 overflow-x-auto overscroll-x-contain py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yellow)]",
        className,
      )}
    >
      <ol className="flex w-max min-w-full gap-4 px-4">
        {Children.toArray(children).map((child, i) => (
          <li key={i} className="w-56 shrink-0 snap-start relative">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 8px 50%, var(--line) 2px, transparent 2px), radial-gradient(circle at calc(100% - 8px) 50%, var(--line) 2px, transparent 2px)`,
                backgroundSize: "16px 100%",
                backgroundRepeat: "repeat-y",
                backgroundPosition: "left top, right top",
              }}
            />
            {child}
          </li>
        ))}
      </ol>
    </div>
  );
}
