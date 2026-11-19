"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@moonwitness/ui";
import {
  DnaChamber,
  IllustrationFrame,
  MotionReveal,
  SectionHeading,
  StorySection,
  WorldAtlas,
} from "@moonwitness/ui/imperium";
import {
  WORLD_ART,
  WORLD_DOMAINS,
  type WorldDomainEntry,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { triggerSacredViewTransition } from "./motion-primitives";
import { WorldEmblemById } from "./sacred-icons";
import { WorldChamberWatermarkSvg } from "./sacred-illustrations";
import { ArsyCarrierConsole } from "./worlds/arsy-carrier-console";
import { MoonwitnessMeridianConsole } from "./worlds/moonwitness-meridian-console";
import { QalamScriptoriumConsole } from "./worlds/qalam-scriptorium-console";
import { RocksoulMandalaConsole } from "./worlds/rocksoul-mandala-console";
import {
  AwsNormativeConsole,
  CrayonSpectrumConsole,
  MythosCaseConsole,
  SidraKnowledgeConsole,
  SinCanConsole,
} from "./worlds/sidra-and-canon-consoles";

const SANCTUM_WORLD_TAGLINES = {
  en: {
    crayon: "Making Life More Colorful!",
  },
  id: {
    moonwitness: "Kisah · Pengetahuan · Arsip",
    arsy: "Radio · Teknologi · Infrastruktur",
    "human-pen": "Pikir · Tulis · Cipta · Bagikan",
    sidra: "Terhubung · Jelajahi · Pelajari",
    "rocksoul-dx": "Bermain · Cipta · Bermimpi",
    crayon: "Biar Hidup Lebih Berwarna!",
    "sin-can": "Refleksi · Tanya · Pahami",
    mythos: "Jelajahi · Temukan · Ingat",
    "angel-with-shotgun": "Hukum · Keadilan · Masyarakat",
  },
  ar: {
    moonwitness: "قصص · معرفة · أرشيف",
    arsy: "إذاعة · تقنية · بنية تحتية",
    "human-pen": "تفكّر · اكتب · أبدع · شارك",
    sidra: "تواصل · استكشف · تعلّم",
    "rocksoul-dx": "العب · أبدع · احلم",
    crayon: "لتكن الحياة أكثر إشراقاً",
    "sin-can": "تأمّل · تساءل · افهم",
    mythos: "استكشف · اكتشف · تذكّر",
    "angel-with-shotgun": "قانون · عدالة · مجتمع",
  },
} as const;

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

  const [selectedArtifactCode, setSelectedArtifactCode] = useState<string>(
    activeWorld.artifacts[0]?.code ?? "MW-0114",
  );
  const selectedArtifact =
    activeWorld.artifacts.find((artifact) => artifact.code === selectedArtifactCode) ??
    activeWorld.artifacts[0]!;

  return (
    <StorySection
      id="the-worlds"
      labelledBy="worlds-heading"
      tone="surface"
      className="scroll-mt-16"
    >
      <MotionReveal disabled={quietMode}>
        <SectionHeading
          id="worlds-heading"
          kicker={
            locale === "id"
              ? "SEMBILAN DUNIA EKOSISTEM"
              : locale === "ar"
                ? "العوالم المعرفية التسعة"
                : "NINE WORLDS OF THE ECOSYSTEM"
          }
          title={
            locale === "id"
              ? "JELAJAHI SEMBILAN DUNIA"
              : locale === "ar"
                ? "العوالم التسعة"
                : "THE NINE WORLDS"
          }
          description={
            locale === "id"
              ? "Sembilan ruang karya terhubung mengelilingi Gerbang Utama—dari arsip kisah, siaran radio, kepenulisan, pengetahuan, permainan, hingga refleksi dan hukum."
              : locale === "ar"
                ? "تسعة عوالم مترابطة تحيط بالبوابة الرئيسية — تجمع بين السرد التوثيقي والإذاعة والكتابة والمعرفة والإبداع والتأمل والعدالة."
                : "Nine interconnected destinations rising around the Central Gate—uniting archive storytelling, radio, writing, learning, play, prismatic study, reflection, mythos, and justice."
          }
          align="center"
        />
      </MotionReveal>

      <div className="mt-10">
        <WorldAtlas
          ariaLabel="Select one of the Nine Worlds"
          activeId={activeWorld.id}
          onSelect={(id) => onSelectWorld(id as WorldIdentifier)}
          className="lg:grid-cols-3"
          items={WORLD_DOMAINS.map((worldDomain) => {
            const overrideSubtitle =
              locale === "en"
                ? SANCTUM_WORLD_TAGLINES.en[
                    worldDomain.id as keyof typeof SANCTUM_WORLD_TAGLINES.en
                  ]
                : SANCTUM_WORLD_TAGLINES[locale][worldDomain.id];
            return {
              id: worldDomain.id,
              title: worldDomain.name,
              subtitle: overrideSubtitle ?? worldDomain.tagline,
              statusLabel: worldDomain.statusLabel,
              emblem: <WorldEmblemById worldId={worldDomain.id} className="h-7 w-7" />,
            };
          })}
        />
      </div>

      <MotionReveal disabled={quietMode}>
        <DnaChamber className="mt-10 p-6 sm:p-10">
          <WorldChamberWatermarkSvg worldId={activeWorld.id} />

          <div className="mb-8 grid grid-cols-1 gap-2 border-b border-[var(--dna-accent)]/25 pb-4 font-mono text-xs uppercase tracking-[0.08em] text-[var(--dna-accent)] md:grid-cols-3 md:items-center">
            <span>CHAMBER // {activeWorld.citadelSector}</span>
            <span className="text-[var(--dna-text)] md:text-center">
              {activeWorld.primaryDirective}
            </span>
            <span className="md:text-right">
              {activeWorld.canonicalAlias ?? activeWorld.harmonicFrequency}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-between border-b border-[var(--dna-accent)]/20 pb-8 lg:col-span-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--dna-accent)]">
                    {activeWorld.citadelSector}
                  </span>
                  <span className="rounded-full border border-[var(--dna-accent)]/40 bg-[var(--dna-accent)]/10 px-3 py-0.5 font-mono text-[11px] tracking-[0.15em] text-[var(--dna-accent)]">
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
                      <h3 className="font-monument text-2xl tracking-[0.16em] text-[var(--dna-text)] sm:text-3xl">
                        {activeWorld.name}
                      </h3>
                      <span dir="rtl" lang="ar" className="text-xl text-[var(--dna-accent)]/95">
                        {activeWorld.arabicEpithet}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-[var(--dna-muted)]">
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
                      className="border border-[var(--dna-accent)]/30 bg-[var(--dna-surface)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--dna-accent)]"
                    >
                      {pillarLabel}
                    </span>
                  ))}
                  <span className="border border-[var(--dna-accent)]/30 bg-[var(--dna-accent)]/10 px-3 py-1 font-mono text-xs text-[var(--dna-accent)]">
                    {activeWorld.summaryLabel}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-[var(--dna-accent)]">
                  SANCTUARY CODICES & DISPATCHES
                </p>
                <div className="space-y-2.5">
                  {activeWorld.artifacts.map((artifactRecord) => {
                    const isCurrentArtifact = artifactRecord.code === selectedArtifact.code;
                    return (
                      <Button
                        key={artifactRecord.code}
                        type="button"
                        variant="plain"
                        onClick={() =>
                          triggerSacredViewTransition(() => {
                            setSelectedArtifactCode(artifactRecord.code);
                          }, quietMode)
                        }
                        className={`h-auto min-h-[44px] w-full cursor-pointer flex-col items-stretch justify-start gap-0 border p-3.5 text-left transition-colors ${
                          isCurrentArtifact
                            ? "border-[var(--dna-accent)] bg-[var(--dna-accent)]/14"
                            : "border-[var(--dna-accent)]/20 bg-[var(--dna-canvas)] hover:border-[var(--dna-accent)]/45"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] text-[var(--dna-accent)]">
                          <span>{artifactRecord.code}</span>
                          <span>{artifactRecord.timestampLabel}</span>
                        </div>
                        <div className="font-monument mt-1 text-sm font-medium tracking-[0.06em] text-[var(--dna-text)]">
                          {artifactRecord.title}
                        </div>
                        <div className="mt-0.5 font-sans text-xs text-[var(--dna-muted)]">
                          {artifactRecord.classification}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between lg:col-span-7">
              <div className="border border-[var(--dna-accent)]/30 bg-gradient-to-r from-[var(--dna-surface)] via-[var(--dna-surface-elevated)] to-[var(--dna-surface)] p-5">
                <div className="flex items-center justify-between font-mono text-xs text-[var(--dna-accent)]">
                  <span>SELECTED RECORD // {selectedArtifact.code}</span>
                  <span>{selectedArtifact.classification}</span>
                </div>
                <h4 className="font-monument mt-2 text-lg tracking-[0.08em] text-[var(--dna-text)] sm:text-xl">
                  {selectedArtifact.title}
                </h4>
                <p className="mt-2 font-serif text-sm leading-relaxed text-[var(--dna-muted)] sm:text-base">
                  {selectedArtifact.summary}
                </p>
              </div>

              <div className="mt-6 flex-1 border border-[var(--dna-accent)]/25 bg-[var(--dna-canvas)] p-6">
                {activeWorld.id === "moonwitness" && <MoonwitnessMeridianConsole />}
                {activeWorld.id === "arsy" && <ArsyCarrierConsole quietMode={quietMode} />}
                {activeWorld.id === "human-pen" && (
                  <QalamScriptoriumConsole quietMode={quietMode} />
                )}
                {activeWorld.id === "sidra" && <SidraKnowledgeConsole />}
                {activeWorld.id === "rocksoul-dx" && (
                  <RocksoulMandalaConsole quietMode={quietMode} />
                )}
                {activeWorld.id === "crayon" && <CrayonSpectrumConsole />}
                {activeWorld.id === "sin-can" && <SinCanConsole />}
                {activeWorld.id === "mythos" && <MythosCaseConsole />}
                {activeWorld.id === "angel-with-shotgun" && <AwsNormativeConsole />}
              </div>
            </div>
          </div>
        </DnaChamber>
      </MotionReveal>
    </StorySection>
  );
}
