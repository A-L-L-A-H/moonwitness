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

type AccessibleChartRow = {
  readonly label: string;
  readonly value: string | number;
};

function AccessibleChartTable({
  ariaLabel,
  rows,
}: {
  ariaLabel: string;
  rows: readonly AccessibleChartRow[];
}) {
  return (
    <table className="sr-only">
      <caption>{ariaLabel}</caption>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2}>No data available</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

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
  accessibleData?: boolean;
}

const BarChart = React.forwardRef<SVGSVGElement, BarChartProps>(
  (
    {
      data,
      height = 160,
      ariaLabel = "Bar chart",
      accessibleData = true,
      className,
      ...props
    },
    ref,
  ) => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const width = Math.max(120, data.length * 48);
    return (
      <>
        <svg
          ref={ref}
          role="img"
          aria-label={accessibleData ? undefined : ariaLabel}
          aria-hidden={accessibleData || undefined}
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
        {accessibleData ? (
          <AccessibleChartTable
            ariaLabel={ariaLabel}
            rows={data.map((point) => ({ label: point.label, value: point.value }))}
          />
        ) : null}
      </>
    );
  },
);
BarChart.displayName = "BarChart";

export interface SparklineProps extends Omit<React.SVGAttributes<SVGSVGElement>, "children"> {
  data: readonly number[] | readonly ChartDataPoint[];
  height?: number;
  width?: number;
  colorVar?: string;
  fillOpacity?: number;
  showLastDot?: boolean;
  ariaLabel?: string;
  accessibleData?: boolean;
}

const Sparkline = React.forwardRef<SVGSVGElement, SparklineProps>(
  (
    {
      data,
      height = 40,
      width = 160,
      colorVar = "var(--primary)",
      fillOpacity = 0.16,
      showLastDot = true,
      ariaLabel = "Telemetry sparkline",
      accessibleData = true,
      className,
      ...props
    },
    ref,
  ) => {
    const values = React.useMemo(
      () => data.map((d) => (typeof d === "number" ? d : d.value)),
      [data],
    );
    const padding = 4;
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const span = max - min || 1;
    const innerW = Math.max(1, width - padding * 2);
    const innerH = Math.max(1, height - padding * 2);

    const coords = values.map((val, idx) => {
      const x =
        values.length <= 1 ? padding + innerW / 2 : padding + (idx / (values.length - 1)) * innerW;
      const y = padding + innerH - ((val - min) / span) * innerH;
      return { x, y, val };
    });

    const linePoints = coords.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
    const first = coords[0];
    const last = coords[coords.length - 1];
    const areaPoints =
      coords.length >= 2 && first && last
        ? `${first.x.toFixed(1)},${height - padding} ${linePoints} ${last.x.toFixed(1)},${height - padding}`
        : "";

    return (
      <>
        <svg
          ref={ref}
          role="img"
          aria-label={accessibleData ? undefined : ariaLabel}
          aria-hidden={accessibleData || undefined}
          viewBox={`0 0 ${width} ${height}`}
          data-mw-chart="sparkline"
          className={cn("h-auto w-full overflow-visible", className)}
          {...props}
        >
          {areaPoints ? (
            <polygon points={areaPoints} fill={colorVar} fillOpacity={fillOpacity} />
          ) : null}
          {coords.length >= 2 ? (
            <polyline
              points={linePoints}
              fill="none"
              stroke={colorVar}
              strokeWidth="var(--mw-icon-stroke, 2)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {showLastDot && last ? (
            <circle cx={last.x} cy={last.y} r={3} fill={colorVar}>
              <title>{String(last.val)}</title>
            </circle>
          ) : null}
        </svg>
        {accessibleData ? (
          <AccessibleChartTable
            ariaLabel={ariaLabel}
            rows={data.map((point, index) =>
              typeof point === "number"
                ? { label: `Point ${index + 1}`, value: point }
                : { label: point.label, value: point.value },
            )}
          />
        ) : null}
      </>
    );
  },
);
Sparkline.displayName = "Sparkline";

export interface LineChartProps extends Omit<React.SVGAttributes<SVGSVGElement>, "children"> {
  data: readonly ChartDataPoint[];
  height?: number;
  width?: number;
  area?: boolean;
  showGrid?: boolean;
  colorVar?: string;
  ariaLabel?: string;
  accessibleData?: boolean;
}

