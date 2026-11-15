export type WorldIdentifier = "moonwitness" | "arsy" | "qalam" | "sidra" | "rocksoul-dx";

export type NavigationSectionId = "the-gate" | "the-worlds" | "the-dock" | "about";

export interface WorldArtifactRecord {
  readonly code: string;
  readonly title: string;
  readonly classification: string;
  readonly summary: string;
  readonly timestampLabel: string;
}

export interface WorldDomainEntry {
  readonly id: WorldIdentifier;
  readonly name: string;
  readonly tagline: string;
  readonly pillars: readonly [string, string, string];
  readonly arabicEpithet: string;
  readonly transliteration: string;
  readonly citadelSector: string;
  readonly harmonicFrequency: string;
  readonly primaryDirective: string;
  readonly architecturalDescription: string;
  readonly accentColor: string;
  readonly statusLabel: string;
  readonly activeWitnessCount: string;
  readonly artifacts: readonly WorldArtifactRecord[];
}

export interface DockNodeTelemetry {
  readonly nodeCode: string;
  readonly worldId: WorldIdentifier;
  readonly designation: string;
  readonly protocol: string;
  readonly latencyMs: number;
  readonly integrityPercent: number;
  readonly orbitalBearing: string;
  readonly state: "SYNCHRONIZED" | "LUMINOUS" | "BROADCASTING";
}

export interface SidraKnowledgeAxiom {
  readonly id: string;
  readonly title: string;
  readonly discipline: string;
  readonly coordinateX: number;
  readonly coordinateY: number;
  readonly exposition: string;
  readonly geometricRatio: string;
  readonly connectedIds: readonly string[];
}

export interface CovenantPillar {
  readonly numeral: string;
  readonly heading: string;
  readonly subtitle: string;
  readonly statement: string;
}

export const NAVIGATION_TABS: readonly {
  readonly id: NavigationSectionId;
  readonly label: string;
}[] = [
  { id: "the-gate", label: "THE GATE" },
  { id: "the-worlds", label: "THE WORLDS" },
  { id: "the-dock", label: "THE DOCK" },
  { id: "about", label: "ABOUT" },
] as const;

