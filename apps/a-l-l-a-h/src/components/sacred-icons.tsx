import type { SVGProps } from "react";
import {
  CrescentStarIcon,
  CrownEmblemIcon,
  DiamondStarOrnament,
  OctagramMandalaIcon,
  SearchLensIcon,
} from "@moonwitness/ui/imperium";
import type { WorldIdentifier } from "@/data/empire-registry";

export {
  CrescentStarIcon,
  CrownEmblemIcon,
  DiamondStarOrnament,
  OctagramMandalaIcon,
  SearchLensIcon,
};

export function PortalAstrolabeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="astrolabe-gold"
          x1="12"
          y1="12"
          x2="108"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--dna-text)" />
          <stop offset="50%" stopColor="var(--dna-accent)" />
          <stop offset="100%" stopColor="var(--dna-accent)" />
        </linearGradient>
        <radialGradient id="astrolabe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--dna-accent)" stopOpacity="0.45" />
          <stop offset="65%" stopColor="var(--dna-accent)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--dna-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#astrolabe-glow)" />
      <circle cx="60" cy="60" r="50" stroke="url(#astrolabe-gold)" strokeWidth="1.2" />
      <circle
        cx="60"
        cy="60"
        r="46"
        stroke="url(#astrolabe-gold)"
        strokeWidth="0.75"
        strokeDasharray="3 3"
      />
      {/* 12-pointed sacred polygon */}
      <polygon
        points="60,10 85,17 103,35 110,60 103,85 85,103 60,110 35,103 17,85 10,60 17,35 35,17"
        stroke="url(#astrolabe-gold)"
        strokeWidth="0.9"
      />
      {/* Dual interlocking hexagrams */}
      <polygon points="60,12 101.5,84 18.5,84" stroke="url(#astrolabe-gold)" strokeWidth="1" />
      <polygon points="60,108 101.5,36 18.5,36" stroke="url(#astrolabe-gold)" strokeWidth="1" />
      {/* Rotated hexagram */}
      <g transform="rotate(30 60 60)">
        <polygon
          points="60,12 101.5,84 18.5,84"
          stroke="url(#astrolabe-gold)"
          strokeWidth="0.85"
          strokeOpacity="0.8"
        />
        <polygon
          points="60,108 101.5,36 18.5,36"
          stroke="url(#astrolabe-gold)"
          strokeWidth="0.85"
          strokeOpacity="0.8"
        />
      </g>
      {/* Inner rings & meridian arcs */}
      <ellipse
        cx="60"
        cy="60"
        rx="48"
        ry="22"
        stroke="url(#astrolabe-gold)"
        strokeWidth="0.8"
        strokeOpacity="0.75"
      />
      <ellipse
        cx="60"
        cy="60"
        rx="22"
        ry="48"
        stroke="url(#astrolabe-gold)"
        strokeWidth="0.8"
        strokeOpacity="0.75"
      />
      <circle cx="60" cy="60" r="24" stroke="url(#astrolabe-gold)" strokeWidth="1.1" />
      <path
        d="M60 32 L63.5 56.5 L88 60 L63.5 63.5 L60 88 L56.5 63.5 L32 60 L56.5 56.5 Z"
        stroke="url(#astrolabe-gold)"
        strokeWidth="1.1"
        fill="rgba(255, 243, 204, 0.18)"
      />
      <circle cx="60" cy="60" r="3.5" fill="var(--dna-text)" />
    </svg>
  );
}

export function MoonwitnessCrestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="mw-gold" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--dna-text)" />
          <stop offset="55%" stopColor="var(--dna-accent)" />
          <stop offset="100%" stopColor="var(--dna-accent)" />
        </linearGradient>
      </defs>
      {/* Ornate Crescent Moon */}
      <path
        d="M42.5 47.5 C29.5 49.5 18 39.5 18 26.5 C18 17.2 23.8 9.2 32.2 6.2 C20.4 7.5 11 17.5 11 29.8 C11 43.2 21.8 54 35.2 54 C42.8 54 49.6 50.4 54 44.8 C50.5 46.7 46.6 47.2 42.5 47.5 Z"
        fill="url(#mw-gold)"
        fillOpacity="0.22"
        stroke="url(#mw-gold)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* Inner filigree arc */}
      <path
        d="M34 11.5 C24.5 15 19.5 25.5 23 35.5 C25.8 43.2 33.2 48.2 41.5 48.5"
        stroke="url(#mw-gold)"
        strokeWidth="0.9"
        strokeDasharray="2 2"
        strokeOpacity="0.85"
      />
      {/* 5-pointed star */}
      <path
        d="M43 17 L44.9 22.4 L50.6 22.5 L46.1 25.9 L47.7 31.4 L43 28.1 L38.3 31.4 L39.9 25.9 L35.4 22.5 L41.1 22.4 Z"
        fill="url(#mw-gold)"
        stroke="var(--dna-text)"
        strokeWidth="0.6"
      />
      {/* Tiny accent sparkles */}
      <circle cx="49" cy="13" r="1.1" fill="var(--dna-text)" />
      <circle cx="29" cy="21" r="0.9" fill="var(--dna-accent)" />
    </svg>
  );
}