const LineChart = React.forwardRef<SVGSVGElement, LineChartProps>(
  (
    {
      data,
      height = 160,
      width = 360,
      area = false,
      showGrid = true,
      colorVar = "var(--primary)",
      ariaLabel = "Time series chart",
      accessibleData = true,
      className,
      ...props
    },
    ref,
  ) => {
    const padX = 16;
    const padTop = 12;
    const padBottom = 24;
    const min = data.length ? Math.min(0, ...data.map((d) => d.value)) : 0;
    const max = data.length ? Math.max(1, ...data.map((d) => d.value)) : 1;
    const span = max - min || 1;
    const innerW = Math.max(1, width - padX * 2);
    const innerH = Math.max(1, height - padTop - padBottom);

    const coords = data.map((point, idx) => {
      const x = data.length <= 1 ? padX + innerW / 2 : padX + (idx / (data.length - 1)) * innerW;
      const y = padTop + innerH - ((point.value - min) / span) * innerH;
      return { x, y, point };
    });

    const linePoints = coords.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
    const first = coords[0];
    const last = coords[coords.length - 1];
    const baselineY = padTop + innerH;
    const areaPoints =
      area && coords.length >= 2 && first && last
        ? `${first.x.toFixed(1)},${baselineY} ${linePoints} ${last.x.toFixed(1)},${baselineY}`
        : "";

    return (
      <>
        <svg
          ref={ref}
          role="img"
          aria-label={accessibleData ? undefined : ariaLabel}
          aria-hidden={accessibleData || undefined}
          viewBox={`0 0 ${width} ${height}`}
          data-mw-chart={area ? "area" : "line"}
          className={cn("h-auto w-full overflow-visible", className)}
          {...props}
        >
          {showGrid
            ? [0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padTop + innerH * (1 - frac);
                return (
                  <line
                    key={frac}
                    x1={padX}
                    y1={y}
                    x2={width - padX}
                    y2={y}
                    stroke="var(--border)"
                    strokeOpacity={0.35}
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                );
              })
            : null}
          <line
            x1={padX}
            y1={baselineY}
            x2={width - padX}
            y2={baselineY}
            stroke="var(--border)"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          {areaPoints ? <polygon points={areaPoints} fill={colorVar} fillOpacity={0.18} /> : null}
          {coords.length >= 2 ? (
            <polyline
              points={linePoints}
              fill="none"
              stroke={colorVar}
              strokeWidth="var(--mw-icon-stroke, 2.2)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {coords.map(({ x, y, point }) => (
            <g key={point.label}>
              <circle
                cx={x}
                cy={y}
                r={3.2}
                fill={point.colorVar ?? colorVar}
                stroke="var(--background)"
                strokeWidth={1.2}
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
              <text
                x={x}
                y={height - 6}
                textAnchor="middle"
                fill="currentColor"
                fontSize={9}
                opacity={0.75}
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
        {accessibleData ? (
          <AccessibleChartTable
            ariaLabel={ariaLabel}
            rows={data.map((point) => ({ label: point.label, value: point.value }))}
          />
        ) : null}
      </>
    );
  },
);
LineChart.displayName = "LineChart";

export type AreaChartProps = Omit<LineChartProps, "area">;

const AreaChart = React.forwardRef<SVGSVGElement, AreaChartProps>(
  ({ ariaLabel = "Area chart", ...props }, ref) => (
    <LineChart ref={ref} area ariaLabel={ariaLabel} {...props} />
  ),
);
AreaChart.displayName = "AreaChart";

export interface RadialGaugeProps extends Omit<React.SVGAttributes<SVGSVGElement>, "children"> {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  unit?: string;
  colorVar?: string;
  ariaLabel?: string;
  accessibleData?: boolean;
}

const RadialGauge = React.forwardRef<SVGSVGElement, RadialGaugeProps>(
  (
    {
      value,
      max = 100,
      size = 88,
      label,
      unit = "%",
      colorVar = "var(--primary)",
      ariaLabel,
      accessibleData = true,
      className,
      ...props
    },
    ref,
  ) => {
    const safeMax = max > 0 ? max : 100;
    const ratio = Math.min(1, Math.max(0, Number.isFinite(value) ? value / safeMax : 0));
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - ratio);
    const displayValue = Math.round(ratio * safeMax);
    const accessibleLabel = ariaLabel ?? `${label ?? "Gauge"} ${displayValue}${unit}`;

    return (
      <>
        <svg
          ref={ref}
          role="img"
          aria-label={accessibleData ? undefined : accessibleLabel}
          aria-hidden={accessibleData || undefined}
          viewBox="0 0 88 88"
          width={size}
          height={size}
          data-mw-chart="radial-gauge"
          className={cn("shrink-0 select-none", className)}
          {...props}
        >
          <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--muted)" strokeWidth="7" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={colorVar}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            style={{ transition: "stroke-dashoffset var(--mw-motion-duration, 180ms) ease" }}
          />
          <text
            x="44"
            y={label ? "41" : "48"}
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize="16"
            fontWeight="800"
            fontFamily="var(--mw-font-mono, ui-monospace, monospace)"
          >
            {`${displayValue}${unit}`}
          </text>
          {label ? (
            <text
              x="44"
              y="55"
              textAnchor="middle"
              fill="var(--muted-foreground)"
              fontSize="8"
              fontWeight="700"
            >
              {label}
            </text>
          ) : null}
        </svg>
        {accessibleData ? (
          <AccessibleChartTable
            ariaLabel={accessibleLabel}
            rows={[{ label: label ?? "Value", value: `${displayValue}${unit}` }]}
          />
        ) : null}
      </>
    );
  },
);
RadialGauge.displayName = "RadialGauge";

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

export {
  ChartContainer,
  BarChart,
  Sparkline,
  LineChart,
  AreaChart,
  RadialGauge,
  ChartLegend,
  ChartTooltip,
};
