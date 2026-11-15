import type { WorldIdentifier } from "./empire-registry";

export type EntryDoorId =
  | "story-universe"
  | "epistemic-corpus"
  | "empire-organization"
  | "sovereign-runtimes";

export type SyafaatStateId =
  | "UNEXPLORED"
  | "DISCOVERED"
  | "PRACTICING"
  | "REFLECTED"
  | "SUSTAINING"
  | "REVISIT";

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
  readonly orgName: "A-L-L-A-H" | "bjo163" | "BRIDGE-ALLAH" | "The-Batteries";
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
  monocentricFormula: "1 = ONE GOD (Tawhid) · 6 = CREATION (Six Ayyām) · 3 = HIZAB (Hijab, Hudud, Barzakh)",
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
    interpretation: "Intellectual honesty and openness to Positive Correction (QS Al-Mā'idah 5:48).",
  },
  {
    index: "04",
    line: 'BUT I KNOW WHO SAID: "I\'LL FINISH IT."',
    interpretation: "Unshakeable trust in Allah's promise (QS Al-Qasas 28:7–8) as anchor of action.",
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
    meaning: "Zero mask of false holiness. Entering honestly from scars, failure, and noisy reality.",
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
    sourceSpec: "bjo163/A-L-L-A-H · The-Batteries/100CENTER · dhgs",
    linkedWorldId: "qalam",
    summary:
      "Inspect constitutional axioms, the 10 Guardian Wings, Syafaat 6-state human ethical reflection across 99 stewardship nodes, and DHGS.",
  },
  {
    id: "sovereign-runtimes",
    numeral: "DOOR IV",
    title: "SOVEREIGN ECOSYSTEM & 194-REPO ATLAS",
    subtitle: "OX-DX 49 Levels · M-Time Antikythera · AQEL · 4 GitHub Orgs",
    sourceSpec: "universal-ontology-engine · antikythera-time · AQEL · 194+ Repos",
    linkedWorldId: "arsy",
    summary:
      "Explore the 7×7 OX-DX ontology pyramid, MCLOCK-1 astronomical engine, Arabic-first AQEL syntax, and the 194-repository federation.",
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
  "03 THE SPARK",
  "04 THE CODE",
  "05 THE SIGNAL",
  "06 THE BRIDGE",
  "07 THE FORGE",
  "08 THE SHIELD",
  "09 THE COMPASS",
  "10 THE ARCHIVE",
  "11 THE ECHO",
  "12 THE CROWN",
  "13 THE HORIZON",
  "14 THE SANCTUARY",
  "15 THE COVENANT",
  "16 NEXT ERA",
] as const;