export function ArsyTowerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="arsy-gold"
          x1="12"
          y1="6"
          x2="52"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--dna-text)" />
          <stop offset="55%" stopColor="var(--dna-accent)" />
          <stop offset="100%" stopColor="var(--dna-accent)" />
        </linearGradient>
      </defs>
      {/* Concentric Radio Waves Left & Right */}
      <path
        d="M21 12.5 C16.5 16.2 16.5 23.8 21 27.5"
        stroke="url(#arsy-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.5 8.5 C9 14.5 9 25.5 15.5 31.5"
        stroke="url(#arsy-gold)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <path
        d="M43 12.5 C47.5 16.2 47.5 23.8 43 27.5"
        stroke="url(#arsy-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M48.5 8.5 C55 14.5 55 25.5 48.5 31.5"
        stroke="url(#arsy-gold)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      {/* Broadcast Lattice Tower */}
      <circle
        cx="32"
        cy="18"
        r="2.8"
        fill="var(--dna-text)"
        stroke="url(#arsy-gold)"
        strokeWidth="1.2"
      />
      <path
        d="M32 21 L21 56 M32 21 L43 56"
        stroke="url(#arsy-gold)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {/* Lattice cross-bracing */}
      <path
        d="M28.5 32 H35.5 M25.5 42 H38.5 M22.5 52 H41.5"
        stroke="url(#arsy-gold)"
        strokeWidth="1.3"
      />
      <path
        d="M28.5 32 L38.5 42 L22.5 52 M35.5 32 L25.5 42 L41.5 52"
        stroke="url(#arsy-gold)"
        strokeWidth="1"
        strokeOpacity="0.85"
      />
      <path d="M17 56 H47" stroke="url(#arsy-gold)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function QalamNibIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="qalam-gold"
          x1="12"
          y1="52"
          x2="54"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--dna-text)" />
          <stop offset="50%" stopColor="var(--dna-accent)" />
          <stop offset="100%" stopColor="var(--dna-accent)" />
        </linearGradient>
      </defs>
      {/* Illuminated Calligraphy Nib */}
      <path
        d="M14 50 L22 30 L44 10 C47 7.5 51.5 8 54 10.5 C56.5 13 57 17.5 54.5 20.5 L34.5 42.5 L14 50 Z"
        fill="url(#qalam-gold)"
        fillOpacity="0.24"
        stroke="url(#qalam-gold)"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      {/* Slit and breather hole */}
      <path
        d="M14 50 L28.5 35.5"
        stroke="var(--dna-text)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle
        cx="30.5"
        cy="33.5"
        r="2.2"
        fill="var(--dna-canvas)"
        stroke="var(--dna-text)"
        strokeWidth="1.2"
      />
      {/* Collar detail */}
      <path d="M37 16.5 L47.5 27" stroke="url(#qalam-gold)" strokeWidth="1.4" />
      <path d="M40.5 13 L51 23.5" stroke="url(#qalam-gold)" strokeWidth="1" strokeOpacity="0.75" />
      {/* Luminous ink trail */}
      <path
        d="M10 54 Q22 55 34 53"
        stroke="var(--dna-text)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
    </svg>
  );
}

