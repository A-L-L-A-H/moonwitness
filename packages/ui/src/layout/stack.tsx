// Moonwitness Layout System -- Stack
import React from "react";
import { cn } from "../lib/utils";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal" | "horizontal-reverse" | "vertical-reverse";
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
}

export function Stack({
  direction = "vertical",
  gap = 4,
  align = "stretch",
  justify = "start",
  wrap = false,
  className = "",
  style = {},
  children,
  ...props
}: StackProps) {
  const directionClass =
    direction === "vertical"
      ? "flex-col"
      : direction === "horizontal"
        ? "flex-row"
        : direction === "horizontal-reverse"
          ? "flex-row-reverse"
          : "flex-col-reverse";
  const gapClass = "gap-" + gap;
  const alignClass =
    align === "start"
      ? "items-start"
      : align === "center"
        ? "items-center"
        : align === "end"
          ? "items-end"
          : "items-stretch";
  const justifyClass =
    justify === "start"
      ? "justify-start"
      : justify === "center"
        ? "justify-center"
        : justify === "end"
          ? "justify-end"
          : justify === "between"
            ? "justify-between"
            : justify === "around"
              ? "justify-around"
              : "justify-evenly";

  return React.createElement(
    "div",
    {
      className: cn(
        "flex",
        directionClass,
        gapClass,
        alignClass,
        justifyClass,
        wrap && "flex-wrap",
        className,
      ),
      style,
      ...props,
    },
    children,
  );
}

export function VStack({
  gap = 4,
  align = "stretch",
  justify = "start",
  wrap = false,
  className = "",
  style = {},
  children,
  ...props
}: Omit<StackProps, "direction">) {
  return React.createElement(
    Stack,
    { direction: "vertical", gap, align, justify, wrap, className, style, ...props },
    children,
  );
}

export function HStack({
  gap = 4,
  align = "center",
  justify = "start",
  wrap = false,
  className = "",
  style = {},
  children,
  ...props
}: Omit<StackProps, "direction">) {
  return React.createElement(
    Stack,
    { direction: "horizontal", gap, align, justify, wrap, className, style, ...props },
    children,
  );
}

export function ZStack({
  className = "",
  style = {},
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return React.createElement(
    "div",
    { className: cn("relative", className), style, ...props },
    children,
  );
}
