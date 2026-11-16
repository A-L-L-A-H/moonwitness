import type { CodexSearchEntry, EntryDoorMeta, ManifestoLine } from "./types";

export const SUPREME_IDENTITY = {
  fullExpansion: "Accountable Life, Learning & Action Hub",
  empireName: "Empire of the Light",
  tawhidPrinciple:
    "LĀ ILĀHA ILLALLĀH — Zero Kultus Individu, Zero Klaim Kenabian, Zero Klaim Wahyu Baru.",
  tawhidMotto: "Only You. Your Deeds. And ALLAH.",
  monocentricFormula:
    "1 = ONE GOD (Tawhid) · 6 = CREATION (Six Ayyām) · 3 = HIZAB (Hijab, Hudud, Barzakh)",
  creativeFormula: "INPUT = OUTPUT · SIN CAN BE BETTER HUMAN · OFFSIDE → ONSIDE",
} as const;

export const OWNER_FOUR_LINE_MANIFESTO: readonly ManifestoLine[] = [
  {
    index: "01",
    line: "NO CLUE WHAT'S COMING.",
    interpretation: "Radical humility before Al-Ghaib; rejecting false certainty over tomorrow.",
  },
  {
    index: "02",
    line: "NO IDEA HOW THIS ENDS.",
    interpretation: "Surrendering final outcomes while upholding relentless daily craftsmanship.",
  },
  {
    index: "03",
    line: "COULD BE RIGHT. COULD BE WRONG.",
    interpretation:
      "Intellectual honesty and openness to Positive Correction (QS Al-Mā'idah 5:48).",
  },
  {
    index: "04",
    line: 'BUT I KNOW WHO SAID: "I\'LL FINISH IT."',
    interpretation:
      "Unshakeable trust in Allah's promise (QS Al-Qasas 28:7–8) as anchor of action.",
  },
] as const;

export const FOUR_ENTRY_DOORS: readonly EntryDoorMeta[] = [
  {
    id: "story-universe",
    numeral: "DOOR I",
    title: "STORY UNIVERSE & 99 CHAPTERS",
    subtitle: "V10 Narrative · MoonWitness II/XII · GOD-PROMISE · AETHERION 100",
    sourceSpec: "moonwitnessxv · moonwitness-II · moonwitness-xii · dx/NARATION.md",
    linkedWorldId: "moonwitness",
    summary:
      "Enter the 4 Lenses across 99 chapters, 8 Story Eras, 13 Platform Functions, 33 World Patches, AETHERION 100 Levels, PARADISE V3, and transmissions.",
  },
  {
    id: "epistemic-corpus",
    numeral: "DOOR II",
    title: "UNIVERSAL CORPUS & EPISTEMIC LAB",
    subtitle: "6+1 ROCKSOUL Domains · SRGBL v8 · P18 Key Witness · WHCMT / Case 001",
    sourceSpec: "moonwitness-corpus · rocksoul-* · witness-semantic-engine",
    linkedWorldId: "sidra",
    summary:
      "Audit scripture, narrative, history, law, and correlation through SRGBL v8, P18 Key Witness v0, Four-Corpus Policy, and WHCMT vs BASS-HUNTER.",
  },
  {
    id: "empire-organization",
    numeral: "DOOR III",
    title: "100CENTER & EMPIRE ORGANIZATION",
    subtitle: "Prime Code PC01–PC09 · WINGS 10 · G.O.D. 99 Directory · 25 Amanah",
    sourceSpec: "bjo163/empire-of-the-light · A-L-L-A-H/master-docs · dhgs",
    linkedWorldId: "qalam",
    summary:
      "Inspect constitutional axioms, WINGS 10 (W01 SKYLINK – W10 HAVEN), all 99 G.O.D. unassigned ethical stewardship slots, and 25 Bidang Amanah.",
  },
  {
    id: "sovereign-runtimes",
    numeral: "DOOR IV",
    title: "SOVEREIGN ECOSYSTEM & 368-REPO ATLAS",
    subtitle: "OX-DX 49 Levels · M-Time Antikythera · AQEL · DHGS 13-Step · Quarantine",
    sourceSpec: "universal-ontology-engine · antikythera-time · AQEL · 368+ Repos",
    linkedWorldId: "arsy",
    summary:
      "Explore the 7×7 OX-DX ontology pyramid (01 UNIVERSE → 49 BIT), MCLOCK-1, AQEL, DHGS 13-step assurance loop, and Quarantined Ambiguity Ledger.",
  },
] as const;

