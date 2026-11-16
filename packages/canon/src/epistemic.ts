import type {
  CorpusAuthorityEntry,
  EpistemicDomainNode,
  KeyWitnessFamily,
  SrgblStageSpec,
} from "./types";

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

export const RGBL_FOUR_LEVELS = [
  { level: "R1", name: "Reality", yield: "Information" },
  { level: "G2", name: "Governing Order", yield: "Knowledge" },
  { level: "B3", name: "Being", yield: "Understanding / Meaning" },
  { level: "L4", name: "Light", yield: "Wisdom / Responsible Direction" },
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

export const P18_KEY_WITNESS_SPEC = {
  title: "P18 Key Witness v0",
  sourceRepo: "bjo163/moonwitness-corpus (KEY-WITNESS-V0.md)",
  formula: "Σ(w·c·i·d) / Σ(w·c·i) · zero denominator → categorical UNKNOWN · zero religion ranking",
  rotationRule: "ROTATE THE RELATIONSHIP, NOT THE TRUTH (max depth 3 candidate hops)",
  corpusSpine9Layers: [
    "01 ARTIFACT",
    "02 WORK",
    "03 EXPRESSION",
    "04 EDITION",
    "05 PASSAGE",
    "06 CONTENT",
    "07 SCOPED ASSERTION",
    "08 EVIDENCE",
    "09 PROVENANCE",
  ] as const,
  witnessTypes6: [
    "textual",
    "variant",
    "translation",
    "lexical",
    "community",
    "commentary",
  ] as const,
  controlledKeys5Families: [
    {
      family: "Mercy & Care",
      keys: ["mercy", "compassion", "forgiveness", "comfort"],
    },
    {
      family: "Covenant Justice",
      keys: ["justice", "truth", "accountability", "restoration"],
    },
    {
      family: "Devotion & Gratitude",
      keys: ["praise", "gratitude", "trust", "hope"],
    },
    {
      family: "Character Discipline",
      keys: ["patience", "humility", "generosity", "wisdom"],
    },
    {
      family: "Speech & Covenant Act",
      keys: ["narrative", "warning", "promise", "covenant"],
    },
  ] as readonly KeyWitnessFamily[],
  relations12: [
    "expresses",
    "commands",
    "prohibits",
    "promises",
    "warns",
    "narrates",
    "praises",
    "condemns",
    "comforts",
    "questions",
    "describes",
    "covenants",
  ] as const,
  mandatoryFrameDimensions5: ["agent", "recipient", "domain", "scope", "genre"] as const,
  directionRange: { min: -2, max: 2, contextCoverageFields: 9 },
} as const;

export const FOUR_CORPUS_POLICY = {
  invariant: "REVEALED SOURCE CATEGORY ≠ EXTANT TEXTUAL WITNESS",
  sourceRepo: "bjo163/propetic",
  corpora: [
    {
      code: "SRC-QUR",
      name: "AL-QURAN",
      epistemicRole: "Muhaimin core & normative criterion",
      invariant: "Primary canonical preservation reference; zero claim of new revelation.",
    },
    {
      code: "SRC-TOR",
      name: "TAURAT",
      epistemicRole: "Supplementary textual witness",
      invariant:
        "Evaluated through witness provenance and never equated raw with extant redactions.",
    },
    {
      code: "SRC-ZAB",
      name: "ZABUR",
      epistemicRole: "Supplementary textual witness",
      invariant: "Distinguish liturgical psalm witnesses from categorical revealed archetype.",
    },
    {
      code: "SRC-INJ",
      name: "INJIL",
      epistemicRole: "Supplementary textual witness",
      invariant: "Distinguish gospel manuscript variants from prophetic source premise.",
    },
  ] as readonly CorpusAuthorityEntry[],
} as const;

export const WHCMT_VS_BASSHUNTER_SPEC = {
  whcmt: {
    code: "WHCMT",
    expansion: "Weighted Hierarchical Constellation Matrix Transformation",
    source: "Z:\\.raw_archives\\chatgpt_mohrezzafahlevi\\conversations-002.json[69]",
    matrixTopRow: ["1", "3", "4", "5"] as const,
    matrixBottomRow: ["2", "6", "7", "8"] as const,
    role: "Working 2×4 constellation transformation matrix kept distinct from BASS-HUNTER.",
  },
  bassHunter: {
    code: "BASS-HUNTER",
    expansion: "Blessings, Answers, Signs & Science",
    source: "A-L-L-A-H/master-docs (CANON_BASS-HUNTER.md)",
    scoringStatus: "UNKNOWN" as const,
    rule: "Expansion owner-supplied; detailed scoring method remains UNKNOWN. Never fabricate scores or merge with WHCMT.",
  },
} as const;

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