export const WORLD_DOMAINS: readonly WorldDomainEntry[] = [
  {
    id: "moonwitness",
    name: "MOONWITNESS",
    tagline: "Stories · Knowledge · Archive",
    pillars: ["Stories", "Knowledge", "Archive"],
    arabicEpithet: "شَاهِدُ القَمَر",
    transliteration: "Shāhid al-Qamar",
    citadelSector: "Western Spire of Testimony",
    harmonicFrequency: "1420.405 MHz · Hydrogen Line",
    primaryDirective: "Preserve human testimony and luminous narratives across borders.",
    architecturalDescription:
      "An observatory and living archive where dispatches from every meridian converge under a single celestial vault. Every story is indexed as an enduring constellation of witness.",
    accentColor: "#f3dfb2",
    statusLabel: "ARCHIVE IMMUTABLE",
    activeWitnessCount: "14,280 Chronicles",
    artifacts: [
      {
        code: "MW-0114",
        title: "The Meridian of Silent Lanterns",
        classification: "Field Testimony · Cairo — Bukhara",
        summary:
          "Oral histories of nocturnal astronomers who mapped desert trade routes using brass astrolabes and lunar mansions.",
        timestampLabel: "Cycle 1448 · Verified",
      },
      {
        code: "MW-0209",
        title: "Codex of the Glass Horizon",
        classification: "Archival Monograph · Andalusia",
        summary:
          "Architectural treatise on water-mirror courtyards designed to reflect starfields onto marble colonnades.",
        timestampLabel: "Cycle 1448 · Sealed",
      },
      {
        code: "MW-0341",
        title: "Voices Above the Cloud Sea",
        classification: "Expedition Log · High Pamirs",
        summary:
          "High-altitude acoustic recordings and manuscript fragments gathered from mountain sanctuaries.",
        timestampLabel: "Cycle 1448 · Live",
      },
    ],
  },
  {
    id: "arsy",
    name: "ARSY",
    tagline: "Radio · Technology · Infrastructure",
    pillars: ["Radio", "Technology", "Infrastructure"],
    arabicEpithet: "العَرْشُ النُّورَانِي",
    transliteration: "Al-‘Arsh al-Nūrānī",
    citadelSector: "Zenith Crown Relay Array",
    harmonicFrequency: "432.000 Hz · Sovereign Carrier",
    primaryDirective: "Sustain zero-drift communication lattices and harmonic broadcasts.",
    architecturalDescription:
      "The high-availability technological backbone of the Empire of the Light. Arsy orchestrates continuous radio transmissions, distributed mesh telemetry, and cryptographic sanctuary storage.",
    accentColor: "#ffd984",
    statusLabel: "CARRIER LOCKED",
    activeWitnessCount: "99.998% Coherence",
    artifacts: [
      {
        code: "AR-0800",
        title: "Zenith Harmonic Beacon",
        classification: "Orbital Carrier · Channel 01",
        summary:
          "Continuous low-noise acoustic and telemetry stream synchronizing all five realms of the Empire.",
        timestampLabel: "0.42 ms Drift",
      },
      {
        code: "AR-1024",
        title: "Sovereign Mesh Ledger",
        classification: "Infrastructure Node · Tier-0",
        summary:
          "Byzantine-resilient replication fabric ensuring every manuscript in Qalam and Moonwitness endures.",
        timestampLabel: "128 Relays Active",
      },
      {
        code: "AR-1440",
        title: "Ionospheric Mirror Protocol",
        classification: "Radio Propagation · Deep Sky",
        summary:
          "Adaptive shortwave and optical relay bridge engineered for uninterrupted cross-continental reach.",
        timestampLabel: "Signal +42 dBm",
      },
    ],
  },
  {
    id: "qalam",
    name: "QALAM",
    tagline: "Create · Write · Share",
    pillars: ["Create", "Write", "Share"],
    arabicEpithet: "نُون وَالقَلَم",
    transliteration: "Nūn wa-al-Qalam",
    citadelSector: "Central Golden Scriptorium",
    harmonicFrequency: "528.000 Hz · Inscription Resonance",
    primaryDirective: "Empower sacred authorship, luminous typography, and shared wisdom.",
    architecturalDescription:
      "At the heart of the Golden Gate stands the Scriptorium of Qalam—where thought becomes permanent inscription. Authors craft essays, visual codices, and poetic treatises in light.",
    accentColor: "#ffeab8",
    statusLabel: "SCRIPTORIUM OPEN",
    activeWitnessCount: "8,940 Inscriptions",
    artifacts: [
      {
        code: "QL-0001",
        title: "Treatise on Sacred Proportion",
        classification: "Illuminated Folio · Geometry",
        summary:
          "How twelve-fold star girih tessellations encode harmonic ratios in both typography and sanctuary domes.",
        timestampLabel: "Folio I · Master",
      },
      {
        code: "QL-0068",
        title: "Letters of the First Dawn",
        classification: "Calligraphic Anthology · Gold Leaf",
        summary:
          "Meditations on clarity, gratitude, and disciplined craftsmanship as acts of devotion.",
        timestampLabel: "Folio IV · Public",
      },
      {
        code: "QL-0096",
        title: "The Architecture of Stillness",
        classification: "Editorial Essay · Sanctuary Design",
        summary:
          "Designing digital spaces that elevate contemplation rather than fragmenting human attention.",
        timestampLabel: "Folio IX · Featured",
      },
    ],
  },
  {
    id: "sidra",
    name: "SIDRA",
    tagline: "Connect · Explore · Learn",
    pillars: ["Connect", "Explore", "Learn"],
    arabicEpithet: "سِدْرَةُ المُنْتَهَى",
    transliteration: "Sidrat al-Muntahā",
    citadelSector: "Eastern Observatory Dome",
    harmonicFrequency: "639.000 Hz · Lattice Synthesis",
    primaryDirective: "Map the interconnected branches of science, ethics, and cosmic order.",
    architecturalDescription:
      "Inspired by the Lote Tree of the Utmost Boundary, Sidra organizes human and machine knowledge into a living polyhedral graph where every inquiry illuminates neighboring disciplines.",
    accentColor: "#e6c987",
    statusLabel: "CONSTELLATION LIVE",
    activeWitnessCount: "640 Knowledge Domes",
    artifacts: [
      {
        code: "SD-0310",
        title: "Atlas of Celestial Mechanics",
        classification: "Curriculum · Astrometry",
        summary:
          "Interactive derivations of orbital resonances, spherical trigonometry, and twilight horizon optics.",
        timestampLabel: "18 Modules",
      },
      {
        code: "SD-0512",
        title: "Ethics of Autonomous Craft",
        classification: "Symposium · Philosophy of Tech",
        summary:
          "Principled engineering standards aligning computational systems with human dignity and truth.",
        timestampLabel: "12 Seminars",
      },
      {
        code: "SD-0777",
        title: "The Polyhedral Tessellation Lab",
        classification: "Interactive Study · Mathematics",
        summary:
          "Quasicrystalline symmetries and golden-ratio projections in classical and futuristic architecture.",
        timestampLabel: "24 Proofs",
      },
    ],
  },
  {
    id: "rocksoul-dx",
    name: "ROCKSOUL DX",
    tagline: "Play · Create · Dream",
    pillars: ["Play", "Create", "Dream"],
    arabicEpithet: "رُوحُ الإِبْدَاع",
    transliteration: "Rūḥ al-Ibdā‘",
    citadelSector: "Horizon Mirror Plaza",
    harmonicFrequency: "888.000 Hz · Prismatic Engine",
    primaryDirective: "Simulate luminous worlds, interactive art, and generative geometry.",
    architecturalDescription:
      "The spatial simulation and creative sandbox wing of the Empire. Rocksoul DX fuses procedural geometry, acoustic synthesis, and interactive worldbuilding into playable experiences.",
    accentColor: "#f7dfa0",
    statusLabel: "ENGINE ENGAGED",
    activeWitnessCount: "120 FPS Lock",
    artifacts: [
      {
        code: "RX-0001",
        title: "Astrolabe of Light Engine",
        classification: "Interactive Sandbox · WebGL/Canvas",
        summary:
          "Real-time sacred geometry generator allowing creators to sculpt radial star mandalas and orbital fields.",
        timestampLabel: "v4.8 Active",
      },
      {
        code: "RX-0042",
        title: "Citadel Walk: Reflections",
        classification: "Spatial Experience · Horizon",
        summary:
          "Procedural acoustic-visual journey across obsidian water mirrors and golden colonnades.",
        timestampLabel: "Scene Ready",
      },
      {
        code: "RX-0099",
        title: "Harmonic Prism Sequencer",
        classification: "Audio-Visual Instrument · DX",
        summary:
          "Polyrhythmic chime matrix tuned to pure Pythagorean ratios and celestial orbital periods.",
        timestampLabel: "Interactive",
      },
    ],
  },
] as const;

