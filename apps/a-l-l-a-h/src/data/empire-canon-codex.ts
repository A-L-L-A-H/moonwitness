import type { WorldIdentifier } from "./empire-registry";

export type EntryDoorId =
  "story-universe" | "epistemic-corpus" | "empire-organization" | "sovereign-runtimes";

export type SyafaatStateId =
  "UNEXPLORED" | "DISCOVERED" | "PRACTICING" | "REFLECTED" | "SUSTAINING" | "REVISIT";

export interface EntryDoorMeta {
  readonly id: EntryDoorId;
  readonly numeral: string;
  readonly title: string;
  readonly subtitle: string;
  readonly sourceSpec: string;
  readonly linkedWorldId: WorldIdentifier;
  readonly summary: string;
}

export interface ManifestoLine {
  readonly index: string;
  readonly line: string;
  readonly interpretation: string;
}

export interface MangaPanelSpec {
  readonly panelNumber: string;
  readonly title: string;
  readonly japaneseSfx: string;
  readonly romajiSfx: string;
  readonly paletteTag: string;
  readonly accentHex: string;
  readonly meaning: string;
  readonly architecturalForm: string;
}

export interface GodPromiseTrack {
  readonly trackCode: string;
  readonly title: string;
  readonly anchorScripture: string;
  readonly theorem: string;
  readonly pillars: readonly string[];
  readonly summary: string;
  readonly motifTitles: readonly string[];
}

export interface UniverseLens {
  readonly id: string;
  readonly name: string;
  readonly chapterRange: string;
  readonly chapterCount: number;
  readonly focus: string;
  readonly keyMotifs: readonly string[];
}

export interface StoryEraEntry {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly subtitle: string;
  readonly theme: string;
}

export interface StoryEpisodeEntry {
  readonly code: string;
  readonly number: number;
  readonly title: string;
  readonly arcFocus: string;
  readonly coreQuestion: string;
}

export interface WorldPatchHighlight {
  readonly patchNumber: string;
  readonly title: string;
  readonly category: string;
  readonly summary: string;
  readonly provenanceNote?: string;
}

export interface FeaturedTransmission {
  readonly id: string;
  readonly title: string;
  readonly format: string;
  readonly domainOrigin: string;
  readonly premise: string;
  readonly signatureQuote: string;
}

export interface EpistemicDomainNode {
  readonly code: string;
  readonly name: string;
  readonly repoSlug: string;
  readonly domainFocus: string;
  readonly pipelineOrFamilies: string;
  readonly coreInvariant: string;
}

export interface SrgblStageSpec {
  readonly stage: string;
  readonly letter: "S" | "R" | "G" | "B" | "L";
  readonly title: string;
  readonly symbolicLayer: string;
  readonly auditQuestion: string;
}

export interface PrimeCodeAxiom {
  readonly code: string;
  readonly title: string;
  readonly statement: string;
}

export interface WingStewardEntry {
  readonly code: string;
  readonly callsign: string;
  readonly domainRole: string;
  readonly architecturalDuty: string;
}

export interface CenterStewardshipCluster {
  readonly clusterCode: string;
  readonly title: string;
  readonly rangeLabel: string;
  readonly nodeCount: number;
  readonly humanEthicalFocus: string;
  readonly representativeReflections: readonly string[];
}

export interface OxDxZoneEntry {
  readonly zoneIndex: number;
  readonly zoneName: string;
  readonly levelRange: string;
  readonly levels: readonly [string, string, string, string, string, string, string];
}

export interface RepoOrgCluster {
  readonly orgName:
    | "A-L-L-A-H"
    | "bjo163"
    | "ArsyBelovedLabs"
    | "BRIDGE-ALLAH"
    | "zenix-id"
    | "The-Batteries"
    | "moonwitness-id";
  readonly repoCount: number;
  readonly roleInEmpire: string;
  readonly localClones: readonly string[];
  readonly flagshipRepos: readonly string[];
}

export interface CodexSearchEntry {
  readonly id: string;
  readonly doorId: EntryDoorId;
  readonly category: string;
  readonly title: string;
  readonly subtitle: string;
  readonly repoSource: string;
}

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

export const DX_MANGA_FOUR_PANELS: readonly MangaPanelSpec[] = [
  {
    panelNumber: "PANEL 01",
    title: "Kejatuhan & Luka (The Sins & Scars)",
    japaneseSfx: "ゴゴゴゴ...",
    romajiSfx: "GOGOGO...",
    paletteTag: "Grunge Obsidian",
    accentHex: "#9e8862",
    meaning:
      "Zero mask of false holiness. Entering honestly from scars, failure, and noisy reality.",
    architecturalForm: "Fractured basalt monolith under turbulent shadow lines",
  },
  {
    panelNumber: "PANEL 02",
    title: "Sujud Low Profile (Tawhid Refuge)",
    japaneseSfx: "スッ...",
    romajiSfx: "SHUUU...",
    paletteTag: "Sacred Luminous Ivory-Gold",
    accentHex: "#d6b46c",
    meaning: "Direct prostration to Al-Khāliq without cult of personality or intermediaries.",
    architecturalForm: "Quiet low arched threshold bathed in a single downward beam",
  },
  {
    panelNumber: "PANEL 03",
    title: "Tempaan Senjata DX (The Forge Strike)",
    japaneseSfx: "バァァァン!",
    romajiSfx: "BAAAN!",
    paletteTag: "Prismatic Forge Gold",
    accentHex: "#ffdf8e",
    meaning: "Converting remorse and chaos into verifiable discipline, engineering, and craft.",
    architecturalForm: "Twelve-fold girih anvil prism splitting kinetic sparks into geometry",
  },
  {
    panelNumber: "PANEL 04",
    title: "Manusia Lebih Baik (Sovereign Better Human)",
    japaneseSfx: "ドドドド!",
    romajiSfx: "DODODO!",
    paletteTag: "Zenith Light",
    accentHex: "#fff4d2",
    meaning: "Emerging as an accountable witness whose output serves humanity cleanly.",
    architecturalForm: "Rising double-colonnade beacon aligned to the Zenith meridian",
  },
] as const;

