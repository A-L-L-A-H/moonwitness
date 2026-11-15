interface VectorProps {
  className?: string;
}

const BARCODE_WEIGHTS = [
  2, 1, 3, 1, 1, 2, 1, 4, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 1, 4, 1, 2, 2, 1, 1, 3, 1, 2, 1,
] as const;

const BARCODE_BARS = BARCODE_WEIGHTS.reduce<{ bars: Array<{ x: number; width: number }>; cursor: number }>(
  (acc, width, index) => {
    const gap = index % 3 === 0 ? 3 : 2;
    acc.bars.push({ x: acc.cursor, width });
    acc.cursor += width + gap;
    return acc;
  },
  { bars: [], cursor: 2 },
).bars;

/** Sketchy crimson spray crown hovering over the ROCKSOUL DX wordmark. */
export function CrimsonCrownSvg({ className = "rs-crown-svg" }: VectorProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 92 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 43L7 15L30 29L46 7L61 29L84 14L75 43"
        stroke="#ff5a52"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 47C31 44 57 44 79 46"
        stroke="#e53e38"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M15 41L9 19L30 31L46 11L60 31L80 18L73 41"
        stroke="#e53e38"
        strokeWidth="1.6"
        strokeDasharray="6 3"
        strokeLinecap="round"
      />
      <circle cx="46" cy="4" r="2.2" fill="#ff7d73" />
      <circle cx="8" cy="11" r="1.8" fill="#e53e38" />
      <circle cx="84" cy="10" r="1.8" fill="#e53e38" />
      <path d="M22 47V53M64 46V51" stroke="#e53e38" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Tapered jagged crimson paint brush underline beneath manifesto copy. */
export function CrimsonBrushSlash({ className = "rs-brush-slash" }: VectorProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 18"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 11C72 5 178 4 292 7C320 8 340 10 356 8"
        stroke="#e53e38"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M18 14C96 10 194 9 318 12"
        stroke="#ff726a"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.72"
      />
      <circle cx="346" cy="13" r="1.6" fill="#e53e38" />
      <circle cx="354" cy="11" r="1.1" fill="#ff726a" />
    </svg>
  );
}

/** Broken-ring gothic anarchy compass emblem used for ROCKSOUL brand marks. */
export function AnarchyStarSigil({ className = "rs-anarchy-sigil" }: VectorProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="18.5" stroke="currentColor" strokeWidth="1.6" strokeDasharray="34 7 18 6" />
      <circle cx="24" cy="24" r="12.5" stroke="#e53e38" strokeWidth="1.1" opacity="0.85" />
      <path d="M24 5L34.5 39M24 5L13.5 39M10 29L38 24" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M24 2L25.5 8M24 40L24 46M2 24H8M40 24H46" stroke="#e53e38" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Chalk-stencil corner emblem accompanying right-margin wall spray text. */
export function SprayTagGlyph({ className = "rs-spray-glyph" }: VectorProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 32L24 14L40 26L56 9L72 26L88 14L96 32"
        stroke="rgba(244,239,232,0.58)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 38C40 34 74 34 108 37" stroke="#e53e38" strokeWidth="2" strokeLinecap="round" opacity="0.82" />
      <path d="M98 37V49M46 35V46" stroke="#e53e38" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="56" cy="4" r="1.8" fill="#e53e38" />
    </svg>
  );
}

/** Crisp modular barcode stamp rendered in world footers. */
export function VectorBarcodeStamp({ className = "rs-barcode-stamp" }: VectorProps) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 132 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        {BARCODE_BARS.map((bar, index) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={index % 4 === 0 ? 1 : 3}
            width={bar.width}
            height={index % 5 === 0 ? 19 : 15}
            fill={index % 9 === 0 ? "#e53e38" : "currentColor"}
          />
        ))}
      </svg>
      <span>RS-DX // 00-04</span>
    </div>
  );
}

/** Dual-channel oscilloscope vector graphic for telemetry HUD panels. */
export function TelemetryWaveformSvg({ className = "rs-waveform-svg" }: VectorProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0 28H220" stroke="rgba(244,239,232,0.12)" strokeWidth="1" strokeDasharray="3 4" />
      <path d="M55 6V50M110 6V50M165 6V50" stroke="rgba(244,239,232,0.08)" strokeWidth="1" />
      <path
        d="M2 29H24L31 15L38 41L46 21L53 31H74L81 9L88 47L96 19L103 32L112 27H134L141 12L149 44L157 22L164 30H186L194 18L202 36L210 28H218"
        stroke="#6fe2a2"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.88"
      />
      <path
        d="M2 35H42L49 27L56 38L64 31H98L106 16L113 43L121 25L128 34H162L170 21L177 39L185 29H218"
        stroke="#e53e38"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}