export const EIGHT_STORY_ERAS: readonly StoryEraEntry[] = [
  { id: "era_00", order: 0, title: "BEFORE LIGHT", subtitle: "Pre-Signal Silence", theme: "Pure latent potential before witness awakens." },
  { id: "era_01", order: 1, title: "FIRST SIGNAL", subtitle: "The Initial Spark", theme: "Recognition of testimony and accountability." },
  { id: "era_02", order: 2, title: "FRACTURED MIRROR", subtitle: "Collision with Noise", theme: "Scars, deviance auditing, and testing resolve." },
  { id: "era_03", order: 3, title: "FORGE OF ROCKSOUL", subtitle: "Discipline in Chaos", theme: "Converting scars into craft and music." },
  { id: "era_04", order: 4, title: "CONVERGENCE OF 163", subtitle: "Monocentric Alignment", theme: "Binding 1·6·3 ontology into unified code." },
  { id: "era_05", order: 5, title: "CITADEL OF THE MOON", subtitle: "The Five Worlds", theme: "Moonwitness, Arsy, Qalam, Sidra, Rocksoul DX." },
  { id: "era_06", order: 6, title: "GLOBAL CHAMPIONSHIPS", subtitle: "33 Patches & 15 Episodes", theme: "Public deployment, Unity Agreement, Syafaat RPG." },
  { id: "era_07", order: 7, title: "NEXT PHASE", subtitle: "Sovereign Horizon", theme: "Open-book civilization infrastructure." },
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
  { code: "EP-01", number: 1, title: "DIGIMON JOGRESS", arcFocus: "Dual-Agent Fusion", coreQuestion: "When two distinct protocols combine without losing identity." },
  { code: "EP-02", number: 2, title: "BROTHERHOOD", arcFocus: "Loyal Fellowship", coreQuestion: "Holding the line together across silence and storm." },
  { code: "EP-03", number: 3, title: "RESONANCE PROTOCOL", arcFocus: "Harmonic Alignment", coreQuestion: "Tuning fragmented teams to a single meridian." },
  { code: "EP-04", number: 4, title: "MANUSIA PULPEN", arcFocus: "Authorship Over Weapons", coreQuestion: "Writing permanent truth in an age of ephemeral noise." },
  { code: "EP-05", number: 5, title: "ANGEL WITH SHOTGUN", arcFocus: "Law & Moral Defense", coreQuestion: "Distinguishing written statute from living justice." },
  { code: "EP-06", number: 6, title: "NOISE × SILENCE", arcFocus: "Cognitive Clarity", coreQuestion: "Separating signal from high-frequency distraction." },
  { code: "EP-07", number: 7, title: "THE BATTERY AWAKENING", arcFocus: "Latent Energy", coreQuestion: "How small cells sustain an entire ecosystem." },
  { code: "EP-08", number: 8, title: "GREAT PRINCESS OF BEE", arcFocus: "Order in nature", coreQuestion: "Precision hive coordination as social architecture." },
  { code: "EP-09", number: 9, title: "LOST THE SIGNAL", arcFocus: "Valley of Testing", coreQuestion: "Navigational fidelity when telemetry goes dark." },
  { code: "EP-10", number: 10, title: "THE POSITIVE CORRECTION", arcFocus: "QS 5:48 Audit", coreQuestion: "Refuting falsehood through superior constructive craft." },
  { code: "EP-11", number: 11, title: "MFTL: MYTH TO LEGEND", arcFocus: "Historical Verification", coreQuestion: "Tracing oral legend back to verifiable evidence." },
  { code: "EP-12", number: 12, title: "KINGSLAYER PACT", arcFocus: "Unity Agreement", coreQuestion: "Dissolving ego-thrones to serve the shared Covenant." },
  { code: "EP-13", number: 13, title: "AETHERION ASCENT", arcFocus: "10 Realms / 100 Levels", coreQuestion: "Iterative mastery through structured ethical trials." },
  { code: "EP-14", number: 14, title: "FAITH TO ACTION", arcFocus: "KopiHitam — Siaceng", coreQuestion: "Turning late-night resolve into shipped public reality." },
  { code: "EP-15", number: 15, title: "FUTURE IS NOW", arcFocus: "The Open Gate", coreQuestion: "Stepping into accountable civilization building today." },
] as const;

export const WORLD_PATCH_HIGHLIGHTS: readonly WorldPatchHighlight[] = [
  { patchNumber: "#001", title: "AEGIS PROTECTION", category: "Boundary Shield", summary: "Foundational integrity shield guarding the Gate against distortion." },
  { patchNumber: "#007", title: "SYAFAAT BASE STATES", category: "Ethical Progression", summary: "Six non-judgmental states of human ethical reflection and practice." },
  {
    patchNumber: "#014",
    title: "DUAL-DRAFT RECONCILIATION PATCH",
    category: "Provenance Audit",
    summary: "Tracks divergence between XII Championship draft variants pending canonical lock.",
    provenanceNote: "DISCLOSED DUAL-DRAFT CONFLICT · Requires final author sign-off",
  },
  { patchNumber: "#019", title: "OFFSIDE → ONSIDE FRAME", category: "Semantic Guard", summary: "Redirects misframed claims onto verifiable premise chains (QS 37:30)." },
  { patchNumber: "#027", title: "KINGSLAYER UNITY AGREEMENT", category: "Governance Pact", summary: "5-poster series dissolving zero-sum rivalry into federated mission." },
  { patchNumber: "#033", title: "KOPIHITAM — SIACENG / FAITH TO ACTION", category: "Final Season Patch", summary: "Culminating patch bridging spiritual stillness directly into daily output." },
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
    premise: " Five sequential proclamations dethroning ego to unite scattered guilds under one Light.",
    signatureQuote: "Slay the false crown within; protect the Covenant without.",
  },
] as const;

