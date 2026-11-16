"use client";

import { ModuleGlyph } from "./module-glyph";

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
}

export interface QuickActionGridProps<T extends QuickActionItem = QuickActionItem> {
  actions: T[];
  onAction: (action: T) => void;
}

const TILE_TONES = [
  "btn-zine text-white",
  "btn-zine btn-blue text-white",
  "border-2 border-[var(--line)] bg-[var(--panel-2)] text-white hover:border-[var(--pink)]",
  "border-2 border-[var(--line)] bg-[var(--panel-2)] text-white hover:border-[var(--blue)]",
];

export function QuickActionGrid<T extends QuickActionItem>({
  actions,
  onAction,
}: QuickActionGridProps<T>) {
  return (
    <div className="grid h-full grid-cols-2 gap-3 auto-rows-fr">
      {actions.map((action, index) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onAction(action)}
          className={`flex min-h-[88px] min-w-0 flex-col items-start justify-between gap-3 px-3 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-wider transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yellow)] ${
            TILE_TONES[index % TILE_TONES.length]
          }`}
        >
          <ModuleGlyph icon={action.icon} className="h-5 w-5 shrink-0" />
          <span className="break-words leading-tight">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