export const CODEX_SEARCH_INDEX: readonly CodexSearchEntry[] = [
  {
    id: "cx-srgbl-v8",
    doorId: "epistemic-corpus",
    category: "SRGBL v8 · 5-Stage Pipeline",
    title: "SRGBL v8 & Symbolic RGBL",
    subtitle: "S1 Source & Sense → R2 Reality → G3 Governing Order → B4 Being → L5 Light",
    repoSource: "bjo163/moonwitness-corpus · bjo163/ALLAH-CRAYON-RGBL-ENGINE",
  },
  {
    id: "cx-p18-key-witness",
    doorId: "epistemic-corpus",
    category: "P18 Key Witness v0 · 9-Layer Spine",
    title: "P18 Key Witness v0, 20 Controlled Keys & Four-Corpus Policy",
    subtitle: "AL-QURAN muhaimin vs TAURAT/ZABUR/INJIL · WHCMT 2×4 vs BASS-HUNTER UNKNOWN",
    repoSource: "bjo163/moonwitness-corpus · bjo163/propetic",
  },
  {
    id: "cx-monocentric-163",
    doorId: "story-universe",
    category: "GOD-PROMISE · Ontology",
    title: "Monocentric 1·6·3 & 3 Promise Tracks",
    subtitle: "1 Tawhid · 6 Creation Ayyām · 3 Hizab + INPUT = OUTPUT",
    repoSource: "A-L-L-A-H/master-docs · bjo163/moonwitnessxv",
  },
  {
    id: "cx-aetherion-paradise",
    doorId: "story-universe",
    category: "AETHERION 100 & PARADISE V3",
    title: "AETHERION 10 Realms (100 Levels) & PARADISE V3 (105 Champions)",
    subtitle: "001–033 Open / 034–100 Sealed · Formula S = 30R + 25V + 25F + 20E ≥ 80",
    repoSource: "bjo163/monwitness-xii · bjo163/moonwitness-xii-season-global-championships",
  },
  {
    id: "cx-world-patches-33",
    doorId: "story-universe",
    category: "World Patches · #001–#033",
    title: "33 World Patches Registry & Dual #014 Conflict Disclosure",
    subtitle: "FAMILY WITHOUT FEAR vs THE WRONG WAY — HELLROAD · 0 divine approvals",
    repoSource: "bjo163/moonwitness-xii · MASTER_BUG_PATCH_33_V2.md",
  },
  {
    id: "cx-dx-manga",
    doorId: "story-universe",
    category: "DX Storyboard · Owner Manifesto",
    title: "SIN CAN BE BETTER HUMAN & 4-Line Owner Manifesto",
    subtitle: "GOGOGO → SHUUU → BAAAN → DODODO + NOISE × SILENCE 4-Line Copy",
    repoSource: "BRIDGE-ALLAH/MOONWITNESS (Z:\\repo\\dx\\NARATION.md) · A-L-L-A-H/master-docs",
  },
  {
    id: "cx-manusia-pulpen",
    doorId: "story-universe",
    category: "GATE Transmission · Story World",
    title: "MANUSIA PULPEN & AngelWithShotgun Ch.01",
    subtitle: "Featured MoonFrame gate transmissions & Kingslayer Unity Agreement",
    repoSource: "bjo163/A-L-L-A-H.COM",
  },
  {
    id: "cx-jerusalem-70ce",
    doorId: "epistemic-corpus",
    category: "ROCKSOUL Correlation · Case 001",
    title: "Shared Case 001: Jerusalem 70 CE",
    subtitle: "Mark 13:2 + Josephus + Arch of Titus + Roman siege law (OFFSIDE → ONSIDE)",
    repoSource: "bjo163/rocksoul-correlation",
  },
  {
    id: "cx-100center",
    doorId: "empire-organization",
    category: "Empire Organization · Stewardship",
    title: "100CENTER & Full G.O.D. 99 Unassigned Personas",
    subtitle: "99 Human Ethical Stewardship Nodes (D01–D09) orbiting 1 Tawhid Center",
    repoSource: "bjo163/empire-of-the-light · A-L-L-A-H/master-docs",
  },
  {
    id: "cx-amanah-25",
    doorId: "empire-organization",
    category: "Pedagogical Atlas · 25 Bidang Amanah",
    title: "25 Bidang Amanah (01 Adam → 25 Muhammad ﷺ)",
    subtitle: "Prophetic stewardship anchors incl. 19 Ilyas (ṬĀGHŪT rejected)",
    repoSource: "Z:\\.raw_archives\\chatgpt_mohrezzafahlevi\\conversations-001[33]",
  },
  {
    id: "cx-wings-10",
    doorId: "empire-organization",
    category: "Empire Organization · WINGS 10",
    title: "WINGS 10 Operational Array (W01 SKYLINK – W10 HAVEN)",
    subtitle: "10 proposed guardian functions (PROPOSED_NOT_ASSIGNED) & Prime Code PC01–PC09",
    repoSource: "bjo163/empire-of-the-light",
  },
  {
    id: "cx-oxdx-49",
    doorId: "sovereign-runtimes",
    category: "Sovereign Engine · OX-DX",
    title: "OX-DX 49-Level Ontology Pyramid",
    subtitle: "7 Zones × 7 Levels from 01 UNIVERSE down to 49 BIT",
    repoSource: "bjo163/universal-ontology-engine",
  },
  {
    id: "cx-mtime-antikythera",
    doorId: "sovereign-runtimes",
    category: "Sovereign Engine · M-Time",
    title: "MCLOCK-1 Virtual Antikythera & Hijri Criteria",
    subtitle: "JPL DE440 · IERS · MABIMS_ID_2026 · DIYANET_1978_VISIBILITY",
    repoSource: "bjo163/antikythera-time",
  },
  {
    id: "cx-aqel-dhgs",
    doorId: "sovereign-runtimes",
    category: "Sovereign Engine · AQEL & DHGS",
    title: "AQEL Arabic-First Language, DHGS 13-Step Loop & Quarantine Ledger",
    subtitle: "RECEIVE → KNOW → VERIFY → ASSIGN → ... → LEARN + §VII Open Ambiguities",
    repoSource: "bjo163/AQEL · bjo163/dhgs · MASTER-CANON-CROSS-REPO-CODEX",
  },
] as const;
