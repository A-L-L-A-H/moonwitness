import { useEffect, useRef, useState } from "react";
import {
  archiveSceneUrl,
  awakeningSceneUrl,
  riotdeckSceneUrl,
  signalSceneUrl,
  studioSceneUrl,
  thresholdSceneUrl,
} from "../../assets/art";

export type WorldDestination =
  | "awakening"
  | "archive"
  | "studio"
  | "riot-deck"
  | "signal-room"
  | "threshold";

export type IllustratedSceneKind =
  | "awakening"
  | "threshold"
  | "archive"
  | "studio"
  | "riot-deck"
  | "signal-room";

interface IllustratedStageProps {
  scene: IllustratedSceneKind;
  destination?: WorldDestination;
  reducedMotion: boolean;
  subtle?: boolean;
  className?: string;
}

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  kind: "ember" | "ash" | "mote";
}

interface SceneFocus {
  panX: string;
  panY: string;
  scale: number;
  accentColor: string;
  glowX: string;
}

const SCENE_IMAGES: Record<IllustratedSceneKind, string> = {
  awakening: awakeningSceneUrl,
  threshold: thresholdSceneUrl,
  archive: archiveSceneUrl,
  studio: studioSceneUrl,
  "riot-deck": riotdeckSceneUrl,
  "signal-room": signalSceneUrl,
};

const SCENE_FOCUS: Record<WorldDestination, SceneFocus> = {
  awakening: {
    panX: "0%",
    panY: "0%",
    scale: 1.04,
    accentColor: "rgba(229, 62, 56, 0.24)",
    glowX: "64%",
  },
  threshold: {
    panX: "0%",
    panY: "0%",
    scale: 1.03,
    accentColor: "rgba(229, 62, 56, 0.2)",
    glowX: "50%",
  },
  archive: {
    panX: "3.2%",
    panY: "0.8%",
    scale: 1.08,
    accentColor: "rgba(216, 169, 98, 0.24)",
    glowX: "16%",
  },
  studio: {
    panX: "1.4%",
    panY: "0.6%",
    scale: 1.08,
    accentColor: "rgba(232, 224, 214, 0.2)",
    glowX: "38%",
  },
  "riot-deck": {
    panX: "-1.6%",
    panY: "0.4%",
    scale: 1.09,
    accentColor: "rgba(229, 62, 56, 0.3)",
    glowX: "62%",
  },
  "signal-room": {
    panX: "-3.4%",
    panY: "0.8%",
    scale: 1.08,
    accentColor: "rgba(116, 168, 220, 0.22)",
    glowX: "84%",
  },
};

function createParticles(count: number, scene: IllustratedSceneKind): EmberParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = (index * 9301 + 49297) % 233280;
    const norm = seed / 233280;
    const kind: EmberParticle["kind"] =
      index % 5 === 0 ? "mote" : index % 2 === 0 ? "ember" : "ash";
    return {
      x: ((index * 173 + seed) % 1000) / 1000,
      y: ((index * 317 + seed * 3) % 1000) / 1000,
      vx: (norm - 0.5) * 0.00018,
      vy:
        kind === "ember"
          ? -(0.00028 + norm * 0.00038)
          : kind === "ash"
            ? -(0.00012 + norm * 0.0002)
            : (norm - 0.5) * 0.0001,
      size:
        kind === "mote"
          ? 2.2 + norm * 2.6
          : (scene === "awakening" ? 1.5 : 1.3) + norm * 1.9,
      alpha: kind === "mote" ? 0.16 + norm * 0.22 : 0.38 + norm * 0.52,
      phase: norm * Math.PI * 2,
      kind,
    };
  });
}

