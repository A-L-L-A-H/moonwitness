import type { SVGProps } from "react";
import { cn } from "../cn";

export const CUTOUT_ARTWORK_IDS = [
  "lunar-disc",
  "crescent",
  "witness-silhouette",
  "rooftop-antenna",
  "cassette-recorder",
  "signal-radio",
  "industrial-battery",
  "city-block",
  "satellite-dish",
  "transit-sign",
  "cable-coil",
  "lunar-rock",
] as const;

export type CutoutArtworkId = (typeof CUTOUT_ARTWORK_IDS)[number];

export interface CutoutItemProps extends Omit<SVGProps<SVGSVGElement>, "children" | "id"> {
  label?: string;
  decorative?: boolean;
}

export interface CutoutArtworkProps extends CutoutItemProps {
  id: CutoutArtworkId;
}

const CUTOUT_LABELS: Record<CutoutArtworkId, string> = {
  "lunar-disc": "Cutout Lunar Disc",
  crescent: "Cutout Crescent",
  "witness-silhouette": "Cutout Witness Silhouette",
  "rooftop-antenna": "Cutout Rooftop Antenna",
  "cassette-recorder": "Cutout Cassette Recorder",
  "signal-radio": "Cutout Signal Radio",
  "industrial-battery": "Cutout Industrial Battery",
  "city-block": "Cutout City Block",
  "satellite-dish": "Cutout Satellite Dish",
  "transit-sign": "Cutout Transit Sign",
  "cable-coil": "Cutout Cable Coil",
  "lunar-rock": "Cutout Lunar Rock",
};

function renderCutoutPaths(id: CutoutArtworkId) {
  const sw = "var(--mw-icon-stroke, 2.2)";
  switch (id) {
    case "lunar-disc":
      return (
        <g>
          <circle cx="80" cy="80" r="56" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <circle cx="80" cy="80" r="44" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="6 4" />
          <circle cx="62" cy="64" r="10" fill="var(--background)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="96" cy="94" r="14" fill="var(--background)" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="98" cy="56" r="6" fill="var(--primary)" fillOpacity="0.45" />
          <path d="M40 80H120" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      );
    case "crescent":
      return (
        <g>
          <path
            d="M98 30A52 52 0 1 0 124 114A42 42 0 0 1 98 30Z"
            fill="var(--primary)"
            stroke="var(--foreground)"
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <circle cx="104" cy="62" r="5" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1.5" />
          <path d="M52 46L56 38L60 46L68 50L60 54L56 62L52 54L44 50Z" fill="var(--secondary, var(--accent))" />
        </g>
      );
    case "witness-silhouette":
      return (
        <g>
          <polygon points="48,142 58,92 102,92 112,142" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <circle cx="80" cy="62" r="22" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="64" y="55" width="32" height="10" rx="2" fill="var(--primary)" />
          <path d="M56 38L64 26L80 34L96 26L104 38" stroke="var(--primary)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="80" y1="92" x2="80" y2="142" stroke="var(--border)" strokeWidth="1.5" />
        </g>
      );
    case "rooftop-antenna":
      return (
        <g>
          <line x1="80" y1="22" x2="80" y2="140" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="56" y1="140" x2="80" y2="96" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="104" y1="140" x2="80" y2="96" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="48" y1="54" x2="112" y2="54" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="58" y1="74" x2="102" y2="74" stroke="var(--foreground)" strokeWidth={sw} />
          <circle cx="80" cy="22" r="6" fill="var(--primary)" />
          <path d="M96 34A22 22 0 0 1 110 50" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="3 3" />
          <path d="M64 34A22 22 0 0 0 50 50" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="3 3" />
        </g>
      );
    case "cassette-recorder":
      return (
        <g>
          <rect x="22" y="42" width="116" height="76" rx="6" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="34" y="54" width="92" height="16" rx="2" fill="var(--primary)" fillOpacity="0.22" stroke="var(--border)" strokeWidth="1.5" />
          <rect x="44" y="76" width="72" height="24" rx="3" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.6" />
          <circle cx="62" cy="88" r="7" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="98" cy="88" r="7" stroke="var(--primary)" strokeWidth={sw} />
          <line x1="69" y1="88" x2="91" y2="88" stroke="var(--muted-foreground)" strokeWidth="1.5" />
          <polygon points="42,118 118,118 110,106 50,106" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="1.4" />
        </g>
      );
    case "signal-radio":
      return (
        <g>
          <rect x="30" y="52" width="100" height="82" rx="6" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="48" y1="52" x2="34" y2="20" stroke="var(--primary)" strokeWidth={sw} strokeLinecap="round" />
          <circle cx="34" cy="20" r="4" fill="var(--primary)" />
          <rect x="42" y="64" width="76" height="22" rx="2" fill="var(--background)" stroke="var(--border)" strokeWidth="1.5" />
          <polyline points="48,75 62,75 68,68 74,82 80,71 86,75 112,75" stroke="var(--primary)" strokeWidth="1.8" fill="none" />
          <circle cx="56" cy="110" r="10" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.8" />
          <rect x="78" y="98" width="40" height="24" rx="2" fill="var(--muted)" stroke="var(--border)" strokeWidth="1.4" />
        </g>
      );
    case "industrial-battery":
      return (
        <g>
          <rect x="34" y="42" width="92" height="92" rx="4" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="46" y="28" width="16" height="14" fill="var(--primary)" stroke="var(--foreground)" strokeWidth="1.8" />
          <rect x="98" y="28" width="16" height="14" fill="var(--secondary, var(--accent))" stroke="var(--foreground)" strokeWidth="1.8" />
          <path d="M44 74H116M44 102H116" stroke="var(--border)" strokeWidth="1.5" />
          <polygon points="84,56 68,84 82,84 74,114 96,80 82,80" fill="var(--primary)" />
        </g>
      );
    case "city-block":
      return (
        <g>
          <rect x="20" y="60" width="36" height="80" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="56" y="34" width="46" height="106" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="102" y="72" width="38" height="68" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} />
          <rect x="66" y="46" width="10" height="12" fill="var(--primary)" />
          <rect x="82" y="46" width="10" height="12" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
          <rect x="66" y="68" width="10" height="12" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
          <rect x="82" y="68" width="10" height="12" fill="var(--primary)" />
          <rect x="30" y="74" width="14" height="10" fill="var(--secondary, var(--primary))" />
          <rect x="112" y="86" width="16" height="10" fill="var(--primary)" />
        </g>
      );
    case "satellite-dish":
      return (
        <g>
          <path d="M40 48C40 94 74 114 114 98" fill="var(--card)" stroke="var(--foreground)" strokeWidth={sw} strokeLinecap="round" />
          <line x1="40" y1="48" x2="114" y2="98" stroke="var(--foreground)" strokeWidth={sw} />
          <line x1="78" y1="72" x2="108" y2="42" stroke="var(--primary)" strokeWidth={sw} />
          <circle cx="110" cy="40" r="6" fill="var(--primary)" />
          <polygon points="58,136 94,136 82,98 70,98" fill="var(--muted)" stroke="var(--foreground)" strokeWidth={sw} />
          <path d="M120 26A18 18 0 0 1 134 40" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="3 3" />
        </g>
      );
    case "transit-sign":
      return (
        <g>
          <rect x="74" y="88" width="12" height="52" fill="var(--muted)" stroke="var(--foreground)" strokeWidth={sw} />
          <polygon points="80,22 132,74 80,126 28,74" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={sw} />
          <polygon points="80,34 120,74 80,114 40,74" fill="var(--card)" stroke="var(--foreground)" strokeWidth="1.6" />
          <polyline points="62,74 96,74 86,62" stroke="var(--foreground)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="96,74 86,86" stroke="var(--foreground)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      );
    case "cable-coil":
      return (
        <g>
          <circle cx="80" cy="78" r="46" stroke="var(--foreground)" strokeWidth={sw} fill="none" />
          <circle cx="80" cy="78" r="36" stroke="var(--primary)" strokeWidth={sw} fill="none" />
          <circle cx="80" cy="78" r="26" stroke="var(--foreground)" strokeWidth={sw} fill="none" />
          <circle cx="80" cy="78" r="14" fill="var(--card)" stroke="var(--border)" strokeWidth="1.8" />
          <path d="M80 124V138H126" stroke="var(--primary)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <rect x="122" y="130" width="16" height="16" rx="2" fill="var(--primary)" stroke="var(--foreground)" strokeWidth="1.5" />
        </g>
      );
    case "lunar-rock":
      return (
        <g>
          <polygon
            points="28,112 40,56 76,34 118,52 134,104 102,128 48,128"
            fill="var(--card)"
            stroke="var(--foreground)"
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <polyline points="76,34 70,74 48,128" stroke="var(--border)" strokeWidth="1.6" fill="none" />
          <polyline points="70,74 118,52" stroke="var(--border)" strokeWidth="1.6" fill="none" />
          <circle cx="94" cy="92" r="8" fill="var(--primary)" fillOpacity="0.4" stroke="var(--primary)" strokeWidth="1.5" />
          <circle cx="58" cy="84" r="5" fill="var(--background)" stroke="var(--border)" strokeWidth="1.2" />
        </g>
      );
  }
}

