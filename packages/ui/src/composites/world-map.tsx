"use client";

import type { ReactNode } from "react";
import { AtlasStage } from "./atlas-stage";
import { SignalGraph } from "./signal-graph";

export interface MapCityItem {
  id: string;
  city: string;
  x: number;
  y: number;
  signals: number;
}

export interface WorldMapProps<T extends MapCityItem = MapCityItem> {
  cities: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  backdrop?: ReactNode;
}

export function WorldMap<T extends MapCityItem>({
  cities,
  selectedId,
  onSelect,
  backdrop,
}: WorldMapProps<T>) {
  return (
    <AtlasStage
      backdrop={backdrop}
      controls={
        <ul className="flex flex-wrap gap-2" aria-label="Cities">
          {cities.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => onSelect(city.id)}
                aria-pressed={selectedId === city.id}
                className={`zine-card min-h-11 px-3 py-2 text-[11px] tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yellow)] ${selectedId === city.id ? "border-[var(--yellow)] bg-[var(--yellow)] text-[var(--ink)]" : "text-[var(--paper)] hover:border-[var(--pink)] hover:text-[var(--pink)]"}`}
              >
                {city.city} <span className="ml-2 opacity-80">{city.signals}</span>
              </button>
            </li>
          ))}
        </ul>
      }
    >
      <SignalGraph cities={cities} selectedId={selectedId} onSelect={onSelect} />
    </AtlasStage>
  );
}
