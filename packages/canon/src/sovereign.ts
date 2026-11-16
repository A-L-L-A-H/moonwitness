import type {
  DhgsAssuranceStep,
  EcosystemEdgeNode,
  EcosystemWorkspaceNode,
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
      "bjo163/moonwitnessxv reported 0/25 Amanah entries until recovered from the Consolidated Narrative Archive (conv-001[33]); requires owner promotion review.",
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
      "BRIDGE-ALLAH/MOONWITNESS (dx runtime)",
      "A-L-L-A-H/rocksoul-dx (desktop kernel)",
      "A-L-L-A-H/memory (constitutional memory)",
      "isrockfeel/moonwitness (active monorepo)",
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
      "bjo163/A-L-L-A-H.COM (Imperium Lumen DNA)",
      "bjo163/moonwitness-corpus (P18 / SRGBL v8)",
      "bjo163/moonwitnessxv (Vision Narrative XV)",
      "bjo163/moonwitness-xiv (99-Chapter Structure)",
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
    localClones: ["Synchronized into bjo163/moonwitness-corpus"],
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
      "BRIDGE-ALLAH/MOONWITNESS (NARATION.md)",
      "Synchronized with @moonwitness/moonframe UI skins",
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
      "Mirrors bjo163/moonwitness (MOONWITNESS OS V9.5); distinct from A-L-L-A-H/moonwitness@dev",
    ],
    flagshipRepos: ["moonwitness-id/moonwitness"],
  },
] as const;

export const ECOSYSTEM_HEALTH_CONTRACT_VERSION = "moonwitness.health/v1" as const;

export const ECOSYSTEM_RUNTIME_CATALOG = {
  monorepoSlug: "A-L-L-A-H/moonwitness",
  liveEdges: [
    {
      id: "sanctuary",
      hostname: "a-l-l-a-h.com",
      url: "https://a-l-l-a-h.com",
      workerName: "allah-sanctuary",
      healthPath: "/api/ecosystem-health",
      layer: "Cloudflare Workers · vinext",
      role: "Primary Sanctuary Gateway, Four Scriptures Covenant & 4-Door Canon Codex",
    },
    {
      id: "web",
      hostname: "moonwitness.biz.id",
      url: "https://moonwitness.biz.id",
      workerName: "moonwitness-web",
      healthPath: "/api/health",
      layer: "Cloudflare Workers · vinext",
      role: "MoonWitness Living Story Console, 7-DNA Skin Lab, Dock & Control Portal",
    },
    {
      id: "api",
      hostname: "api.moonwitness.biz.id",
      url: "https://api.moonwitness.biz.id",
      workerName: "moonwitness-api",
      healthPath: "/api/v1/healthz",
      layer: "Cloudflare Workers · EdgeRouter + D1",
      role: "Unified API Gateway, Session Auth, Timeline & Command-Center Persistence",
    },
    {
      id: "codex-edge",
      hostname: "codex.a-l-l-a-h.com",
      url: "https://codex.a-l-l-a-h.com",
      workerName: "sovereign-codex-edge",
      healthPath: "/health",
      layer: "Cloudflare Workers · D1 Edge",
      role: "Autonomous 9-Node Edge Pulse, Roadmap Progress & Public Comments Codex",
    },
    {
      id: "community",
      hostname: "community.moonwitness.biz.id",
      url: "https://community.moonwitness.biz.id",
      workerName: "rocksoul-community",
      healthPath: "/",
      layer: "Cloudflare Workers · SPA Edge",
      role: "Source-Aware Community Participation Portal for MoonWitness × Rocksoul",
    },
    {
      id: "radio",
      hostname: "moonwitness-radio.bjo163.workers.dev",
      url: "https://moonwitness-radio.bjo163.workers.dev",
      workerName: "moonwitness-radio",
      healthPath: "/health",
      layer: "Cloudflare Workers · Audio Broadcast",
      role: "MoonWitness Acoustic Broadcast & Contemplative Radio Telemetry Edge",
    },
    {
      id: "igate",
      hostname: "igate.moonwitness.biz.id",
      url: "https://igate.moonwitness.biz.id",
      workerName: "rocksoul-igate-worker",
      healthPath: "/health",
      layer: "Cloudflare Workers · D1 Edge",
      role: "Rocksoul Identity Gateway & Provisioning Edge Health Broker",
    },
  ] as readonly EcosystemEdgeNode[],
  workspaceNodes: [
    {
      workspacePath: "apps/a-l-l-a-h",
      name: "@moonwitness/a-l-l-a-h",
      stack: "Next 15.5 · vinext · WebGL2 GLSL · Cloudflare Worker",
      dnaWorld: "01 Imperium Lumen",
      responsibility:
        "Monocentric Sanctuary Frontier, Four Scriptural Witnesses, Contemplation & 4-Door Canon Codex.",
    },
    {
      workspacePath: "apps/web",
      name: "@moonwitness/web",
      stack: "Next 15.5 · @moonwitness/ui · Playwright Verified",
      dnaWorld: "02 Lunar Chronicles / 05 Riot Anarchy",
      responsibility:
        "MoonWitness Universe Console (/dock, /mission-control, /intelligence, /skin-lab, Operations).",
    },
    {
      workspacePath: "apps/api",
      name: "@moonwitness/api",
      stack: "Fastify · @moonwitness/orm libSQL · Ollama AI",
      dnaWorld: "Core API Gateway",
      responsibility:
        "Authenticated REST gateway, persistent SQLite timeline/command-center state & Rust/Go proxy.",
    },
    {
      workspacePath: "apps/rocksoul",
      name: "rocksoul-dx",
      stack: "Tauri 2 · React 19 · Three.js / R3F · SQLite",
      dnaWorld: "03 Rocksoul (Noise × Silence)",
      responsibility:
        "Windows desktop spatial workbench integrating The Awakening threshold, SQLite & allowlisted Git ops.",
    },
    {
      workspacePath: "apps/memory",
      name: "How U Remind Me",
      stack: "FastAPI · SQLite FTS5 · FastEmbed · LanceDB · Rclone S3",
      dnaWorld: "Personal Archive Vault",
      responsibility:
        "Local-first encrypted conversation vault & semantic recall feeding /intelligence memory bridge.",
    },
    {
      workspacePath: "cp/arsy & services/*",
      name: "ARSY + Rust Bare-Metal Services",
      stack: "Go Stdlib (:8787) · 4 Rust Axum Services",
      dnaWorld: "09 Simpul Nusantara / Control Plane",
      responsibility:
        "Go WireGuard/DNS host reconciler paired with Rust RADIUS, SNMP, SigV4 Storage & Syslog engines.",
    },
  ] as readonly EcosystemWorkspaceNode[],
} as const;

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
