"use client";

import { NativeSelect } from "@moonwitness/ui";
import { artPlateSrc } from "@/lib/art";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  DnaBadge,
  DnaChamber,
  IllustrationFrame,
  MotionReveal,
  SectionHeading,
  StorySection,
  WorldAtlas,
} from "@moonwitness/ui/imperium";
import {
  DX_MANGA_FOUR_PANELS,
  JERUSALEM_70CE_CASE_001,
  SRGBL_V8_STAGES,
  SYAFAAT_BASE_STATES,
} from "@/data/empire-canon-codex";
import {
  SIDRA_KNOWLEDGE_AXIOMS,
  WORLD_ART,
  WORLD_DOMAINS,
  type WorldDomainEntry,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { triggerSacredViewTransition } from "./motion-primitives";
import { WorldEmblemById } from "./sacred-icons";
import { MeridianConstellationMapSvg, WorldChamberWatermarkSvg } from "./sacred-illustrations";

const QALAM_STORAGE_KEY = "allah-qalam-folios-v1";

const MOONWITNESS_MERIDIANS = [
  {
    code: "MERIDIAN 01",
    city: "Cairo",
    fullLabel: "Cairo · Al-Qāhirah",
    stats: "Nile Witness Chain · Heritage Focus",
    bearing: "30.0444° N · 31.2357° E",
    note: "Observatory of nocturnal lanterns preserving Mediterranean & Nile scholarly chains.",
    x: 68,
    y: 78,
  },
  {
    code: "MERIDIAN 02",
    city: "Samarkand",
    fullLabel: "Samarkand · Ulugh",
    stats: "Meridian Sextant Table · Heritage Focus",
    bearing: "39.6542° N · 66.9597° E",
    note: "High-precision celestial meridian sextant tables illuminating Eurasian astronavigation.",
    x: 180,
    y: 48,
  },
  {
    code: "MERIDIAN 03",
    city: "Nusantara",
    fullLabel: "Nusantara · Archipelago",
    stats: "Maritime Oral Tradition · Heritage Focus",
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
  const { locale } = useSanctuaryLocale();
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

  // Crayon SRGBL stage + Angel With Shotgun gate inspection state
  const [selectedSrgblIdx, setSelectedSrgblIdx] = useState<number>(0);
  const [selectedAwsStageIdx, setSelectedAwsStageIdx] = useState<number>(0);

  const selectedAxiom =
    SIDRA_KNOWLEDGE_AXIOMS.find((axiom) => axiom.id === selectedAxiomId) ??
    SIDRA_KNOWLEDGE_AXIOMS[0]!;

  const selectedArtifact =
    activeWorld.artifacts.find((artifact) => artifact.code === selectedArtifactCode) ??
    activeWorld.artifacts[0]!;

  const activeMeridian = MOONWITNESS_MERIDIANS[activeMeridianIdx] ?? MOONWITNESS_MERIDIANS[0]!;
  const selectedSrgblStage = SRGBL_V8_STAGES[selectedSrgblIdx] ?? SRGBL_V8_STAGES[0]!;
  const AWS_GATES = [
    "SOURCE",
    "RULE",
    "JURISDICTION",
    "APPLICABILITY",
    "ARGUMENT",
    "REVIEW",
  ] as const;

  return (
    <StorySection
      id="the-worlds"
      labelledBy="worlds-heading"
      tone="surface"
      className="scroll-mt-16"
    >
      {/* Section Header */}
      <MotionReveal disabled={quietMode}>
        <SectionHeading
          id="worlds-heading"
          kicker={locale === "id" ? "SEMBILAN DUNIA EKOSISTEM" : "NINE WORLDS OF THE ECOSYSTEM"}
          title={locale === "id" ? "JELAJAHI SEMBILAN DUNIA" : "THE NINE WORLDS"}
          description={
            locale === "id"
              ? "Sembilan ruang karya terhubung mengelilingi Gerbang Utama—dari arsip kisah, siaran radio, kepenulisan, pengetahuan, permainan, hingga refleksi dan hukum."
              : "Nine interconnected destinations rising around the Central Gate—uniting archive storytelling, radio, writing, learning, play, prismatic study, reflection, mythos, and justice."
          }
          align="center"
        />
      </MotionReveal>

      {/* Nine Worlds Atlas Selector via @moonwitness/ui */}
      <div className="mt-10">
        <WorldAtlas
          ariaLabel="Select one of the Nine Worlds"
          activeId={activeWorld.id}
          onSelect={(id) => onSelectWorld(id as WorldIdentifier)}
          className="lg:grid-cols-3"
          items={WORLD_DOMAINS.map((worldDomain) => ({
            id: worldDomain.id,
            title: worldDomain.name,
            subtitle: worldDomain.tagline,
            statusLabel: worldDomain.statusLabel,
            emblem: <WorldEmblemById worldId={worldDomain.id} className="h-7 w-7" />,
          }))}
        />
      </div>

      {/* Active World Chamber */}
      <MotionReveal disabled={quietMode}>
        <DnaChamber className="mt-10 p-6 sm:p-10">
          <WorldChamberWatermarkSvg worldId={activeWorld.id} />

          {/* Meridian & Status Header Strip */}
          <div className="mb-8 grid grid-cols-1 gap-2 border-b border-[var(--dna-accent)]/25 pb-4 text-xs font-mono tracking-[0.08em] text-[var(--dna-accent)] uppercase md:grid-cols-3 md:items-center">
            <span>CHAMBER // {activeWorld.citadelSector}</span>
            <span className="text-[var(--dna-text)] md:text-center">
              {activeWorld.primaryDirective}
            </span>
            <span className="md:text-right">
              {activeWorld.canonicalAlias ?? activeWorld.harmonicFrequency}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Left Column: Architectural Overview & Artifacts */}
            <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--dna-accent)]/20 pb-8 lg:pb-0 lg:pr-8">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono tracking-[0.2em] text-[var(--dna-accent)] uppercase">
                    {activeWorld.citadelSector}
                  </span>
                  <span className="rounded-full border border-[var(--dna-accent)]/40 bg-[var(--dna-accent)]/10 px-3 py-0.5 text-[11px] font-mono tracking-[0.15em] text-[var(--dna-accent)]">
                    {activeWorld.statusLabel}
                  </span>
                </div>

                <div className="mt-4">
                  <IllustrationFrame
                    aspectRatio="worldTile"
                    scrim
                    className="border-2 border-[var(--brand-paper)] shadow-[4px_4px_0_var(--brand-pink)]"
                  >
                    <Image
                      src={WORLD_ART[activeWorld.id].src}
                      alt={WORLD_ART[activeWorld.id].subject}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </IllustrationFrame>
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <WorldEmblemById worldId={activeWorld.id} className="h-14 w-14 shrink-0" />
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="font-monument text-2xl sm:text-3xl tracking-[0.16em] text-[var(--dna-text)]">
                        {activeWorld.name}
                      </h3>
                      <span dir="rtl" lang="ar" className="text-xl text-[var(--dna-accent)]/95">
                        {activeWorld.arabicEpithet}
                      </span>
                    </div>
                    <p className="text-xs font-mono tracking-[0.14em] text-[var(--dna-muted)] uppercase mt-1">
                      {activeWorld.transliteration} · {activeWorld.harmonicFrequency}
                    </p>
                  </div>
                </div>

                <p className="mt-5 font-serif text-base leading-relaxed text-[var(--dna-text)]">
                  {activeWorld.architecturalDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {activeWorld.pillars.map((pillarLabel) => (
                    <span
                      key={pillarLabel}
                      className="border border-[var(--dna-accent)]/30 bg-[var(--dna-surface)] px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-[var(--dna-accent)] uppercase"
                    >
                      {pillarLabel}
                    </span>
                  ))}
                  <span className="border border-[var(--dna-accent)]/30 bg-[var(--dna-accent)]/10 px-3 py-1 text-xs font-mono text-[var(--dna-accent)]">
                    {activeWorld.summaryLabel}
                  </span>
                </div>
              </div>

              {/* Artifacts / Dispatches Selector */}
              <div className="mt-8">
                <p className="font-mono text-xs tracking-[0.22em] text-[var(--dna-accent)] uppercase mb-3">
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
                            ? "border-[var(--dna-accent)] bg-[var(--dna-accent)]/14"
                            : "border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] hover:border-[var(--dna-accent)]/45"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--dna-accent)]">
                          <span>{artifactRecord.code}</span>
                          <span>{artifactRecord.timestampLabel}</span>
                        </div>
                        <div className="font-monument mt-1 text-sm font-medium tracking-[0.06em] text-[var(--dna-text)]">
                          {artifactRecord.title}
                        </div>
                        <div className="mt-0.5 font-sans text-xs text-[var(--dna-muted)]">
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
              <div className="border border-[var(--dna-accent)]/30 bg-gradient-to-r from-[var(--dna-surface)] via-[var(--dna-surface-elevated)] to-[var(--dna-surface)] p-5">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--dna-accent)]">
                  <span>SELECTED RECORD // {selectedArtifact.code}</span>
                  <span>{selectedArtifact.classification}</span>
                </div>
                <h4 className="font-monument mt-2 text-lg sm:text-xl tracking-[0.08em] text-[var(--dna-text)]">
                  {selectedArtifact.title}
                </h4>
                <p className="mt-2 font-serif text-sm sm:text-base leading-relaxed text-[var(--dna-muted)]">
                  {selectedArtifact.summary}
                </p>
              </div>

              {/* Interactive Console per World */}
              <div className="mt-6 flex-1 border border-[var(--dna-accent)]/25 bg-[var(--dna-canvas)] p-6">
                {activeWorld.id === "moonwitness" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
                      <span className="font-monument text-sm tracking-[0.18em] text-[var(--dna-accent)] uppercase">
                        MOONWITNESS MERIDIAN OBSERVATORY
                      </span>
                      <span className="font-mono text-xs text-[var(--dna-accent)]">
                        ORBITAL SYNC: 100%
                      </span>
                    </div>
                    <p className="mt-3 font-sans text-xs text-[var(--dna-muted)]">
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
                                ? "border-[var(--dna-accent)] bg-[var(--dna-accent)]/14"
                                : "border-[var(--dna-accent)]/25 bg-[var(--dna-surface)] hover:border-[var(--dna-accent)]/55"
                            }`}
                          >
                            <div className="text-[11px] font-mono text-[var(--dna-accent)]">
                              {meridian.code}
                            </div>
                            <div className="font-monument mt-1 text-sm text-[var(--dna-text)]">
                              {meridian.fullLabel}
                            </div>
                            <div className="mt-1 font-sans text-xs text-[var(--dna-muted)]">
                              {meridian.stats}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-3.5">
                      <div className="flex flex-wrap items-center justify-between font-mono text-[10px] text-[var(--dna-accent)]">
                        <span>{activeMeridian.fullLabel}</span>
                        <span>{activeMeridian.bearing}</span>
                      </div>
                      <p className="mt-1.5 font-serif text-sm text-[var(--dna-muted)]">
                        {activeMeridian.note}
                      </p>
                    </div>
                  </div>
                )}

                {activeWorld.id === "arsy" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
                      <span className="font-monument text-sm tracking-[0.18em] text-[var(--dna-accent)] uppercase">
                        ARSY HARMONIC CARRIER SYNTHESIZER
                      </span>
                      <button
                        type="button"
                        onClick={toggleArsyCarrier}
                        className={`min-h-[44px] px-4 py-1.5 text-xs font-mono tracking-[0.18em] uppercase border transition-all cursor-pointer ${
                          carrierPlaying
                            ? "border-[var(--dna-accent)] bg-[var(--dna-accent)] text-[var(--dna-canvas)] font-semibold"
                            : "border-[var(--dna-accent)] bg-[var(--dna-accent)]/15 text-[var(--dna-accent)] hover:bg-[var(--dna-accent)]/30"
                        }`}
                      >
                        {carrierPlaying ? "■ MUTE HARMONIC STREAM" : "▶ ENGAGE CARRIER TONE"}
                      </button>
                    </div>

                    <div className="mt-4 border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-2">
                      <canvas
                        ref={arsyWaveCanvasRef}
                        width={560}
                        height={92}
                        className="h-20 w-full"
                        aria-label="Real-time harmonic standing wave visualizer"
                      />
                    </div>

                    <p className="mt-3 font-sans text-xs text-[var(--dna-muted)]">
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
                                ? "border-[var(--dna-accent)] bg-[var(--dna-accent)]/20"
                                : "border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] hover:border-[var(--dna-accent)]/45"
                            }`}
                          >
                            <div className="font-mono text-sm font-semibold text-[var(--dna-text)]">
                              {freqOption.label}
                            </div>
                            <div className="mt-1 text-xs font-mono text-[var(--dna-accent)]">
                              Harmonic Interval: {freqOption.ratio}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeWorld.id === "human-pen" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
                      <span className="font-monument text-sm tracking-[0.14em] text-[var(--dna-text)] uppercase">
                        HUMAN-PEN · QALAM SCRIPTORIUM
                      </span>
                      <DnaBadge>{inscriptions.length} FOLIOS SEALED</DnaBadge>
                    </div>

                    <form onSubmit={handleInscribeSubmit} className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="qalam-author-input"
                            className="block text-[11px] font-mono tracking-[0.15em] text-[var(--dna-accent)] uppercase"
                          >
                            Scribe Designation
                          </label>
                          <input
                            id="qalam-author-input"
                            type="text"
                            value={draftAuthor}
                            onChange={(e) => setDraftAuthor(e.target.value)}
                            placeholder="e.g. Traveler of the Gate"
                            className="font-sans mt-1 min-h-[44px] w-full border border-[var(--dna-accent)]/35 bg-[var(--dna-surface)] px-3 py-2 text-sm text-[var(--dna-text)] placeholder-[var(--dna-muted)] focus:border-[var(--dna-accent)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="qalam-seal-select"
                            className="block text-[11px] font-mono tracking-[0.15em] text-[var(--dna-accent)] uppercase"
                          >
                            Sacred Seal
                          </label>
                          <NativeSelect
                            id="qalam-seal-select"
                            value={draftSeal}
                            onChange={(e) => setDraftSeal(e.target.value)}
                            className="font-sans mt-1 min-h-[44px] w-full border border-[var(--dna-accent)]/35 bg-[var(--dna-surface)] px-3 py-2 text-sm text-[var(--dna-text)] focus:border-[var(--dna-accent)] focus:outline-none"
                          >
                            {SACRED_SEALS.map((sealOption) => (
                              <option key={sealOption} value={sealOption}>
                                {sealOption}
                              </option>
                            ))}
                          </NativeSelect>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="qalam-reflection-input"
                          className="block text-[11px] font-mono tracking-[0.15em] text-[var(--dna-accent)] uppercase"
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
                          className="font-serif mt-1 w-full border border-[var(--dna-accent)]/35 bg-[var(--dna-surface)] px-3 py-2 text-sm text-[var(--dna-text)] placeholder-[var(--dna-muted)] focus:border-[var(--dna-accent)] focus:outline-none"
                        />
                      </div>
                      {qalamHint && (
                        <p role="alert" className="font-mono text-xs text-[var(--dna-warning)]">
                          {qalamHint}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="submit"
                          className="font-monument min-h-[44px] border border-[var(--dna-accent)] bg-[var(--dna-accent)]/20 px-5 py-2 text-xs tracking-[0.2em] text-[var(--dna-text)] uppercase hover:bg-[var(--dna-accent)]/35 transition-colors cursor-pointer"
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
                            className="min-h-[44px] border border-[var(--dna-accent)]/25 px-3 py-1 font-mono text-[10px] text-[var(--dna-muted)] uppercase hover:border-[var(--dna-accent)] hover:text-[var(--dna-text)] cursor-pointer"
                          >
                            RESTORE DEFAULTS
                          </button>
                        )}
                      </div>
                    </form>

                    <div className="mt-4 space-y-2.5 pr-1">
                      {inscriptions.map((entry) => (
                        <div
                          key={entry.id}
                          className="border border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] p-3.5 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--dna-accent)]">
                            <span>
                              {entry.id} · {entry.authorTitle}
                            </span>
                            <span>{entry.sealName}</span>
                          </div>
                          <p className="mt-1.5 font-serif text-sm sm:text-base leading-relaxed text-[var(--dna-text)]">
                            “{entry.bodyText}”
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeWorld.id === "sidra" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
                      <span className="font-monument text-sm tracking-[0.18em] text-[var(--dna-accent)] uppercase">
                        SIDRA POLYHEDRAL KNOWLEDGE CONSTELLATION
                      </span>
                      <span className="font-mono text-xs text-[var(--dna-accent)]">
                        {selectedAxiom.geometricRatio}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12 items-center">
                      <div className="sm:col-span-6">
                        <div
                          role="group"
                          aria-label="Sidra Knowledge Graph"
                          className="relative h-60 sm:h-64 w-full overflow-hidden border border-[var(--dna-accent)]/30 bg-[var(--dna-canvas)] shadow-[inset_0_0_28px_rgba(0,0,0,0.88)]"
                        >
                          <Image
                            src={artPlateSrc("sidra-lote-constellation")}
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
                                    stroke={isHighlighted ? "var(--dna-text)" : "var(--dna-accent)"}
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
                                      ? "scale-125 border-[var(--dna-text)] bg-[var(--dna-text)] shadow-[0_0_16px_rgba(255,244,210,0.95)]"
                                      : "border-[var(--dna-canvas)] bg-[var(--dna-accent)] shadow-[0_0_8px_rgba(223,192,123,0.55)] group-hover:scale-110 group-hover:bg-[var(--dna-text)]"
                                  }`}
                                />
                                <span
                                  className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-serif text-[10px] tracking-[0.04em] backdrop-blur-sm transition-colors ${
                                    placePillAbove
                                      ? "bottom-[calc(50%+12px)]"
                                      : "top-[calc(50%+12px)]"
                                  } ${
                                    isCurrent
                                      ? "border-[var(--dna-text)]/75 bg-[var(--dna-canvas)]/90 text-[var(--dna-text)]"
                                      : "border-[var(--dna-accent)]/30 bg-[var(--dna-canvas)]/80 text-[var(--dna-accent)] group-hover:border-[var(--dna-accent)]/60"
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
                        <div className="text-xs font-mono text-[var(--dna-accent)] uppercase">
                          {selectedAxiom.discipline}
                        </div>
                        <h5 className="font-monument text-lg text-[var(--dna-text)]">
                          {selectedAxiom.title}
                        </h5>
                        <p className="font-serif text-sm leading-relaxed text-[var(--dna-muted)]">
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
                                  ? "border-[var(--dna-accent)] bg-[var(--dna-accent)]/25 text-[var(--dna-text)]"
                                  : "border-[var(--dna-accent)]/25 text-[var(--dna-muted)] hover:border-[var(--dna-accent)]/55"
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
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/20 pb-3">
                      <span className="font-monument text-sm tracking-[0.18em] text-[var(--dna-accent)] uppercase">
                        ROCKSOUL DX · ASTROLABE DREAMFORGE ENGINE
                      </span>
                      <span className="font-mono text-xs text-[var(--dna-accent)]">
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
                          className="h-52 w-full max-w-[280px] border border-[var(--dna-accent)]/25 bg-[var(--dna-canvas)]"
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
                                  ? "border-[var(--dna-text)] bg-[var(--dna-accent)]/25 text-[var(--dna-text)]"
                                  : "border-[var(--dna-accent)]/25 text-[var(--dna-muted)] hover:border-[var(--dna-accent)]/60"
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono text-[var(--dna-accent)]">
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
                            className="mt-1 w-full accent-[var(--dna-accent)]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono text-[var(--dna-accent)]">
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
                            className="mt-1 w-full accent-[var(--dna-accent)]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-mono text-[var(--dna-accent)]">
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
                            className="mt-1 w-full accent-[var(--dna-accent)]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--dna-accent)]/15 pt-3 font-mono text-[10px] text-[var(--dna-muted)]">
                      <span className="text-[var(--dna-accent)]">
                        DESKTOP WORKBENCH · LOCAL SQLITE ENGINE · SPATIAL STAGE
                      </span>
                      <span>SSOT: @MOONWITNESS/CANON</span>
                    </div>
                  </div>
                )}

                {activeWorld.id === "crayon" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--brand-blue)]/30 pb-3">
                      <span className="font-monument text-sm tracking-[0.14em] text-[var(--dna-text)] uppercase">
                        CRAYON · SRGBL v8 HERMENEUTIC SPECTRUM
                      </span>
                      <DnaBadge>CANON EXPLORER · bjo163/ALLAH-CRAYON-RGBL-ENGINE</DnaBadge>
                    </div>
                    <p className="mt-3 font-sans text-sm text-[var(--dna-muted)]">
                      Select a lens stage to inspect how CRAYON illuminates primary text from sense
                      to living action:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SRGBL_V8_STAGES.map((stage, idx) => (
                        <button
                          key={stage.stage}
                          type="button"
                          onClick={() => setSelectedSrgblIdx(idx)}
                          className={`min-h-[44px] border px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                            selectedSrgblIdx === idx
                              ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/20 text-[var(--dna-text)]"
                              : "border-[var(--dna-accent)]/25 text-[var(--dna-muted)] hover:border-[var(--brand-blue)]/60"
                          }`}
                        >
                          {stage.stage}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 border border-[var(--brand-blue)]/35 bg-[var(--dna-canvas)] p-4 space-y-2">
                      <div className="font-mono text-xs text-[var(--brand-blue)] uppercase">
                        {selectedSrgblStage.symbolicLayer}
                      </div>
                      <h5 className="font-monument text-lg text-[var(--dna-text)]">
                        {selectedSrgblStage.title}
                      </h5>
                      <p className="font-serif text-base text-[var(--dna-text)]">
                        {selectedSrgblStage.auditQuestion}
                      </p>
                    </div>
                  </div>
                )}

                {activeWorld.id === "sin-can" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent-secondary)]/35 pb-3">
                      <span className="font-monument text-sm tracking-[0.14em] text-[var(--dna-text)] uppercase">
                        SIN CAN · BETTER HUMAN REFLECTION ARC
                      </span>
                      <DnaBadge>CANON EXPLORER · 4 STORY PANELS</DnaBadge>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {DX_MANGA_FOUR_PANELS.map((panel) => (
                        <div
                          key={panel.panelNumber}
                          className="border border-[var(--dna-accent-secondary)]/35 bg-[var(--dna-canvas)] p-3.5"
                        >
                          <div className="flex items-center justify-between font-mono text-xs text-[var(--dna-accent)]">
                            <span>{panel.panelNumber}</span>
                            <span>{panel.romajiSfx}</span>
                          </div>
                          <div className="font-monument mt-1 text-sm text-[var(--dna-text)]">
                            {panel.title}
                          </div>
                          <p className="mt-1.5 font-sans text-sm text-[var(--dna-muted)]">
                            {panel.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {SYAFAAT_BASE_STATES.map((stateItem) => (
                        <span
                          key={stateItem.state}
                          className="border border-[var(--dna-accent-secondary)]/35 bg-[var(--dna-surface-elevated)] px-2.5 py-1 font-mono text-xs text-[var(--dna-text)]"
                        >
                          {stateItem.state}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeWorld.id === "mythos" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dna-accent)]/30 pb-3">
                      <span className="font-monument text-sm tracking-[0.14em] text-[var(--dna-text)] uppercase">
                        MYTHOS · MFTL & SHARED CASE 001
                      </span>
                      <DnaBadge>CANON EXPLORER · DOM-02 / DOM-03</DnaBadge>
                    </div>
                    <p className="mt-3 font-sans text-sm text-[var(--dna-muted)]">
                      {JERUSALEM_70CE_CASE_001.title} — cross-domain verification across four
                      primary strands:
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {JERUSALEM_70CE_CASE_001.strands.map((strand) => (
                        <div
                          key={strand.domain}
                          className="border border-[var(--dna-accent)]/30 bg-[var(--dna-canvas)] p-3.5"
                        >
                          <div className="font-mono text-xs text-[var(--dna-accent)] uppercase">
                            {strand.domain}
                          </div>
                          <p className="mt-1.5 font-sans text-sm text-[var(--dna-text)]">
                            {strand.evidence}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 font-mono text-xs text-[var(--dna-success)]">
                      VERDICT: {JERUSALEM_70CE_CASE_001.verdict}
                    </p>
                  </div>
                )}

                {activeWorld.id === "angel-with-shotgun" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--brand-blue)]/30 pb-3">
                      <span className="font-monument text-sm tracking-[0.14em] text-[var(--dna-text)] uppercase">
                        ANGEL WITH SHOTGUN · AWS NORMATIVE ENGINE
                      </span>
                      <DnaBadge>CANON EXPLORER · DOM-05 LAW</DnaBadge>
                    </div>
                    <p className="mt-3 font-sans text-sm text-[var(--dna-accent)]">
                      CORE INVARIANT: LEGAL TEXT ≠ APPLICABLE LAW WITHOUT FULL SCOPE VALIDATION
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {AWS_GATES.map((gate, idx) => (
                        <button
                          key={gate}
                          type="button"
                          onClick={() => setSelectedAwsStageIdx(idx)}
                          className={`min-h-[44px] border px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                            selectedAwsStageIdx === idx
                              ? "border-[var(--dna-accent)] bg-[var(--dna-accent)] text-[var(--dna-canvas)] font-bold"
                              : "border-[var(--brand-blue)]/35 text-[var(--dna-text)] hover:border-[var(--dna-accent)]"
                          }`}
                        >
                          0{idx + 1} · {gate}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 border border-[var(--brand-blue)]/35 bg-[var(--dna-canvas)] p-4">
                      <div className="font-mono text-xs text-[var(--brand-blue)] uppercase">
                        ACTIVE GATE // 0{selectedAwsStageIdx + 1} · {AWS_GATES[selectedAwsStageIdx]}
                      </div>
                      <p className="mt-2 font-sans text-base text-[var(--dna-text)]">
                        Every normative judgment traverses all six gates in sequence (Source, Rule,
                        Jurisdiction, Applicability, Argument, and Review) before any obligation
                        applies.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DnaChamber>
      </MotionReveal>
    </StorySection>
  );
}
