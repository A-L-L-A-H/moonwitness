"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LUMINOUS_NAMES_OF_ALLAH, TASBIH_PHRASES } from "@/data/remembrance-sanctuary";
import type { WorldIdentifier } from "@/data/empire-registry";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import {
  ScrollChapterReveal,
  SpatialTiltCard,
  triggerSacredViewTransition,
} from "./motion-primitives";
import { DiamondStarOrnament } from "./sacred-icons";
import { AstrolabeSealMedallion, SacredCornerBrackets } from "./sacred-illustrations";

const TASBIH_STORAGE_KEY = "allah-tasbih-state-v1";
const MUHASABAH_STORAGE_KEY = "allah-muhasabah-v1";

const MUHASABAH_PLEDGES = [
  {
    id: "restitution",
    labelEn: "Fulfill trust & settle any debt owed",
    labelId: "Tunaikan amanah & lunasi hak sesama",
  },
  {
    id: "gentle-speech",
    labelEn: "Guard tongue from mockery or falsehood",
    labelId: "Jaga lisan dari dusta & merendahkan",
  },
  {
    id: "hidden-mercy",
    labelEn: "Offer unseen kindness without applause",
    labelId: "Beri kebaikan senyap tanpa mencari pujian",
  },
  {
    id: "honest-craft",
    labelEn: "Deliver clean, verifiable work as worship",
    labelId: "Hasilkan karya jujur & teruji sebagai ibadah",
  },
] as const;

interface PersistedTasbihState {
  readonly phraseId: string;
  readonly count: number;
  readonly cycles: number;
  readonly totalWitnessed: number;
}

