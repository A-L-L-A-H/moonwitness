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