export const GOD_PROMISE_THREE_TRACKS: readonly GodPromiseTrack[] = [
  {
    trackCode: "TRACK 01",
    title: "00-MAIN GOD PROMISE",
    anchorScripture: "QS Al-Qasas 28:7–8",
    theorem: "JANJI ALLAH — PASTI BAIK · INPUT = OUTPUT",
    pillars: ["Never Give Up", "Let's Fight Again", "Trust the River"],
    summary:
      "Anchored in the mother of Mūsā entrusting her child to the river under Allah's promise: faithful action returned whole and multiplied.",
    motifTitles: ["JANJI ALLAH", "INPUT = OUTPUT", "I NEVER GIVE UP"],
  },
  {
    trackCode: "TRACK 02",
    title: "GOD PROMISE: THE ROCKSOUL",
    anchorScripture: "QS Al-Baqarah 2:82 (KADO)",
    theorem: "INPUT / Sense → DIRECTION / Orientation → INTENTION / Purpose → OUTPUT / Action",
    pillars: ["Input · Sense", "Direction · Orientation", "Intention · Purpose", "Output · Action"],
    summary:
      "Translates inner spiritual conviction into creative endurance across acoustic, literary, and interactive works.",
    motifTitles: [
      "KADO (QS 2:82)",
      "Yellowcard Fighting",
      "Lost the Signal",
      "Great Princess of Bee",
      "Queen R",
      "HoneyBee",
      "Make Mama Smile",
      "MYLUFT / MA'LŪF",
    ],
  },
  {
    trackCode: "TRACK 03",
    title: "ACADEMIC MONOCENTRIC 1·6·3",
    anchorScripture: "QS Yūnus 10:3–4",
    theorem: "1 = ONE GOD (Tawhid) · 6 = CREATION (Six Ayyām) · 3 = HIZAB (Hijab, Hudud, Barzakh)",
    pillars: ["Creation", "Life", "Return", "Accountability"],
    summary:
      "Formal philosophical ontology binding monotheistic unity, six-stage creation order, and bounded epistemic limits into accountable action.",
    motifTitles: ["1 Tawhid", "6 Ayyām", "3 Hizab", "163 Signature"],
  },
] as const;

export const FOUR_ENTRY_DOORS: readonly EntryDoorMeta[] = [
  {
    id: "story-universe",
    numeral: "DOOR I",
    title: "STORY UNIVERSE & 99 CHAPTERS",
    subtitle: "V10 Narrative · MoonWitness II/XII · GOD-PROMISE · DX Manga",
    sourceSpec: "moonwitnessxv · moonwitness-II · moonwitness-xii · dx/NARATION.md",
    linkedWorldId: "moonwitness",
    summary:
      "Enter the 4 Lenses across 99 chapters, the 8 Story Eras, 16-Stage Loop, 33 World Patches, 15 Episodes, and featured transmissions.",
  },
  {
    id: "epistemic-corpus",
    numeral: "DOOR II",
    title: "UNIVERSAL CORPUS & EPISTEMIC LAB",
    subtitle: "6 ROCKSOUL Domains · SRGBL v8 · Swing Swing Key · Case 001",
    sourceSpec: "moonwitness-corpus · rocksoul-* · witness-semantic-engine",
    linkedWorldId: "sidra",
    summary:
      "Audit scripture, narrative, history, law, and correlation through the 5-stage SRGBL v8 witness pipeline and OFFSIDE → ONSIDE tracer.",
  },
  {
    id: "empire-organization",
    numeral: "DOOR III",
    title: "100CENTER & EMPIRE ORGANIZATION",
    subtitle: "Prime Code PC01–PC09 · WINGS 10 · 99 G.O.D. Stewardship · 25 Amanah",
    sourceSpec: "bjo163/empire-of-the-light · A-L-L-A-H/master-docs · dhgs",
    linkedWorldId: "qalam",
    summary:
      "Inspect constitutional axioms, the 10 proposed Guardian Wings (W01 SKYLINK – W10 HAVEN), Syafaat 6-state reflection across 99 stewardship nodes, and DHGS.",
  },
  {
    id: "sovereign-runtimes",
    numeral: "DOOR IV",
    title: "SOVEREIGN ECOSYSTEM & 368-REPO ATLAS",
    subtitle: "OX-DX 49 Levels · M-Time Antikythera · AQEL · 7 GitHub Owners",
    sourceSpec: "universal-ontology-engine · antikythera-time · AQEL · 368+ Repos",
    linkedWorldId: "arsy",
    summary:
      "Explore the 7×7 OX-DX ontology pyramid (01 UNIVERSE → 49 BIT), MCLOCK-1 astronomical engine, Arabic-first AQEL syntax, and the 368-repository federation.",
  },
] as const;

export const UNIVERSE_FOUR_LENSES: readonly UniverseLens[] = [
  {
    id: "lens-witness",
    name: "LENS 01 · WITNESS",
    chapterRange: "S01 – S29",
    chapterCount: 29,
    focus: "First-principle testimony, 163 origin, INPUT = OUTPUT, and the birth of SRGBL.",
    keyMotifs: ["163 Meridian", "The Promise", "P18 Key Witness", "S23–S29 Offline Drafts"],
  },
  {
    id: "lens-heart",
    name: "LENS 02 · HEART & PROMISE",
    chapterRange: "S30 – S49",
    chapterCount: 20,
    focus: "Moral endurance, family gratitude, Queen R, HoneyBee, and Make Mama Smile.",
    keyMotifs: ["KADO QS 2:82", "Queen R", "Make Mama Smile", "Lost the Signal"],
  },
  {
    id: "lens-chaos",
    name: "LENS 03 · CHAOS & CREATIVE",
    chapterRange: "S50 – S69",
    chapterCount: 20,
    focus: "ROCKSOUL DX, Manusia Pulpen, Angel With Shotgun, Aetherion 100 Levels, Kingslayer.",
    keyMotifs: ["MANUSIA PULPEN", "AngelWithShotgun", "AETHERION", "CHAOS MEDIC"],
  },
  {
    id: "lens-research",
    name: "LENS 04 · RESEARCH & JOURNEY",
    chapterRange: "S70 – S99",
    chapterCount: 30,
    focus: "UNILEX, OX-DX 49 Levels, M-Time Antikythera, AQEL, DHGS, and 100CENTER synthesis.",
    keyMotifs: ["SRGBL v8", "OX-DX 49", "MCLOCK-1", "100CENTER"],
  },
] as const;