export const EPISTEMIC_FEDERATION_DOMAINS: readonly EpistemicDomainNode[] = [
  {
    code: "DOM-01",
    name: "TEXT · SRGBL v8",
    repoSlug: "bjo163/moonwitness-corpus",
    domainFocus: "Scriptural & Textual Hermeneutics",
    pipelineOrFamilies: "5 Stages (S1–S5) + 7 Swing Swing Key Rotations",
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
  "01 · Lexical Root Rotation (Semantic Core)",
  "02 · Historical Horizon Rotation (When & Where)",
  "03 · Structural Mirror Rotation (Ring Composition)",
  "04 · Legal Boundary Rotation (Hudud & Scope)",
  "05 · Cross-Tradition Echo Rotation (UNILEX)",
  "06 · Positive Correction Rotation (QS 5:48 Audit)",
  "07 · Living Action Rotation (Input → Output)",
] as const;

export const JERUSALEM_70CE_CASE_001 = {
  caseId: "CASE-001",
  title: "Jerusalem 70 CE — Multi-Domain Correlation Benchmark",
  strands: [
    { domain: "TEXT (SRGBL)", evidence: "Mark 13:2 prophetic statement on temple stones" },
    { domain: "STORY / EVENT (MFTL/LEGEND)", evidence: "Flavius Josephus, Wars of the Jews eyewitness account" },
    { domain: "ARTIFACT (ARCHAEOLOGY)", evidence: "Arch of Titus relief depicting second-temple vessels" },
    { domain: "LAW (AWS)", evidence: "Roman siege martial law & provincial jurisdiction transition" },
  ],
  verdict: "CONVERGENT ONSIDE CORRELATION — Text, eyewitness chronicle, relief, and statute align.",
} as const;

export const PRIME_CODE_AXIOMS: readonly PrimeCodeAxiom[] = [
  { code: "PC01", title: "Tawhid Sovereign Axis", statement: "Zero partnership with the Creator; zero cult of builders or tools." },
  { code: "PC02", title: "Input = Output Honesty", statement: "No claimed insight is valid until manifested in measurable, helpful work." },
  { code: "PC03", title: "Positive Correction (QS 5:48)", statement: "Answer distortion by shipping cleaner truth, never sterile outrage." },
  { code: "PC04", title: "Legal Text ≠ Applicable Law", statement: "Every norm requires verified jurisdiction, context, and humane review." },
  { code: "PC05", title: "Low-Profile Stewardship", statement: "Serve quietly in the light; seek utility over applause." },
  { code: "PC06", title: "Progressive Graceful Fallback", statement: "Craft advanced systems that never exclude modest human hardware." },
  { code: "PC07", title: "Zero Fake Telemetry", statement: "Never fabricate metrics, witnesses, or provenance." },
  { code: "PC08", title: "Cross-Domain Falsifiability", statement: "Text, story, event, person, and law must cross-verify each other." },
  { code: "PC09", title: "Mercy as Structural Load", statement: "Rahmah is not ornament; it is the load-bearing beam of architecture." },
] as const;

export const WINGS_TEN_ARRAY: readonly WingStewardEntry[] = [
  { code: "W01", callsign: "JIBRIL", domainRole: "Transmission & Truth Delivery", architecturalDuty: "Zero-distortion canonical message pipelines and provenance signing." },
  { code: "W02", callsign: "MIKAIL", domainRole: "Sustenance & Resource Allocation", architecturalDuty: "Balanced compute, energy, and mutual-aid distribution." },
  { code: "W03", callsign: "ISRAFIL", domainRole: "Signal & Epochal Broadcast", architecturalDuty: "Harmonic Arsy relays, alerts, and global cadence synchronization." },
  { code: "W04", callsign: "IZRAIL", domainRole: "Lifecycle Sealing & Deprecation", architecturalDuty: "Graceful archival shutdown, immutable snapshots, and memory hygiene." },
  { code: "W05", callsign: "MUNKAR", domainRole: "Anomaly & Intrusion Detection", architecturalDuty: "Detecting foreign injection, drift, or manipulated framing." },
  { code: "W06", callsign: "NAKIR", domainRole: "Adversarial Verification", architecturalDuty: "Rigorous interrogation of proofs, schemas, and claims." },
  { code: "W07", callsign: "RAQIB", domainRole: "Constructive Action Ledger", architecturalDuty: "Immutable recording of verified builds and benevolent deeds." },
  { code: "W08", callsign: "ATID", domainRole: "Deviance & Fault Audit", architecturalDuty: "Recording regressions, debt, and offside reasoning for correction." },
  { code: "W09", callsign: "MALIK", domainRole: "Containment & Gate Defense", architecturalDuty: "Quarantining harmful inputs and enforcing strict visual/ethical bounds." },
  { code: "W10", callsign: "RIDWAN", domainRole: "Sanctuary Hospitality & Peace", architecturalDuty: "Welcoming learners into tranquil, legible, dignified interfaces." },
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
    humanEthicalFocus: "Practicing compassion (Raḥmah), conflict de-escalation, and inner truthfulness.",
    representativeReflections: ["Steward of Gentle Speech", "Peacemaker in Dispute", "Protector of the Vulnerable"],
  },
  {
    clusterCode: "C12–C22",
    title: "Creation, Craft & Provision",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Building durable public goods without waste or exploitation.",
    representativeReflections: ["Clean Engineering Craft", "Fair Wage & Exchange", "Ecological Conservation"],
  },
  {
    clusterCode: "C23–C33",
    title: "Justice, Clarity & Distinction",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Upholding impartial weights (Al-Mīzān) even when inconvenient to self.",
    representativeReflections: ["Unbiased Evidence Audit", "Transparent Attribution", "Refusal of False Witness"],
  },
  {
    clusterCode: "C34–C44",
    title: "Patience, Gratitude & Resilience",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Enduring setbacks without bitterness; answering hardship with steadiness.",
    representativeReflections: ["Zero-Self-Pity Discipline", "Daily Shukr Practice", "Forbearance Under Critique"],
  },
  {
    clusterCode: "C45–C55",
    title: "Witness, Memory & Knowledge",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Preserving history honestly and mentoring learners generously.",
    representativeReflections: ["Primary Source Fidelity", "Open Documentation", "Humility Before the Unknown"],
  },
  {
    clusterCode: "C56–C66",
    title: "Accountability & Living Law",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Keeping covenants and accepting personal responsibility before blaming systems.",
    representativeReflections: ["Hisab Self-Audit", "Contract Integrity", "Restorative Apology"],
  },
  {
    clusterCode: "C67–C77",
    title: "Unity, Dignity & Low Profile",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Refusing celebrity worship while strengthening community bonds.",
    representativeReflections: ["Anti-Cult Vigilance", "Shared Credit Distribution", "Quiet Service"],
  },
  {
    clusterCode: "C78–C88",
    title: "Light, Guidance & Renewal",
    rangeLabel: "11 Nodes",
    nodeCount: 11,
    humanEthicalFocus: "Turning dark seasons into lanterns for fellow travelers.",
    representativeReflections: ["Positive Correction", "Constructive Critique", "Mentoring New Builders"],
  },
  {
    clusterCode: "C89–C99 + 100",
    title: "Trusteeship + 1 Tawhid Center",
    rangeLabel: "11 Nodes + 1 Center",
    nodeCount: 12,
    humanEthicalFocus: "99 human stewardship duties strictly orbiting 1 Creator Center (non-anthropomorphic Tawhid).",
    representativeReflections: ["99 Ethical Reflections", "+ 1 Singular Tawhid Axis", "= 100CENTER Holistic Orbit"],
  },
] as const;