export function CutoutArtwork({
  id,
  className,
  label,
  decorative = false,
  ...rest
}: CutoutArtworkProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : (label ?? CUTOUT_LABELS[id])}
      aria-hidden={decorative ? true : undefined}
      data-mw-cutout={id}
      className={cn("h-28 w-28 shrink-0 select-none", className)}
      {...rest}
    >
      {renderCutoutPaths(id)}
    </svg>
  );
}

export function LunarDiscArt(props: CutoutItemProps) {
  return <CutoutArtwork id="lunar-disc" {...props} />;
}

export function CrescentArt(props: CutoutItemProps) {
  return <CutoutArtwork id="crescent" {...props} />;
}

export function WitnessSilhouetteArt(props: CutoutItemProps) {
  return <CutoutArtwork id="witness-silhouette" {...props} />;
}

export function RooftopAntennaArt(props: CutoutItemProps) {
  return <CutoutArtwork id="rooftop-antenna" {...props} />;
}

export function CassetteRecorderArt(props: CutoutItemProps) {
  return <CutoutArtwork id="cassette-recorder" {...props} />;
}

export function SignalRadioArt(props: CutoutItemProps) {
  return <CutoutArtwork id="signal-radio" {...props} />;
}

export function IndustrialBatteryArt(props: CutoutItemProps) {
  return <CutoutArtwork id="industrial-battery" {...props} />;
}

export function CityBlockArt(props: CutoutItemProps) {
  return <CutoutArtwork id="city-block" {...props} />;
}

export function SatelliteDishArt(props: CutoutItemProps) {
  return <CutoutArtwork id="satellite-dish" {...props} />;
}

export function TransitSignArt(props: CutoutItemProps) {
  return <CutoutArtwork id="transit-sign" {...props} />;
}

export function CableCoilArt(props: CutoutItemProps) {
  return <CutoutArtwork id="cable-coil" {...props} />;
}

export function LunarRockArt(props: CutoutItemProps) {
  return <CutoutArtwork id="lunar-rock" {...props} />;
}
