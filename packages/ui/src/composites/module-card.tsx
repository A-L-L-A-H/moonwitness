"use client";

import type { ReactNode } from "react";
import { ArrowRight, Crown } from "../icons";
import { cn } from "../lib/utils";
import { useSkin } from "../skin";
import { moduleCardVariants } from "../skin/compositions";
import { ModuleGlyph } from "./module-glyph";

export interface ModuleStat {
  label: string;
  value: string | number;
  color: string;
}

export interface ModuleItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  stats: ModuleStat[];
}

export interface ModuleCardProps<T extends ModuleItem = ModuleItem> {
  module: T;
  onOpen: (m: T) => void;
  art?: ReactNode;
}

export function ModuleCard<T extends ModuleItem>({ module, onOpen, art }: ModuleCardProps<T>) {
  const { skin } = useSkin();
  return (
    <button
      onClick={() => onOpen(module)}
      data-skin={skin}
      className={cn(
        "zine-card-rough group relative isolate flex w-full items-center gap-4 overflow-hidden p-4 text-left transition-transform hover:-translate-y-0.5",
        moduleCardVariants({ skin, size: "md" }),
      )}
    >
      {art ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {art}
        </span>
      ) : null}
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
        style={{
          background: module.color,
          color:
            module.color === "var(--yellow)" || module.color === "var(--primary)"
              ? "var(--primary-foreground)"
              : "var(--brand-white)",
        }}
      >
        <ModuleGlyph icon={module.icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-brush text-lg leading-tight text-[var(--foreground)]">
            {module.name.toUpperCase()}
          </span>
          <Crown className="h-3.5 w-5 text-[var(--primary)]" />
        </span>
        <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
          {module.description}
        </span>
        <span className="mt-1.5 flex flex-wrap gap-x-3 text-[11px]">
          {module.stats.map((s) => (
            <span key={s.label} className="flex items-center gap-1 text-[var(--muted-foreground)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
              <span style={{ color: s.color }}>{s.value}</span> {s.label}
            </span>
          ))}
        </span>
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors group-hover:border-[var(--primary)] group-hover:text-[var(--primary)]">
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}