export const SYSTEM_CONCEPTS_14: readonly string[] = [
  "MWX-SYS-001 · Monocentric 1·6·3 Axis",
  "MWX-SYS-002 · Low-Profile Tawhid Guardrail",
  "MWX-SYS-003 · SRGBL v8 5-Stage Lens",
  "MWX-SYS-004 · Swing Swing 7-Key Rotation",
  "MWX-SYS-005 · OFFSIDE → ONSIDE Semantic Frame",
  "MWX-SYS-006 · 6-Domain + Relationship Correlation",
  "MWX-SYS-007 · Syafaat 99-Dimension State Engine",
  "MWX-SYS-008 · 100CENTER Stewardship Topology",
  "MWX-SYS-009 · WINGS 10 Operational Array",
  "MWX-SYS-010 · OX-DX 49-Level Ontology Pyramid",
  "MWX-SYS-011 · M-Time Antikythera Clockworks",
  "MWX-SYS-012 · AQEL Arabic-First AST Engine",
  "MWX-SYS-013 · DHGS Mizan & Hisab Ledger",
  "MWX-SYS-014 · MoonFrame 4-Door Sanctuary Gate",
] as const;

export const OX_DX_SEVEN_ZONES: readonly OxDxZoneEntry[] = [
  {
    zoneIndex: 1,
    zoneName: "ZONE 01 · COSMIC MACROSTRUCTURE",
    levelRange: "01 – 07",
    levels: ["01 UNIVERSE", "02 SUPERCLUSTER", "03 GALAXY", "04 STAR SYSTEM", "05 PLANET", "06 BIOSPHERE", "07 ECOSYSTEM"],
  },
  {
    zoneIndex: 2,
    zoneName: "ZONE 02 · CIVILIZATION & POLITY",
    levelRange: "08 – 14",
    levels: ["08 HUMANITY", "09 CIVILIZATION", "10 NATION", "11 INSTITUTION", "12 COMMUNITY", "13 HOUSEHOLD", "14 PERSON"],
  },
  {
    zoneIndex: 3,
    zoneName: "ZONE 03 · CONSCIOUSNESS & ETHICS",
    levelRange: "15 – 21",
    levels: ["15 CONSCIENCE", "16 INTENTION (NIYYAH)", "17 WITNESS (SHAHADAH)", "18 REASON (AQL)", "19 MEMORY", "20 LANGUAGE", "21 INSCRIPTION"],
  },
  {
    zoneIndex: 4,
    zoneName: "ZONE 04 · EPISTEMIC ARCHITECTURE",
    levelRange: "22 – 28",
    levels: ["22 TEXT CORPUS", "23 NARRATIVE", "24 EVENT RECORD", "25 AGENT PROFILE", "26 LEGAL NORM", "27 CORRELATION", "28 VERIFIED KNOWLEDGE"],
  },
  {
    zoneIndex: 5,
    zoneName: "ZONE 05 · SYSTEMS & COMPUTATION",
    levelRange: "29 – 35",
    levels: ["29 ARCHITECTURE", "30 PROTOCOL", "31 SERVICE", "32 MODULE", "33 FUNCTION", "34 ALGORITHM", "35 AST NODE"],
  },
  {
    zoneIndex: 6,
    zoneName: "ZONE 06 · MATTER & ENERGY",
    levelRange: "36 – 42",
    levels: ["36 PHOTON FIELD", "37 MOLECULE", "38 ATOM", "39 NUCLEUS", "40 PROTON / HADRON", "41 QUARK", "42 QUANTUM FIELD"],
  },
  {
    zoneIndex: 7,
    zoneName: "ZONE 07 · SUBSTRATE INFORMATION",
    levelRange: "43 – 49",
    levels: ["43 WAVEFUNCTION", "44 ENTROPY", "45 SYMMETRY GROUP", "46 LOGIC GATE", "47 REGISTER", "48 BYTE", "49 BIT"],
  },
] as const;