export function RemembranceSanctuary({
  quietMode = false,
  onNavigateToWorld,
}: {
  readonly quietMode?: boolean;
  readonly onNavigateToWorld?: (worldId: WorldIdentifier) => void;
}) {
  const { locale } = useSanctuaryLocale();
  const [selectedNameId, setSelectedNameId] = useState<string>(LUMINOUS_NAMES_OF_ALLAH[0]!.id);
  const [activePhraseId, setActivePhraseId] = useState<string>(TASBIH_PHRASES[0]!.id);
  const [beadCount, setBeadCount] = useState<number>(0);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);
  const [totalWitnessed, setTotalWitnessed] = useState<number>(0);
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(false);
  const [breathActive, setBreathActive] = useState<boolean>(false);
  const [breathPhaseIndex, setBreathPhaseIndex] = useState<number>(0);
  const [justCompletedCycle, setJustCompletedCycle] = useState<boolean>(false);
  const [pledgeIds, setPledgeIds] = useState<readonly string[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!breathActive) {
      return;
    }
    const scheduleMs = [4000, 4000, 6000];
    const timer = window.setTimeout(() => {
      setBreathPhaseIndex((prev) => (prev + 1) % 3);
    }, scheduleMs[breathPhaseIndex] ?? 4000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [breathActive, breathPhaseIndex]);

  // Hydrate persisted remembrance progress safely on client mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TASBIH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PersistedTasbihState>;
      if (
        typeof parsed.phraseId === "string" &&
        TASBIH_PHRASES.some((p) => p.id === parsed.phraseId)
      ) {
        setActivePhraseId(parsed.phraseId);
      }
      if (typeof parsed.count === "number" && Number.isFinite(parsed.count) && parsed.count >= 0) {
        setBeadCount(parsed.count % 33);
      }
      if (
        typeof parsed.cycles === "number" &&
        Number.isFinite(parsed.cycles) &&
        parsed.cycles >= 0
      ) {
        setCyclesCompleted(parsed.cycles);
      }
      if (
        typeof parsed.totalWitnessed === "number" &&
        Number.isFinite(parsed.totalWitnessed) &&
        parsed.totalWitnessed >= 0
      ) {
        setTotalWitnessed(parsed.totalWitnessed);
      }
    } catch {
      // Ignore storage access failures in private browsing contexts
    }

    try {
      const savedPledges = window.localStorage.getItem(MUHASABAH_STORAGE_KEY);
      if (savedPledges) {
        const parsedPledges = JSON.parse(savedPledges) as unknown;
        if (Array.isArray(parsedPledges)) {
          setPledgeIds(parsedPledges.filter((item): item is string => typeof item === "string"));
        }
      }
    } catch {
      // Ignore storage access failures in private browsing contexts
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(MUHASABAH_STORAGE_KEY, JSON.stringify(pledgeIds));
    } catch {
      // Ignore storage quota or restricted context
    }
  }, [pledgeIds]);

  const toggleMuhasabahPledge = (id: string) => {
    setPledgeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const exportPrivateMuhasabahJson = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      privacyNote: "Exported strictly on-device. Zero server telemetry or public leaderboard.",
      tasbih: { activePhraseId, beadCount, cyclesCompleted, totalWitnessed },
      muhasabahPledges: MUHASABAH_PLEDGES.filter((p) => pledgeIds.includes(p.id)).map((p) => p.id),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `allah-muhasabah-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    try {
      const payload: PersistedTasbihState = {
        phraseId: activePhraseId,
        count: beadCount,
        cycles: cyclesCompleted,
        totalWitnessed,
      };
      window.localStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or restricted context
    }
  }, [activePhraseId, beadCount, cyclesCompleted, totalWitnessed]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  const playGentleBell = useCallback(
    (isCycleCompletion: boolean) => {
      if (!chimeEnabled) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          void ctx.resume();
        }
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(isCycleCompletion ? 648 : 528, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(isCycleCompletion ? 0.055 : 0.032, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + (isCycleCompletion ? 0.9 : 0.45));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + (isCycleCompletion ? 0.92 : 0.48));
      } catch {
        // Ignore audio playback errors if blocked by browser autoplay policy
      }
    },
    [chimeEnabled],
  );

  const selectedNameIndex = Math.max(
    0,
    LUMINOUS_NAMES_OF_ALLAH.findIndex((entry) => entry.id === selectedNameId),
  );
  const selectedName = LUMINOUS_NAMES_OF_ALLAH[selectedNameIndex] ?? LUMINOUS_NAMES_OF_ALLAH[0]!;
  const activePhrase =
    TASBIH_PHRASES.find((phrase) => phrase.id === activePhraseId) ?? TASBIH_PHRASES[0]!;
  const tasbihProgressFraction = beadCount / activePhrase.targetCount;
  const breathLabels = [
    "INHALE (4S) · RECEIVING AN-NŪR",
    "STILLNESS (4S) · AS-SAKĪNAH TRUST",
    "EXHALE (6S) · GRATEFUL RELEASE",
  ] as const;

  const handleReciteBead = () => {
    const nextRaw = beadCount + 1;
    const completedNow = nextRaw >= activePhrase.targetCount;
    const nextBead = completedNow ? 0 : nextRaw;
    setBeadCount(nextBead);
    setTotalWitnessed((prev) => prev + 1);
    if (completedNow) {
      setCyclesCompleted((prev) => prev + 1);
      setJustCompletedCycle(true);
    } else {
      setJustCompletedCycle(false);
    }
    playGentleBell(completedNow);
  };

  const handleSelectPhrase = (phraseId: string) => {
    triggerSacredViewTransition(() => {
      setActivePhraseId(phraseId);
      setBeadCount(0);
      setJustCompletedCycle(false);
    }, quietMode);
  };

  return (
    <div
      id="remembrance-sanctuary"
      className="mt-16 border border-[#d6b46c]/35 bg-[#060911]/95 p-6 sm:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.82)] relative"
    >
      <SacredCornerBrackets />

      {/* Section Banner */}
      <ScrollChapterReveal quietMode={quietMode}>
        <div className="flex flex-col items-center text-center border-b border-[#d6b46c]/20 pb-8">
          <div dir="rtl" lang="ar" className="text-2xl sm:text-3xl text-[#f5dfa6] tracking-wide">
            بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] font-mono tracking-[0.26em] text-[#dfc07b] uppercase">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#d6b46c]" />
            <span>MĪZĀN AL-QALB · CONTEMPLATIVE STILLNESS</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#d6b46c]" />
          </div>
          <h3 className="font-monument mt-3 text-2xl sm:text-3xl tracking-[0.16em] text-gold-gradient uppercase">
            CONTEMPLATION, GRATITUDE &amp; STILLNESS
          </h3>
          <p className="mt-2.5 max-w-2xl font-serif text-base text-[#e6decb] leading-relaxed">
            A quiet, non-sectarian chamber honoring One Creator—reflecting on universal virtues of
            Light, Mercy, Wisdom, Gratitude, and Peace while centering conscience before every act
            of building.
          </p>
        </div>
      </ScrollChapterReveal>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: 9 Luminous Attributes Contemplation */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] tracking-[0.2em] text-[#dfc07b] uppercase">
                UNIVERSAL ATTRIBUTES · LUMINOUS CONTEMPLATIONS (9 OF 99)
              </span>
              <span className="font-mono text-[10.5px] text-[#cfc5b0]">
                MONOCENTRIC UNITY · ZERO HUMAN IDOLS
              </span>
            </div>

            {/* Desktop / Tablet: 9-Fold Nonagram Celestial Ring */}
            <div className="mt-5 hidden sm:block">
              <div
                role="tablist"
                aria-label="Select a Beautiful Name of Allah to contemplate"
                className="relative mx-auto h-[412px] w-[412px] select-none"
              >
                {/* Hand-crafted Obsidian & Gold-Leaf Nonagram Rosette Dial */}
                <div className="pointer-events-none absolute inset-4 overflow-hidden rounded-full border border-[#d6b46c]/40 bg-[#05070e] shadow-[0_0_54px_rgba(223,192,123,0.14),inset_0_0_36px_rgba(0,0,0,0.92)]">
                  <Image
                    src="/art/nonagram-sanctuary-dial.webp"
                    alt=""
                    fill
                    loading="eager"
                    sizes="380px"
                    className="object-cover scale-[1.04] opacity-88"
                  />
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(5,7,14,0.88)_0%,rgba(5,7,14,0.52)_28%,rgba(5,7,14,0.28)_64%,rgba(5,7,14,0.9)_100%)]" />
                </div>

                {/* Rotating Brass Optical Sightline Pointer */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-4"
                  style={{
                    transform: `rotate(${selectedNameIndex * 40}deg)`,
                    transition: quietMode
                      ? "none"
                      : "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <div className="absolute top-[11%] left-1/2 h-[22%] w-px -translate-x-1/2 bg-gradient-to-b from-[#fff8e6] via-[#f5dfa6]/70 to-transparent" />
                  <div className="absolute top-[10%] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-t border-l border-[#fff8e6] bg-[#f5dfa6]/40" />
                </div>

                {/* Central Al-Asma Focal Medallion */}
                <div className="pointer-events-none absolute top-1/2 left-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#f5dfa6]/45 bg-[#060811]/90 text-center px-2 shadow-[0_0_30px_rgba(223,192,123,0.18)] backdrop-blur-sm">
                  <span className="font-mono text-[9px] tracking-[0.22em] text-[#dfc07b]">
                    0{selectedNameIndex + 1} / 09
                  </span>
                  <div dir="rtl" lang="ar" className="mt-1 text-2xl text-[#fff8e6]">
                    {selectedName.arabic}
                  </div>
                  <div className="font-monument mt-0.5 text-[11px] tracking-[0.12em] text-[#f5dfa6]">
                    {selectedName.transliteration}
                  </div>
                </div>

                {/* 9 Orbiting Luminous Attribute Nodes */}
                {LUMINOUS_NAMES_OF_ALLAH.map((entry, idx) => {
                  const rad = ((idx * 40 - 90) * Math.PI) / 180;
                  const x = Number((206 + Math.cos(rad) * 162 - 44).toFixed(1));
                  const y = Number((206 + Math.sin(rad) * 162 - 25).toFixed(1));
                  const isSelected = entry.id === selectedName.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() =>
                        triggerSacredViewTransition(() => {
                          setSelectedNameId(entry.id);
                        }, quietMode)
                      }
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className={`absolute flex h-[50px] w-[88px] flex-col items-center justify-center rounded-sm border px-1.5 transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "z-10 border-[#fff4d2] bg-[#1b160c]/95 shadow-[0_0_24px_rgba(245,223,166,0.34)] scale-105"
                          : "border-[#d6b46c]/30 bg-[#080b14]/92 hover:border-[#f5dfa6]/70 hover:bg-[#0f1322]"
                      }`}
                    >
                      <span dir="rtl" lang="ar" className="text-sm leading-none text-[#fff4d2]">
                        {entry.arabic}
                      </span>
                      <span className="font-monument mt-1 text-[9.5px] leading-none tracking-[0.06em] whitespace-nowrap text-[#f5efe2]">
                        {entry.transliteration}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile (< 640px): Compact 3x3 Luminous Tile Grid */}
            <div
              role="tablist"
              aria-label="Select a Beautiful Name of Allah to contemplate"
              className="mt-4 grid grid-cols-3 gap-2.5 sm:hidden"
            >
              {LUMINOUS_NAMES_OF_ALLAH.map((entry) => {
                const isSelected = entry.id === selectedName.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() =>
                      triggerSacredViewTransition(() => {
                        setSelectedNameId(entry.id);
                      }, quietMode)
                    }
                    className={`min-h-[68px] border px-2 py-2.5 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#fff4d2] bg-[#d6b46c]/18 shadow-[0_0_24px_rgba(223,192,123,0.18)]"
                        : "border-[#d6b46c]/22 bg-[#0a0d16] hover:border-[#d6b46c]/55"
                    }`}
                  >
                    <div dir="rtl" lang="ar" className="text-lg text-[#fff4d2]">
                      {entry.arabic}
                    </div>
                    <div className="font-monument mt-0.5 text-[10px] tracking-[0.06em] whitespace-nowrap text-[#f5efe2]">
                      {entry.transliteration}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <SpatialTiltCard disabled={quietMode} maxTiltDeg={2.5} className="mt-5">
            <div className="relative border border-[#dfc07b]/40 bg-gradient-to-br from-[#0e1320] via-[#090c15] to-[#06080f] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/20 pb-3">
                <div className="flex items-baseline gap-3">
                  <span dir="rtl" lang="ar" className="text-2xl text-[#fff4d2]">
                    {selectedName.arabic}
                  </span>
                  <span className="font-monument text-lg tracking-[0.14em] text-[#fff8e6]">
                    {selectedName.transliteration}
                  </span>
                </div>
                <span className="border border-[#d6b46c]/35 bg-[#d6b46c]/12 px-2.5 py-0.5 font-mono text-[10px] text-[#f8eac6]">
                  {selectedName.meaning}
                </span>
              </div>

              <p className="mt-4 font-serif text-base leading-relaxed text-[#ece4d3]">
                {selectedName.contemplation}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#d6b46c]/15 pt-3">
                <span className="text-xs text-[#dfc07b]">
                  Practice: <span className="text-[#f5efe2]">{selectedName.practicePrompt}</span>
                </span>
                {onNavigateToWorld && (
                  <button
                    type="button"
                    onClick={() => onNavigateToWorld(selectedName.linkedWorldId)}
                    className="btn-luxe-secondary px-4 py-1.5 font-mono text-[10px] tracking-[0.14em] text-[#f8eac6] uppercase hover:text-white cursor-pointer"
                  >
                    {selectedName.worldLabel} &rsaquo;
                  </button>
                )}
              </div>
            </div>
          </SpatialTiltCard>
        </div>

        {/* Right: Orbital Tasbih Counter & Sakinah Breath Guide */}
        <div className="octa-bevel-shell lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-3">
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#dfc07b] uppercase">
                ORBITAL TASBĪḤ · SAKĪNAH
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-pressed={chimeEnabled}
                  onClick={() => setChimeEnabled((prev) => !prev)}
                  className={`btn-luxe-secondary px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase cursor-pointer ${
                    chimeEnabled ? "text-[#fff8e6]" : "text-[#bfb59e] hover:text-[#fff6df]"
                  }`}
                >
                  {chimeEnabled ? "CHIME: 528HZ" : "CHIME: MUTE"}
                </button>
                <button
                  type="button"
                  aria-pressed={breathActive}
                  onClick={() => setBreathActive((prev) => !prev)}
                  className={`btn-luxe-secondary px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase cursor-pointer ${
                    breathActive ? "text-[#fff8e6]" : "text-[#bfb59e] hover:text-[#fff6df]"
                  }`}
                >
                  {breathActive ? "BREATH: ON" : "BREATH: GUIDE"}
                </button>
              </div>
            </div>

            {/* Phrase Selector Pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {TASBIH_PHRASES.map((phrase) => {
                const active = phrase.id === activePhrase.id;
                return (
                  <button
                    key={phrase.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleSelectPhrase(phrase.id)}
                    className={`btn-luxe-secondary px-3.5 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase cursor-pointer ${
                      active ? "text-[#fff6df]" : "text-[#bfb59e] hover:text-[#fff6df]"
                    }`}
                  >
                    {phrase.transliteration}
                  </button>
                );
              })}
            </div>

            {/* Orbital 33-Bead Visual Ring */}
            <div className="mt-5 flex flex-col items-center text-center">
              <div className="relative flex items-center justify-center">
                {breathActive && !quietMode && (
                  <div
                    aria-hidden="true"
                    className="animate-sakinah-breathe absolute h-44 w-44 rounded-full bg-[#dfc07b]/15 blur-xl"
                  />
                )}
                <button
                  type="button"
                  onClick={handleReciteBead}
                  aria-label={`Recite ${activePhrase.transliteration}. Count ${beadCount} of ${activePhrase.targetCount}`}
                  className="group relative flex h-44 w-44 flex-col items-center justify-center rounded-full focus:outline-none cursor-pointer"
                >
                  <svg
                    viewBox="0 0 180 180"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                  >
                    <circle
                      cx="90"
                      cy="90"
                      r="74"
                      fill="rgba(4,5,9,0.85)"
                      stroke="#d6b46c"
                      strokeOpacity="0.22"
                      strokeWidth="1"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="64"
                      fill="none"
                      stroke="#d6b46c"
                      strokeOpacity="0.14"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="64"
                      fill="none"
                      stroke="#fff4d2"
                      strokeOpacity="0.68"
                      strokeWidth="1.5"
                      strokeDasharray="402.12"
                      strokeDashoffset={(402.12 * (1 - tasbihProgressFraction)).toFixed(2)}
                      transform="rotate(-90 90 90)"
                      style={{ transition: quietMode ? "none" : "stroke-dashoffset 260ms ease" }}
                    />
                    {Array.from({ length: 33 }, (_, i) => {
                      const angle = (i * Math.PI * 2) / 33 - Math.PI / 2;
                      const cx = Number((90 + Math.cos(angle) * 74).toFixed(2));
                      const cy = Number((90 + Math.sin(angle) * 74).toFixed(2));
                      const lit = i < beadCount;
                      const isMilestone = i === 10 || i === 21 || i === 32;
                      return (
                        <circle
                          key={i}
                          cx={cx}
                          cy={cy}
                          r={lit ? (isMilestone ? 4 : 3.2) : isMilestone ? 2.2 : 1.7}
                          fill={lit ? "#fff4d2" : "#dfc07b"}
                          fillOpacity={lit ? 0.98 : isMilestone ? 0.55 : 0.28}
                        />
                      );
                    })}
                  </svg>
                  <AstrolabeSealMedallion className="pointer-events-none absolute h-24 w-24 opacity-25 transition-opacity group-hover:opacity-40" />
                  <div dir="rtl" lang="ar" className="relative z-10 text-xl text-[#fff4d2]">
                    {activePhrase.arabic}
                  </div>
                  <div className="relative z-10 mt-1 font-mono text-2xl font-semibold text-[#fff8e6]">
                    {beadCount}
                    <span className="text-xs text-[#cfc5b0]"> / 33</span>
                  </div>
                  <div className="relative z-10 mt-1 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-[#dfc07b] uppercase">
                    <DiamondStarOrnament className="h-2.5 w-2.5" /> PAUSE &amp; REFLECT
                  </div>
                </button>
              </div>

              <p className="mt-3 font-serif text-sm text-[#e6decb]">{activePhrase.translation}</p>
              <p className="mt-1 text-xs text-[#cfc5b0]">{activePhrase.heartFocus}</p>
              {breathActive && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 border border-[#fff4d2]/40 bg-[#0b0f1b] px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-[#f5dfa6] uppercase"
                >
                  {breathLabels[breathPhaseIndex]}
                </div>
              )}
              {justCompletedCycle && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 border border-[#fff4d2]/55 bg-[#d6b46c]/20 px-3 py-1 font-mono text-[11px] text-[#fff8e6]"
                >
                  33-Bead Contemplation Cycle Sealed ({cyclesCompleted} total)
                </div>
              )}
            </div>
          </div>

          {/* Quiet On-Device Private Muhasabah Checklist */}
          <div className="mt-5 border-t border-[#d6b46c]/20 pt-4">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-[#dfc07b] uppercase">
              <span>
                {locale === "id"
                  ? "MUḤĀSABAH PRIVAT · KHUSUS PERANGKAT INI"
                  : "PRIVATE MUḤĀSABAH · ON-DEVICE ONLY"}
              </span>
              <span>
                {pledgeIds.length}/{MUHASABAH_PLEDGES.length}
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {MUHASABAH_PLEDGES.map((item) => {
                const checked = pledgeIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleMuhasabahPledge(item.id)}
                    className={`btn-luxe-secondary flex items-center gap-2 px-3 py-1.5 text-left text-[11px] leading-snug cursor-pointer ${
                      checked ? "text-[#fff8e6]" : "text-[#cfc5b0] hover:text-[#fff6df]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2 w-2 shrink-0 rotate-45 border ${
                        checked
                          ? "border-[#fff4d2] bg-[#fff4d2]"
                          : "border-[#dfc07b]/60 bg-transparent"
                      }`}
                    />
                    <span>{locale === "id" ? item.labelId : item.labelEn}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 font-mono text-[9.5px] leading-relaxed text-[#bfb59e]">
              {locale === "id"
                ? "AMAL NYATA (0% POTONGAN): Salurkan zakat/sedekah langsung kepada tetangga, anak yatim, atau pihak yang berhak di sekitar Anda."
                : "DIRECT SERVICE (0% PLATFORM FEE): Channel kindness, fair wages & zakat directly to neighbors, orphans, and those around you."}
            </p>
          </div>

          <div
            aria-live="polite"
            className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#d6b46c]/15 pt-3 font-mono text-[10px] text-[#bfb59e]"
          >
            <span>CYCLES: {cyclesCompleted}</span>
            <span>TOTAL: {totalWitnessed}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={exportPrivateMuhasabahJson}
                className="btn-luxe-secondary px-3 py-1 text-[#f5dfa6] hover:text-white cursor-pointer"
              >
                EXPORT JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setBeadCount(0);
                  setJustCompletedCycle(false);
                }}
                className="btn-luxe-secondary px-3 py-1 hover:text-[#fff6df] cursor-pointer"
              >
                RESET RING
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
