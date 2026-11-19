import type { SVGProps } from "react";

function CornerFiligreeGlyph({ className }: { readonly className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none absolute h-6 w-6 text-[#f5dfa6] ${className}`}
    >
      <path d="M1 14V4.5L4.5 1H14" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.85" />
      <path d="M5 10V6L6 5H10" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.45" />
      <polygon points="4.5,2.5 6.5,4.5 4.5,6.5 2.5,4.5" fill="#fff8e6" fillOpacity="0.9" />
    </svg>
  );
}

/**
 * Corner astrolabe brass filigree brackets framing Imperium Lumen chambers cleanly.
 */
export function SacredCornerBrackets() {
  return (
    <>
      <CornerFiligreeGlyph className="top-1.5 left-1.5" />
      <CornerFiligreeGlyph className="top-1.5 right-1.5 -scale-x-100" />
      <CornerFiligreeGlyph className="bottom-1.5 left-1.5 -scale-y-100" />
      <CornerFiligreeGlyph className="bottom-1.5 right-1.5 -scale-100" />
    </>
  );
}

/**
 * Geometric 8-pointed Rub el Hizb celestial seal used across sanctuary headers and panels.
 */
export function OctagramMandalaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient
          id="mw-octagram-gold"
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
      <path
        d="M32 2 L35.5 11 L45 8 L43 17.5 L53 19 L47.5 27.5 L56 32 L47.5 36.5 L53 45 L43 46.5 L45 56 L35.5 53 L32 62 L28.5 53 L19 56 L21 46.5 L11 45 L16.5 36.5 L8 32 L16.5 27.5 L11 19 L21 17.5 L19 8 L28.5 11 Z"
        stroke="url(#mw-octagram-gold)"
        strokeWidth="1.25"
        fill="rgba(217, 181, 108, 0.08)"
      />
      <rect x="14" y="14" width="36" height="36" stroke="url(#mw-octagram-gold)" strokeWidth="1.2" />
      <rect
        x="14"
        y="14"
        width="36"
        height="36"
        transform="rotate(45 32 32)"
        stroke="url(#mw-octagram-gold)"
        strokeWidth="1.2"
      />
      <circle
        cx="32"
        cy="32"
        r="14"
        stroke="url(#mw-octagram-gold)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle cx="32" cy="32" r="9.5" stroke="url(#mw-octagram-gold)" strokeWidth="1.1" />
      <path
        d="M32 20 L34.4 29.6 L44 32 L34.4 34.4 L32 44 L29.6 34.4 L20 32 L29.6 29.6 Z"
        fill="url(#mw-octagram-gold)"
        fillOpacity="0.85"
      />
      <circle cx="32" cy="32" r="2.5" fill="#fff8e6" />
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

/**
 * Hand-drawn style three-peak crown emblem used in the Empire of the Light lockup.
 */
export function CrownEmblemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 40" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 32 L3 10 L15 21 L24 6 L33 21 L45 10 L43 32 Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="rgba(246, 212, 56, 0.16)"
      />
      <path
        d="M8 36 H40"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Arc links connecting Meridian Observatory sky chart coordinates.
 */
export function MeridianArcLines({
  meridians,
  activeIndex,
}: {
  readonly meridians: readonly { readonly code: string; readonly x: number; readonly y: number }[];
  readonly activeIndex: number;
}) {
  return (
    <svg
      viewBox="0 0 360 132"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {meridians.map((src, idx) => {
        const dst = meridians[(idx + 1) % meridians.length];
        if (!dst) return null;
        const activeSeg = idx === activeIndex;
        return (
          <path
            key={`${src.code}-${dst.code}`}
            d={`M${src.x} ${src.y} Q180 24 ${dst.x} ${dst.y}`}
            fill="none"
            stroke={activeSeg ? "var(--dna-text)" : "var(--dna-accent)"}
            strokeOpacity={activeSeg ? 0.8 : 0.28}
            strokeWidth={activeSeg ? 1.3 : 0.75}
            strokeDasharray={activeSeg ? undefined : "3 3"}
          />
        );
      })}
    </svg>
  );
}

/**
 * Compact harmonic waveform badge for telemetry gateway panels.
 */
export function GatewayWaveformVector({ variant = 0 }: { readonly variant?: number }) {
  const phase = variant * 11;
  return (
    <svg viewBox="0 0 120 22" fill="none" aria-hidden="true" className="h-5 w-full opacity-80">
      <line
        x1="0"
        y1="11"
        x2="120"
        y2="11"
        stroke="var(--dna-accent)"
        strokeOpacity="0.18"
        strokeWidth="0.6"
      />
      <path
        d={`M0 11 Q15 ${4 + (phase % 5)} 30 11 T60 11 T90 11 T120 11`}
        stroke="var(--dna-accent)"
        strokeWidth="1.15"
        strokeOpacity="0.75"
      />
      <path
        d={`M0 11 Q15 ${17 - (phase % 4)} 30 11 T60 11 T90 11 T120 11`}
        stroke="var(--dna-accent)"
        strokeWidth="0.7"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

/**
 * Architectural miniature portal glyph for Canon Entry Doors.
 */
export function DoorPortalVector({
  doorId,
  active = false,
}: {
  readonly doorId: string;
  readonly active?: boolean;
}) {
  const stroke = active ? "var(--dna-text)" : "var(--dna-accent)";
  if (doorId === "story-universe") {
    return (
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className="h-8 w-8">
        <path d="M8 30 V16 C8 9 18 5 18 5 C18 5 28 9 28 16 V30" stroke={stroke} strokeWidth="1.3" />
        <circle cx="18" cy="18" r="4.5" stroke={stroke} strokeOpacity="0.75" strokeWidth="1" />
        <path
          d="M18 11 L19.2 16.8 L25 18 L19.2 19.2 L18 25 L16.8 19.2 L11 18 L16.8 16.8 Z"
          fill={stroke}
          fillOpacity="0.7"
        />
      </svg>
    );
  }
  if (doorId === "epistemic-corpus") {
    return (
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className="h-8 w-8">
        <polygon points="18,4 30,18 18,32 6,18" stroke={stroke} strokeWidth="1.25" />
        <polygon
          points="18,9 25,18 18,27 11,18"
          stroke={stroke}
          strokeOpacity="0.6"
          strokeWidth="0.9"
        />
        <circle cx="18" cy="18" r="2.2" fill={stroke} />
      </svg>
    );
  }
  if (doorId === "empire-organization") {
    return (
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className="h-8 w-8">
        <circle cx="18" cy="18" r="12" stroke={stroke} strokeWidth="1.15" strokeDasharray="3 2" />
        <circle cx="18" cy="18" r="7" stroke={stroke} strokeWidth="1.2" />
        <circle cx="18" cy="18" r="2.4" fill={stroke} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className="h-8 w-8">
      <circle cx="18" cy="18" r="12" stroke={stroke} strokeWidth="1" strokeOpacity="0.55" />
      <ellipse
        cx="18"
        cy="18"
        rx="13"
        ry="5"
        transform="rotate(-30 18 18)"
        stroke={stroke}
        strokeWidth="1.1"
      />
      <ellipse
        cx="18"
        cy="18"
        rx="13"
        ry="5"
        transform="rotate(30 18 18)"
        stroke={stroke}
        strokeWidth="1.1"
      />
      <circle cx="18" cy="18" r="2.4" fill={stroke} />
    </svg>
  );
}

/**
 * 33-bead Dhikr progress orbital dial SVG ring.
 */
export function TasbihBeadRingVector({
  beadCount,
  progressFraction,
  quietMode = false,
}: {
  readonly beadCount: number;
  readonly progressFraction: number;
  readonly quietMode?: boolean;
}) {
  return (
    <svg viewBox="0 0 180 180" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <circle
        cx="90"
        cy="90"
        r="74"
        fill="var(--dna-canvas)"
        fillOpacity="0.85"
        stroke="var(--dna-accent)"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      <circle
        cx="90"
        cy="90"
        r="64"
        fill="none"
        stroke="var(--dna-accent)"
        strokeOpacity="0.14"
        strokeWidth="1.5"
      />
      <circle
        cx="90"
        cy="90"
        r="64"
        fill="none"
        stroke="var(--dna-text)"
        strokeOpacity="0.68"
        strokeWidth="1.5"
        strokeDasharray="402.12"
        strokeDashoffset={(402.12 * (1 - progressFraction)).toFixed(2)}
        transform="rotate(-90 90 90)"
        style={{ transition: quietMode ? "none" : "stroke-dashoffset 260ms ease" }}
      />
      {Array.from({ length: 33 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 33 - Math.PI / 2;
        const cx = Number((90 + Math.cos(angle) * 74).toFixed(2));
        const cy = Number((90 + Math.sin(angle) * 74).toFixed(2));
        const lit = i < beadCount;
        const isMilestone = i === 10 || i === 21 || i === 32;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={lit ? (isMilestone ? 4 : 3.2) : isMilestone ? 2.2 : 1.7}
            fill={lit ? "var(--dna-text)" : "var(--dna-accent)"}
            fillOpacity={lit ? 0.98 : isMilestone ? 0.55 : 0.28}
          />
        );
      })}
    </svg>
  );
}

/**
 * Constellation connection lines for Sidra Knowledge Graph nodes.
 */
export function SidraConstellationLinks({
  axioms,
  selectedId,
}: {
  readonly axioms: readonly {
    readonly id: string;
    readonly coordinateX: number;
    readonly coordinateY: number;
    readonly connectedIds: readonly string[];
  }[];
  readonly selectedId: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {axioms.map((axiomNode) =>
        axiomNode.connectedIds.map((targetId) => {
          const targetNode = axioms.find((candidate) => candidate.id === targetId);
          if (!targetNode) return null;
          const isHighlighted = axiomNode.id === selectedId || targetNode.id === selectedId;
          return (
            <line
              key={`${axiomNode.id}-${targetNode.id}`}
              x1={axiomNode.coordinateX}
              y1={axiomNode.coordinateY}
              x2={targetNode.coordinateX}
              y2={targetNode.coordinateY}
              stroke={isHighlighted ? "var(--dna-text)" : "var(--dna-accent)"}
              strokeWidth={isHighlighted ? "0.7" : "0.35"}
              strokeOpacity={isHighlighted ? "0.75" : "0.24"}
            />
          );
        }),
      )}
    </svg>
  );
}