export function SidraPolyhedronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="sidra-gold"
          x1="10"
          y1="8"
          x2="54"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--dna-text)" />
          <stop offset="55%" stopColor="var(--dna-accent)" />
          <stop offset="100%" stopColor="var(--dna-accent)" />
        </linearGradient>
      </defs>
      {/* Outer Icosahedral Hexagon */}
      <polygon
        points="32,7 53.6,19.5 53.6,44.5 32,57 10.4,44.5 10.4,19.5"
        fill="url(#sidra-gold)"
        fillOpacity="0.14"
        stroke="url(#sidra-gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Inner Star Triangles */}
      <polygon
        points="32,7 53.6,44.5 10.4,44.5"
        stroke="url(#sidra-gold)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <polygon
        points="32,57 53.6,19.5 10.4,19.5"
        stroke="url(#sidra-gold)"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* Internal Polyhedral Edges */}
      <path
        d="M32 7 V57 M10.4 19.5 L53.6 44.5 M53.6 19.5 L10.4 44.5"
        stroke="url(#sidra-gold)"
        strokeWidth="0.95"
        strokeOpacity="0.7"
      />
      <circle cx="32" cy="32" r="2.5" fill="var(--dna-text)" />
    </svg>
  );
}

export function RocksoulCubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="cube-gold"
          x1="10"
          y1="8"
          x2="54"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--dna-text)" />
          <stop offset="55%" stopColor="var(--dna-accent)" />
          <stop offset="100%" stopColor="var(--dna-accent)" />
        </linearGradient>
      </defs>
      {/* Top Face */}
      <polygon
        points="32,8 53,20 32,32 11,20"
        fill="url(#cube-gold)"
        fillOpacity="0.26"
        stroke="url(#cube-gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Left Face */}
      <polygon
        points="11,20 32,32 32,56 11,44"
        fill="url(#cube-gold)"
        fillOpacity="0.14"
        stroke="url(#cube-gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Right Face */}
      <polygon
        points="53,20 53,44 32,56 32,32"
        fill="url(#cube-gold)"
        fillOpacity="0.08"
        stroke="url(#cube-gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Inner Isometric Wireframe */}
      <path
        d="M32 8 V32 M11 44 L32 32 L53 44"
        stroke="url(#cube-gold)"
        strokeWidth="0.9"
        strokeDasharray="2 2"
        strokeOpacity="0.65"
      />
      <circle cx="32" cy="32" r="2.4" fill="var(--dna-text)" />
    </svg>
  );
}

export function CrayonPrismIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <polygon
        points="32,8 54,50 10,50"
        fill="rgba(46, 168, 255, 0.14)"
        stroke="var(--brand-blue)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22 36 H42 M18 43 H46"
        stroke="var(--dna-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="24" r="3" fill="var(--dna-accent-secondary)" />
    </svg>
  );
}

export function SinCanMirrorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 50 V24 C14 14 32 8 32 8 C32 8 50 14 50 24 V50 Z"
        fill="rgba(237, 20, 155, 0.14)"
        stroke="var(--dna-accent-secondary)"
        strokeWidth="2"
      />
      <path d="M32 14 V46" stroke="var(--dna-accent)" strokeWidth="1.8" strokeDasharray="3 3" />
      <circle cx="32" cy="29" r="5" fill="var(--dna-text)" />
    </svg>
  );
}

export function MythosArchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 52 H54 M16 24 V52 M32 24 V52 M48 24 V52"
        stroke="var(--dna-accent)"
        strokeWidth="2.2"
      />
      <polygon
        points="8,24 32,10 56,24"
        fill="rgba(246, 212, 56, 0.18)"
        stroke="var(--dna-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AwsScalesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <path
        d="M32 10 V52 M20 52 H44 M14 20 H50"
        stroke="var(--dna-text)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 20 L8 36 H20 Z"
        fill="rgba(46, 168, 255, 0.25)"
        stroke="var(--brand-blue)"
        strokeWidth="1.6"
      />
      <path
        d="M50 20 L44 36 H56 Z"
        fill="rgba(246, 212, 56, 0.25)"
        stroke="var(--dna-accent)"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function WorldEmblemById({
  worldId,
  className,
}: {
  readonly worldId: WorldIdentifier;
  readonly className?: string;
}) {
  switch (worldId) {
    case "moonwitness":
      return <MoonwitnessCrestIcon className={className} />;
    case "arsy":
      return <ArsyTowerIcon className={className} />;
    case "human-pen":
      return <QalamNibIcon className={className} />;
    case "sidra":
      return <SidraPolyhedronIcon className={className} />;
    case "rocksoul-dx":
      return <RocksoulCubeIcon className={className} />;
    case "crayon":
      return <CrayonPrismIcon className={className} />;
    case "sin-can":
      return <SinCanMirrorIcon className={className} />;
    case "mythos":
      return <MythosArchIcon className={className} />;
    case "angel-with-shotgun":
      return <AwsScalesIcon className={className} />;
  }
}