export const DOCK_TELEMETRY_NODES: readonly DockNodeTelemetry[] = [
  {
    nodeCode: "GATE-01",
    worldId: "moonwitness",
    designation: "Spire of Testimony Vault",
    protocol: "MW-CHRONICLE/TLS1.3",
    latencyMs: 4,
    integrityPercent: 100,
    orbitalBearing: "284° W · +19° Decl",
    state: "SYNCHRONIZED",
  },
  {
    nodeCode: "GATE-02",
    worldId: "arsy",
    designation: "Zenith Carrier Array",
    protocol: "ARSY-MESH/QUIC",
    latencyMs: 2,
    integrityPercent: 99.99,
    orbitalBearing: "000° Z · +90° Apex",
    state: "BROADCASTING",
  },
  {
    nodeCode: "GATE-03",
    worldId: "qalam",
    designation: "Golden Scriptorium Core",
    protocol: "QALAM-FOLIO/ED25519",
    latencyMs: 3,
    integrityPercent: 100,
    orbitalBearing: "180° S · +45° Gate",
    state: "LUMINOUS",
  },
  {
    nodeCode: "GATE-04",
    worldId: "sidra",
    designation: "Lote-Tree Knowledge Graph",
    protocol: "SIDRA-DAG/SPARQL",
    latencyMs: 5,
    integrityPercent: 100,
    orbitalBearing: "076° E · +33° Dome",
    state: "SYNCHRONIZED",
  },
  {
    nodeCode: "GATE-05",
    worldId: "rocksoul-dx",
    designation: "Dreamforge Spatial Engine",
    protocol: "ROCKSOUL-DX/WEBGPU",
    latencyMs: 1,
    integrityPercent: 100,
    orbitalBearing: "142° SE · +12° Plaza",
    state: "LUMINOUS",
  },
] as const;

