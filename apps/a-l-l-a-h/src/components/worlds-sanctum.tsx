"use client";

import { useEffect, useRef, useState } from "react";
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

  // Moonwitness / Artifact state (derived fallback ensures automatic sync across worlds)
  const [selectedArtifactCode, setSelectedArtifactCode] = useState<string>(
    activeWorld.artifacts[0]?.code ?? "MW-0114",
  );

  // Arsy Web Audio state
  const [activeFrequencyHz, setActiveFrequencyHz] = useState<number>(432);
  const [carrierPlaying, setCarrierPlaying] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const harmonicOscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Qalam Scriptorium state
  const [inscriptions, setInscriptions] =
    useState<readonly InscriptionEntry[]>(INITIAL_INSCRIPTIONS);
  const [draftAuthor, setDraftAuthor] = useState<string>("");
  const [draftSeal, setDraftSeal] = useState<string>(SACRED_SEALS[0]);
  const [draftReflection, setDraftReflection] = useState<string>("");

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
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (harmonicOscRef.current) {
        harmonicOscRef.current.stop();
        harmonicOscRef.current.disconnect();
        harmonicOscRef.current = null;
      }
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
    masterGain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.35);
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
    fifthGain.gain.setValueAtTime(0.018, ctx.currentTime);
    fifthOsc.connect(fifthGain);
    fifthGain.connect(ctx.destination);
    fifthOsc.start();
    harmonicOscRef.current = fifthOsc;

    setCarrierPlaying(true);
  };

  // Rocksoul DX Sacred Geometry Canvas loop (with reduced-motion / quietMode awareness)
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
        phase += rotationSpeed * 0.0005;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * (orbitalRadiusRatio / 180);

      ctx.clearRect(0, 0, width, height);

      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        4,
        centerX,
        centerY,
        baseRadius * 1.35,
      );
      radialGlow.addColorStop(0, "rgba(255, 241, 200, 0.24)");
      radialGlow.addColorStop(0.55, "rgba(214, 180, 108, 0.08)");
      radialGlow.addColorStop(1, "rgba(8, 10, 18, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(phase);

      for (let i = 0; i < symmetryPoints; i += 1) {
        const angle = (i * Math.PI * 2) / symmetryPoints;
        ctx.save();
        ctx.rotate(angle);

        ctx.strokeStyle = "rgba(238, 208, 142, 0.55)";
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.ellipse(baseRadius * 0.48, 0, baseRadius * 0.48, baseRadius * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();

        const nextAngle = ((i + 2) * Math.PI * 2) / symmetryPoints;
        ctx.strokeStyle = "rgba(255, 244, 214, 0.35)";
        ctx.beginPath();
        ctx.moveTo(baseRadius, 0);
        ctx.lineTo(
          Math.cos(nextAngle - angle) * baseRadius,
          Math.sin(nextAngle - angle) * baseRadius,
        );
        ctx.stroke();

        ctx.restore();
      }

      ctx.strokeStyle = "rgba(248, 234, 198, 0.75)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(214, 180, 108, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 1.14, 0, Math.PI * 2);
      ctx.stroke();

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
      return;
    }
    const newRecord: InscriptionEntry = {
      id: `INSC-0${inscriptions.length + 1}`,
      authorTitle: draftAuthor.trim() || "Sworn Witness of the Gate",
      sealName: draftSeal,
      bodyText: trimmedText,
      cycleStamp: "Cycle 1448 · Sealed Now",
    };
    triggerSacredViewTransition(() => {
      setInscriptions([newRecord, ...inscriptions]);
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

  return (
    <section
      id="the-worlds"
      aria-labelledby="worlds-heading"
      className="relative border-t border-[#d6b46c]/25 bg-gradient-to-b from-[#05060a] via-[#090b12] to-[#05060a] py-24 px-4 sm:px-8 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4 text-xs tracking-[0.35em] text-[#d6b46c] uppercase">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#d6b46c]" />
              <span>FIVE REALMS OF THE COVENANT</span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#d6b46c]" />
            </div>
            <h2
              id="worlds-heading"
              className="mt-4 font-serif text-3xl sm:text-5xl tracking-[0.18em] text-gold-gradient uppercase"
            >
              THE WORLDS OF LIGHT
            </h2>
            <p className="mt-3 max-w-2xl font-serif text-base sm:text-lg text-[#d6ceb8]/85">
              Five interconnected sanctuaries rising around the Central Gate—each dedicated to a
              noble pillar of witness, infrastructure, authorship, wisdom, and creation.
            </p>
          </div>
        </ScrollChapterReveal>

        {/* Five World Selector Cards with 3D Spatial Tilt */}
        <div
          role="tablist"
          aria-label="Select a World Realm"
          className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
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
                  className={`group relative flex h-full w-full min-h-[44px] flex-col items-center rounded-sm border p-5 text-center transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-[#e6c987] bg-gradient-to-b from-[#d6b46c]/18 via-[#d6b46c]/8 to-transparent shadow-[0_0_30px_rgba(214,180,108,0.18)]"
                      : "border-[#d6b46c]/20 bg-[#0b0d16]/70 hover:border-[#d6b46c]/55 hover:bg-[#d6b46c]/8"
                  }`}
                >
                  <WorldEmblemById
                    worldId={worldDomain.id}
                    className={`h-11 w-11 transition-transform duration-300 ${
                      isSelected ? "scale-110" : "group-hover:scale-105"
                    }`}
                  />
                  <span className="mt-3 font-serif text-sm font-semibold tracking-[0.2em] text-[#f7ecd0]">
                    {worldDomain.name}
                  </span>
                  <span className="mt-1 text-[11px] tracking-[0.06em] text-[#bfb59e]">
                    {worldDomain.tagline}
                  </span>
                  {isSelected && (
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] tracking-[0.22em] text-[#f6dd9e] uppercase">
                      <DiamondStarOrnament className="h-3 w-3" /> Active Sanctum
                    </span>
                  )}
                </button>
              </SpatialTiltCard>
            );
          })}
        </div>

        {/* Active World Sanctum Chamber */}
        <ScrollChapterReveal quietMode={quietMode}>
          <div className="mt-10 rounded-sm border border-[#d6b46c]/35 bg-[#080a12]/90 p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
            {/* Architectural Meridian & Harmonic Resonance Strip */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/20 pb-4 text-[11px] font-mono tracking-[0.18em] text-[#dfc07b] uppercase">
              <span>CHAMBER // {activeWorld.citadelSector}</span>
              <span>DIRECTIVE // {activeWorld.primaryDirective}</span>
              <span>RESONANCE // {activeWorld.harmonicFrequency}</span>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              {/* Left Column: Architectural Overview & Artifacts */}
              <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#d6b46c]/20 pb-8 lg:pb-0 lg:pr-8">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono tracking-[0.22em] text-[#d6b46c] uppercase">
                      {activeWorld.citadelSector}
                    </span>
                    <span className="rounded-full border border-[#d6b46c]/40 bg-[#d6b46c]/10 px-3 py-0.5 text-[11px] font-mono tracking-[0.15em] text-[#f8eac6]">
                      {activeWorld.statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <WorldEmblemById worldId={activeWorld.id} className="h-14 w-14 shrink-0" />
                    <div>
                      <div className="flex items-baseline gap-3">
                        <h3 className="font-serif text-2xl sm:text-3xl tracking-[0.16em] text-[#fff6df]">
                          {activeWorld.name}
                        </h3>
                        <span className="font-serif text-lg text-[#d6b46c]/90">
                          {activeWorld.arabicEpithet}
                        </span>
                      </div>
                      <p className="text-xs tracking-[0.18em] text-[#bfb59e] uppercase mt-1">
                        {activeWorld.transliteration} · {activeWorld.harmonicFrequency}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 font-serif text-base leading-relaxed text-[#e6decb]">
                    {activeWorld.architecturalDescription}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {activeWorld.pillars.map((pillarLabel) => (
                      <span
                        key={pillarLabel}
                        className="border border-[#d6b46c]/30 bg-[#111524] px-3 py-1 text-xs tracking-[0.18em] text-[#f3dfb2] uppercase"
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
                  <p className="text-xs tracking-[0.25em] text-[#d6b46c] uppercase mb-3">
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
                          <div className="mt-1 font-serif text-sm font-medium tracking-[0.06em] text-[#fff6df]">
                            {artifactRecord.title}
                          </div>
                          <div className="mt-0.5 text-xs text-[#bfb59e]">
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
                  <h4 className="mt-2 font-serif text-xl tracking-[0.08em] text-[#fff8e6]">
                    {selectedArtifact.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#d9d0be]">
                    {selectedArtifact.summary}
                  </p>
                </div>

                {/* Interactive Console per World */}
                <div className="mt-6 flex-1 border border-[#d6b46c]/25 bg-[#06080f] p-6">
                  {activeWorld.id === "moonwitness" && (
                    <div>
                      <div className="flex items-center justify-between border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-serif text-sm tracking-[0.2em] text-[#f5e3b8] uppercase">
                          MOONWITNESS MERIDIAN OBSERVATORY
                        </span>
                        <span className="font-mono text-xs text-[#d6b46c]">ORBITAL SYNC: 100%</span>
                      </div>
                      <p className="mt-3 text-xs text-[#bfb59e]">
                        Active witness corridors linking stories, nocturnal archives, and human
                        testimonies under the same moon.
                      </p>
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="border border-[#d6b46c]/25 bg-[#0c0f1a] p-4">
                          <div className="text-[11px] font-mono text-[#d6b46c]">MERIDIAN 01</div>
                          <div className="mt-1 font-serif text-lg text-[#fff6df]">
                            Cairo · Al-Qāhirah
                          </div>
                          <div className="mt-1 text-xs text-[#bfb59e]">
                            412 Verified Oral Chronicles
                          </div>
                        </div>
                        <div className="border border-[#d6b46c]/25 bg-[#0c0f1a] p-4">
                          <div className="text-[11px] font-mono text-[#d6b46c]">MERIDIAN 02</div>
                          <div className="mt-1 font-serif text-lg text-[#fff6df]">
                            Samarkand · Ulugh
                          </div>
                          <div className="mt-1 text-xs text-[#bfb59e]">
                            289 Star Catalogue Folios
                          </div>
                        </div>
                        <div className="border border-[#d6b46c]/25 bg-[#0c0f1a] p-4">
                          <div className="text-[11px] font-mono text-[#d6b46c]">MERIDIAN 03</div>
                          <div className="mt-1 font-serif text-lg text-[#fff6df]">
                            Nusantara · Archipelago
                          </div>
                          <div className="mt-1 text-xs text-[#bfb59e]">
                            518 Maritime Witness Logs
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeWorld.id === "arsy" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-serif text-sm tracking-[0.2em] text-[#f5e3b8] uppercase">
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
                      <p className="mt-3 text-xs text-[#bfb59e]">
                        Select an acoustic carrier frequency to tune the Sovereign Relay Array:
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
                      <div className="flex items-center justify-between border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-serif text-sm tracking-[0.2em] text-[#f5e3b8] uppercase">
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
                              className="mt-1 min-h-[44px] w-full border border-[#d6b46c]/35 bg-[#0c0f1a] px-3 py-2 text-xs text-[#fff6df] placeholder-[#7a7364] focus:border-[#f8eac6] focus:outline-none"
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
                              className="mt-1 min-h-[44px] w-full border border-[#d6b46c]/35 bg-[#0c0f1a] px-3 py-2 text-xs text-[#fff6df] focus:border-[#f8eac6] focus:outline-none"
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
                            onChange={(e) => setDraftReflection(e.target.value)}
                            placeholder="Inscribe a word of wisdom, gratitude, or architectural vision..."
                            className="mt-1 w-full border border-[#d6b46c]/35 bg-[#0c0f1a] px-3 py-2 text-xs text-[#fff6df] placeholder-[#7a7364] focus:border-[#f8eac6] focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="min-h-[44px] border border-[#e6c987] bg-[#d6b46c]/20 px-5 py-2 font-serif text-xs tracking-[0.2em] text-[#fff6df] uppercase hover:bg-[#d6b46c]/35 transition-colors cursor-pointer"
                        >
                          SEAL INSCRIPTION IN FOLIO
                        </button>
                      </form>

                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                        {inscriptions.map((entry) => (
                          <div
                            key={entry.id}
                            className="border border-[#d6b46c]/20 bg-[#0b0e18] p-3 text-xs"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#d6b46c]">
                              <span>
                                {entry.id} · {entry.authorTitle}
                              </span>
                              <span>{entry.sealName}</span>
                            </div>
                            <p className="mt-1 font-serif text-sm text-[#f4efe4]">
                              “{entry.bodyText}”
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeWorld.id === "sidra" && (
                    <div>
                      <div className="flex items-center justify-between border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-serif text-sm tracking-[0.2em] text-[#f5e3b8] uppercase">
                          SIDRA POLYHEDRAL KNOWLEDGE CONSTELLATION
                        </span>
                        <span className="font-mono text-xs text-[#d6b46c]">
                          {selectedAxiom.geometricRatio}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12 items-center">
                        <div className="sm:col-span-6">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-full h-48 border border-[#d6b46c]/20 bg-[#090c16]"
                            aria-label="Sidra Knowledge Graph"
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
                                    stroke={isHighlighted ? "#f5e3b8" : "#8c6d32"}
                                    strokeWidth={isHighlighted ? "0.9" : "0.45"}
                                    strokeOpacity={isHighlighted ? "0.85" : "0.4"}
                                  />
                                );
                              }),
                            )}
                            {SIDRA_KNOWLEDGE_AXIOMS.map((axiomNode) => {
                              const isCurrent = axiomNode.id === selectedAxiom.id;
                              return (
                                <g
                                  key={axiomNode.id}
                                  onClick={() => setSelectedAxiomId(axiomNode.id)}
                                  className="cursor-pointer"
                                >
                                  <circle
                                    cx={axiomNode.coordinateX}
                                    cy={axiomNode.coordinateY}
                                    r={isCurrent ? 5.2 : 3.2}
                                    fill={isCurrent ? "#fff6df" : "#d6b46c"}
                                    stroke="#080a12"
                                    strokeWidth="0.8"
                                  />
                                  <text
                                    x={axiomNode.coordinateX}
                                    y={axiomNode.coordinateY - 6.5}
                                    textAnchor="middle"
                                    fill="#f5e3b8"
                                    fontSize="3.8"
                                    fontFamily="serif"
                                  >
                                    {axiomNode.title.split(" ")[0]}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                        <div className="sm:col-span-6 space-y-2">
                          <div className="text-xs font-mono text-[#d6b46c] uppercase">
                            {selectedAxiom.discipline}
                          </div>
                          <h5 className="font-serif text-lg text-[#fff6df]">
                            {selectedAxiom.title}
                          </h5>
                          <p className="text-xs leading-relaxed text-[#d9d0be]">
                            {selectedAxiom.exposition}
                          </p>
                          <div className="pt-2 flex flex-wrap gap-1.5">
                            {SIDRA_KNOWLEDGE_AXIOMS.map((axiomItem) => (
                              <button
                                key={axiomItem.id}
                                type="button"
                                onClick={() => setSelectedAxiomId(axiomItem.id)}
                                className={`min-h-[36px] px-2.5 py-1 text-[11px] font-mono border cursor-pointer ${
                                  axiomItem.id === selectedAxiom.id
                                    ? "border-[#f5e3b8] bg-[#d6b46c]/25 text-[#fff6df]"
                                    : "border-[#d6b46c]/25 text-[#bfb59e]"
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
                      <div className="flex items-center justify-between border-b border-[#d6b46c]/20 pb-3">
                        <span className="font-serif text-sm tracking-[0.2em] text-[#f5e3b8] uppercase">
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
                            width={240}
                            height={200}
                            className="border border-[#d6b46c]/25 bg-[#05070e]"
                          />
                        </div>
                        <div className="sm:col-span-6 space-y-4">
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
