import type {
  DhgsAssuranceStep,
  MasterDnaMeta,
  OxDxZoneEntry,
  QuarantinedAmbiguityEntry,
  RepoOrgCluster,
} from "./types";

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

export const DHGS_13_STEPS: readonly DhgsAssuranceStep[] = [
  {
    stepNumber: 1,
    code: "RECEIVE",
    action: "Ingest bounded request or testimony",
    purpose: "Accept input without altering primary record.",
  },
  {
    stepNumber: 2,
    code: "KNOW",
    action: "Bind context, provenance & domain",
    purpose: "Anchor frame before judgment.",
  },
  {
    stepNumber: 3,
    code: "VERIFY",
    action: "Check primary evidence & counterclaims",
    purpose: "Distinguish verified facts from UNKNOWN.",
  },
  {
    stepNumber: 4,
    code: "ASSIGN",
    action: "Bind named human custodian (Amanah)",
    purpose: "No nameless automated authority.",
  },
  {
    stepNumber: 5,
    code: "ASSESS",
    action: "Weigh benefit, harm & Mizan criteria",
    purpose: "Transparent human-auditable scoring.",
  },
  {
    stepNumber: 6,
    code: "DECIDE",
    action: "Commit explicit bounded determination",
    purpose: "Preserve dissenting or open uncertainties.",
  },
  {
    stepNumber: 7,
    code: "RECORD",
    action: "Write immutable entry in Open Book / Hisab",
    purpose: "Establish traceable attribution.",
  },
  {
    stepNumber: 8,
    code: "EXECUTE",
    action: "Ship clean, reversible engineering action",
    purpose: "Translate verdict into reliable craft.",
  },
  {
    stepNumber: 9,
    code: "EXPLAIN",
    action: "Expose rationale in human language",
    purpose: "Eliminate opaque black-box verdicts.",
  },
  {
    stepNumber: 10,
    code: "MONITOR",
    action: "Track real runtime telemetry & drift",
    purpose: "Detect regression or misuse early.",
  },
  {
    stepNumber: 11,
    code: "REVIEW",
    action: "Invite stakeholder appeal & Shura audit",
    purpose: "Guard against blind spots and bias.",
  },
  {
    stepNumber: 12,
    code: "CORRECT",
    action: "Execute Positive Correction & rollback",
    purpose: "Repair harm cleanly when wrong.",
  },
  {
    stepNumber: 13,
    code: "LEARN",
    action: "Consolidate durable insight into Codex",
    purpose: "Feed verified wisdom back into next cycle.",
  },
] as const;

export const QUARANTINED_AMBIGUITY_LEDGER: readonly QuarantinedAmbiguityEntry[] = [
  {
    id: "q-bass-hunter-rgbl",
    title: "BASS-HUNTER Method & RGBL/SRGBL Owner Ratification",
    classification: "UNKNOWN",
    detail:
      "CANON_BASS-HUNTER.md supplies expansion (Blessings, Answers, Signs & Science) but marks method UNKNOWN; CANON_RGBL-SRGBL.md awaits primary confirmation over recovered R&D models.",
    rule: "Never fabricate scoring or merge BASS-HUNTER with WHCMT (2×4 matrix 1-3-4-5 / 2-6-7-8).",
  },
  {
    id: "q-patch-014-conflict",
    title: "World Patch #014 Dual-Draft Collision",
    classification: "CONFLICTED",
    detail:
      "Both FAMILY WITHOUT FEAR and THE WRONG WAY — HELLROAD occupy slot #014 across recovered chat drafts, with 0/33 external divine approvals across all patches.",
    rule: "Preserve both #014 drafts side by side; never silently renumber or merge.",
  },
  {
    id: "q-amanah-mvn21a",
    title: "MVN §21A.7 & 25 Bidang Amanah Recovery Gap",
    classification: "PENDING_OWNER_REVIEW",
    detail:
      "bjo163/moonwitnessxv reported 0/25 Amanah entries until recovered from Z:\\.raw_archives\\chatgpt_mohrezzafahlevi\\conversations-001[33]; requires owner promotion review.",
    rule: "Expose raw origin and keep pedagogical Avatar framing distinct from infallibility.",
  },
  {
    id: "q-hallucinated-repos-quarantine",
    title: "Quarantined Placeholder SHAs & Non-Existent Repo Strings",
    classification: "QUARANTINED",
    detail:
      "Removed synthetic SHAs (M06-01-source-repo-pins.md) and non-existent repo names (bjo163/GOD-PROMISE, The-Batteries/100CENTER, etc.), plus third-party forks (paperclip, BRIDGE-ALLAH/ui, g4f).",
    rule: "Only cite verified GitHub repos across the 368-repo topology or confirmed local paths.",
  },
] as const;

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

export const MASTER_DNA_WORLDS_META: readonly MasterDnaMeta[] = [
  {
    id: "01-imperium-lumen",
    docCode: "01",
    title: "IMPERIUM LUMEN",
    metaphor: "Monumental empire of light and impossible architecture",
    ecosystemIdentity: "A-L-L-A-H.COM / Empire of the Light",
    rootAssignment: "Gate & Dock (`apps/a-l-l-a-h`)",
  },
  {
    id: "02-lunar-chronicles",
    docCode: "02",
    title: "LUNAR CHRONICLES",
    metaphor: "Living lunar observatory, celestial chronicle, and universe archive",
    ecosystemIdentity: "MoonWitness Universe",
    rootAssignment: "ID & Chronicle (`apps/web/dock`)",
  },
  {
    id: "03-rocksoul",
    docCode: "03",
    title: "ROCKSOUL",
    metaphor: "Silent cinematic storyteller and alternative-music journey (NOISE × SILENCE)",
    ecosystemIdentity: "ROCKSOUL signature narrative",
    rootAssignment: "Scoped World (`apps/rocksoul` / SkinScope)",
  },
  {
    id: "04-nexus-paradox",
    docCode: "04",
    title: "NEXUS PARADOX",
    metaphor: "Interface from another reality; diegetic spatial technology",
    ecosystemIdentity: "Headquarter / Future-game & experimental products",
    rootAssignment: "Command Center / Control Plane",
  },
  {
    id: "05-riot-anarchy",
    docCode: "05",
    title: "RIOT ANARCHY",
    metaphor: "Underground wall of manga, punk, xerox, and anti-design",
    ecosystemIdentity: "Gen-Z grunge / manga / poster experiences",
    rootAssignment: "RIOT Intelligence & Zine Surfaces (`apps/web`)",
  },
  {
    id: "06-mycelium",
    docCode: "06",
    title: "MYCELIUM",
    metaphor: "Digital ecosystem behaving like a living bioluminescent organism",
    ecosystemIdentity: "World Observatory / Organic generative network",
    rootAssignment: "Network / Memory Graph Observatory",
  },
  {
    id: "09-simpul-nusantara",
    docCode: "07",
    title: "SIMPUL NUSANTARA",
    metaphor: "Service atlas showing abstract neighborhood network routes",
    ecosystemIdentity: "E-ISP Storefront & Archipelago Operations",
    rootAssignment: "E-ISP / Operations (`radius`, `snmp`, `syslog`, `vpn`)",
  },
] as const;
