import React from "react";

export interface VectorProp {
  className?: string;
}

/**
 * Sovereign Crimson Crown Emblem — pure vector SVG plate for infinite DPI clarity.
 */
export function CrimsonCrownSvg({ className = "rs-crown-svg" }: VectorProp) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rs-crown-grad" x1="0" y1="0" x2="96" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--world-crimson-soft)" />
          <stop offset="55%" stopColor="var(--world-crimson)" />
          <stop offset="100%" stopColor="var(--world-crimson-deep)" />
        </linearGradient>
      </defs>
      <path
        d="M8 52L14 14L32 34L48 6L64 34L82 14L88 52H8Z"
        fill="url(#rs-crown-grad)"
        stroke="var(--world-crimson-soft)"
        strokeWidth="2.2"
        strokeLinejoin="miter"
      />
      <path
        d="M14 44H82M22 36L32 24L48 40L64 24L74 36"
        stroke="var(--color-paper)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <rect x="8" y="55" width="80" height="4" fill="var(--world-crimson)" />
      <circle cx="48" cy="6" r="2.6" fill="var(--color-lime)" />
      <circle cx="14" cy="14" r="2.2" fill="var(--world-crimson-soft)" />
      <circle cx="82" cy="14" r="2.2" fill="var(--world-crimson-soft)" />
    </svg>
  );
}

/**
 * Distress Crimson Brush Slash — razor-sharp vector katana/dry-brush stroke.
 */
export function CrimsonBrushSlash({ className = "rs-brush-slash" }: VectorProp) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rs-slash-grad" x1="0" y1="10" x2="420" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--world-crimson-soft)" />
          <stop offset="68%" stopColor="var(--world-crimson)" />
          <stop offset="100%" stopColor="var(--world-crimson)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 9L14 4L388 8L420 10L342 13L18 15L0 9Z"
        fill="url(#rs-slash-grad)"
      />
      <path
        d="M6 17L196 15L280 17L6 17Z"
        fill="var(--world-crimson-soft)"
        fillOpacity="0.55"
      />
      <rect x="0" y="2" width="38" height="2" fill="var(--color-lime)" fillOpacity="0.85" />
    </svg>
  );
}

/**
 * Anarchy Star / Chaos Sigil — crisp tactical vector seal.
 */
export function AnarchyStarSigil({ className = "rs-anarchy-sigil" }: VectorProp) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="currentColor"
        strokeOpacity="0.82"
        strokeWidth="2.4"
      />
      <circle
        cx="32"
        cy="32"
        r="28.5"
        stroke="var(--world-crimson)"
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeDasharray="6 4"
      />
      <path
        d="M32 6L13 56M32 6L51 56M10 38L54 32"
        stroke="var(--world-crimson)"
        strokeWidth="3.4"
        strokeLinecap="square"
      />
      <path
        d="M32 9L16 53M32 9L48 53M13 36.5L52 31.5"
        stroke="var(--color-paper)"
        strokeWidth="1.35"
        strokeLinecap="square"
      />
      <circle cx="32" cy="32" r="2.8" fill="var(--color-lime)" />
    </svg>
  );
}

/**
 * Street Stencil Spray Tag — crisp angular pulse glyph.
 */
export function SprayTagGlyph({ className = "rs-spray-glyph" }: VectorProp) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 40L24 12L42 34L62 8L82 36L104 14L126 38"
        stroke="var(--world-crimson)"
        strokeWidth="3.2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M14 45H132"
        stroke="var(--color-paper)"
        strokeOpacity="0.7"
        strokeWidth="1.8"
      />
      <path
        d="M34 45V52M78 45V50M112 45V53"
        stroke="var(--world-crimson)"
        strokeWidth="1.6"
      />
      <circle cx="62" cy="8" r="3" fill="var(--color-lime)" />
      <circle cx="132" cy="20" r="2" fill="var(--world-crimson)" />
    </svg>
  );
}

/**
 * Editorial Barcode Stamp — sharp vector bars + serial readout.
 */
export function VectorBarcodeStamp({
  code = "RS-DX // 0049-LOCAL",
  className = "rs-barcode-stamp",
}: {
  code?: string;
  className?: string;
}) {
  const bars = [
    [2, 3], [7, 1], [10, 4], [16, 2], [20, 1], [23, 3], [28, 2], [32, 4],
    [38, 1], [41, 2], [45, 3], [50, 1], [53, 4], [59, 2], [63, 1], [66, 3],
    [71, 2], [75, 4], [81, 1], [84, 3], [89, 2], [93, 1], [96, 4], [102, 2],
    [106, 3], [111, 1], [114, 3],
  ] as const;
  return (
    <div className={className} aria-hidden="true">
      <svg
        className="rs-barcode-img"
        viewBox="0 0 120 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {bars.map(([x, w], idx) => (
          <rect
            key={idx}
            x={x}
            y="1"
            width={w}
            height="18"
            fill={idx % 5 === 0 ? "var(--world-crimson)" : "var(--color-paper)"}
            fillOpacity={idx % 3 === 0 ? "0.95" : "0.75"}
          />
        ))}
      </svg>
      <span>{code}</span>
    </div>
  );
}

/**
 * Signal Telemetry Waveform — dual-trace vector oscilloscope with tactical grid.
 */
export function TelemetryWaveformSvg({ className = "rs-waveform-svg" }: VectorProp) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rs-wave-red" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--world-crimson)" stopOpacity="0.2" />
          <stop offset="18%" stopColor="var(--world-crimson-soft)" />
          <stop offset="82%" stopColor="var(--world-crimson)" />
          <stop offset="100%" stopColor="var(--world-crimson)" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="rs-wave-lime" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-lime)" stopOpacity="0.15" />
          <stop offset="25%" stopColor="var(--color-lime)" stopOpacity="0.9" />
          <stop offset="75%" stopColor="var(--color-clean)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--color-lime)" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <line x1="0" y1="36" x2="600" y2="36" stroke="var(--color-paper)" strokeOpacity="0.14" strokeDasharray="4 6" />
      <line x1="150" y1="4" x2="150" y2="68" stroke="var(--color-paper)" strokeOpacity="0.08" />
      <line x1="300" y1="4" x2="300" y2="68" stroke="var(--color-paper)" strokeOpacity="0.08" />
      <line x1="450" y1="4" x2="450" y2="68" stroke="var(--color-paper)" strokeOpacity="0.08" />
      <path
        d="M0 36 L38 36 L54 18 L70 54 L88 10 L106 60 L124 26 L144 44 L168 34 L196 36 L216 14 L234 58 L252 20 L272 50 L294 32 L326 36 L346 12 L366 62 L386 16 L406 52 L426 28 L454 36 L478 22 L498 52 L518 18 L538 46 L560 36 L600 36"
        stroke="url(#rs-wave-red)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M0 38 L44 38 L64 28 L84 48 L104 24 L126 46 L152 34 L184 38 L208 26 L228 48 L248 22 L270 44 L300 36 L334 38 L358 24 L378 50 L398 28 L420 44 L448 36 L486 30 L508 46 L530 26 L554 40 L600 36"
        stroke="url(#rs-wave-lime)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