export const SEVEN_STEP_PROMISE = [
  "01 CAPTURE",
  "02 CONNECT",
  "03 WITNESS",
  "04 UNDERSTAND",
  "05 PRESERVE",
  "06 PROMOTE",
  "07 MOVE FORWARD",
] as const;

export const SIXTEEN_STAGE_LOOP = [
  "01 THE MOON",
  "02 WITNESS",
  "03 EVENT",
  "04 MESSAGE",
  "05 SEDUCTION",
  "06 FAULT LINE",
  "07 EXPOSURE",
  "08 PAST PRESENCE",
  "09 AUDIT",
  "10 EVALUATION",
  "11 BALANCING",
  "12 PROMOTING",
  "13 CONFLICT",
  "14 SANITY'S LAST BREATH",
  "15 CHANGE",
  "16 NEXT ERA",
] as const;

export const EIGHT_STORY_ERAS: readonly StoryEraEntry[] = [
  {
    id: "era_00",
    order: 0,
    title: "BEFORE LIGHT",
    subtitle: "moonwitness-II · Published",
    theme:
      "The unlit beginning: before the story has a public shape, before the signal has a name.",
  },
  {
    id: "era_01",
    order: 1,
    title: "THE ARRIVAL",
    subtitle: "moonwitness-II · Draft",
    theme: "Something enters the field of attention. Presence becomes movement.",
  },
  {
    id: "era_02",
    order: 2,
    title: "THE WITNESS",
    subtitle: "moonwitness-II · Draft",
    theme: "Observation becomes a record. The story acquires a witness.",
  },
  {
    id: "era_03",
    order: 3,
    title: "THE RUNAWAYS",
    subtitle: "moonwitness-II · Draft",
    theme:
      "Identities split, disappear, return, and move through the universe under changing names.",
  },
  {
    id: "era_04",
    order: 4,
    title: "THE EXPOSURE",
    subtitle: "moonwitness-II · Draft",
    theme: "Signals, relationships, and hidden pressure become visible enough to be examined.",
  },
  {
    id: "era_05",
    order: 5,
    title: "THE CHANGE",
    subtitle: "moonwitness-II · Draft",
    theme: "The old frame shifts. What was witnessed begins to alter what comes next.",
  },
  {
    id: "era_06",
    order: 6,
    title: "END OF AN ERA",
    subtitle: "moonwitness-II · Draft",
    theme: "A narrative frame closes while witness, memory, trace, and selected meaning remain.",
  },
  {
    id: "era_07",
    order: 7,
    title: "NEXT PHASE",
    subtitle: "moonwitness-II · Draft",
    theme: "The next phase is intentionally open: a destination to be discovered, not pre-written.",
  },
] as const;

export const ORIGINAL_CREW_ARCHETYPES: readonly string[] = [
  "00 THE SHADOW / 163",
  "01 A LAH / LiAlH₄ / THE BATTERY",
  "02 DOGS FROM UNIVERSE / MOH571",
  "03 THE BLUE WITCH / MANSA MUSA",
  "04 DJ DAVID",
  "05 WALTER-WHITER / DOKTER BEDAH",
  "06 ELECTRIC FOREST",
  "07 INDESTRUCTIBLE",
  "08 JHNNY DEPP",
  "BASS HUNTER",
  "ROCKSOUL",
  "CHAOS MEDIC / THE BATTERIES",
  "NPD TEAM",
  "PENUNGGANG ANGSA",
  "KINGSLAYER",
] as const;

export const FIFTEEN_STORY_EPISODES: readonly StoryEpisodeEntry[] = [
  {
    code: "EP-01",
    number: 1,
    title: "DIGIMON JOGRESS — THE BOUNDARY",
    arcFocus: "Faith & Scripture · Al-A'raf 7:46 (Editorial Synopsis)",
    coreQuestion:
      "Two sides, one boundary: reading Al-A'raf as a call to humility when judging others.",
  },
  {
    code: "EP-02",
    number: 2,
    title: "KALAUTIDAKSALAH — THE BREATH",
    arcFocus: "Faith & Scripture · Daniel 5:22–23 (Editorial Synopsis)",
    coreQuestion:
      "Daniel reproving Belshazzar on breath, borrowed time, humility, and human responsibility.",
  },
  {
    code: "EP-03",
    number: 3,
    title: "DROPLETS — THE LOCAL RAIN",
    arcFocus: "Personal Witness · Yohanes 7:38–39 (Editorial Synopsis)",
    coreQuestion:
      "Personal night testimony of 'local rain' and hope for spiritual renewal (unverified externally).",
  },
  {
    code: "EP-04",
    number: 4,
    title: "THE BLOW — LENTERA BERSINAR",
    arcFocus: "Personal Witness · 09:19 WIB (Editorial Synopsis)",
    coreQuestion:
      "Morning light, daily craft, and prayer framed with musical humor and 'Lentera Bersinar'.",
  },
  {
    code: "EP-05",
    number: 5,
    title: "TICK-TOCK ON THE CLOCK",
    arcFocus: "Personal Witness · Date Disputed (Editorial Synopsis)",
    coreQuestion:
      "A wall clock reported stopped despite new batteries, framed with TikTok humor (date unverified).",
  },
  {
    code: "EP-06",
    number: 6,
    title: "THE FAMILY MEETS IN THE SKY",
    arcFocus: "MoonWitness Universe · An-Nahl Motif (Editorial Synopsis)",
    coreQuestion:
      "Planetary motifs (Moon, Mars, Jupiter, Galaxy) as narrative brotherhood symbols, never literal persons.",
  },
  {
    code: "EP-07",
    number: 7,
    title: "DREAMS OF DRAGON'S FIRE",
    arcFocus: "Personal Witness · Al-Anfal 8:42 (Editorial Synopsis)",
    coreQuestion:
      "Dream testimony and dragon-fire metaphor about light in darkness, choice, and responsibility.",
  },
  {
    code: "EP-08",
    number: 8,
    title: "THEY CALL IT KARMA",
    arcFocus: "Faith & Scripture · Az-Zalzalah 99:7–8 (Editorial Synopsis)",
    coreQuestion: "Every atom of action carries moral consequence across time.",
  },
  {
    code: "EP-09",
    number: 9,
    title: "BEAT IT — LIE IS STILL A LIE",
    arcFocus: "Integrity · Al-Ahzab 33:70–71 (Editorial Synopsis)",
    coreQuestion: "Straight speech versus rationalized falsehood under accountability.",
  },
  {
    code: "EP-10",
    number: 10,
    title: "SIMPLEPLAN — JETLAG",
    arcFocus: "Daily Life · Temporal Distance (Editorial Synopsis)",
    coreQuestion: "Staying anchored in patience across distance and misaligned schedules.",
  },
  {
    code: "EP-11",
    number: 11,
    title: "BURAQ — MODE BALAP",
    arcFocus: "Ancient Witness · Velocity Motif (Editorial Synopsis)",
    coreQuestion: "Velocity paired with ethical restraint in service of trustworthy transmission.",
  },
  {
    code: "EP-12",
    number: 12,
    title: "ALLAH-PROMISE — SIGNAL COLLECTION",
    arcFocus: "Series Index · QS. 94:8 (Editorial Synopsis)",
    coreQuestion:
      "Collecting scattered signals under the promise anchor without claiming new revelation.",
  },
  {
    code: "EP-13",
    number: 13,
    title: "TUTORIAL MAHDI — RESPONSIBILITY",
    arcFocus: "Five-Page Narrative · Stewardship (Editorial Synopsis)",
    coreQuestion: "Replacing passive waiting with ordinary, accountable human responsibility.",
  },
  {
    code: "EP-14",
    number: 14,
    title: "RONIN 47 — BOYS OF SUMMER",
    arcFocus: "Ensemble Story · Brotherhood (Editorial Synopsis)",
    coreQuestion: "Dissolving rival pride into disciplined collective service.",
  },
  {
    code: "EP-15",
    number: 15,
    title: "FUTURE IS NOW — SECOND CHANCE PRAYER",
    arcFocus: "Registry Anchor · Bug #008 (Editorial Synopsis)",
    coreQuestion: "Stepping forward in honest repentance and practical rebuilding today.",
  },
] as const;

