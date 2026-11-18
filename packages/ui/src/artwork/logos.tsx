import type { SVGProps } from "react";
import { cn } from "../cn";

export const BRAND_LOGO_IDS = [
  "moonwitness",
  "01-imperium-lumen",
  "02-lunar-chronicles",
  "03-rocksoul",
  "04-nexus-paradox",
  "05-riot-anarchy",
  "06-mycelium",
  "09-simpul-nusantara",
  "arsy",
  "memory",
  "mission-control",
  "dock-chronicle",
  "scriptures-codex",
  "mtime-horizon",
  "id-lab",
  "addon-studio",
  "shadow-frequency",
  "noc-gateway",
] as const;

export type BrandLogoId = (typeof BRAND_LOGO_IDS)[number];

export type BrandLogoVariant = "mark" | "lockup" | "wordmark" | "stamp";

export interface BrandLogoProps extends Omit<SVGProps<SVGSVGElement>, "children" | "id"> {
  variant?: BrandLogoVariant;
  size?: number | string;
  label?: string;
  decorative?: boolean;
}

export interface DnaBrandLogoProps extends BrandLogoProps {
  id: BrandLogoId;
}

interface LogoMeta {
  id: BrandLogoId;
  title: string;
  subtitle: string;
  defaultLabel: string;
}

const LOGO_META: Record<BrandLogoId, LogoMeta> = {
  moonwitness: {
    id: "moonwitness",
    title: "MOONWITNESS",
    subtitle: "SOVEREIGN PLATFORM",
    defaultLabel: "MoonWitness brand logo",
  },
  "01-imperium-lumen": {
    id: "01-imperium-lumen",
    title: "IMPERIUM LUMEN",
    subtitle: "CITADEL ARCHITECTURE",
    defaultLabel: "Imperium Lumen brand logo",
  },
  "02-lunar-chronicles": {
    id: "02-lunar-chronicles",
    title: "LUNAR CHRONICLES",
    subtitle: "NOCTURNAL ARCHIVE",
    defaultLabel: "Lunar Chronicles brand logo",
  },
  "03-rocksoul": {
    id: "03-rocksoul",
    title: "ROCKSOUL",
    subtitle: "AUDIO CORE",
    defaultLabel: "Rocksoul brand logo",
  },
  "04-nexus-paradox": {
    id: "04-nexus-paradox",
    title: "NEXUS PARADOX",
    subtitle: "SYSTEMS TOPOLOGY",
    defaultLabel: "Nexus Paradox brand logo",
  },
  "05-riot-anarchy": {
    id: "05-riot-anarchy",
    title: "RIOT ANARCHY",
    subtitle: "STREET ZINE ENGINE",
    defaultLabel: "Riot Anarchy brand logo",
  },
  "06-mycelium": {
    id: "06-mycelium",
    title: "MYCELIUM",
    subtitle: "LIVING NETWORK",
    defaultLabel: "Mycelium brand logo",
  },
  "09-simpul-nusantara": {
    id: "09-simpul-nusantara",
    title: "SIMPUL NUSANTARA",
    subtitle: "ARCHIPELAGO HERITAGE",
    defaultLabel: "Simpul Nusantara brand logo",
  },
  arsy: {
    id: "arsy",
    title: "ARSY",
    subtitle: "AUTONOMOUS RELAY",
    defaultLabel: "Arsy brand logo",
  },
  memory: {
    id: "memory",
    title: "MEMORY",
    subtitle: "TAPE CONTINUITY",
    defaultLabel: "Memory brand logo",
  },
  "mission-control": {
    id: "mission-control",
    title: "MISSION CONTROL",
    subtitle: "SHADOW OPERATIONS",
    defaultLabel: "Mission Control brand logo",
  },
  "dock-chronicle": {
    id: "dock-chronicle",
    title: "DOCK CHRONICLE",
    subtitle: "TIMELINE ARCHIVE",
    defaultLabel: "Dock Chronicle brand logo",
  },
  "scriptures-codex": {
    id: "scriptures-codex",
    title: "SCRIPTURES CODEX",
    subtitle: "FOUR REVEALED WITNESSES",
    defaultLabel: "Scriptures Codex brand logo",
  },
  "mtime-horizon": {
    id: "mtime-horizon",
    title: "MTIME HORIZON",
    subtitle: "LUNAR EPOCH OBSERVATORY",
    defaultLabel: "M-Time Horizon brand logo",
  },
  "id-lab": {
    id: "id-lab",
    title: "IDENTITY LAB",
    subtitle: "WITNESS SIGNET ENGINE",
    defaultLabel: "ID Lab brand logo",
  },
  "addon-studio": {
    id: "addon-studio",
    title: "ADDON STUDIO",
    subtitle: "EXTENSIBLE REGISTRY",
    defaultLabel: "Addon Studio brand logo",
  },
  "shadow-frequency": {
    id: "shadow-frequency",
    title: "SHADOW FREQUENCY",
    subtitle: "LEVEL 4 TRANSMISSION",
    defaultLabel: "Shadow Frequency brand logo",
  },
  "noc-gateway": {
    id: "noc-gateway",
    title: "NOC GATEWAY",
    subtitle: "EDGE PROBE PLANE",
    defaultLabel: "NOC Gateway brand logo",
  },
};

