"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  SIDRA_KNOWLEDGE_AXIOMS,
  WORLD_DOMAINS,
  type WorldDomainEntry,
  type WorldIdentifier,
} from "@/data/empire-registry";
import {
  ScrollChapterReveal,
  SpatialTiltCard,
  triggerSacredViewTransition,
} from "./motion-primitives";
import { DiamondStarOrnament, WorldEmblemById } from "./sacred-icons";
import { MeridianConstellationMapSvg, WorldChamberWatermarkSvg } from "./sacred-illustrations";

const QALAM_STORAGE_KEY = "allah-qalam-folios-v1";

const MOONWITNESS_MERIDIANS = [
  {
    code: "MERIDIAN 01",
    city: "Cairo",
    fullLabel: "Cairo · Al-Qāhirah",
    stats: "412 Verified Oral Chronicles",
    bearing: "30.0444° N · 31.2357° E",
    note: "Observatory of nocturnal lanterns preserving Mediterranean & Nile scholarly chains.",
    x: 68,
    y: 78,
  },
  {
    code: "MERIDIAN 02",
    city: "Samarkand",
    fullLabel: "Samarkand · Ulugh",
    stats: "289 Star Catalogue Folios",
    bearing: "39.6542° N · 66.9597° E",
    note: "High-precision celestial meridian sextant Tables illuminating Eurasian astronavigation.",
    x: 180,
    y: 48,
  },
  {
    code: "MERIDIAN 03",
    city: "Nusantara",
    fullLabel: "Nusantara · Archipelago",
    stats: "518 Maritime Witness Logs",
    bearing: "6.2088° S · 106.8456° E",
    note: "Equatorial ocean corridor uniting oral wisdom, calligraphy, and monsoon celestial navigation.",
    x: 292,
    y: 84,
  },
] as const;

const ROCKSOUL_PRESETS = [
  { label: "Octagram 8", points: 8, radius: 52, speed: 20 },
  { label: "Lote Rose 12", points: 12, radius: 62, speed: 28 },
  { label: "Crown 18", points: 18, radius: 74, speed: 38 },
] as const;

interface InscriptionEntry {
  readonly id: string;
  readonly authorTitle: string;
  readonly sealName: string;
  readonly bodyText: string;
  readonly cycleStamp: string;
}

const INITIAL_INSCRIPTIONS: readonly InscriptionEntry[] = [
  {
    id: "INSC-01",
    authorTitle: "Custodian of the Western Spire",
    sealName: "Al-Nūr · Light",
    bodyText:
      "Every line of code and every carved arch is a testimony of gratitude when crafted with precision and truth.",
    cycleStamp: "Cycle 1448 · Zenith",
  },
  {
    id: "INSC-02",
    authorTitle: "Chronicler of Sidra",
    sealName: "Al-Mīzān · Balance",
    bodyText:
      "Between silence and transmission lies geometry: the bridge connecting unseen wisdom to visible form.",
    cycleStamp: "Cycle 1448 · Dawn",
  },
];

const SACRED_SEALS = [
  "Al-Nūr · Light",
  "Al-Ḥikmah · Wisdom",
  "Al-Qalam · The Pen",
  "Al-Mīzān · Balance",
] as const;

const ARSY_FREQUENCIES = [
  { hz: 432, label: "432 Hz · Celestial Foundation", ratio: "1 : 1 Unison" },
  { hz: 528, label: "528 Hz · Scriptorium Resonance", ratio: "6 : 5 Minor Third" },
  { hz: 648, label: "648 Hz · Sovereign Fifth", ratio: "3 : 2 Perfect Fifth" },
  { hz: 864, label: "864 Hz · Zenith Octave", ratio: "2 : 1 Octave" },
] as const;

