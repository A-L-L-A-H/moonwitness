import type { SVGProps } from "react";

export type DnaIconTone = "current" | "accent" | "duotone" | "triad";

export interface DnaIconProps extends SVGProps<SVGSVGElement> {
  readonly size?: number | string;
  readonly tone?: DnaIconTone;
}

/**
 * Resolves standard SVG dimensions and accessible defaults while stripping non-DOM icon props.
 */
export function resolveIconSvgProps({
  size,
  tone = "duotone",
  width,
  height,
  viewBox = "0 0 24 24",
  ...rest
}: DnaIconProps) {
  const accentColor =
    tone === "current"
      ? "currentColor"
      : tone === "triad"
        ? "var(--brand-yellow, var(--dna-accent, currentColor))"
        : "var(--dna-accent, currentColor)";

  return {
    accentColor,
    svgProps: {
      viewBox,
      fill: "none",
      "aria-hidden": true as const,
      width: size ?? width,
      height: size ?? height,
      ...rest,
    },
  };
}
