"use client";

import type { Era, EraId } from "@moonwitness/types";
import { ToggleGroup, ToggleGroupItem } from "@moonwitness/ui";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@moonwitness/ui";
import { cn } from "@moonwitness/ui";

export type SortKey = "newest" | "oldest";

interface FilterBarProps {
  eras: Era[];
  era: EraId | "all";
  onEraChange: (era: EraId | "all") => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function FilterBar({
  eras,
  era,
  onEraChange,
  sort,
  onSortChange,
  view,
  onViewChange,
}: FilterBarProps) {
  return (
    <div className="zine-card-rough flex flex-wrap items-center gap-3 p-3">
      <span className="font-brush text-sm text-white">FILTER BY ERA</span>

      {/* Era filter using ToggleGroup */}
      <ToggleGroup
        type="multiple"
        value={[era === "all" ? "all" : era]}
        onValueChange={(value) => {
          const nextEra = value.includes("all") ? "all" : (value[0] as EraId | "all");
          onEraChange(nextEra);
        }}
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filter by era"
      >
        <ToggleGroupItem
          value="all"
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] transition-colors max-lg:min-h-11",
            era === "all"
              ? "border-[var(--pink)] bg-[var(--pink)] font-bold text-white"
              : "border-[var(--line)] text-zinc-300 hover:border-zinc-500",
          )}
        >
          All Eras
        </ToggleGroupItem>
        {eras.map((e) => (
          <ToggleGroupItem
            key={e.id}
            value={e.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors max-lg:min-h-11",
              era === e.id
                ? "font-bold text-white"
                : "border-[var(--line)] text-zinc-300 hover:border-zinc-500",
            )}
            style={era === e.id ? { borderColor: e.color, background: `${e.color}33` } : undefined}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
            {e.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="ml-auto flex items-center gap-2">
        {/* Sort using Select */}
        <label className="sr-only" htmlFor="dock-sort">
          Sort events
        </label>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger
            id="dock-sort"
            className="rounded-md px-3 py-1.5 text-[11px] max-lg:min-h-11 bg-[var(--background)] border-[var(--line)] focus:border-[var(--pink)] focus:ring-[var(--pink)]"
          >
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--background)] border-[var(--line)]">
            <SelectItem value="newest">Sort: Newest First</SelectItem>
            <SelectItem value="oldest">Sort: Oldest First</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle using ToggleGroup */}
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => onViewChange(v[0] as "grid" | "list")}
          className="flex rounded-md border border-[var(--line)]"
          role="group"
          aria-label="View mode"
        >
          <ToggleGroupItem
            value="grid"
            className={cn(
              "inline-flex items-center justify-center px-2.5 py-1.5 max-lg:min-h-11 max-lg:min-w-11",
              view === "grid" ? "bg-[var(--pink)] text-white" : "text-zinc-400 hover:text-white",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4 L10 4 L10 10 L4 10 Z M14 4 L20 4 L20 10 L14 10 Z M4 14 L10 14 L10 20 L4 20 Z M14 14 L20 14 L20 20 L14 20 Z" />
            </svg>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            className={cn(
              "inline-flex items-center justify-center px-2.5 py-1.5 max-lg:min-h-11 max-lg:min-w-11",
              view === "list" ? "bg-[var(--pink)] text-white" : "text-zinc-400 hover:text-white",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6 L20 6 M4 12 L20 12 M4 18 L20 18" />
            </svg>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
