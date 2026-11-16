// Moonwitness Artwork System -- Generative Art (TypeScript only, no JSX)
// Procedural generation utilities for canvas/SVG rendering

interface GenerativeOptions {
  width?: number;
  height?: number;
  seed?: number;
}

/**
 * Seeded random number generator
 */
export function mulberry32(a: number): () => number {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate constellation points and connections
 */
export function generateConstellation(options: GenerativeOptions & { starCount?: number; connectionDistance?: number } = {}) {
  const { width = 400, height = 300, seed = Date.now(), starCount = 30, connectionDistance = 120 } = options;
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
    const starI = stars[i];
    if (!starI) continue;
    for (let j = i + 1; j < stars.length; j++) {
      const starJ = stars[j];
      if (!starJ) continue;
      const dx = starI.x - starJ.x;
      const dy = starI.y - starJ.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < connectionDistance && rand() < 0.3) {
        connections.push({ from: i, to: j });
      }
    }
  }

  return { stars, connections };
}

/**
 * Generate halftone field pattern
 */
export function generateHalftoneField(options: GenerativeOptions & { dotSize?: number; spacing?: number } = {}) {
  const { width = 400, height = 300, seed = Date.now(), dotSize = 2, spacing = 8 } = options;
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const rand = mulberry32(seed);

  const dots: { x: number; y: number; size: number; opacity: number }[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * spacing + (rand() - 0.5) * spacing * 0.3;
      const y = row * spacing + (rand() - 0.5) * spacing * 0.3;
      const size = dotSize * (0.5 + rand() * 0.8);
      const opacity = 0.15 * (0.5 + rand() * 0.5);
      dots.push({ x, y, size, opacity });
    }
  }

  return dots;
}

/**
 * Generate noise texture data
 */
export function generateNoiseTexture(options: GenerativeOptions & { scale?: number; octaves?: number } = {}) {
  const { width = 400, height = 300, scale = 0.01, octaves = 4 } = options;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = scale;

      for (let o = 0; o < octaves; o++) {
        const sampleX = x * frequency;
        const sampleY = y * frequency;
        const n = Math.sin(sampleX * 12.9898 + sampleY * 78.233) * 43758.5453;
        value += (n - Math.floor(n)) * amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }

      const idx = (y * width + x) * 4;
      const v = Math.floor(value * 255);
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 64;
    }
  }

  return { data, width, height };
}

/**
 * Generate brush stroke points
 */
export function generateBrushStroke(options: GenerativeOptions & { points?: number } = {}) {
  const { width = 400, height = 100, seed = Date.now(), points = 8 } = options;
  const rand = mulberry32(seed);
  const pathPoints: { x: number; y: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    const y = height / 2 + (rand() - 0.5) * height * 0.6;
    pathPoints.push({ x, y });
  }

  // Create smooth curve using quadratic Bezier
  const firstPoint = pathPoints[0];
  const lastPoint = pathPoints[pathPoints.length - 1];
  
  let pathData = 'M ' + firstPoint!.x + ' ' + firstPoint!.y;
  for (let i = 1; i < pathPoints.length - 1; i++) {
    const xc = (pathPoints[i]!.x + pathPoints[i + 1]!.x) / 2;
    const yc = (pathPoints[i]!.y + pathPoints[i + 1]!.y) / 2;
    pathData += ' Q ' + pathPoints[i]!.x + ' ' + pathPoints[i]!.y + ' ' + xc + ' ' + yc;
  }
  pathData += ' Q ' + lastPoint!.x + ' ' + lastPoint!.y + ' ' + lastPoint!.x + ' ' + lastPoint!.y;

  return { pathPoints, pathData };
}

/**
 * Generate splatter points
 */
export function generateSplatter(options: GenerativeOptions & { count?: number; maxSize?: number } = {}) {
  const { width = 400, height = 300, seed = Date.now(), count = 50, maxSize = 8 } = options;
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

  return splats;
}

/**
 * Generate distorted grid lines
 */
export function generateGridDistortion(options: GenerativeOptions & { cols?: number; rows?: number; distortion?: number } = {}) {
  const { width = 400, height = 300, seed = Date.now(), cols = 10, rows = 8, distortion = 0.3 } = options;
  const rand = mulberry32(seed);
  const cellW = width / cols;
  const cellH = height / rows;
  const lines: { points: { x: number; y: number }[]; orientation: string }[] = [];

  // Vertical lines
  for (let col = 0; col <= cols; col++) {
    const points: { x: number; y: number }[] = [];
    for (let row = 0; row <= rows; row++) {
      const x = col * cellW + (rand() - 0.5) * cellW * distortion;
      const y = row * cellH;
      points.push({ x, y });
    }
    lines.push({ points, orientation: 'vertical' });
  }

  // Horizontal lines
  for (let row = 0; row <= rows; row++) {
    const points: { x: number; y: number }[] = [];
    for (let col = 0; col <= cols; col++) {
      const x = col * cellW;
      const y = row * cellH + (rand() - 0.5) * cellH * distortion;
      points.push({ x, y });
    }
    lines.push({ points, orientation: 'horizontal' });
  }

  return lines;
}