export const SOVEREIGN_ENGINE_SPECS = {
  mTime: {
    name: "M-Time · Virtual Antikythera (MCLOCK-1)",
    repo: "bjo163/antikythera-time",
    version: "v0.16.0",
    standards: ["JPL DE440 Ephemeris", "IERS Earth Orientation", "IAU 2006/2000A Precession-Nutation"],
    hijriCriteria: ["MABIMS_ID_2026 (3° altitude · 6.4° elongation)", "DIYANET_1978_VISIBILITY"],
    purpose: "Astronomical timekeeping unifying lunar crescent visibility and solar ephemeris under one auditable dial.",
  },
  aqel: {
    name: "AQEL · Arabic-First Reasoning Language",
    repo: "bjo163/AQEL",
    keywords: ["عرّف (Define)", "حقيقة (Truth)", "قاعدة (Rule)", "اسأل (Query)", "استنتج (Infer)", "تحقق (Verify)", "اشرح (Explain)"],
    sampleSnippet: `عرّف شاهد = "Moonwitness"\nحقيقة أمانة = (المدخلات == المخرجات)\nتحقق أمانة\nاشرح "Input equals verifiable accountable output"`,
    purpose: "Native Arabic symbolic logic language treating epistemic verification as a first-class syntax primitive.",
  },
  dhgs: {
    name: "DHGS · Divine–Human Governance System",
    repo: "bjo163/dhgs",
    version: "v15.1.0",
    primitives: ["Shadow Audit", "Mizan Balance", "Hisab Ledger", "Open Book", "@dhgs/orm"],
    purpose: "Accountable governance ORM modeling institutional obligations, balances, and transparent public review.",
  },
  ageCode: {
    name: "AGE CODE & UNILEX",
    repo: "bjo163/A-L-L-A-H",
    matrix: "12 Traditions × 6 Historical Epochs × 12 Thematic Clusters",
    purpose: "Comparative lexical and chronological map tracing shared ethical archetypes across civilizations.",
  },
} as const;

