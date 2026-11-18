"use client";

import { useMemo } from "react";
import type { MasterDnaId } from "../skin/dna-worlds";
import { type SkinName, useSkin } from "../skin";
import { cn } from "../cn";
import {
  generateBrushStroke,
  generateConstellation,
  generateGridDistortion,
  generateHalftoneField,
  generateSplatter,
} from "./generative";

export interface SkinBackdropProps {
  skin?: SkinName;
  dnaId?: MasterDnaId;
  seed?: number;
  className?: string;
}

function hashSeed(base: number, skin: string, dna: string): number {
  let hash = base | 0;
  const input = `${skin}:${dna}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) + 1;
}

export function SkinBackdrop({
  skin: skinProp,
  dnaId: dnaProp,
  seed = 1337,
  className,
}: SkinBackdropProps) {
  const ctx = useSkin();
  const skin = skinProp ?? ctx.skin;
  const dnaId = dnaProp ?? ctx.dnaId;

  const numericSeed = useMemo(() => hashSeed(seed, skin, dnaId), [seed, skin, dnaId]);

  const geometry = useMemo(() => {
    const constellation = generateConstellation({
      seed: numericSeed,
      starCount: skin === "transmission" ? 24 : 18,
      connectionDistance: 28,
    });
    const halftone = generateHalftoneField({
      seed: numericSeed + 7,
      dotSize: skin === "riot" ? 2.2 : 1.4,
      spacing: skin === "riot" ? 10 : 12,
    });
    const grid = generateGridDistortion({
      seed: numericSeed + 13,
      cols: 10,
      rows: 6,
      distortion: skin === "technical" ? 1.5 : skin === "transmission" ? 5 : 0.6,
    });
    const stroke = generateBrushStroke({
      seed: numericSeed + 23,
      points: 8,
    });
    const splatter = generateSplatter({
      seed: numericSeed + 31,
      count: skin === "riot" ? 14 : 6,
      maxSize: 5,
    });

    return { constellation, halftone, grid, stroke, splatter };
  }, [numericSeed, skin]);

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      data-mw-backdrop="true"
      data-mw-backdrop-skin={skin}
      data-mw-backdrop-dna={dnaId}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full overflow-hidden select-none opacity-35",
        className,
      )}
      fill="none"
    >
      {skin === "default" && (
        <g>
          {geometry.constellation.connections.map((edge, idx) => {
            const a = geometry.constellation.stars[edge.from];
            const b = geometry.constellation.stars[edge.to];
            if (!a || !b) return null;
            return (
              <line
                key={idx}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--primary)"
                strokeOpacity="0.28"
                strokeWidth="0.28"
              />
            );
          })}
          {geometry.constellation.stars.map((star, idx) => (
            <circle
              key={idx}
              cx={star.x}
              cy={star.y}
              r={Math.max(0.35, star.size * 0.25)}
              fill={idx % 3 === 0 ? "var(--secondary, var(--primary))" : "var(--foreground)"}
              fillOpacity="0.45"
            />
          ))}
        </g>
      )}

      {skin === "riot" && (
        <g>
          {geometry.halftone.slice(0, 80).map((dot, idx) => (
            <circle
              key={idx}
              cx={dot.x}
              cy={dot.y}
              r={dot.size * 0.28}
              fill="var(--primary)"
              fillOpacity={Math.min(0.45, dot.opacity * 0.6)}
            />
          ))}
          {geometry.splatter.map((sp, idx) => (
            <rect
              key={`sp-${idx}`}
              x={sp.x}
              y={sp.y}
              width={sp.size * 0.7}
              height={sp.size * 0.7}
              fill="var(--secondary, var(--primary))"
              fillOpacity="0.35"
              transform={`rotate(${sp.rotation} ${sp.x} ${sp.y})`}
            />
          ))}
          <path
            d={geometry.stroke.pathData}
            stroke="var(--foreground)"
            strokeOpacity="0.2"
            strokeWidth="0.6"
          />
        </g>
      )}

      {(skin === "technical" || skin === "editorial") && (
        <g>
          {geometry.grid.map((line, idx) => {
            const pts = line.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
            return (
              <polyline
                key={idx}
                points={pts}
                stroke={idx % 4 === 0 ? "var(--primary)" : "var(--border)"}
                strokeOpacity={skin === "editorial" ? "0.28" : "0.42"}
                strokeWidth={skin === "editorial" ? "0.2" : "0.25"}
              />
            );
          })}
        </g>
      )}

      {skin === "archive" && (
        <g>
          {geometry.halftone.slice(0, 64).map((dot, idx) => (
            <circle
              key={idx}
              cx={dot.x}
              cy={dot.y}
              r={dot.size * 0.2}
              fill="var(--foreground)"
              fillOpacity="0.18"
            />
          ))}
          {geometry.grid.slice(0, 6).map((line, idx) => {
            const pts = line.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
            return (
              <polyline
                key={`arch-${idx}`}
                points={pts}
                stroke="var(--primary)"
                strokeOpacity="0.22"
                strokeWidth="0.2"
                strokeDasharray="1.5 1.5"
              />
            );
          })}
        </g>
      )}

      {skin === "transmission" && (
        <g>
          {geometry.grid.map((line, idx) => {
            const pts = line.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
            return (
              <polyline
                key={idx}
                points={pts}
                stroke="var(--primary)"
                strokeOpacity="0.32"
                strokeWidth="0.28"
              />
            );
          })}
          {geometry.constellation.stars.map((star, idx) => (
            <circle
              key={`tx-${idx}`}
              cx={star.x}
              cy={star.y}
              r={Math.max(0.4, star.size * 0.28)}
              fill="var(--secondary, var(--primary))"
              fillOpacity="0.55"
            />
          ))}
        </g>
      )}

      {skin === "sanctuary" && (
        <g>
          <circle cx="200" cy="150" r="105" stroke="var(--primary)" strokeOpacity="0.22" strokeWidth="0.4" />
          <circle cx="200" cy="150" r="68" stroke="var(--primary)" strokeOpacity="0.3" strokeWidth="0.35" strokeDasharray="3 3" />
          <polygon
            points="200,45 224,126 305,150 224,174 200,255 176,174 95,150 176,126"
            stroke="var(--primary)"
            strokeOpacity="0.26"
            strokeWidth="0.4"
          />
          {geometry.constellation.stars.slice(0, 12).map((star, idx) => (
            <circle
              key={`sanc-${idx}`}
              cx={star.x}
              cy={star.y}
              r={0.8}
              fill="var(--primary)"
              fillOpacity="0.45"
            />
          ))}
        </g>
      )}

      {skin === "brutalist" && (
        <g>
          {geometry.grid.slice(0, 4).map((line, idx) => (
            <line
              key={`brut-${idx}`}
              x1={0}
              y1={idx * 75 + 24}
              x2={400}
              y2={idx * 75 + 24}
              stroke="var(--border)"
              strokeOpacity="0.25"
              strokeWidth="1.2"
            />
          ))}
          <rect x="28" y="28" width="90" height="90" stroke="var(--primary)" strokeOpacity="0.22" strokeWidth="1.4" />
          <rect x="282" y="182" width="90" height="90" stroke="var(--border)" strokeOpacity="0.2" strokeWidth="1.4" />
        </g>
      )}

      {skin === "noir" && (
        <g>
          {Array.from({ length: 10 }, (_, idx) => (
            <rect
              key={`sprocket-l-${idx}`}
              x={8}
              y={10 + idx * 29}
              width={8}
              height={14}
              rx={1}
              fill="var(--foreground)"
              fillOpacity="0.18"
            />
          ))}
          {geometry.halftone.slice(0, 50).map((dot, idx) => (
            <circle
              key={`noir-${idx}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size * 0.16}
              fill="var(--primary)"
              fillOpacity="0.22"
            />
          ))}
        </g>
      )}

      {skin === "kinetic" && (
        <g>
          {geometry.splatter.map((sp, idx) => (
            <polygon
              key={`kin-${idx}`}
              points={`${sp.x},${sp.y} ${sp.x + sp.size * 2},${sp.y - sp.size} ${sp.x + sp.size},${sp.y + sp.size}`}
              fill={idx % 2 === 0 ? "var(--primary)" : "var(--accent)"}
              fillOpacity="0.34"
            />
          ))}
          <path
            d={geometry.stroke.pathData}
            stroke="var(--accent)"
            strokeOpacity="0.4"
            strokeWidth="0.9"
          />
        </g>
      )}
    </svg>
  );
}