export function WorldsSanctum({
  activeWorldId,
  quietMode = false,
  onSelectWorld,
}: {
  readonly activeWorldId: WorldIdentifier;
  readonly quietMode?: boolean;
  readonly onSelectWorld: (worldId: WorldIdentifier) => void;
}) {
  const activeWorld: WorldDomainEntry =
    WORLD_DOMAINS.find((domain) => domain.id === activeWorldId) ?? WORLD_DOMAINS[0]!;

  // Moonwitness / Artifact state
  const [selectedArtifactCode, setSelectedArtifactCode] = useState<string>(
    activeWorld.artifacts[0]?.code ?? "MW-0114",
  );
  const [activeMeridianIdx, setActiveMeridianIdx] = useState<number>(0);

  // Arsy Web Audio + Standing Wave Oscilloscope state
  const [activeFrequencyHz, setActiveFrequencyHz] = useState<number>(432);
  const [carrierPlaying, setCarrierPlaying] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const harmonicOscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const fifthGainRef = useRef<GainNode | null>(null);
  const arsyWaveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Qalam Scriptorium state + localStorage persistence
  const [inscriptions, setInscriptions] =
    useState<readonly InscriptionEntry[]>(INITIAL_INSCRIPTIONS);
  const [draftAuthor, setDraftAuthor] = useState<string>("");
  const [draftSeal, setDraftSeal] = useState<string>(SACRED_SEALS[0]);
  const [draftReflection, setDraftReflection] = useState<string>("");
  const [qalamHint, setQalamHint] = useState<string>("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(QALAM_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as InscriptionEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setInscriptions(parsed.slice(0, 24));
      }
    } catch {
      // Ignore storage errors in private contexts
    }
  }, []);

  // Sidra Knowledge Graph state
  const [selectedAxiomId, setSelectedAxiomId] = useState<string>(
    SIDRA_KNOWLEDGE_AXIOMS[0]?.id ?? "noor-optics",
  );

  // Rocksoul DX Generative Mandala state
  const [symmetryPoints, setSymmetryPoints] = useState<number>(12);
  const [orbitalRadiusRatio, setOrbitalRadiusRatio] = useState<number>(62);
  const [rotationSpeed, setRotationSpeed] = useState<number>(28);
  const rocksoulCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup Web Audio on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (harmonicOscRef.current) {
        harmonicOscRef.current.stop();
        harmonicOscRef.current.disconnect();
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  // Update frequency live if carrier is playing
  useEffect(() => {
    if (
      carrierPlaying &&
      oscillatorRef.current &&
      harmonicOscRef.current &&
      audioContextRef.current
    ) {
      const now = audioContextRef.current.currentTime;
      oscillatorRef.current.frequency.setTargetAtTime(activeFrequencyHz, now, 0.08);
      harmonicOscRef.current.frequency.setTargetAtTime(activeFrequencyHz * 1.5, now, 0.08);
    }
  }, [activeFrequencyHz, carrierPlaying]);

  const toggleArsyCarrier = () => {
    if (carrierPlaying) {
      const ctx = audioContextRef.current;
      if (ctx && gainNodeRef.current && fifthGainRef.current) {
        const stopAt = ctx.currentTime + 0.14;
        gainNodeRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
        fifthGainRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
        oscillatorRef.current?.stop(stopAt);
        harmonicOscRef.current?.stop(stopAt);
      } else {
        oscillatorRef.current?.stop();
        harmonicOscRef.current?.stop();
      }
      oscillatorRef.current = null;
      harmonicOscRef.current = null;
      setCarrierPlaying(false);
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioCtx();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.35);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    const primaryOsc = ctx.createOscillator();
    primaryOsc.type = "sine";
    primaryOsc.frequency.setValueAtTime(activeFrequencyHz, ctx.currentTime);
    primaryOsc.connect(masterGain);
    primaryOsc.start();
    oscillatorRef.current = primaryOsc;

    const fifthOsc = ctx.createOscillator();
    fifthOsc.type = "triangle";
    fifthOsc.frequency.setValueAtTime(activeFrequencyHz * 1.5, ctx.currentTime);
    const fifthGain = ctx.createGain();
    fifthGain.gain.setValueAtTime(0.001, ctx.currentTime);
    fifthGain.gain.exponentialRampToValueAtTime(0.016, ctx.currentTime + 0.35);
    fifthOsc.connect(fifthGain);
    fifthGain.connect(ctx.destination);
    fifthOsc.start();
    harmonicOscRef.current = fifthOsc;
    fifthGainRef.current = fifthGain;

    setCarrierPlaying(true);
  };

  // Arsy Harmonic Standing Wave Oscilloscope Canvas
  useEffect(() => {
    if (activeWorld.id !== "arsy") {
      return;
    }
    const canvas = arsyWaveCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animId = 0;
    let t = 0;

    const drawWave = () => {
      const staticOnly = quietMode || reducedMotionQuery.matches;
      if (!staticOnly) {
        t += carrierPlaying ? 0.055 : 0.018;
      }

      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;
      const freqFactor = activeFrequencyHz / 216;
      const amp = carrierPlaying ? h * 0.28 : h * 0.16;

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(223, 192, 123, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Primary sine + harmonic fifth superposition
      ctx.strokeStyle = carrierPlaying ? "rgba(255, 244, 210, 0.92)" : "rgba(223, 192, 123, 0.62)";
      ctx.lineWidth = carrierPlaying ? 1.8 : 1.25;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const nx = (x / w) * Math.PI * 2 * freqFactor;
        const y =
          midY -
          (Math.sin(nx + t) * 0.68 + Math.sin(nx * 1.5 - t * 1.2) * 0.32) *
            amp *
            Math.sin((x / w) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mirrored faint golden fifth harmonic envelope
      ctx.strokeStyle = "rgba(223, 192, 123, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const nx = (x / w) * Math.PI * 2 * (freqFactor * 1.5);
        const y = midY + Math.cos(nx - t * 0.9) * (amp * 0.65) * Math.sin((x / w) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (!staticOnly) {
        animId = window.requestAnimationFrame(drawWave);
      }
    };

    drawWave();
    return () => {
      window.cancelAnimationFrame(animId);
    };
  }, [activeWorld.id, activeFrequencyHz, carrierPlaying, quietMode]);

  // Rocksoul DX Sacred Geometry Canvas loop (with dual girih counter-rotation)
  useEffect(() => {
    if (activeWorld.id !== "rocksoul-dx") {
      return;
    }
    const canvas = rocksoulCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationId = 0;
    let phase = 0;

    const drawMandala = () => {
      const freezeMotion = quietMode || reducedMotionQuery.matches;
      if (!freezeMotion) {
        phase += rotationSpeed * 0.00045;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * (orbitalRadiusRatio / 185);

      ctx.clearRect(0, 0, width, height);

      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        4,
        centerX,
        centerY,
        baseRadius * 1.4,
      );
      radialGlow.addColorStop(0, "rgba(255, 241, 200, 0.26)");
      radialGlow.addColorStop(0.55, "rgba(214, 180, 108, 0.09)");
      radialGlow.addColorStop(1, "rgba(8, 10, 18, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Outer Girih Star Layer
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(phase);

      for (let i = 0; i < symmetryPoints; i += 1) {
        const angle = (i * Math.PI * 2) / symmetryPoints;
        ctx.save();
        ctx.rotate(angle);

        ctx.strokeStyle = "rgba(238, 208, 142, 0.58)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.ellipse(baseRadius * 0.48, 0, baseRadius * 0.48, baseRadius * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        const nextAngle = ((i + 2) * Math.PI * 2) / symmetryPoints;
        ctx.strokeStyle = "rgba(255, 244, 214, 0.36)";
        ctx.beginPath();
        ctx.moveTo(baseRadius, 0);
        ctx.lineTo(
          Math.cos(nextAngle - angle) * baseRadius,
          Math.sin(nextAngle - angle) * baseRadius,
        );
        ctx.stroke();

        ctx.restore();
      }

      ctx.strokeStyle = "rgba(248, 234, 198, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(214, 180, 108, 0.42)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Inner Counter-Rotating Rosette
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-phase * 0.7);
      const innerCount = Math.max(6, Math.floor(symmetryPoints / 2));
      for (let j = 0; j < innerCount; j += 1) {
        ctx.rotate((Math.PI * 2) / innerCount);
        ctx.strokeStyle = "rgba(255, 248, 230, 0.38)";
        ctx.lineWidth = 0.9;
        ctx.strokeRect(
          -baseRadius * 0.22,
          -baseRadius * 0.22,
          baseRadius * 0.44,
          baseRadius * 0.44,
        );
      }
      ctx.fillStyle = "rgba(255, 248, 230, 0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!freezeMotion) {
        animationId = window.requestAnimationFrame(drawMandala);
      }
    };

    drawMandala();
    return () => {
      window.cancelAnimationFrame(animationId);
    };
  }, [activeWorld.id, symmetryPoints, orbitalRadiusRatio, rotationSpeed, quietMode]);

  const handleInscribeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedText = draftReflection.trim();
    if (!trimmedText) {
      setQalamHint("Please write a reflection or word of gratitude before sealing.");
      return;
    }
    setQalamHint("");
    const nextNumber = inscriptions.length + 1;
    const newRecord: InscriptionEntry = {
      id: `INSC-${String(nextNumber).padStart(2, "0")}`,
      authorTitle: draftAuthor.trim() || "Sworn Witness of the Gate",
      sealName: draftSeal,
      bodyText: trimmedText,
      cycleStamp: "Cycle 1448 · Sealed Now",
    };
    const nextList = [newRecord, ...inscriptions];
    try {
      window.localStorage.setItem(QALAM_STORAGE_KEY, JSON.stringify(nextList));
    } catch {
      // Ignore storage failures
    }
    triggerSacredViewTransition(() => {
      setInscriptions(nextList);
      setDraftReflection("");
      setDraftAuthor("");
    }, quietMode);
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const next = WORLD_DOMAINS[(currentIndex + 1) % WORLD_DOMAINS.length];
      if (next) onSelectWorld(next.id);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prev = WORLD_DOMAINS[(currentIndex - 1 + WORLD_DOMAINS.length) % WORLD_DOMAINS.length];
      if (prev) onSelectWorld(prev.id);
    }
  };

  const selectedAxiom =
    SIDRA_KNOWLEDGE_AXIOMS.find((axiom) => axiom.id === selectedAxiomId) ??
    SIDRA_KNOWLEDGE_AXIOMS[0]!;

  const selectedArtifact =
    activeWorld.artifacts.find((artifact) => artifact.code === selectedArtifactCode) ??
    activeWorld.artifacts[0]!;

  const activeMeridian = MOONWITNESS_MERIDIANS[activeMeridianIdx] ?? MOONWITNESS_MERIDIANS[0]!;

  return (
    <section
      id="the-worlds"
      aria-labelledby="worlds-heading"
      className="scroll-mt-16 relative border-t border-[#d6b46c]/25 bg-gradient-to-b from-[#05060a]/95 via-[#090b12]/90 to-[#05060a]/95 py-24 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="flex flex-col items-center text-center">
            <div className="font-monument flex items-center gap-4 text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
              <span>FIVE REALMS OF THE COVENANT</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
            </div>
            <h2
              id="worlds-heading"
              className="font-monument mt-4 text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
            >
              THE WORLDS OF LIGHT
            </h2>
            <p className="mt-3 max-w-2xl font-serif text-base sm:text-lg text-[#dfd6c3]/90 leading-relaxed">
              Five interconnected sanctuaries rising around the Central Gate—each dedicated to a
              noble pillar of witness, infrastructure, authorship, wisdom, and creation.
            </p>
          </div>
        </ScrollChapterReveal>

        {/* Five World Meridian Compass Strip with Optical Bus & Beveled Beacons */}
        <div className="relative mt-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-6 right-6 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#dfc07b]/40 to-transparent lg:block"
          />
          <div
            role="tablist"
            aria-label="Select a World Realm"
            className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {WORLD_DOMAINS.map((worldDomain, domainIndex) => {
              const isSelected = worldDomain.id === activeWorld.id;
              return (
                <SpatialTiltCard key={worldDomain.id} disabled={quietMode} maxTiltDeg={4}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onKeyDown={(event) => handleTabKeyDown(event, domainIndex)}
                    onClick={() => onSelectWorld(worldDomain.id)}
                    className={`portal-arch-card group relative flex h-full w-full min-h-[44px] flex-col items-center border px-4 pt-6 pb-5 text-center transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "border-[#fff4d2] bg-gradient-to-b from-[#d6b46c]/22 via-[#0f1422]/90 to-[#060911] shadow-[0_0_32px_rgba(223,192,123,0.22)]"
                        : "border-[#d6b46c]/25 bg-[#090c16]/85 hover:border-[#d6b46c]/55 hover:bg-[#d6b46c]/8"
                    }`}
                  >
                    <WorldEmblemById
                      worldId={worldDomain.id}
                      className={`h-11 w-11 transition-transform duration-300 ${
                        isSelected ? "scale-110" : "group-hover:scale-105"
                      }`}
                    />
                    <span className="font-monument mt-3 text-sm font-semibold tracking-[0.2em] text-[#f7ecd0]">
                      {worldDomain.name}
                    </span>
                    <span className="mt-1 font-sans text-[11px] tracking-[0.04em] text-[#cfc5b0]">
                      {worldDomain.tagline}
                    </span>
                    <span className="mt-2 font-mono text-[9.5px] tracking-[0.14em] text-[#dfc07b]/80">
                      {worldDomain.harmonicFrequency.split("·")[0]?.trim()}
                    </span>
                    {isSelected && (
                      <span className="mt-2.5 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-[#fff4d2] uppercase">
                        <DiamondStarOrnament className="h-3 w-3" /> Active Sanctum
                      </span>
                    )}
                  </button>
                </SpatialTiltCard>
              );
            })}
          </div>
        </div>

        {/* Active World Beveled Sanctum Chamber */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="octa-bevel-shell relative mt-10 overflow-hidden border border-[#d6b46c]/40 bg-gradient-to-br from-[#0a0d17]/95 via-[#070a12]/95 to-[#05060b] p-6 sm:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.84)]">
            <WorldChamberWatermarkSvg worldId={activeWorld.id} />

            {/* Architectural Meridian & Harmonic Resonance 3-Col Strip */}
            <div className="mb-8 grid grid-cols-1 gap-2 border-b border-[#d6b46c]/20 pb-4 text-[11px] font-mono tracking-[0.12em] text-[#dfc07b] uppercase md:grid-cols-3 md:items-center">
              <span>CHAMBER // {activeWorld.citadelSector}</span>
              <span className="text-[#e6decb] md:text-center">{activeWorld.primaryDirective}</span>
              <span className="md:text-right">RESONANCE // {activeWorld.harmonicFrequency}</span>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              {/* Left Column: Architectural Overview & Artifacts */}
              <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#d6b46c]/20 pb-8 lg:pb-0 lg:pr-8">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono tracking-[0.2em] text-[#d6b46c] uppercase">
                      {activeWorld.citadelSector}
                    </span>
                    <span className="rounded-full border border-[#d6b46c]/40 bg-[#d6b46c]/10 px-3 py-0.5 text-[11px] font-mono tracking-[0.15em] text-[#f8eac6]">
                      {activeWorld.statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <WorldEmblemById worldId={activeWorld.id} className="h-14 w-14 shrink-0" />
                    <div>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h3 className="font-monument text-2xl sm:text-3xl tracking-[0.16em] text-[#fff6df]">
                          {activeWorld.name}
                        </h3>
                        <span dir="rtl" lang="ar" className="text-xl text-[#d6b46c]/95">
                          {activeWorld.arabicEpithet}
                        </span>
                      </div>
                      <p className="text-xs font-mono tracking-[0.14em] text-[#bfb59e] uppercase mt-1">
                        {activeWorld.transliteration} · {activeWorld.harmonicFrequency}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 font-serif text-base leading-relaxed text-[#eae2d1]">
                    {activeWorld.architecturalDescription}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {activeWorld.pillars.map((pillarLabel) => (
                      <span
                        key={pillarLabel}
                        className="border border-[#d6b46c]/30 bg-[#111524] px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-[#f3dfb2] uppercase"
                      >
                        {pillarLabel}
                      </span>
                    ))}
                    <span className="border border-[#d6b46c]/30 bg-[#d6b46c]/10 px-3 py-1 text-xs font-mono text-[#f8eac6]">
                      {activeWorld.activeWitnessCount}
                    </span>
                  </div>
                </div>

                {/* Artifacts / Dispatches Selector */}
                <div className="mt-8">
                  <p className="font-mono text-xs tracking-[0.22em] text-[#d6b46c] uppercase mb-3">
                    SANCTUARY CODICES & DISPATCHES
                  </p>
                  <div className="space-y-2.5">
                    {activeWorld.artifacts.map((artifactRecord) => {
                      const isCurrentArtifact = artifactRecord.code === selectedArtifact.code;
                      return (
                        <button
                          key={artifactRecord.code}
                          type="button"
                          onClick={() =>
                            triggerSacredViewTransition(() => {
                              setSelectedArtifactCode(artifactRecord.code);
                            }, quietMode)
                          }
                          className={`w-full min-h-[44px] text-left p-3.5 border transition-colors cursor-pointer ${
                            isCurrentArtifact
                              ? "border-[#e6c987] bg-[#d6b46c]/14"
                              : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/45"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-[#d6b46c]">
                            <span>{artifactRecord.code}</span>
                            <span>{artifactRecord.timestampLabel}</span>
                          </div>
                          <div className="font-monument mt-1 text-sm font-medium tracking-[0.06em] text-[#fff6df]">
                            {artifactRecord.title}
                          </div>
                          <div className="mt-0.5 font-sans text-xs text-[#cfc5b0]">
                            {artifactRecord.classification}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: World-Specific Interactive Instrument */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                {/* Highlighted Artifact Reader Banner */}
                <div className="border border-[#d6b46c]/30 bg-gradient-to-r from-[#121626] via-[#15192b] to-[#101320] p-5">
                  <div className="flex items-center justify-between text-xs font-mono text-[#e6c987]">
                    <span>SELECTED RECORD // {selectedArtifact.code}</span>
                    <span>{selectedArtifact.classification}</span>
                  </div>
                  <h4 className="font-monument mt-2 text-lg sm:text-xl tracking-[0.08em] text-[#fff8e6]">
                    {selectedArtifact.title}
                  </h4>
                  <p className="mt-2 font-serif text-sm sm:text-base leading-relaxed text-[#e6decb]">
                    {selectedArtifact.summary}
                  </p>
                </div>

                {/* Interactive Console per World */}
                <div className="mt-6 flex-1 border border-[#d6b46c]/25 bg-[#06080f] p-6">
                  {activeWorld.id === "moonwitness" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-monument text-sm tracking-[0.18em] text-[#f5e3b8] uppercase">
                          MOONWITNESS MERIDIAN OBSERVATORY
                        </span>
                        <span className="font-mono text-xs text-[#d6b46c]">ORBITAL SYNC: 100%</span>
                      </div>
                      <p className="mt-3 font-sans text-xs text-[#cfc5b0]">
                        Select an observatory meridian to inspect witness corridors linking human
                        testimony across regions under the same sky:
                      </p>

                      <div className="mt-4">
                        <MeridianConstellationMapSvg
                          meridians={MOONWITNESS_MERIDIANS}
                          activeIndex={activeMeridianIdx}
                          onSelectMeridian={setActiveMeridianIdx}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {MOONWITNESS_MERIDIANS.map((meridian, idx) => {
                          const selected = idx === activeMeridianIdx;
                          return (
                            <button
                              key={meridian.code}
                              type="button"
                              onClick={() => setActiveMeridianIdx(idx)}
                              className={`min-h-[44px] border p-3.5 text-left transition-colors cursor-pointer ${
                                selected
                                  ? "border-[#e6c987] bg-[#d6b46c]/14"
                                  : "border-[#d6b46c]/25 bg-[#0c0f1a] hover:border-[#d6b46c]/55"
                              }`}
                            >
                              <div className="text-[11px] font-mono text-[#d6b46c]">
                                {meridian.code}
                              </div>
                              <div className="font-monument mt-1 text-sm text-[#fff6df]">
                                {meridian.fullLabel}
                              </div>
                              <div className="mt-1 font-sans text-xs text-[#cfc5b0]">
                                {meridian.stats}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 border border-[#d6b46c]/20 bg-[#0b0e18] p-3.5">
                        <div className="flex flex-wrap items-center justify-between font-mono text-[10px] text-[#dfc07b]">
                          <span>{activeMeridian.fullLabel}</span>
                          <span>{activeMeridian.bearing}</span>
                        </div>
                        <p className="mt-1.5 font-serif text-sm text-[#e6decb]">
                          {activeMeridian.note}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeWorld.id === "arsy" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-monument text-sm tracking-[0.18em] text-[#f5e3b8] uppercase">
                          ARSY HARMONIC CARRIER SYNTHESIZER
                        </span>
                        <button
                          type="button"
                          onClick={toggleArsyCarrier}
                          className={`min-h-[44px] px-4 py-1.5 text-xs font-mono tracking-[0.18em] uppercase border transition-all cursor-pointer ${
                            carrierPlaying
                              ? "border-[#fff2c6] bg-[#d6b46c] text-[#05060a] font-semibold"
                              : "border-[#d6b46c] bg-[#d6b46c]/15 text-[#f8eac6] hover:bg-[#d6b46c]/30"
                          }`}
                        >
                          {carrierPlaying ? "■ MUTE HARMONIC STREAM" : "▶ ENGAGE CARRIER TONE"}
                        </button>
                      </div>

                      <div className="mt-4 border border-[#d6b46c]/20 bg-[#05070e] p-2">
                        <canvas
                          ref={arsyWaveCanvasRef}
                          width={560}
                          height={92}
                          className="h-20 w-full"
                          aria-label="Real-time harmonic standing wave visualizer"
                        />
                      </div>

                      <p className="mt-3 font-sans text-xs text-[#cfc5b0]">
                        Select an acoustic carrier frequency to tune the Sovereign Relay Array:
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {ARSY_FREQUENCIES.map((freqOption) => {
                          const isSelectedFreq = freqOption.hz === activeFrequencyHz;
                          return (
                            <button
                              key={freqOption.hz}
                              type="button"
                              onClick={() => setActiveFrequencyHz(freqOption.hz)}
                              className={`min-h-[44px] p-3.5 text-left border transition-colors cursor-pointer ${
                                isSelectedFreq
                                  ? "border-[#e6c987] bg-[#d6b46c]/20"
                                  : "border-[#d6b46c]/20 bg-[#0b0e18] hover:border-[#d6b46c]/45"
                              }`}
                            >
                              <div className="font-mono text-sm font-semibold text-[#fff6df]">
                                {freqOption.label}
                              </div>
                              <div className="mt-1 text-xs font-mono text-[#d6b46c]">
                                Harmonic Interval: {freqOption.ratio}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeWorld.id === "qalam" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-monument text-sm tracking-[0.18em] text-[#f5e3b8] uppercase">
                          QALAM SANCTUARY SCRIPTORIUM
                        </span>
                        <span className="font-mono text-xs text-[#d6b46c]">
                          {inscriptions.length} FOLIOS SEALED
                        </span>
                      </div>

                      <form onSubmit={handleInscribeSubmit} className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="qalam-author-input"
                              className="block text-[11px] font-mono tracking-[0.15em] text-[#d6b46c] uppercase"
                            >
                              Scribe Designation
                            </label>
                            <input
                              id="qalam-author-input"
                              type="text"
                              value={draftAuthor}
                              onChange={(e) => setDraftAuthor(e.target.value)}
                              placeholder="e.g. Traveler of the Gate"
                              className="font-sans mt-1 min-h-[44px] w-full border border-[#d6b46c]/35 bg-[#0c0f1a] px-3 py-2 text-sm text-[#fff6df] placeholder-[#9f9580] focus:border-[#f8eac6] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="qalam-seal-select"
                              className="block text-[11px] font-mono tracking-[0.15em] text-[#d6b46c] uppercase"
                            >
                              Sacred Seal
                            </label>
                            <select
                              id="qalam-seal-select"
                              value={draftSeal}
                              onChange={(e) => setDraftSeal(e.target.value)}
                              className="font-sans mt-1 min-h-[44px] w-full border border-[#d6b46c]/35 bg-[#0c0f1a] px-3 py-2 text-sm text-[#fff6df] focus:border-[#f8eac6] focus:outline-none"
                            >
                              {SACRED_SEALS.map((sealOption) => (
                                <option key={sealOption} value={sealOption}>
                                  {sealOption}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="qalam-reflection-input"
                            className="block text-[11px] font-mono tracking-[0.15em] text-[#d6b46c] uppercase"
                          >
                            Luminous Inscription
                          </label>
                          <textarea
                            id="qalam-reflection-input"
                            rows={2}
                            value={draftReflection}
                            onChange={(e) => {
                              setDraftReflection(e.target.value);
                              if (qalamHint) setQalamHint("");
                            }}
                            placeholder="Inscribe a word of wisdom, gratitude, or architectural vision..."
                            className="font-serif mt-1 w-full border border-[#d6b46c]/35 bg-[#0c0f1a] px-3 py-2 text-sm text-[#fff6df] placeholder-[#9f9580] focus:border-[#f8eac6] focus:outline-none"
                          />
                        </div>
                        {qalamHint && (
                          <p role="alert" className="font-mono text-xs text-[#ffcf99]">
                            {qalamHint}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="submit"
                            className="font-monument min-h-[44px] border border-[#e6c987] bg-[#d6b46c]/20 px-5 py-2 text-xs tracking-[0.2em] text-[#fff6df] uppercase hover:bg-[#d6b46c]/35 transition-colors cursor-pointer"
                          >
                            SEAL INSCRIPTION IN FOLIO
                          </button>
                          {inscriptions.length > INITIAL_INSCRIPTIONS.length && (
                            <button
                              type="button"
                              onClick={() => {
                                setInscriptions(INITIAL_INSCRIPTIONS);
                                try {
                                  window.localStorage.removeItem(QALAM_STORAGE_KEY);
                                } catch {
                                  // Ignore storage error
                                }
                              }}
                              className="min-h-[44px] border border-[#d6b46c]/25 px-3 py-1 font-mono text-[10px] text-[#bfb59e] uppercase hover:border-[#dfc07b] hover:text-[#fff6df] cursor-pointer"
                            >
                              RESTORE DEFAULTS
                            </button>
                          )}
                        </div>
                      </form>

                      <div className="mt-4 space-y-2.5 max-h-44 overflow-y-auto pr-1">
                        {inscriptions.map((entry) => (
                          <div
                            key={entry.id}
                            className="border border-[#d6b46c]/20 bg-[#0b0e18] p-3.5 text-xs"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#d6b46c]">
                              <span>
                                {entry.id} · {entry.authorTitle}
                              </span>
                              <span>{entry.sealName}</span>
                            </div>
                            <p className="mt-1.5 font-serif text-sm sm:text-base leading-relaxed text-[#f4efe4]">
                              “{entry.bodyText}”
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeWorld.id === "sidra" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-monument text-sm tracking-[0.18em] text-[#f5e3b8] uppercase">
                          SIDRA POLYHEDRAL KNOWLEDGE CONSTELLATION
                        </span>
                        <span className="font-mono text-xs text-[#d6b46c]">
                          {selectedAxiom.geometricRatio}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12 items-center">
                        <div className="sm:col-span-6">
                          <div
                            role="group"
                            aria-label="Sidra Knowledge Graph"
                            className="relative h-60 sm:h-64 w-full overflow-hidden border border-[#d6b46c]/30 bg-[#060912] shadow-[inset_0_0_28px_rgba(0,0,0,0.88)]"
                          >
                            <Image
                              src="/art/sidra-lote-constellation.png"
                              alt=""
                              fill
                              sizes="(max-width: 768px) 100vw, 480px"
                              className="object-cover opacity-90"
                            />
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_20%,rgba(6,9,18,0.68)_100%)]"
                            />
                            <svg
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 h-full w-full"
                            >
                              {SIDRA_KNOWLEDGE_AXIOMS.map((axiomNode) =>
                                axiomNode.connectedIds.map((targetId) => {
                                  const targetNode = SIDRA_KNOWLEDGE_AXIOMS.find(
                                    (candidate) => candidate.id === targetId,
                                  );
                                  if (!targetNode) {
                                    return null;
                                  }
                                  const isHighlighted =
                                    axiomNode.id === selectedAxiom.id ||
                                    targetNode.id === selectedAxiom.id;
                                  return (
                                    <line
                                      key={`${axiomNode.id}-${targetNode.id}`}
                                      x1={axiomNode.coordinateX}
                                      y1={axiomNode.coordinateY}
                                      x2={targetNode.coordinateX}
                                      y2={targetNode.coordinateY}
                                      stroke={isHighlighted ? "#fff4d2" : "#dfc07b"}
                                      strokeWidth={isHighlighted ? "0.7" : "0.35"}
                                      strokeOpacity={isHighlighted ? "0.75" : "0.24"}
                                    />
                                  );
                                }),
                              )}
                            </svg>

                            {SIDRA_KNOWLEDGE_AXIOMS.map((axiomNode) => {
                              const isCurrent = axiomNode.id === selectedAxiom.id;
                              const placePillAbove = axiomNode.id === "noor-optics";
                              return (
                                <button
                                  key={axiomNode.id}
                                  type="button"
                                  aria-label={`Inspect ${axiomNode.title}`}
                                  aria-pressed={isCurrent}
                                  onClick={() => setSelectedAxiomId(axiomNode.id)}
                                  style={{
                                    left: `${axiomNode.coordinateX}%`,
                                    top: `${axiomNode.coordinateY}%`,
                                  }}
                                  className="group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center focus:outline-none cursor-pointer"
                                >
                                  <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-300 ${
                                      isCurrent
                                        ? "scale-125 border-[#fff8e6] bg-[#fff4d2] shadow-[0_0_16px_rgba(255,244,210,0.95)]"
                                        : "border-[#060912] bg-[#d6b46c] shadow-[0_0_8px_rgba(223,192,123,0.55)] group-hover:scale-110 group-hover:bg-[#fff4d2]"
                                    }`}
                                  />
                                  <span
                                    className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-serif text-[10px] tracking-[0.04em] backdrop-blur-sm transition-colors ${
                                      placePillAbove
                                        ? "bottom-[calc(50%+12px)]"
                                        : "top-[calc(50%+12px)]"
                                    } ${
                                      isCurrent
                                        ? "border-[#fff4d2]/75 bg-[#060912]/90 text-[#fff8e6]"
                                        : "border-[#d6b46c]/30 bg-[#060912]/80 text-[#f5e3b8] group-hover:border-[#f5dfa6]/60"
                                    }`}
                                  >
                                    {axiomNode.id === "qalam-codex"
                                      ? "Qalam"
                                      : axiomNode.title.split(" ")[0]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="sm:col-span-6 space-y-2.5">
                          <div className="text-xs font-mono text-[#d6b46c] uppercase">
                            {selectedAxiom.discipline}
                          </div>
                          <h5 className="font-monument text-lg text-[#fff6df]">
                            {selectedAxiom.title}
                          </h5>
                          <p className="font-serif text-sm leading-relaxed text-[#e6decb]">
                            {selectedAxiom.exposition}
                          </p>
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {SIDRA_KNOWLEDGE_AXIOMS.map((axiomItem) => (
                              <button
                                key={axiomItem.id}
                                type="button"
                                onClick={() => setSelectedAxiomId(axiomItem.id)}
                                className={`min-h-[44px] px-3 py-1.5 text-[11px] font-mono border cursor-pointer transition-colors ${
                                  axiomItem.id === selectedAxiom.id
                                    ? "border-[#f5e3b8] bg-[#d6b46c]/25 text-[#fff6df]"
                                    : "border-[#d6b46c]/25 text-[#bfb59e] hover:border-[#d6b46c]/55"
                                }`}
                              >
                                {axiomItem.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeWorld.id === "rocksoul-dx" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-monument text-sm tracking-[0.18em] text-[#f5e3b8] uppercase">
                          ROCKSOUL DX · ASTROLABE DREAMFORGE ENGINE
                        </span>
                        <span className="font-mono text-xs text-[#d6b46c]">
                          {symmetryPoints}-FOLD GIRIH SYMMETRY
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-12 items-center">
                        <div className="sm:col-span-6 flex justify-center">
                          <canvas
                            ref={rocksoulCanvasRef}
                            width={440}
                            height={320}
                            aria-label="Rocksoul DX Generative Mandala Studio Canvas"
                            className="h-52 w-full max-w-[280px] border border-[#d6b46c]/25 bg-[#05070e]"
                          />
                        </div>
                        <div className="sm:col-span-6 space-y-4">
                          <div className="flex flex-wrap gap-1.5">
                            {ROCKSOUL_PRESETS.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  setSymmetryPoints(preset.points);
                                  setOrbitalRadiusRatio(preset.radius);
                                  setRotationSpeed(preset.speed);
                                }}
                                className={`min-h-[44px] border px-3 py-1.5 font-mono text-[10px] uppercase cursor-pointer transition-colors ${
                                  symmetryPoints === preset.points &&
                                  orbitalRadiusRatio === preset.radius
                                    ? "border-[#fff4d2] bg-[#d6b46c]/25 text-[#fff8e6]"
                                    : "border-[#d6b46c]/25 text-[#cfc5b0] hover:border-[#d6b46c]/60"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-mono text-[#e6c987]">
                              <label htmlFor="symmetry-slider">Symmetry Fold</label>
                              <span>{symmetryPoints} Points</span>
                            </div>
                            <input
                              id="symmetry-slider"
                              type="range"
                              min={6}
                              max={24}
                              step={2}
                              value={symmetryPoints}
                              onChange={(e) => setSymmetryPoints(Number(e.target.value))}
                              className="mt-1 w-full accent-[#d6b46c]"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-mono text-[#e6c987]">
                              <label htmlFor="radius-slider">Harmonic Aperture</label>
                              <span>{orbitalRadiusRatio}%</span>
                            </div>
                            <input
                              id="radius-slider"
                              type="range"
                              min={35}
                              max={80}
                              value={orbitalRadiusRatio}
                              onChange={(e) => setOrbitalRadiusRatio(Number(e.target.value))}
                              className="mt-1 w-full accent-[#d6b46c]"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-mono text-[#e6c987]">
                              <label htmlFor="velocity-slider">Sidereal Velocity</label>
                              <span>{rotationSpeed} rad/s</span>
                            </div>
                            <input
                              id="velocity-slider"
                              type="range"
                              min={0}
                              max={80}
                              value={rotationSpeed}
                              onChange={(e) => setRotationSpeed(Number(e.target.value))}
                              className="mt-1 w-full accent-[#d6b46c]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollChapterReveal>
      </div>
    </section>
  );
}
