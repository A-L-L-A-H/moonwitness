"use client";

import type { WorldMapProps, MapCityItem } from "./world-map";

export function SignalGraph<T extends MapCityItem>({
  cities,
  selectedId,
  onSelect,
}: Pick<WorldMapProps<T>, "cities" | "selectedId" | "onSelect">) {
  return (
    <svg
      viewBox="0 0 100 80"
      className="h-64 w-full @[34rem]:h-80"
      role="group"
      aria-label="Universe map"
    >
      {cities.map((a, i) =>
        cities
          .slice(i + 1)
          .map((b) => (
            <line
              key={`${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y * 0.8}
              x2={b.x}
              y2={b.y * 0.8}
              stroke={i % 2 ? "var(--pink)" : "var(--blue)"}
              strokeWidth="0.32"
              strokeDasharray="1.2 1.6"
              opacity="0.6"
              aria-hidden="true"
            />
          )),
      )}
      {cities.map((city) => (
        <g
          key={city.id}
          role="button"
          tabIndex={0}
          aria-label={`Select ${city.city}`}
          aria-pressed={selectedId === city.id}
          className="group cursor-pointer outline-none"
          onClick={() => onSelect(city.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(city.id);
            }
          }}
        >
          <circle
            cx={city.x}
            cy={city.y * 0.8}
            r="5"
            fill="transparent"
            stroke="transparent"
            strokeWidth="0.5"
            className="group-focus-visible:stroke-[var(--yellow)]"
          />
          <circle
            cx={city.x}
            cy={city.y * 0.8}
            r={selectedId === city.id ? 3.4 : 2.9}
            fill="var(--ink)"
            opacity="0.9"
          />
          <circle
            cx={city.x}
            cy={city.y * 0.8}
            r={selectedId === city.id ? 2.6 : 2.1}
            fill={selectedId === city.id ? "var(--yellow)" : "var(--pink)"}
            stroke={selectedId === city.id ? "var(--ink)" : "var(--paper)"}
            strokeWidth="0.25"
            className="pulse-dot motion-reduce:animate-none"
            style={{ animationDelay: `${city.x * 20}ms` }}
          />
        </g>
      ))}
    </svg>
  );
}
