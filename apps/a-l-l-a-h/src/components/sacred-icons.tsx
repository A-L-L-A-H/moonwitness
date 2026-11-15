import type { SVGProps } from "react";
import type { WorldIdentifier } from "@/data/empire-registry";

export function OctagramMandalaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="octagram-gold"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fff3d1" />
          <stop offset="50%" stopColor="#d9b56c" />
          <stop offset="100%" stopColor="#8c6523" />
        </linearGradient>
      </defs>
      {/* Cardinal outer points */}
      <path
        d="M32 2 L35.5 11 L45 8 L43 17.5 L53 19 L47.5 27.5 L56 32 L47.5 36.5 L53 45 L43 46.5 L45 56 L35.5 53 L32 62 L28.5 53 L19 56 L21 46.5 L11 45 L16.5 36.5 L8 32 L16.5 27.5 L11 19 L21 17.5 L19 8 L28.5 11 Z"
        stroke="url(#octagram-gold)"
        strokeWidth="1.25"
        fill="rgba(217, 181, 108, 0.08)"
      />
      {/* Interlocking Rub el Hizb squares */}
      <rect x="14" y="14" width="36" height="36" stroke="url(#octagram-gold)" strokeWidth="1.2" />
      <rect
        x="14"
        y="14"
        width="36"
        height="36"
        transform="rotate(45 32 32)"
        stroke="url(#octagram-gold)"
        strokeWidth="1.2"
      />
      {/* Inner sacred rings and star */}
      <circle
        cx="32"
        cy="32"
        r="14"
        stroke="url(#octagram-gold)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle cx="32" cy="32" r="9.5" stroke="url(#octagram-gold)" strokeWidth="1.1" />
      <path
        d="M32 20 L34.4 29.6 L44 32 L34.4 34.4 L32 44 L29.6 34.4 L20 32 L29.6 29.6 Z"
        fill="url(#octagram-gold)"
        fillOpacity="0.85"
      />
      <circle cx="32" cy="32" r="2.5" fill="#fff8e6" />
    </svg>
  );
}

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
          <stop offset="0%" stopColor="#fff7df" />
          <stop offset="50%" stopColor="#dfc07c" />
          <stop offset="100%" stopColor="#9e7632" />
        </linearGradient>
        <radialGradient id="astrolabe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2c6" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#d9b56c" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#d9b56c" stopOpacity="0" />
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
      <circle cx="60" cy="60" r="3.5" fill="#fff9e8" />
    </svg>
  );
}

export function MoonwitnessCrestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="mw-gold" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="55%" stopColor="#dec07d" />
          <stop offset="100%" stopColor="#9c732b" />
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
        stroke="#fff6dc"
        strokeWidth="0.6"
      />
      {/* Tiny accent sparkles */}
      <circle cx="49" cy="13" r="1.1" fill="#fff6dc" />
      <circle cx="29" cy="21" r="0.9" fill="#dec07d" />
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
          <stop offset="0%" stopColor="#fff7df" />
          <stop offset="55%" stopColor="#dfc07b" />
          <stop offset="100%" stopColor="#997029" />
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
      <circle cx="32" cy="18" r="2.8" fill="#fff7df" stroke="url(#arsy-gold)" strokeWidth="1.2" />
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
          <stop offset="0%" stopColor="#fff8e3" />
          <stop offset="50%" stopColor="#e2c37e" />
          <stop offset="100%" stopColor="#9c722a" />
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
      <path d="M14 50 L28.5 35.5" stroke="#fff8e3" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="30.5" cy="33.5" r="2.2" fill="#0d0d12" stroke="#fff8e3" strokeWidth="1.2" />
      {/* Collar detail */}
      <path d="M37 16.5 L47.5 27" stroke="url(#qalam-gold)" strokeWidth="1.4" />
      <path d="M40.5 13 L51 23.5" stroke="url(#qalam-gold)" strokeWidth="1" strokeOpacity="0.75" />
      {/* Luminous ink trail */}
      <path
        d="M10 54 Q22 55 34 53"
        stroke="#fff6d9"
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
          <stop offset="0%" stopColor="#fff7df" />
          <stop offset="55%" stopColor="#dfc07b" />
          <stop offset="100%" stopColor="#997029" />
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
      <circle cx="32" cy="32" r="2.5" fill="#fff7df" />
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
          <stop offset="0%" stopColor="#fff7df" />
          <stop offset="55%" stopColor="#dfc07b" />
          <stop offset="100%" stopColor="#997029" />
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
      <circle cx="32" cy="32" r="2.4" fill="#fff8e6" />
    </svg>
  );
}

export function SearchLensIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M15.5 15.5 L20.5 20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CrescentStarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M17.2 16.8 C12.2 17.6 7.8 13.7 7.8 8.7 C7.8 5.4 9.7 2.5 12.6 1.3 C7.6 1.8 3.8 6.1 3.8 11.2 C3.8 16.7 8.3 21.2 13.8 21.2 C17.1 21.2 20 19.6 21.8 17.1 C20.3 17.3 18.7 17.1 17.2 16.8 Z"
        fill="currentColor"
      />
      <path
        d="M16.8 5.2 L17.5 7.1 L19.5 7.1 L17.9 8.3 L18.5 10.2 L16.8 9 L15.1 10.2 L15.7 8.3 L14.1 7.1 L16.1 7.1 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DiamondStarOrnament(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2 L14.8 9.2 L22 12 L14.8 14.8 L12 22 L9.2 14.8 L2 12 L9.2 9.2 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="rgba(248, 234, 198, 0.2)"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
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
    case "qalam":
      return <QalamNibIcon className={className} />;
    case "sidra":
      return <SidraPolyhedronIcon className={className} />;
    case "rocksoul-dx":
      return <RocksoulCubeIcon className={className} />;
  }
}
