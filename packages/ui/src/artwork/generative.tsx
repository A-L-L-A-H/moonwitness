// Moonwitness Artwork System -- Generative Art
// Procedural generation: constellations, halftone fields, noise textures, brush strokes

import React from 'react';

interface GenerativeProps {
  width?: number;
  height?: number;
  seed?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Seeded random number generator
 */
function mulberry32(a: number): () => number {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Constellation - connected stars forming patterns
 */
export function Constellation({
  width = 400,
  height = 300,
  seed = Date.now(),
  starCount = 30,
  connectionDistance = 120,
  className = '',
  style = {},
}: GenerativeProps & { starCount?: number; connectionDistance?: number }) {
  const rand = mulberry32(seed);
  const stars: { x: number; y: number; size: number }[] = [];

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: rand() * width,
      y: rand() * height,
      size: 1 + rand() * 2,
    });
  }

  const connections: { from: number; to: number }[] = [];
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dx = stars[i].x - stars[j].x;
      const dy = stars[i].y - stars[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < connectionDistance && rand() < 0.3) {
        connections.push({ from: i, to: j });
      }
    }
  }

  return (
    <svg width={width} height={height} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="transparent" />
      {connections.map((conn, idx) => (
        <line
          key={idx}
          x1={stars[conn.from].x}
          y1={stars[conn.from].y}
          x2={stars[conn.to].x}
          y2={stars[conn.to].y}
          stroke="var(--pink)"
          strokeWidth="0.5"
          strokeDasharray="2,3"
          opacity="0.4"
          filter="url(#glow)"
        />
      ))}
      {stars.map((star, idx) => (
        <circle
          key={idx}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="var(--pink)"
          opacity={0.6 + rand() * 0.4}
          filter="url(#glow)"
        />
      ))}
    </svg>
  );
}

/**
 * HalftoneField - procedural halftone pattern
 */
export function HalftoneField({
  width = 400,
  height = 300,
  seed = Date.now(),
  dotSize = 2,
  spacing = 8,
  color = 'var(--pink)',
  opacity = 0.15,
  className = '',
  style = {},
}: GenerativeProps & { dotSize?: number; spacing?: number; color?: string; opacity?: number }) {
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const rand = mulberry32(seed);

  const dots: { x: number; y: number; size: number; opacity: number }[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * spacing + (rand() - 0.5) * spacing * 0.3;
      const y = row * spacing + (rand() - 0.5) * spacing * 0.3;
      const size = dotSize * (0.5 + rand() * 0.8);
      const dotOpacity = opacity * (0.5 + rand() * 0.5);
      dots.push({ x, y, size, opacity: dotOpacity });
    }
  }

  return (
    <svg width={width} height={height} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent" />
      {dots.map((dot, idx) => (
        <circle
          key={idx}
          cx={dot.x}
          cy={dot.y}
          r={dot.size}
          fill={color}
          opacity={dot.opacity}
        />
      ))}
    </svg>
  );
}

/**
 * NoiseTexture - Perlin-like noise texture
 */
export function NoiseTexture({
  width = 400,
  height = 300,
  seed = Date.now(),
  scale = 0.01,
  octaves = 4,
  persistence = 0.5,
  className = '',
  style = {},
}: GenerativeProps & { scale?: number; octaves?: number; persistence?: number }) {
  // Generate noise as a data URL
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return null;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  const rand = mulberry32(seed);

  // Simple value noise
  const data = imageData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = scale;

      for (let o = 0; o < octaves; o++) {
        const sampleX = x * frequency;
        const sampleY = y * frequency;
        // Simple hash-based noise
        const n = Math.sin(sampleX * 12.9898 + sampleY * 78.233) * 43758.5453;
        value += (n - Math.floor(n)) * amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }

      const idx = (y * width + x) * 4;
      const v = Math.floor(value * 255);
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 64; // Low alpha for overlay
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');

  return (
    <svg width={width} height={height} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent" />
      <image href={dataUrl} width="100%" height="100%" opacity="0.3" />
    </svg>
  );
}

/**
 * BrushStroke - organic brush stroke path
 */
export function BrushStroke({
  width = 400,
  height = 100,
  seed = Date.now(),
  points = 8,
  color = 'var(--yellow)',
  strokeWidth = 3,
  className = '',
  style = {},
}: GenerativeProps & { points?: number; color?: string; strokeWidth?: number }) {
  const rand = mulberry32(seed);
  const pathPoints: { x: number; y: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    const y = height / 2 + (rand() - 0.5) * height * 0.6;
    pathPoints.push({ x, y });
  }

  // Create smooth curve using quadratic Bezier
  let pathData = \M \ \;
  for (let i = 1; i < pathPoints.length - 1; i++) {
    const xc = (pathPoints[i].x + pathPoints[i + 1].x) / 2;
    const yc = (pathPoints[i].y + pathPoints[i + 1].y) / 2;
    pathData += \ Q \ \ \ \;
  }
  // Last point
  const last = pathPoints[pathPoints.length - 1];
  pathData += \ Q \ \ \ \;

  return (
    <svg width={width} height={height} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

/**
 * Splatter - ink splatter effect
 */
export function Splatter({
  width = 400,
  height = 300,
  seed = Date.now(),
  count = 50,
  color = 'var(--pink)',
  maxSize = 8,
  className = '',
  style = {},
}: GenerativeProps & { count?: number; color?: string; maxSize?: number }) {
  const rand = mulberry32(seed);
  const splats: { x: number; y: number; size: number; rotation: number }[] = [];

  for (let i = 0; i < count; i++) {
    splats.push({
      x: rand() * width,
      y: rand() * height,
      size: 1 + rand() * maxSize,
      rotation: rand() * 360,
    });
  }

  return (
    <svg width={width} height={height} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#splatterBlur)">
        {splats.map((splat, idx) => (
          <ellipse
            key={idx}
            cx={splat.x}
            cy={splat.y}
            rx={splat.size}
            ry={splat.size * (0.5 + rand() * 0.5)}
            fill={color}
            opacity={0.3 + rand() * 0.4}
            transform={otate(\ \ \)\}
          />
        ))}
      </g>
      <defs>
        <filter id="splatterBlur">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * GridDistortion - warped grid pattern
 */
export function GridDistortion({
  width = 400,
  height = 300,
  seed = Date.now(),
  cols = 10,
  rows = 8,
  distortion = 0.3,
  color = 'var(--blue)',
  strokeWidth = 0.5,
  className = '',
  style = {},
}: GenerativeProps & { cols?: number; rows?: number; distortion?: number; color?: string; strokeWidth?: number }) {
  const rand = mulberry32(seed);
  const cellW = width / cols;
  const cellH = height / rows;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  // Vertical lines
  for (let col = 0; col <= cols; col++) {
    let pathData = \M \ 0\;
    for (let row = 0; row <= rows; row++) {
      const x = col * cellW + (rand() - 0.5) * cellW * distortion;
      const y = row * cellH;
      if (row === 0) pathData = \M \ \;
      else pathData += \ L \ \;
    }
    lines.push({ pathData });
  }

  // Horizontal lines
  for (let row = 0; row <= rows; row++) {
    let pathData = \M 0 \;
    for (let col = 0; col <= cols; col++) {
      const x = col * cellW;
      const y = row * cellH + (rand() - 0.5) * cellH * distortion;
      if (col === 0) pathData = \M \ \;
      else pathData += \ L \ \;
    }
    lines.push({ pathData });
  }

  return (
    <svg width={width} height={height} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      {lines.map((line, idx) => (
        <path
          key={idx}
          d={line.pathData}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          opacity="0.4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
