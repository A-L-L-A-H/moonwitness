// Moonwitness Layout System -- Container
import React from "react";
import { cn } from "../lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  centered?: boolean;
}

export function Container({
  size = "lg",
  centered = true,
  className = "",
  style = {},
  children,
  ...props
}: ContainerProps) {
  const sizeClass = "max-w-" + size;
  return React.createElement(
    "div",
    {
      className: cn("mx-auto w-full", sizeClass, centered && "mx-auto", className),
      style,
      ...props,
    },
    children,
  );
}
