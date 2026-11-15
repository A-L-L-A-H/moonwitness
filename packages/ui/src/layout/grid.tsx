// Moonwitness Layout System -- Grid
import React from "react";
import { cn } from "../lib/utils";

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  gap?: number | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  asym?: Record<number, number>;
  flow?: "row" | "col";
  maxW?: string;
}

export function Grid({
  cols = 1,
  gap = 4,
  asym: _asym,
  flow = "row",
  maxW,
  className = "",
  style = {},
  children,
  ...props
}: GridProps) {
  const getGridCols = () => {
    if (typeof cols === "number") return "grid-cols-" + cols;
    return Object.entries(cols)
      .map(([bp, val]) => (bp === "2xl" ? "2xl" : bp) + ":grid-cols-" + val)
      .join(" ");
  };
  const getGap = () => {
    if (typeof gap === "number") return "gap-" + gap;
    return Object.entries(gap)
      .map(([bp, val]) => (bp === "2xl" ? "2xl" : bp) + ":gap-" + val)
      .join(" ");
  };
  return (
    <div
      className={cn(
        "grid",
        flow === "col" ? "grid-flow-col" : "grid-flow-row",
        getGridCols(),
        getGap(),
        className,
      )}
      style={{ maxWidth: maxW, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  rowSpan?: number | { sm?: number; md?: number; lg?: number; xl?: number; "2xl"?: number };
  order?: number;
}

export function GridItem({
  span = 1,
  rowSpan = 1,
  order,
  className = "",
  style = {},
  children,
  ...props
}: GridItemProps) {
  const getSpan = () => {
    if (typeof span === "number") return "col-span-" + span;
    return Object.entries(span)
      .map(([bp, val]) => (bp === "2xl" ? "2xl" : bp) + ":col-span-" + val)
      .join(" ");
  };
  const getRowSpan = () => {
    if (typeof rowSpan === "number") return "row-span-" + rowSpan;
    return Object.entries(rowSpan)
      .map(([bp, val]) => (bp === "2xl" ? "2xl" : bp) + ":row-span-" + val)
      .join(" ");
  };
  return (
    <div
      className={cn(
        "grid-item",
        getSpan(),
        getRowSpan(),
        order !== undefined && "order-" + order,
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