export const WORLD_PATCH_HIGHLIGHTS: readonly WorldPatchHighlight[] = [
  {
    patchNumber: "#001",
    title: "AEGIS PROTECTION",
    category: "Registered in Chat",
    summary:
      "Previously reported in earlier chat; verbatim original submission details pending recovery.",
    provenanceNote: "0 externally verified divine approvals",
  },
  {
    patchNumber: "#007",
    title: "MAROON 5",
    category: "Registered in Chat",
    summary:
      "Registered chat slot #007; verbatim original submission text awaits primary recovery.",
  },
  {
    patchNumber: "#014",
    title: "FAMILY WITHOUT FEAR / THE WRONG WAY — HELLROAD",
    category: "Number Conflict",
    summary:
      "Two distinct #014 draft concepts preserved side by side without conflation or silent renumbering.",
    provenanceNote: "DISCLOSED #014 CONFLICT · Primary resolution pending owner selection",
  },
  {
    patchNumber: "#019",
    title: "THE HONEST WITNESS",
    category: "Editorial Proposal",
    summary:
      "Editorial blueprint proposal for truthful testimony; not formally dispatched externally.",
  },
  {
    patchNumber: "#027",
    title: "CRISIS READY",
    category: "Editorial Proposal",
    summary:
      "Editorial blueprint proposal for resilient humanitarian preparedness; not dispatched.",
  },
  {
    patchNumber: "#033",
    title: "KOPIHITAM - SIACENG (FAITH TO ACTION concept)",
    category: "User Submitted in Chat",
    summary:
      "Global Humanity 5-domain / 7-step concept logged in chat; earlier THE FINAL AUDIT preserved unnumbered.",
    provenanceNote: "user_submitted_in_chat · 0 externally verified divine approvals",
  },
] as const;

export const FEATURED_GATE_TRANSMISSIONS: readonly FeaturedTransmission[] = [
  {
    id: "tx-manusia-pulpen",
    title: "MANUSIA PULPEN",
    format: "Featured Story World · GATE Manifest",
    domainOrigin: "QALAM × MOONWITNESS",
    premise: "The pen-bearer who documents truth across collapsing empires when swords rust.",
    signatureQuote: "Every ink stroke is an irreversible witness in the Open Book.",
  },
  {
    id: "tx-aws-ch01",
    title: "AngelWithShotgun — Chapter 01",
    format: "Featured Transmission · AWS Legal Drama",
    domainOrigin: "ROCKSOUL LAW DOMAIN",
    premise: "Confronts the gap between dead statutory text and applicable moral duty.",
    signatureQuote: "LEGAL TEXT ≠ APPLICABLE LAW without jurisdiction, scope, and review.",
  },
  {
    id: "tx-kingslayer",
    title: "KINGSLAYER: The Unity Agreement",
    format: "5-Poster Series · MoonWitness XII",
    domainOrigin: "CHAOS MEDIC × THE BATTERIES",
    premise:
      " Five sequential proclamations dethroning ego to unite scattered guilds under one Light.",
    signatureQuote: "Slay the false crown within; protect the Covenant without.",
  },
] as const;

