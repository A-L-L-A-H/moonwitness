"use client";

import { useEffect, useRef } from "react";

interface CelestialParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
  driftX: number;
  driftY: number;
  hueGold: boolean;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function CelestialCanvas({
  sanctuaryRadianceActive,
}: {
  readonly sanctuaryRadianceActive: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const ctx = canvasElement.getContext("2d");
    if (!ctx) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = (canvasElement.width = window.innerWidth);
    let height = (canvasElement.height = window.innerHeight);

    const particleCount = 88;
    const particles: CelestialParticle[] = Array.from({ length: particleCount }, (_, index) => {
      const inCenterColumn = index % 4 === 0;
      return {
        x: inCenterColumn
          ? width * (0.42 + ((index * 17) % 16) / 100)
          : ((index * 137.5) % 100) * (width / 100),
        y: ((index * 73.1) % 100) * (height / 100),
        radius: 0.6 + (index % 4) * 0.45,
        alpha: 0.25 + (index % 5) * 0.14,
        pulseSpeed: 0.012 + (index % 7) * 0.004,
        pulseOffset: index * 0.9,
        driftX: ((index % 3) - 1) * 0.08,
        driftY: inCenterColumn ? -0.22 - (index % 3) * 0.08 : -0.06,
        hueGold: index % 3 !== 0,
      };
    });

    const ripples: Ripple[] = [];

    let pointerX = width * 0.5;
    let pointerY = height * 0.52;

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const handlePointerDown = (event: PointerEvent) => {
      // In water or hero area, trigger a celestial expanding ring
      ripples.push({
        x: event.clientX,
        y: event.clientY,
        radius: 4,
        maxRadius: Math.min(width, height) * 0.35,
        alpha: 0.65,
      });
    };

    const handleResize = () => {
      if (!canvasRef.current) {
        return;
      }
      width = canvasRef.current.width = window.innerWidth;
      height = canvasRef.current.height = window.innerHeight;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("resize", handleResize);

    let frameId = 0;
    let tick = 0;

    const renderFrame = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      // Subtle central vertical light pillar shimmer
      const centerX = width * 0.5;
      const pillarGradient = ctx.createLinearGradient(centerX, height * 0.08, centerX, height * 0.72);
      const intensityMultiplier = sanctuaryRadianceActive ? 1.45 : 1.0;
      pillarGradient.addColorStop(0, `rgba(255, 244, 212, ${0.12 * intensityMultiplier})`);
      pillarGradient.addColorStop(0.5, `rgba(226, 191, 118, ${0.06 * intensityMultiplier})`);
      pillarGradient.addColorStop(1, `rgba(255, 232, 175, ${0.16 * intensityMultiplier})`);

      ctx.fillStyle = pillarGradient;
      ctx.fillRect(centerX - 2, height * 0.08, 4, height * 0.64);

      // Interactive pointer aura
      const auraGradient = ctx.createRadialGradient(
        pointerX,
        pointerY,
        2,
        pointerX,
        pointerY,
        180
      );
      auraGradient.addColorStop(0, `rgba(255, 240, 198, ${0.07 * intensityMultiplier})`);
      auraGradient.addColorStop(1, "rgba(255, 240, 198, 0)");
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, 180, 0, Math.PI * 2);
      ctx.fill();

      // Render interactive click ripples
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const ripple = ripples[i]!;
        ripple.radius += 3.2;
        ripple.alpha *= 0.96;

        ctx.strokeStyle = `rgba(255, 242, 204, ${ripple.alpha * 0.45})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Elliptical reflection if in bottom water realm
        if (ripple.y > height * 0.65) {
          ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.35, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        }
        ctx.stroke();

        if (ripple.radius >= ripple.maxRadius || ripple.alpha < 0.02) {
          ripples.splice(i, 1);
        }
      }

      // Twinkling celestial motes
      for (const particle of particles) {
        if (!reducedMotionQuery.matches) {
          particle.x += particle.driftX;
          particle.y += particle.driftY * (sanctuaryRadianceActive ? 1.5 : 1);

          if (particle.y < 0) {
            particle.y = height * 0.75;
          }
          if (particle.x < 0) {
            particle.x = width;
          } else if (particle.x > width) {
            particle.x = 0;
          }
        }

        const twinkle =
          0.45 + 0.55 * Math.sin(tick * particle.pulseSpeed + particle.pulseOffset);
        const currentAlpha = Math.min(1, particle.alpha * twinkle * intensityMultiplier);

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.hueGold
          ? `rgba(248, 226, 172, ${currentAlpha})`
          : `rgba(255, 252, 244, ${currentAlpha})`;
        ctx.fill();
      }

      if (!reducedMotionQuery.matches) {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [sanctuaryRadianceActive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
}