export const SIDRA_KNOWLEDGE_AXIOMS: readonly SidraKnowledgeAxiom[] = [
  {
    id: "noor-optics",
    title: "Optics of Al-Nūr",
    discipline: "Radiative Geometry",
    coordinateX: 50,
    coordinateY: 22,
    exposition:
      "Every ray emitted from the central meridian reflects across the obsidian basin according to inverse-square harmonic attenuation, uniting heaven and horizon.",
    geometricRatio: "φ = 1.6180339887",
    connectedIds: ["mizan-harmony", "qalam-codex", "falak-orbit"],
  },
  {
    id: "mizan-harmony",
    title: "Al-Mīzān Equilibrium",
    discipline: "Architectural Balance",
    coordinateX: 24,
    coordinateY: 48,
    exposition:
      "Twin citadels flank the central portal in exact bilateral symmetry, symbolizing the balance between outward technical mastery and inward spiritual stillness.",
    geometricRatio: "√2 = 1.4142135623",
    connectedIds: ["noor-optics", "hikmah-archive"],
  },
  {
    id: "falak-orbit",
    title: "Al-Falak Celestial Mechanics",
    discipline: "Astrometry",
    coordinateX: 76,
    coordinateY: 48,
    exposition:
      "Planetary rings and sidereal trajectories trace deterministic ellipses around the primary luminary, providing a universal clock for all five worlds.",
    geometricRatio: "2π = 6.2831853071",
    connectedIds: ["noor-optics", "ibda-synthesis"],
  },
  {
    id: "hikmah-archive",
    title: "Bayt al-Ḥikmah Memory",
    discipline: "Epistemology",
    coordinateX: 34,
    coordinateY: 78,
    exposition:
      "Knowledge preserved with cryptographic provenance and scholarly rigor transforms fleeting human observations into an eternal inheritance.",
    geometricRatio: "3:4:5 Pythagorean",
    connectedIds: ["mizan-harmony", "qalam-codex"],
  },
  {
    id: "qalam-codex",
    title: "The First Inscription",
    discipline: "Calligraphic Ontology",
    coordinateX: 50,
    coordinateY: 56,
    exposition:
      "At the intersection of intention and form stands the Qalam: translating unseen wisdom into visible proportion, letter, and law.",
    geometricRatio: "1 : √3 Octagram",
    connectedIds: ["noor-optics", "hikmah-archive", "ibda-synthesis"],
  },
  {
    id: "ibda-synthesis",
    title: "Ibdā‘ Creative Genesis",
    discipline: "Generative Systems",
    coordinateX: 66,
    coordinateY: 78,
    exposition:
      "From simple geometric seeds emerge infinite non-repeating star tessellations—demonstrating how finite rules yield boundless beauty.",
    geometricRatio: "12-Fold Girih",
    connectedIds: ["falak-orbit", "qalam-codex"],
  },
] as const;

export const COVENANT_PILLARS: readonly CovenantPillar[] = [
  {
    numeral: "I",
    heading: "A WORLD TO WITNESS",
    subtitle: "Truth · Testimony · Remembrance",
    statement:
      "To witness with clarity and reverence is the beginning of awareness. Through Moonwitness and Arsy, every signal of beauty, justice, and cosmic order is observed and preserved without distortion.",
  },
  {
    numeral: "II",
    heading: "A WORLD TO LEARN",
    subtitle: "Wisdom · Geometry · Inquiry",
    statement:
      "Creation is an open book of signs. Through Sidra, mathematics, astronomy, ethics, and engineering are studied not as fragmented utilities, but as unified expressions of divine proportion.",
  },
  {
    numeral: "III",
    heading: "A WORLD TO BUILD",
    subtitle: "Craft · Excellence · Radiance",
    statement:
      "Excellence (Iḥsān) demands that whatever we construct—whether an infrastructure protocol, a written manuscript in Qalam, or a luminous world in Rocksoul DX—is built with supreme beauty and integrity.",
  },
] as const;