export const EPISTEMIC_FEDERATION_DOMAINS: readonly EpistemicDomainNode[] = [
  {
    code: "DOM-01",
    name: "TEXT · SRGBL v8",
    repoSlug: "bjo163/moonwitness-corpus",
    domainFocus: "Scriptural & Textual Hermeneutics",
    pipelineOrFamilies: "5 Stages (S1–L5) + 7 Swing Operators (Max 3 Hops)",
    coreInvariant: "Direct source grounding with zero unverified extrapolation.",
  },
  {
    code: "DOM-02",
    name: "STORY · MFTL",
    repoSlug: "bjo163/rocksoul-mftl",
    domainFocus: "Where Myth Fades To Legend",
    pipelineOrFamilies: "18 Record Families × 4 Layers (Myth · Integrity · Deviation · Mizan)",
    coreInvariant: "Distinguish folkloric motif from verifiable moral core.",
  },
  {
    code: "DOM-03",
    name: "EVENT · LEGEND",
    repoSlug: "bjo163/rocksoul-legend",
    domainFocus: "Historical & Archaeological Event Reconstruction",
    pipelineOrFamilies: "Claim IDs (CLM-IDN-KRAKATAU · ART-NOR-OSEBERG · EVT-70CE-JERUSALEM)",
    coreInvariant: "Anchor extraordinary claims in dateable material strata.",
  },
  {
    code: "DOM-04",
    name: "PERSON · SUPERHERO",
    repoSlug: "bjo163/rocksoul-superhero",
    domainFocus: "Human Agency & Witness Profiles",
    pipelineOrFamilies: "Witness Attribution, Moral Courage & Action Ledgers",
    coreInvariant: "Zero deification of humans; evaluate deeds strictly by Amanah.",
  },
  {
    code: "DOM-05",
    name: "LAW · AWS",
    repoSlug: "bjo163/rocksoul-aws",
    domainFocus: "Angel With Shotgun Normative Engine",
    pipelineOrFamilies: "SOURCE → RULE → JURISDICTION → APPLICABILITY → ARGUMENT → REVIEW",
    coreInvariant: "LEGAL TEXT ≠ APPLICABLE LAW without full scope validation.",
  },
  {
    code: "DOM-06",
    name: "SEMANTIC · WSI",
    repoSlug: "bjo163/witness-semantic-engine",
    domainFocus: "Downstream Semantic Frame Auditor",
    pipelineOrFamilies: "OFFSIDE → ONSIDE Frame Realignment (QS 37:30)",
    coreInvariant: "Expose rhetorical sleight-of-hand before inference.",
  },
  {
    code: "REL-00",
    name: "CORRELATION GRAPH",
    repoSlug: "bjo163/rocksoul-correlation",
    domainFocus: "Cross-Domain Typed Evidence Fabric",
    pipelineOrFamilies: "Proven on Shared Case 001: Jerusalem 70 CE",
    coreInvariant: "No single-source dogma; cross-domain convergence required.",
  },
] as const;

export const SRGBL_V8_STAGES: readonly SrgblStageSpec[] = [
  {
    stage: "S1 · SOURCE & SENSE",
    letter: "S",
    title: "Origin Text & Sensory Grounding",
    symbolicLayer: "Symbolic Seed",
    auditQuestion: "What is the verbatim primary passage and concrete linguistic sense?",
  },
  {
    stage: "R2 · REALITY",
    letter: "R",
    title: "al-Wāqi' · Empirical Fact",
    symbolicLayer: "R = Reality",
    auditQuestion: "What physical, historical, or observable facts anchor this witness?",
  },
  {
    stage: "G3 · GOVERNING ORDER",
    letter: "G",
    title: "al-Ghaib & Sunnatullāh Laws",
    symbolicLayer: "G = Ghaib",
    auditQuestion: "Which unseen metaphysical boundaries or invariant laws govern the event?",
  },
  {
    stage: "B4 · BEING",
    letter: "B",
    title: "Barakah · Ethical Transformation",
    symbolicLayer: "B = Blessing",
    auditQuestion: "How does this truth elevate human conscience, justice, and mercy?",
  },
  {
    stage: "L5 · LIGHT",
    letter: "L",
    title: "al-Ḥayāh · Living Illuminated Output",
    symbolicLayer: "L = Life",
    auditQuestion: "What reproducible good deed or system artifact ships into living society?",
  },
] as const;

export const SWING_SWING_KEY_ROTATIONS: readonly string[] = [
  "01 · Direction Reversal (Question, Never Proven Inverse)",
  "02 · Polarity Reversal (Candidate Counterclaim)",
  "03 · Subject/Object Role Shift (Grammar & Genre Checked)",
  "04 · Cause/Effect Reexamination (Never Auto-Reversed)",
  "05 · Perspective / Recipient Rotation",
  "06 · Temporal Viewpoint Rotation",
  "07 · Semantic Opposition Candidate",
] as const;

export const JERUSALEM_70CE_CASE_001 = {
  caseId: "CASE-001",
  title: "Jerusalem 70 CE — Multi-Domain Correlation Benchmark",
  strands: [
    { domain: "TEXT (SRGBL)", evidence: "Mark 13:2 prophetic statement on temple stones" },
    {
      domain: "STORY / EVENT (MFTL/LEGEND)",
      evidence: "Flavius Josephus, Wars of the Jews eyewitness account",
    },
    {
      domain: "ARTIFACT (ARCHAEOLOGY)",
      evidence: "Arch of Titus relief depicting second-temple vessels",
    },
    {
      domain: "LAW (AWS)",
      evidence: "Roman siege martial law & provincial jurisdiction transition",
    },
  ],
  verdict: "CONVERGENT ONSIDE CORRELATION — Text, eyewitness chronicle, relief, and statute align.",
} as const;

export const PRIME_CODE_AXIOMS: readonly PrimeCodeAxiom[] = [
  {
    code: "PC01",
    title: "SOURCE INTEGRITY",
    statement: "Distinguish original source, edition, witness and interpretation.",
  },
  {
    code: "PC02",
    title: "TRUTH & EVIDENCE",
    statement: "Attribute claims, verify and show uncertainties.",
  },
  {
    code: "PC03",
    title: "HUMAN AGENCY",
    statement: "Protect free choice, informed consent and revocation.",
  },
  {
    code: "PC04",
    title: "TRUST & RESPONSIBILITY",
    statement: "Every mission has named, bounded accountable humans.",
  },
  {
    code: "PC05",
    title: "CONSULTATION",
    statement: "Affected stakeholders may question and appeal decisions.",
  },
  {
    code: "PC06",
    title: "FAIRNESS & JUSTICE",
    statement: "Evaluate procedures with human-auditable criteria.",
  },
  {
    code: "PC07",
    title: "COMPASSION & PROTECTION",
    statement: "Prevent avoidable harm and prioritize dignity.",
  },
  {
    code: "PC08",
    title: "RESTORATION & RENEWAL",
    statement: "Support correction, repair and responsive oversight.",
  },
  {
    code: "PC09",
    title: "CONTINUITY",
    statement: "Preserve knowledge, ownership, succession and rollback.",
  },
] as const;