export const CROSS_REPO_TOPOLOGY_ATLAS: readonly RepoOrgCluster[] = [
  {
    orgName: "A-L-L-A-H",
    repoCount: 12,
    roleInEmpire: "Constitutional Core, Master Docs, Kernel OS, Desktop Universe & Harness",
    localClones: ["Z:\\repo\\dx (A-L-L-A-H/dx)", "Z:\\repo\\A-L-L-A-H\\rocksoul-dx", "Z:\\repo\\A-L-L-A-H\\memory"],
    flagshipRepos: [
      "A-L-L-A-H/master-docs",
      "A-L-L-A-H/moonwitness",
      "A-L-L-A-H/rocksoul-dx",
      "A-L-L-A-H/mw-os",
      "A-L-L-A-H/dx",
      "A-L-L-A-H/e-isp",
    ],
  },
  {
    orgName: "bjo163",
    repoCount: 150,
    roleInEmpire: "Main R&D Foundry — 6-Domain Federation, V10/XII Codices, OX-DX, M-Time, AQEL, DHGS",
    localClones: [
      "Z:\\project\\rocksoul-dx (bjo163/A-L-L-A-H.COM)",
      "Z:\\project\\moonwitness-corpus",
      "Z:\\project\\moonstranaut",
      "Z:\\project\\moonframe",
    ],
    flagshipRepos: [
      "bjo163/A-L-L-A-H.COM",
      "bjo163/A-L-L-A-H",
      "bjo163/moonwitnessxv",
      "bjo163/moonwitness-corpus",
      "bjo163/rocksoul-correlation",
      "bjo163/universal-ontology-engine",
      "bjo163/antikythera-time",
      "bjo163/AQEL",
      "bjo163/dhgs",
    ],
  },
  {
    orgName: "BRIDGE-ALLAH",
    repoCount: 24,
    roleInEmpire: "Multi-Target Bridges (OS, AI Engine, SDK, CLI, Web, Mobile, Desktop, IoT, Security)",
    localClones: ["Mapped across Z:\\project\\moonframe & Z:\\repo\\A-L-L-A-H\\ui"],
    flagshipRepos: [
      "BRIDGE-ALLAH/EMPIRE-OF-LIGHT",
      "BRIDGE-ALLAH/CORE-PHILOSOPHY",
      "BRIDGE-ALLAH/SYSTEM-ARCHITECTURE",
      "BRIDGE-ALLAH/DESIGN-SYSTEM",
      "BRIDGE-ALLAH/AI-ENGINE",
      "BRIDGE-ALLAH/SDK",
    ],
  },
  {
    orgName: "The-Batteries",
    repoCount: 8,
    roleInEmpire: "Operational Stewardship Guilds — 100CENTER, World Monitor, Sentinel & Asmaul-Husna",
    localClones: ["Stewardship specifications synchronized into 100CENTER & WINGS 10"],
    flagshipRepos: [
      "The-Batteries/100CENTER",
      "The-Batteries/THE-BATTERIES",
      "The-Batteries/WORLD-MONITOR",
      "The-Batteries/CONTINUUM",
      "The-Batteries/SENTINEL",
      "The-Batteries/ASMAUL-HUSNA",
    ],
  },
] as const;