function BrandGlyph({ id }: { id: BrandLogoId }) {
  const sw = "var(--mw-icon-stroke, 2.2)";
  switch (id) {
    case "moonwitness":
      return (
        <g>
          <rect
            x="4"
            y="4"
            width="40"
            height="40"
            rx="6"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <path
            d="M15 16L19 11L24 15L29 11L33 16"
            stroke="var(--primary)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M27.5 18.5A9.5 9.5 0 1 0 32 32A8.5 8.5 0 0 1 27.5 18.5Z"
            fill="var(--primary)"
          />
          <circle cx="30" cy="23" r="2.2" fill="var(--secondary, var(--accent))" />
        </g>
      );
    case "01-imperium-lumen":
      return (
        <g>
          <polygon
            points="24,3 43,14 43,34 24,45 5,34 5,14"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polygon
            points="24,9 36,24 24,39 12,24"
            stroke="var(--foreground)"
            strokeWidth={sw}
            fill="none"
          />
          <line x1="24" y1="6" x2="24" y2="42" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="4" fill="var(--primary)" />
        </g>
      );
    case "02-lunar-chronicles":
      return (
        <g>
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <circle
            cx="24"
            cy="24"
            r="14"
            stroke="var(--primary)"
            strokeWidth={sw}
            strokeDasharray="4 3"
          />
          <path
            d="M28 14A10 10 0 1 0 31 32A8.5 8.5 0 0 1 28 14Z"
            fill="var(--primary)"
          />
          <circle cx="33" cy="17" r="2" fill="var(--secondary, var(--accent))" />
        </g>
      );
    case "03-rocksoul":
      return (
        <g>
          <polygon
            points="10,6 38,6 44,24 38,42 10,42 4,24"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polyline
            points="11,26 16,26 19,15 24,33 29,18 32,26 37,26"
            stroke="var(--foreground)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="14" y1="11" x2="34" y2="11" stroke="var(--secondary, var(--primary))" strokeWidth={sw} />
        </g>
      );
    case "04-nexus-paradox":
      return (
        <g>
          <rect
            x="5"
            y="5"
            width="38"
            height="38"
            rx="4"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <path
            d="M14 14H28L34 20V34H20L14 28V14Z"
            stroke="var(--primary)"
            strokeWidth={sw}
            fill="none"
          />
          <line x1="14" y1="34" x2="34" y2="14" stroke="var(--secondary, var(--foreground))" strokeWidth={sw} />
          <circle cx="14" cy="14" r="2.5" fill="var(--primary)" />
          <circle cx="34" cy="34" r="2.5" fill="var(--primary)" />
          <circle cx="24" cy="24" r="3" fill="var(--foreground)" />
        </g>
      );
    case "05-riot-anarchy":
      return (
        <g>
          <polygon
            points="6,9 42,5 40,39 8,43"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polygon
            points="14,34 24,10 34,34 27,34 24,25 21,34"
            fill="var(--primary)"
          />
          <line
            x1="10"
            y1="26"
            x2="38"
            y2="20"
            stroke="var(--secondary, var(--foreground))"
            strokeWidth={sw}
            strokeLinecap="square"
          />
        </g>
      );
    case "06-mycelium":
      return (
        <g>
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth={sw}
          />
          <line x1="24" y1="24" x2="24" y2="11" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="24" y1="24" x2="13" y2="31" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="24" y1="24" x2="35" y2="31" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="4.5" fill="var(--primary)" />
          <circle cx="24" cy="11" r="3" fill="var(--secondary, var(--foreground))" />
          <circle cx="13" cy="31" r="3" fill="var(--secondary, var(--foreground))" />
          <circle cx="35" cy="31" r="3" fill="var(--secondary, var(--foreground))" />
        </g>
      );
    case "09-simpul-nusantara":
      return (
        <g>
          <rect
            x="6"
            y="6"
            width="36"
            height="36"
            rx="8"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polygon
            points="24,11 37,24 24,37 11,24"
            stroke="var(--secondary, var(--foreground))"
            strokeWidth={sw}
            fill="none"
          />
          <polygon
            points="24,16 32,24 24,32 16,24"
            fill="var(--primary)"
            fillOpacity="0.85"
          />
          <circle cx="24" cy="24" r="2.2" fill="var(--background)" />
        </g>
      );
    case "arsy":
      return (
        <g>
          <polygon
            points="24,4 44,24 24,44 4,24"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <polyline
            points="16,29 24,13 32,29"
            stroke="var(--foreground)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="18" y1="24" x2="30" y2="24" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="13" r="2.3" fill="var(--secondary, var(--primary))" />
        </g>
      );
    case "memory":
      return (
        <g>
          <rect
            x="4"
            y="10"
            width="40"
            height="28"
            rx="4"
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth={sw}
          />
          <rect
            x="10"
            y="16"
            width="28"
            height="12"
            rx="2"
            stroke="var(--border)"
            strokeWidth="1.5"
            fill="var(--background)"
          />
          <circle cx="17" cy="22" r="3.2" stroke="var(--primary)" strokeWidth={sw} fill="none" />
          <circle cx="31" cy="22" r="3.2" stroke="var(--primary)" strokeWidth={sw} fill="none" />
          <line x1="20.2" y1="22" x2="27.8" y2="22" stroke="var(--secondary, var(--foreground))" strokeWidth="1.5" />
          <polygon points="14,38 34,38 31,33 17,33" fill="var(--foreground)" fillOpacity="0.2" stroke="var(--border)" strokeWidth="1.2" />
        </g>
      );
    case "mission-control":
      return (
        <g>
          <rect x="4" y="4" width="40" height="40" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="13" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="24" cy="24" r="5" fill="var(--primary)" />
          <line x1="24" y1="6" x2="24" y2="14" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="24" y1="34" x2="24" y2="42" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="6" y1="24" x2="14" y2="24" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="34" y1="24" x2="42" y2="24" stroke="var(--foreground)" strokeWidth={sw} />
        </g>
      );
    case "dock-chronicle":
      return (
        <g>
          <rect x="5" y="6" width="38" height="36" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <line x1="12" y1="16" x2="36" y2="16" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="12" y1="24" x2="32" y2="24" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="12" y1="32" x2="28" y2="32" stroke="var(--secondary, var(--accent))" strokeWidth={sw} />
          <circle cx="34" cy="32" r="3" fill="var(--primary)" />
        </g>
      );
    case "scriptures-codex":
      return (
        <g>
          <rect x="6" y="7" width="36" height="34" rx="2" fill="var(--card)" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="24" y1="7" x2="24" y2="41" stroke="var(--primary)" strokeWidth="1.6" />
          <polygon points="15,15 19,20 15,25 11,20" fill="var(--primary)" />
          <polygon points="33,15 37,20 33,25 29,20" fill="var(--foreground)" fillOpacity="0.6" />
          <line x1="11" y1="32" x2="19" y2="32" stroke="var(--border)" strokeWidth="1.6" />
          <line x1="29" y1="32" x2="37" y2="32" stroke="var(--border)" strokeWidth="1.6" />
        </g>
      );
    case "mtime-horizon":
      return (
        <g>
          <circle cx="24" cy="24" r="19" fill="var(--card)" stroke="var(--primary)" strokeWidth={sw} />
          <path d="M9 28H39" stroke="var(--foreground)" strokeWidth={sw} />
          <path d="M16 28A8 8 0 0 1 32 28" fill="var(--primary)" />
          <circle cx="33" cy="14" r="2.5" fill="var(--secondary, var(--accent))" />
        </g>
      );
    case "id-lab":
      return (
        <g>
          <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <circle cx="24" cy="19" r="6" stroke="var(--primary)" strokeWidth={sw} fill="none" />
          <path d="M14 36C15.5 29.5 19 27 24 27C29 27 32.5 29.5 34 36" stroke="var(--foreground)" strokeWidth={sw} fill="none" />
        </g>
      );
    case "addon-studio":
      return (
        <g>
          <rect x="6" y="6" width="16" height="16" rx="2" fill="var(--primary)" stroke="var(--border)" strokeWidth="1.5" />
          <rect x="26" y="6" width="16" height="16" rx="2" fill="var(--card)" stroke="var(--primary)" strokeWidth={sw} />
          <rect x="6" y="26" width="16" height="16" rx="2" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="26" y="26" width="16" height="16" rx="2" fill="var(--secondary, var(--accent))" stroke="var(--border)" strokeWidth="1.5" />
        </g>
      );
    case "shadow-frequency":
      return (
        <g>
          <rect x="5" y="5" width="38" height="38" rx="19" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <polyline points="10,24 16,14 21,33 27,12 32,30 38,24" stroke="var(--primary)" strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "noc-gateway":
      return (
        <g>
          <rect x="5" y="9" width="38" height="30" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth={sw} />
          <circle cx="14" cy="24" r="3.5" fill="var(--green)" />
          <circle cx="24" cy="24" r="3.5" fill="var(--primary)" />
          <circle cx="34" cy="24" r="3.5" fill="var(--secondary, var(--accent))" />
          <line x1="14" y1="15" x2="34" y2="15" stroke="var(--border)" strokeWidth="1.5" />
        </g>
      );
  }
}

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
