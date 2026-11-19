import { cn } from "../cn";
import { BrandGlyph } from "./logos/glyphs";
import {
  LOGO_META,
  type BrandLogoId,
  type BrandLogoProps,
  type DnaBrandLogoProps,
} from "./logos/meta";

export {
  BRAND_LOGO_IDS,
  type BrandLogoId,
  type BrandLogoVariant,
  type BrandLogoProps,
  type DnaBrandLogoProps,
} from "./logos/meta";

function renderBrandSvg(id: BrandLogoId, props: BrandLogoProps) {
  const {
    variant = "lockup",
    size = variant === "mark" ? 40 : 36,
    className,
    label,
    decorative = false,
    style,
    ...rest
  } = props;

  const meta = LOGO_META[id];
  const accessibleLabel = decorative ? undefined : (label ?? meta.defaultLabel);
  const svgHeight = typeof size === "number" ? size : size;

  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 48 48"
        width={svgHeight}
        height={svgHeight}
        fill="none"
        role={decorative ? undefined : "img"}
        aria-label={accessibleLabel}
        aria-hidden={decorative ? true : undefined}
        data-mw-brand-logo={id}
        data-mw-brand-variant="mark"
        className={cn("inline-block shrink-0", className)}
        style={style}
        {...rest}
      >
        <BrandGlyph id={id} />
      </svg>
    );
  }

  if (variant === "wordmark") {
    return (
      <svg
        viewBox="0 0 216 40"
        height={svgHeight}
        fill="none"
        role={decorative ? undefined : "img"}
        aria-label={accessibleLabel}
        aria-hidden={decorative ? true : undefined}
        data-mw-brand-logo={id}
        data-mw-brand-variant="wordmark"
        className={cn("inline-block w-auto shrink-0", className)}
        style={style}
        {...rest}
      >
        <text
          x="4"
          y="20"
          fill="var(--foreground)"
          fontFamily="var(--mw-font-display, ui-sans-serif, system-ui)"
          fontSize="16"
          fontWeight="800"
          letterSpacing="1.6"
        >
          {meta.title}
        </text>
        <text
          x="4"
          y="33"
          fill="var(--primary)"
          fontFamily="var(--mw-font-mono, ui-monospace, monospace)"
          fontSize="8"
          fontWeight="700"
          letterSpacing="2"
        >
          {meta.subtitle}
        </text>
      </svg>
    );
  }

  if (variant === "stamp") {
    return (
      <svg
        viewBox="0 0 88 88"
        width={svgHeight}
        height={svgHeight}
        fill="none"
        role={decorative ? undefined : "img"}
        aria-label={accessibleLabel}
        aria-hidden={decorative ? true : undefined}
        data-mw-brand-logo={id}
        data-mw-brand-variant="stamp"
        className={cn("inline-block shrink-0", className)}
        style={style}
        {...rest}
      >
        <circle cx="44" cy="44" r="40" stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="44" cy="44" r="33" stroke="var(--border)" strokeWidth="1.2" />
        <g transform="translate(20 14)">
          <BrandGlyph id={id} />
        </g>
        <text
          x="44"
          y="74"
          textAnchor="middle"
          fill="var(--foreground)"
          fontFamily="var(--mw-font-mono, ui-monospace, monospace)"
          fontSize="6.5"
          fontWeight="800"
          letterSpacing="1.2"
        >
          {meta.title.slice(0, 14)}
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 264 48"
      height={svgHeight}
      fill="none"
      role={decorative ? undefined : "img"}
      aria-label={accessibleLabel}
      aria-hidden={decorative ? true : undefined}
      data-mw-brand-logo={id}
      data-mw-brand-variant="lockup"
      className={cn("inline-block w-auto shrink-0", className)}
      style={style}
      {...rest}
    >
      <BrandGlyph id={id} />
      <text
        x="58"
        y="24"
        fill="var(--foreground)"
        fontFamily="var(--mw-font-display, ui-sans-serif, system-ui)"
        fontSize="16"
        fontWeight="800"
        letterSpacing="1.5"
      >
        {meta.title}
      </text>
      <text
        x="58"
        y="37"
        fill="var(--muted-foreground)"
        fontFamily="var(--mw-font-mono, ui-monospace, monospace)"
        fontSize="8"
        fontWeight="700"
        letterSpacing="2"
      >
        {meta.subtitle}
      </text>
    </svg>
  );
}

export function DnaBrandLogo({ id, ...props }: DnaBrandLogoProps) {
  return renderBrandSvg(id, props);
}

export function MoonwitnessLogo(props: BrandLogoProps) {
  return renderBrandSvg("moonwitness", props);
}

export function ImperiumLumenLogo(props: BrandLogoProps) {
  return renderBrandSvg("01-imperium-lumen", props);
}

export function LunarChroniclesLogo(props: BrandLogoProps) {
  return renderBrandSvg("02-lunar-chronicles", props);
}

export function RocksoulLogo(props: BrandLogoProps) {
  return renderBrandSvg("03-rocksoul", props);
}

export function NexusParadoxLogo(props: BrandLogoProps) {
  return renderBrandSvg("04-nexus-paradox", props);
}

export function RiotAnarchyLogo(props: BrandLogoProps) {
  return renderBrandSvg("05-riot-anarchy", props);
}

export function MyceliumLogo(props: BrandLogoProps) {
  return renderBrandSvg("06-mycelium", props);
}

export function SimpulNusantaraLogo(props: BrandLogoProps) {
  return renderBrandSvg("09-simpul-nusantara", props);
}

export function ArsyBrandLogo(props: BrandLogoProps) {
  return renderBrandSvg("arsy", props);
}

export function MemoryBrandLogo(props: BrandLogoProps) {
  return renderBrandSvg("memory", props);
}

export function MissionControlLogo(props: BrandLogoProps) {
  return renderBrandSvg("mission-control", props);
}

export function DockChronicleLogo(props: BrandLogoProps) {
  return renderBrandSvg("dock-chronicle", props);
}

export function ScripturesCodexLogo(props: BrandLogoProps) {
  return renderBrandSvg("scriptures-codex", props);
}

export function MtimeHorizonLogo(props: BrandLogoProps) {
  return renderBrandSvg("mtime-horizon", props);
}

export function IdLabLogo(props: BrandLogoProps) {
  return renderBrandSvg("id-lab", props);
}

export function AddonStudioLogo(props: BrandLogoProps) {
  return renderBrandSvg("addon-studio", props);
}

export function ShadowFrequencyLogo(props: BrandLogoProps) {
  return renderBrandSvg("shadow-frequency", props);
}

export function NocGatewayLogo(props: BrandLogoProps) {
  return renderBrandSvg("noc-gateway", props);
}