export const WINGS_TEN_ARRAY: readonly WingStewardEntry[] = [
  {
    code: "W01",
    callsign: "SKYLINK · SIGNAL COURIERS",
    domainRole: "Transmission & Knowledge (TRUTH_GUIDANCE · Lead: GOD-049)",
    architecturalDuty:
      "Inspired by Jibril / Gabriel · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W02",
    callsign: "RAINMAKERS · LIFELINE CREW",
    domainRole: "Resources & Sustenance (RENEWAL · Lead: GOD-017)",
    architecturalDuty:
      "Inspired by Mikail / Michael · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W03",
    callsign: "LAST SIGNAL · SIREN SQUAD",
    domainRole: "Alerts & Readiness (PATHFINDING · Lead: GOD-043)",
    architecturalDuty:
      "Inspired by Israfil · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W04",
    callsign: "SOFT LANDING · TRANSITION CREW",
    domainRole: "Life Transitions (PROTECTION · Lead: GOD-061)",
    architecturalDuty:
      "Inspired by Malak al-Mawt / Izrail · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W05",
    callsign: "QUESTION ZERO · INQUIRY UNIT",
    domainRole: "Inquiry & Investigation (TRUTH_GUIDANCE · Lead: GOD-031)",
    architecturalDuty:
      "Inspired by Munkar · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W06",
    callsign: "DOUBLE CHECK · SECOND OPINION",
    domainRole: "Independent Verification (TRUTH_GUIDANCE · Lead: GOD-074)",
    architecturalDuty:
      "Inspired by Nakir · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W07",
    callsign: "ECHOLOG · FIELD RECORDERS",
    domainRole: "Observation & Documentation (TRUTH_GUIDANCE · Lead: GOD-050)",
    architecturalDuty:
      "Inspired by Raqib (Quran 50:18 descriptor) · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W08",
    callsign: "LEDGER PUNK · AUDIT REBELS",
    domainRole: "Accountability & Audit (RENEWAL · Lead: GOD-040)",
    architecturalDuty:
      "Inspired by Atid (Quran 50:18 descriptor) · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W09",
    callsign: "FIREWALL · REDLINE GUARD",
    domainRole: "Safety & Containment (PROTECTION · Lead: GOD-077)",
    architecturalDuty:
      "Inspired by Malik · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
  {
    code: "W10",
    callsign: "HAVEN · PEACEKEEPERS",
    domainRole: "Care & Sanctuary (PROTECTION · Lead: GOD-068)",
    architecturalDuty:
      "Inspired by Ridwan (popular name) · PROPOSED_NOT_ASSIGNED · HUMAN_OPERATIONS_WING · NO_SUPERNATURAL_OR_DIVINE_AUTHORITY.",
  },
] as const;

export const SYAFAAT_BASE_STATES: readonly {
  readonly state: SyafaatStateId;
  readonly description: string;
}[] = [
  { state: "UNEXPLORED", description: "Dimension not yet examined in personal practice." },
  { state: "DISCOVERED", description: "Concept understood cognitively and anchored in text." },
  { state: "PRACTICING", description: "Deliberately exercised in daily craft or social conduct." },
  { state: "REFLECTED", description: "Audited honestly against scars, mistakes, and Mizan." },
  { state: "SUSTAINING", description: "Stabilized into quiet habit benefiting others." },
  { state: "REVISIT", description: "Returned to intentionally for deeper humility and renewal." },
] as const;

export const CENTER_100_STEWARDSHIP_CLUSTERS: readonly CenterStewardshipCluster[] = [
  {
    clusterCode: "C01–C11",
    title: "Mercy, Peace & Sanctity",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus:
      "Practicing compassion (Raḥmah), conflict de-escalation, and inner truthfulness.",
    representativeReflections: [
      "Steward of Gentle Speech",
      "Peacemaker in Dispute",
      "Protector of the Vulnerable",
    ],
  },
  {
    clusterCode: "C12–C22",
    title: "Creation, Craft & Provision",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Building durable public goods without waste or exploitation.",
    representativeReflections: [
      "Clean Engineering Craft",
      "Fair Wage & Exchange",
      "Ecological Conservation",
    ],
  },
  {
    clusterCode: "C23–C33",
    title: "Justice, Clarity & Distinction",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Upholding impartial weights (Al-Mīzān) even when inconvenient to self.",
    representativeReflections: [
      "Unbiased Evidence Audit",
      "Transparent Attribution",
      "Refusal of False Witness",
    ],
  },
  {
    clusterCode: "C34–C44",
    title: "Patience, Gratitude & Resilience",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Enduring setbacks without bitterness; answering hardship with steadiness.",
    representativeReflections: [
      "Zero-Self-Pity Discipline",
      "Daily Shukr Practice",
      "Forbearance Under Critique",
    ],
  },
  {
    clusterCode: "C45–C55",
    title: "Witness, Memory & Knowledge",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Preserving history honestly and mentoring learners generously.",
    representativeReflections: [
      "Primary Source Fidelity",
      "Open Documentation",
      "Humility Before the Unknown",
    ],
  },
  {
    clusterCode: "C56–C66",
    title: "Accountability & Living Law",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus:
      "Keeping covenants and accepting personal responsibility before blaming systems.",
    representativeReflections: ["Hisab Self-Audit", "Contract Integrity", "Restorative Apology"],
  },
  {
    clusterCode: "C67–C77",
    title: "Unity, Dignity & Low Profile",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Refusing celebrity worship while strengthening community bonds.",
    representativeReflections: [
      "Anti-Cult Vigilance",
      "Shared Credit Distribution",
      "Quiet Service",
    ],
  },
  {
    clusterCode: "C78–C88",
    title: "Light, Guidance & Renewal",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Turning dark seasons into lanterns for fellow travelers.",
    representativeReflections: [
      "Positive Correction",
      "Constructive Critique",
      "Mentoring New Builders",
    ],
  },
  {
    clusterCode: "C89–C99 + 100",
    title: "Trusteeship + 1 Tawhid Center",
    rangeLabel: "11 Nodes + 1 Center",
    nodeCount: 12,
    humanEthicalFocus:
      "99 human stewardship duties strictly orbiting 1 Creator Center (non-anthropomorphic Tawhid).",
    representativeReflections: [
      "99 Ethical Reflections",
      "+ 1 Singular Tawhid Axis",
      "= 100CENTER Holistic Orbit",
    ],
  },
] as const;

export const SYSTEM_CONCEPTS_14: readonly string[] = [
  "MWX-SYS-001 · MoonWitness OS",
  "MWX-SYS-002 · Semantic Engine",
  "MWX-SYS-003 · FURQAN Evidence Gate",
  "MWX-SYS-004 · MIZAN Consistency & Impact Review",
  "MWX-SYS-005 · AMANAH Responsibility & Access",
  "MWX-SYS-006 · SHURA Deliberation",
  "MWX-SYS-007 · 100CENTER Human Decision Layer",
  "MWX-SYS-008 · KITAB Change & Evidence Ledger",
  "MWX-SYS-009 · SIDRA TREE Knowledge Graph",
  "MWX-SYS-010 · Divine Command Center Hub",
  "MWX-SYS-011 · Atmosphere OS",
  "MWX-SYS-012 · HELIOGRID Energy System",
  "MWX-SYS-013 · ARSY Compute & Research Orchestration",
  "MWX-SYS-014 · Material Forge & Experimental R&D",
] as const;

export const OX_DX_SEVEN_ZONES: readonly OxDxZoneEntry[] = [
  {
    zoneIndex: 1,
    zoneName: "ZONE 01 · EXISTENCE",
    levelRange: "01 – 07",
    levels: [
      "01 UNIVERSE",
      "02 CREATION",
      "03 ORDER",
      "04 REALITY",
      "05 REALM",
      "06 WORLD",
      "07 DOMAIN",
    ],
  },
  {
    zoneIndex: 2,
    zoneName: "ZONE 02 · CONTEXT",
    levelRange: "08 – 14",
    levels: [
      "08 ECOSYSTEM",
      "09 ORGANIZATION",
      "10 COMMUNITY",
      "11 REGION",
      "12 ENVIRONMENT",
      "13 NETWORK",
      "14 CONTEXT",
    ],
  },
  {
    zoneIndex: 3,
    zoneName: "ZONE 03 · INTENT",
    levelRange: "15 – 21",
    levels: [
      "15 PURPOSE",
      "16 MISSION",
      "17 OBJECTIVE",
      "18 PROGRAM",
      "19 PROJECT",
      "20 PRODUCT",
      "21 SYSTEM",
    ],
  },
  {
    zoneIndex: 4,
    zoneName: "ZONE 04 · STRUCTURE",
    levelRange: "22 – 28",
    levels: [
      "22 REPOSITORY",
      "23 SOURCE",
      "24 UNIT",
      "25 MODULE",
      "26 SUBSYSTEM",
      "27 COMPONENT",
      "28 ELEMENT",
    ],
  },
  {
    zoneIndex: 5,
    zoneName: "ZONE 05 · SEMANTIC",
    levelRange: "29 – 35",
    levels: [
      "29 SYMBOL",
      "30 ENTITY",
      "31 PROPERTY",
      "32 RELATION",
      "33 OPERATION",
      "34 FUNCTION",
      "35 BEHAVIOR",
    ],
  },
  {
    zoneIndex: 6,
    zoneName: "ZONE 06 · DYNAMIC",
    levelRange: "36 – 42",
    levels: [
      "36 STATE",
      "37 EVENT",
      "38 PROCESS",
      "39 FLOW",
      "40 TRANSITION",
      "41 ACTION",
      "42 EXECUTION",
    ],
  },
  {
    zoneIndex: 7,
    zoneName: "ZONE 07 · REPRESENTATION",
    levelRange: "43 – 49",
    levels: [
      "43 INSTRUCTION",
      "44 EXPRESSION",
      "45 VALUE",
      "46 DATA",
      "47 TOKEN",
      "48 CHARACTER",
      "49 BIT",
    ],
  },
] as const;

export const SOVEREIGN_ENGINE_SPECS = {
  mTime: {
    name: "M-Time · Virtual Antikythera (MCLOCK-1)",
    repo: "bjo163/antikythera-time",
    version: "v0.16.0",
    standards: [
      "JPL DE440 Ephemeris",
      "IERS Earth Orientation",
      "IAU 2006/2000A Precession-Nutation",
    ],
    hijriCriteria: ["MABIMS_ID_2026 (3° altitude · 6.4° elongation)", "DIYANET_1978_VISIBILITY"],
    purpose:
      "Astronomical timekeeping unifying lunar crescent visibility and solar ephemeris under one auditable dial.",
  },
  aqel: {
    name: "AQEL · Arabic-First Reasoning Language",
    repo: "bjo163/AQEL",
    keywords: [
      "عرّف (Define)",
      "حقيقة (Truth)",
      "قاعدة (Rule)",
      "اسأل (Query)",
      "استنتج (Infer)",
      "تحقق (Verify)",
      "اشرح (Explain)",
    ],
    sampleSnippet: `عرّف شاهد = "Moonwitness"\nحقيقة أمانة = (المدخلات == المخرجات)\nتحقق أمانة\nاشرح "Input equals verifiable accountable output"`,
    purpose:
      "Native Arabic symbolic logic language treating epistemic verification as a first-class syntax primitive.",
  },
  dhgs: {
    name: "DHGS · Divine–Human Governance System",
    repo: "bjo163/dhgs",
    version: "v15.1.0",
    primitives: ["Shadow Audit", "Mizan Balance", "Hisab Ledger", "Open Book", "@dhgs/orm"],
    purpose:
      "Accountable governance ORM modeling institutional obligations, balances, and transparent public review.",
  },
  ageCode: {
    name: "AGE CODE & UNILEX",
    repo: "bjo163/A-L-L-A-H",
    matrix: "12 Traditions × 6 Historical Epochs × 12 Thematic Clusters",
    purpose:
      "Comparative lexical and chronological map tracing shared ethical archetypes across civilizations.",
  },
} as const;

export const CROSS_REPO_TOPOLOGY_ATLAS: readonly RepoOrgCluster[] = [
  {
    orgName: "A-L-L-A-H",
    repoCount: 12,
    roleInEmpire: "Constitutional Core, Master Docs, Kernel OS, Desktop Sanctuary & Harness",
    localClones: [
      "Z:\\repo\\dx (BRIDGE-ALLAH/MOONWITNESS)",
      "Z:\\repo\\A-L-L-A-H\\rocksoul-dx",
      "Z:\\repo\\A-L-L-A-H\\memory",
      "Z:\\repo\\isrockfeel\\moonwitness (active dev workspace)",
    ],
    flagshipRepos: [
      "A-L-L-A-H/master-docs",
      "A-L-L-A-H/rocksoul-dx",
      "A-L-L-A-H/moonwitness",
      "A-L-L-A-H/dx",
      "A-L-L-A-H/moonwitness-os",
      "A-L-L-A-H/mw-os",
      "A-L-L-A-H/e-isp",
    ],
  },
  {
    orgName: "bjo163",
    repoCount: 280,
    roleInEmpire:
      "Primary R&D Foundry — II/XII/XV Codices, Empire of the Light, SRGBL Corpus, OX-DX, M-Time, AQEL & DHGS",
    localClones: [
      "Z:\\project\\rocksoul-dx (bjo163/A-L-L-A-H.COM)",
      "Z:\\project\\moonwitness-corpus",
      "Z:\\project\\moonradio (bjo163/moonwitnessxv)",
      "Z:\\project\\moonwitness-xi (bjo163/moonwitness-xiv)",
    ],
    flagshipRepos: [
      "bjo163/A-L-L-A-H.COM",
      "bjo163/A-L-L-A-H",
      "bjo163/moonwitness-II",
      "bjo163/moonwitness-xii-season-global-championships",
      "bjo163/moonwitnessxv",
      "bjo163/moonwitness-corpus",
      "bjo163/empire-of-the-light",
      "bjo163/ALLAH-CRAYON-RGBL-ENGINE",
      "bjo163/universal-ontology-engine",
      "bjo163/antikythera-time",
      "bjo163/AQEL",
      "bjo163/dhgs",
    ],
  },
  {
    orgName: "ArsyBelovedLabs",
    repoCount: 27,
    roleInEmpire:
      "Gen2 Enterprise Architecture Freeze — 196-Entry Blueprint, ADRs 021–027 & Multi-Service Cores",
    localClones: ["Synchronized into bjo163/moonwitness-corpus & Z:\\project\\moonwitness-corpus"],
    flagshipRepos: [
      "ArsyBelovedLabs/moonwitness-blueprint",
      "ArsyBelovedLabs/moonwitness-platform-foundation",
      "ArsyBelovedLabs/moonwitness-core",
      "ArsyBelovedLabs/mw-core",
      "ArsyBelovedLabs/moonwitness-corpus",
      "ArsyBelovedLabs/rocksoul-orchestrator",
    ],
  },
  {
    orgName: "BRIDGE-ALLAH",
    repoCount: 24,
    roleInEmpire:
      "Rust & OS Consolidation Wave — MWX, EMPIRE-OF-LIGHT Temps Binary, ARSY & MoonFrame Targets",
    localClones: [
      "Z:\\repo\\dx (BRIDGE-ALLAH/MOONWITNESS)",
      "Mapped across Z:\\project\\moonframe",
    ],
    flagshipRepos: [
      "BRIDGE-ALLAH/MWX",
      "BRIDGE-ALLAH/EMPIRE-OF-LIGHT",
      "BRIDGE-ALLAH/MOONWITNESS",
      "BRIDGE-ALLAH/MOONWITNESSxx",
      "BRIDGE-ALLAH/A-R-S-Y",
      "BRIDGE-ALLAH/MW-IDE",
      "BRIDGE-ALLAH/MW-UI",
      "BRIDGE-ALLAH/ROCKSOUL",
    ],
  },
  {
    orgName: "zenix-id",
    repoCount: 16,
    roleInEmpire: "2024–2025 Docker, RADIUS, OpenVPN & Network Infrastructure Substrate",
    localClones: ["Network & ISP telemetry lineages carried into A-L-L-A-H/e-isp & bjo163/mwx-isp"],
    flagshipRepos: [
      "zenix-id/cosmos",
      "zenix-id/mars",
      "zenix-id/saturnus",
      "zenix-id/orbit",
      "zenix-id/toughradius2",
      "zenix-id/n8n",
    ],
  },
  {
    orgName: "The-Batteries",
    repoCount: 8,
    roleInEmpire:
      "Creative & Infrastructure Collective (6 public + 2 private repos: riot-os, A-R-S-Y, mycocolink)",
    localClones: [
      "Stewardship architecture synchronized with bjo163/empire-of-the-light (PC01–PC09, WINGS 10, G.O.D. 99)",
    ],
    flagshipRepos: [
      "The-Batteries/riot-os",
      "The-Batteries/A-R-S-Y",
      "The-Batteries/mycocolink",
      "The-Batteries/dev-start-g",
      "The-Batteries/moonwitness",
      "The-Batteries/moon-os",
    ],
  },
  {
    orgName: "moonwitness-id",
    repoCount: 1,
    roleInEmpire: "Canonical Private V9.5 Monorepo Anchor (MOONWITNESS OS V9.5)",
    localClones: [
      "Mirrors bjo163/moonwitness (Z:\\repo\\moonwitness); distinct from A-L-L-A-H/moonwitness (Z:\\repo\\isrockfeel\\moonwitness)",
    ],
    flagshipRepos: ["moonwitness-id/moonwitness"],
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
    id: "cx-monocentric-163",
    doorId: "story-universe",
    category: "GOD-PROMISE · Ontology",
    title: "Monocentric 1·6·3 & 3 Promise Tracks",
    subtitle: "1 Tawhid · 6 Creation Ayyām · 3 Hizab + INPUT = OUTPUT",
    repoSource: "A-L-L-A-H/master-docs · bjo163/moonwitnessxv",
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
    title: "100CENTER & G.O.D. 99 Unassigned Personas",
    subtitle: "99 Human Ethical Stewardship Nodes (9 Depts × 11) orbiting 1 Tawhid Center",
    repoSource: "bjo163/empire-of-the-light · A-L-L-A-H/master-docs",
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
    title: "AQEL Arabic-First Language & DHGS v15.1.0",
    subtitle: "عرّف · حقيقة · قاعدة · تحقق · اشرح + Mizan & Hisab Ledger",
    repoSource: "bjo163/AQEL · bjo163/dhgs",
  },
] as const;
