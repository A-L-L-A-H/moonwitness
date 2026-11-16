import React from "react";
import {
  barcodeStampUrl,
  brushSlashUrl,
  emblemAnarchyUrl,
  emblemCrownUrl,
  sprayTagUrl,
  telemetryWaveUrl,
} from "../../assets/art";

export interface VectorProp {
  className?: string;
}

/**
 * Sovereign Crimson Crown Emblem — rendered PNG artwork plate.
 */
export function CrimsonCrownSvg({ className = "rs-crown-svg" }: VectorProp) {
  return (
    <img
      className={className}
      src={emblemCrownUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/**
 * Distress Crimson Brush Slash — rendered PNG dry-brush stroke plate.
 */
export function CrimsonBrushSlash({ className = "rs-brush-slash" }: VectorProp) {
  return (
    <img
      className={className}
      src={brushSlashUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/**
 * Anarchy Star / Chaos Sigil — rendered PNG seal plate.
 */
export function AnarchyStarSigil({ className = "rs-anarchy-sigil" }: VectorProp) {
  return (
    <img
      className={className}
      src={emblemAnarchyUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/**
 * Street Stencil Spray Tag — rendered PNG aerosol stencil & drips plate.
 */
export function SprayTagGlyph({ className = "rs-spray-glyph" }: VectorProp) {
  return (
    <img
      className={className}
      src={sprayTagUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/**
 * Editorial Barcode Stamp — rendered PNG metallic barcode plate + serial code.
 */
export function VectorBarcodeStamp({
  code = "RS-DX // 0049-LOCAL",
  className = "rs-barcode-stamp",
}: {
  code?: string;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <img
        className="rs-barcode-img"
        src={barcodeStampUrl}
        alt=""
        draggable={false}
      />
      <span>{code}</span>
    </div>
  );
}

/**
 * Signal Telemetry Waveform — rendered PNG dual-trace oscilloscope plate.
 */
export function TelemetryWaveformSvg({ className = "rs-waveform-svg" }: VectorProp) {
  return (
    <img
      className={className}
      src={telemetryWaveUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
