"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export interface ChartDataPoint {
  readonly label: string;
  readonly value: number;
  readonly colorVar?: string;
}

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  skin?: SkinName;
}

const DEFAULT_SERIES_VARS = [
  "var(--primary)",
  "var(--accent)",
  "var(--secondary)",
  "var(--green)",
] as const;

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, title, skin, children, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    return (
      <div
        ref={ref}
        role="region"
        aria-label={title ?? "Chart"}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn("p-4", recipe.card, className)}
        {...props}
      >
        {title ? <div className="mb-3 text-sm font-semibold">{title}</div> : null}
        {children}
      </div>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

export interface BarChartProps extends React.SVGAttributes<SVGSVGElement> {
  data: readonly ChartDataPoint[];
  height?: number;
  ariaLabel?: string;
}

const BarChart = React.forwardRef<SVGSVGElement, BarChartProps>(
  ({ data, height = 160, ariaLabel = "Bar chart", className, ...props }, ref) => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const width = Math.max(120, data.length * 48);
    return (
      <svg
        ref={ref}
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        className={cn("w-full overflow-visible", className)}
        {...props}
      >
        {data.map((point, idx) => {
          const barHeight = Math.max(4, Math.round((point.value / max) * (height - 28)));
          const x = idx * 48 + 8;
          const y = height - 22 - barHeight;
          const fill = point.colorVar ?? DEFAULT_SERIES_VARS[idx % DEFAULT_SERIES_VARS.length];
          return (
            <g key={point.label}>
              <title>{`${point.label}: ${point.value}`}</title>
              <rect x={x} y={y} width={32} height={barHeight} fill={fill} rx={2} />
              <text
                x={x + 16}
                y={height - 6}
                textAnchor="middle"
                fill="currentColor"
                fontSize={10}
                opacity={0.78}
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  },
);
BarChart.displayName = "BarChart";

const ChartLegend = ({ items }: { items: readonly ChartDataPoint[] }) => (
  <ul className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
    {items.map((item, idx) => (
      <li key={item.label} className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{
            backgroundColor: item.colorVar ?? DEFAULT_SERIES_VARS[idx % DEFAULT_SERIES_VARS.length],
          }}
        />
        <span>{item.label}</span>
        <span className="font-mono font-semibold text-[var(--foreground)]">{item.value}</span>
      </li>
    ))}
  </ul>
);

const ChartTooltip = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--mw-badge-radius,0.25rem)] border border-[var(--border)] bg-[var(--popover)] px-2.5 py-1.5 text-xs text-[var(--popover-foreground)] shadow-md",
        className,
      )}
      {...props}
    />
  ),
);
ChartTooltip.displayName = "ChartTooltip";

export { ChartContainer, BarChart, ChartLegend, ChartTooltip };