function usePageVisibility() {
  const [visible, setVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}

/**
 * Shared 2D artwork stage with pointer parallax, vignette veil, film grain,
 * and ambient ember/mote 2D canvas rendering across all world destinations.
 */
export function IllustratedStage({
  scene,
  destination,
  reducedMotion,
  subtle = false,
  className = "",
}: IllustratedStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = usePageVisibility();

  const resolvedDestination: WorldDestination = destination ?? scene;
  const focus = SCENE_FOCUS[resolvedDestination] ?? SCENE_FOCUS.threshold;
  const artworkSrc = SCENE_IMAGES[scene];

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion || subtle) {
      if (container) {
        container.style.setProperty("--px", "0px");
        container.style.setProperty("--py", "0px");
      }
      return;
    }

    let rafId = 0;
    let nextX = 0;
    let nextY = 0;

    const flush = () => {
      rafId = 0;
      container.style.setProperty("--px", `${nextX.toFixed(1)}px`);
      container.style.setProperty("--py", `${nextY.toFixed(1)}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      nextX = ((event.clientX / w) - 0.5) * -18;
      nextY = ((event.clientY / h) - 0.5) * -10;
      if (!rafId) rafId = window.requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion, subtle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = createParticles(subtle ? 36 : scene === "awakening" ? 68 : 76, scene);
    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || window.innerWidth || 1280;
      height = canvas.clientHeight || window.innerHeight || 720;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (now: number, dt: number) => {
      ctx.clearRect(0, 0, width, height);
      const opacityScale = subtle ? 0.45 : 1;

      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx * dt + Math.sin(now * 0.001 + p.phase) * 0.00004 * dt;
          p.y += p.vy * dt;
          if (p.y < -0.04) p.y = 1.04;
          if (p.y > 1.04) p.y = -0.04;
          if (p.x < -0.04) p.x = 1.04;
          if (p.x > 1.04) p.x = -0.04;
        }

        const px = p.x * width;
        const py = p.y * height;
        const pulse = reducedMotion ? 1 : 0.72 + Math.sin(now * 0.0024 + p.phase) * 0.28;
        const alpha = p.alpha * pulse * opacityScale;

        if (p.kind === "ember") {
          ctx.fillStyle = `rgba(255, 114, 92, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 1.45, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(255, 224, 178, ${(alpha * 0.85).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.7, p.size * 0.55), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "ash") {
          ctx.fillStyle = `rgba(229, 62, 56, ${(alpha * 0.75).toFixed(3)})`;
          ctx.fillRect(px, py, p.size * 1.1, p.size * 1.1);
        } else {
          ctx.fillStyle = `rgba(244, 239, 232, ${(alpha * 0.65).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    resize();
    drawFrame(lastTime, 0);

    const tick = (now: number) => {
      const dt = Math.min(48, Math.max(1, now - lastTime));
      lastTime = now;
      drawFrame(now, dt);
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("resize", resize);
    if (!reducedMotion && visible) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion, scene, subtle, visible]);

  return (
    <div
      ref={containerRef}
      className={`world-canvas${subtle ? " is-subtle" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      data-destination={resolvedDestination}
      data-scene={scene}
    >
      <div
        className="world-artwork-stage"
        style={{
          transform: subtle
            ? "scale(1.02)"
            : `translate3d(calc(${focus.panX} + var(--px, 0px)), calc(${focus.panY} + var(--py, 0px)), 0) scale(${focus.scale})`,
        }}
      >
        <img
          src={artworkSrc}
          alt=""
          className={`world-artwork-img${scene === "awakening" ? " is-awakening" : ""}`}
        />
      </div>
      <div
        className="world-atmosphere-veil"
        style={{
          background: subtle
            ? "radial-gradient(ellipse at 50% 30%, rgba(16, 10, 14, 0.74) 0%, rgba(7, 7, 10, 0.92) 78%), linear-gradient(180deg, rgba(7, 7, 10, 0.84) 0%, rgba(7, 7, 10, 0.94) 100%)"
            : `
                radial-gradient(circle at ${focus.glowX} 56%, ${focus.accentColor} 0%, transparent 44%),
                radial-gradient(ellipse at 20% 42%, rgba(7, 7, 10, 0.76) 0%, rgba(7, 7, 10, 0.22) 48%, rgba(7, 7, 10, 0.7) 100%),
                linear-gradient(180deg, rgba(7, 7, 10, 0.56) 0%, rgba(7, 7, 10, 0.1) 34%, rgba(7, 7, 10, 0.16) 66%, rgba(7, 7, 10, 0.88) 100%)
              `,
        }}
      />
      <div className="world-film-grain" />
      <canvas ref={canvasRef} className="world-particle-canvas" />
    </div>
  );
}