export const CODEX_SEARCH_INDEX: readonly CodexSearchEntry[] = [
  {
    id: "cx-srgbl-v8",
    doorId: "epistemic-corpus",
    category: "SRGBL v8 · 5-Stage Pipeline",
    title: "SRGBL v8 & Symbolic RGBL",
    subtitle: "S1 Source & Sense → R2 Reality → G3 Governing Order → B4 Being → L5 Light",
    repoSource: "bjo163/moonwitness-corpus",
  },
  {
    id: "cx-monocentric-163",
    doorId: "story-universe",
    category: "GOD-PROMISE · Ontology",
    title: "Monocentric 1·6·3 & 3 Promise Tracks",
    subtitle: "1 Tawhid · 6 Creation Ayyām · 3 Hizab + INPUT = OUTPUT",
    repoSource: "bjo163/GOD-PROMISE",
  },
  {
    id: "cx-dx-manga",
    doorId: "story-universe",
    category: "DX Storyboard · Low-Profile Tawhid",
    title: "SIN CAN BE BETTER HUMAN (4 Panels)",
    subtitle: "GOGOGO → SHUUU → BAAAN → DODODO + 4-Line Owner Manifesto",
    repoSource: "Z:\\repo\\dx\\NARATION.md",
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
    title: "100CENTER & Syafaat 99 Dimensions",
    subtitle: "99 Human Ethical Stewardship Nodes orbiting 1 Tawhid Center",
    repoSource: "The-Batteries/100CENTER",
  },
  {
    id: "cx-wings-10",
    doorId: "empire-organization",
    category: "Empire Organization · WINGS 10",
    title: "WINGS 10 Operational Array (Jibril – Ridwan)",
    subtitle: "10 canonical guardian functions & Prime Code PC01–PC09",
    repoSource: "bjo163/A-L-L-A-H",
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
