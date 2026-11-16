import type {
  AmanahFieldEntry,
  CenterStewardshipCluster,
  God99PersonaEntry,
  PrimeCodeAxiom,
  SyafaatStateId,
  WingStewardEntry,
} from "./types";

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

type God99DeptSpec = {
  readonly code: string;
  readonly name: string;
  readonly pillar: God99PersonaEntry["pillar"];
  readonly slots: readonly (readonly [string, string, string])[];
};

const GOD_99_DEPARTMENTS_RAW: readonly God99DeptSpec[] = [
  {
    code: "D01",
    name: "WOLF PACK",
    pillar: "PATHFINDING",
    slots: [
      ["GOD-018", "GATECRASHER", "Al-Fattah"],
      ["GOD-064", "FINDER X", "Al-Wajid"],
      ["GOD-071", "FIRST MOVER", "Al-Muqaddim"],
      ["GOD-073", "ZERO POINT", "Al-Awwal"],
      ["GOD-075", "DAYLIGHT", "Az-Zahir"],
      ["GOD-076", "HIDDEN TRAIL", "Al-Batin"],
      ["GOD-087", "CROSSROADS", "Al-Jami"],
      ["GOD-093", "GLOWRUNNER", "An-Nur"],
      ["GOD-094", "COMPASS KID", "Al-Hadi"],
      ["GOD-095", "WILD CARD", "Al-Badi"],
      ["GOD-098", "WOLFGUARD", "Ar-Rashid"],
    ],
  },
  {
    code: "D02",
    name: "SIGNAL RUNNERS",
    pillar: "PATHFINDING",
    slots: [
      ["GOD-019", "KNOWLEDGE HUNTER", "Al-Alim"],
      ["GOD-026", "ECHO SCOUT", "As-Sami"],
      ["GOD-027", "NIGHT LENS", "Al-Basir"],
      ["GOD-031", "DEEP INTEL", "Al-Khabir"],
      ["GOD-040", "ACCOUNT GRID", "Al-Hasib"],
      ["GOD-043", "RADAR PUNK", "Ar-Raqib"],
      ["GOD-044", "ANSWERLINE", "Al-Mujib"],
      ["GOD-045", "WIDE BAND", "Al-Wasi"],
      ["GOD-049", "WAKE SIGNAL", "Al-Baith"],
      ["GOD-050", "FIELD WITNESS", "Ash-Shahid"],
      ["GOD-057", "DATA COUNT", "Al-Muhsi"],
    ],
  },
  {
    code: "D03",
    name: "PROOF LAB",
    pillar: "TRUTH_GUIDANCE",
    slots: [
      ["GOD-028", "FAIR VERDICT", "Al-Hakam"],
      ["GOD-046", "WISDOM ENGINE", "Al-Hakim"],
      ["GOD-048", "HONOR CODE", "Al-Majid"],
      ["GOD-051", "FACT ANCHOR", "Al-Haqq"],
      ["GOD-054", "STABLE CORE", "Al-Matin"],
      ["GOD-063", "UPTIME KEEPER", "Al-Qayyum"],
      ["GOD-066", "ONE THREAD", "Al-Wahid"],
      ["GOD-067", "NO COUNTERFEIT", "Al-Ahad"],
      ["GOD-074", "LAST CHECK", "Al-Akhir"],
      ["GOD-096", "LONG RECORD", "Al-Baqi"],
      ["GOD-099", "PATIENCE PATCH", "As-Sabur"],
    ],
  },
  {
    code: "D04",
    name: "PEACE RIOT",
    pillar: "TRUTH_GUIDANCE",
    slots: [
      ["GOD-005", "PEACE RIOTER", "As-Salam"],
      ["GOD-024", "RESPECT RISE", "Al-Muizz"],
      ["GOD-025", "HUMILITY CHECK", "Al-Mudhill"],
      ["GOD-029", "EQUAL SIGN", "Al-Adl"],
      ["GOD-030", "SOFT POWER", "Al-Latif"],
      ["GOD-032", "COOL HEAD", "Al-Halim"],
      ["GOD-041", "DIGNITY LINE", "Al-Jalil"],
      ["GOD-078", "HUMBLE STANDARD", "Al-Mutaali"],
      ["GOD-079", "GOODWILL", "Al-Barr"],
      ["GOD-082", "CLEAN SLATE", "Al-Afuww"],
      ["GOD-086", "FAIR SHARE", "Al-Muqsit"],
    ],
  },
  {
    code: "D05",
    name: "FORGE LAB",
    pillar: "RENEWAL",
    slots: [
      ["GOD-008", "COURAGE CIRCUIT", "Al-Aziz"],
      ["GOD-010", "EGO BREAKER", "Al-Mutakabbir"],
      ["GOD-011", "IDEA FORGE", "Al-Khaliq"],
      ["GOD-012", "BUILDSHIFT", "Al-Bari"],
      ["GOD-013", "SHAPE ZERO", "Al-Musawwir"],
      ["GOD-033", "BIG PICTURE", "Al-Azim"],
      ["GOD-053", "STRONGHOLD", "Al-Qawiyy"],
      ["GOD-058", "FIRST DRAFT", "Al-Mubdi"],
      ["GOD-065", "PRIDE IN CRAFT", "Al-Maajid"],
      ["GOD-069", "CAPACITY BOOST", "Al-Qadir"],
      ["GOD-070", "POWER BUDGET", "Al-Muqtadir"],
    ],
  },
  {
    code: "D06",
    name: "PATCH & RESTORE",
    pillar: "RENEWAL",
    slots: [
      ["GOD-009", "BROKEN FIXER", "Al-Jabbar"],
      ["GOD-015", "BULLY STOPPER", "Al-Qahhar"],
      ["GOD-020", "RATE LIMIT", "Al-Qabid"],
      ["GOD-021", "OPEN HAND", "Al-Basit"],
      ["GOD-022", "EGO DOWN", "Al-Khafid"],
      ["GOD-023", "LIFT UP", "Ar-Rafi"],
      ["GOD-059", "RESTORE POINT", "Al-Muid"],
      ["GOD-072", "PAUSE BUTTON", "Al-Muakhkhir"],
      ["GOD-080", "SECOND CHANCE", "At-Tawwab"],
      ["GOD-081", "NO REVENGE", "Al-Muntaqim"],
      ["GOD-097", "HANDOVER", "Al-Warith"],
    ],
  },
  {
    code: "D07",
    name: "COMMONS CREW",
    pillar: "RENEWAL",
    slots: [
      ["GOD-003", "CIVIC LEAD", "Al-Malik"],
      ["GOD-016", "GIVEAWAY", "Al-Wahhab"],
      ["GOD-017", "FOOD GRID", "Ar-Razzaq"],
      ["GOD-039", "SUPPLY LINE", "Al-Muqit"],
      ["GOD-042", "GENEROUS HAND", "Al-Karim"],
      ["GOD-052", "TRUST BROKER", "Al-Wakil"],
      ["GOD-084", "MANDATE CHECK", "Malik-al-Mulk"],
      ["GOD-088", "RESOURCE ZERO", "Al-Ghani"],
      ["GOD-089", "LIVELIHOOD LAB", "Al-Mughni"],
      ["GOD-090", "ACCESS CONTROL", "Al-Mani"],
      ["GOD-092", "GOOD RETURN", "An-Nafi"],
    ],
  },
  {
    code: "D08",
    name: "SHADOW GUARD",
    pillar: "PROTECTION",
    slots: [
      ["GOD-004", "CLEAN CORE", "Al-Quddus"],
      ["GOD-006", "SAFE PASS", "Al-Mumin"],
      ["GOD-007", "WATCH WARDEN", "Al-Muhaymin"],
      ["GOD-036", "HIGH STANDARD", "Al-Aliyy"],
      ["GOD-037", "BIG SHIELD", "Al-Kabir"],
      ["GOD-038", "ARCHIVE GUARD", "Al-Hafiz"],
      ["GOD-055", "WINGMATE", "Al-Waliyy"],
      ["GOD-068", "SAFE HARBOR", "As-Samad"],
      ["GOD-077", "BOUNDARY CAPTAIN", "Al-Waali"],
      ["GOD-085", "DIGNITY GUARD", "Dhul-Jalal-wal-Ikram"],
      ["GOD-091", "HARM DETECTOR", "Ad-Darr"],
    ],
  },
  {
    code: "D09",
    name: "MERCY RESCUE",
    pillar: "PROTECTION",
    slots: [
      ["GOD-001", "OPEN HEART", "Ar-Rahman"],
      ["GOD-002", "CARE LOOP", "Ar-Rahim"],
      ["GOD-014", "FORGIVE FORGE", "Al-Ghaffar"],
      ["GOD-034", "HEALING ROUTE", "Al-Ghafur"],
      ["GOD-035", "GRATITUDE CLUB", "Ash-Shakur"],
      ["GOD-047", "HEARTBEAT", "Al-Wadud"],
      ["GOD-056", "THANK YOU CLUB", "Al-Hamid"],
      ["GOD-060", "LIFE SUPPORT", "Al-Muhyi"],
      ["GOD-061", "LAST MILE CARE", "Al-Mumit"],
      ["GOD-062", "LIVING WELL", "Al-Hayy"],
      ["GOD-083", "GENTLE HAND", "Ar-Rauf"],
    ],
  },
];

export const GOD_99_DEPARTMENTS = GOD_99_DEPARTMENTS_RAW.map((dept) => ({
  code: dept.code,
  name: dept.name,
  pillar: dept.pillar,
  slotCount: dept.slots.length,
}));

export const GOD_99_DIRECTORY: readonly God99PersonaEntry[] = GOD_99_DEPARTMENTS_RAW.flatMap(
  (dept) =>
    dept.slots.map(([slotId, codename, attributeReflection]) => ({
      slotId,
      codename,
      attributeReflection,
      departmentCode: dept.code,
      departmentName: dept.name,
      pillar: dept.pillar,
      status: "UNASSIGNED" as const,
      powers: "NONE" as const,
      relationship: "ETHICAL_ANALOGY_NOT_IDENTITY" as const,
    })),
);

export const AMANAH_25_ATLAS: readonly AmanahFieldEntry[] = [
  {
    number: 1,
    prophet: "Adam",
    amanahKey: "KHALĪFAH",
    domainFocus: "Stewardship",
    quranRef: "QS 2:30–39",
  },
  {
    number: 2,
    prophet: "Idris",
    amanahKey: "ṢIDQ",
    domainFocus: "Integrity",
    quranRef: "QS 19:56–57",
  },
  {
    number: 3,
    prophet: "Nuh",
    amanahKey: "INDHĀR / NADHĪR",
    domainFocus: "Foresight & Warning",
    quranRef: "QS 71:1–4",
  },
  {
    number: 4,
    prophet: "Hud",
    amanahKey: "NUṢḤ / AMĀNAH",
    domainFocus: "Counsel & Integrity",
    quranRef: "QS 7:65–68",
  },
  {
    number: 5,
    prophet: "Saleh",
    amanahKey: "IṢLĀḤ AL-ARḌ",
    domainFocus: "Earth & Resources",
    quranRef: "QS 11:61–64",
  },
  {
    number: 6,
    prophet: "Ibrahim",
    amanahKey: "ḤUJJAH",
    domainFocus: "Evidence & Foundations",
    quranRef: "QS 6:74–83",
  },
  {
    number: 7,
    prophet: "Lut",
    amanahKey: "ḤURUMĀT",
    domainFocus: "Dignity & Boundaries",
    quranRef: "QS 7:80–84",
  },
  {
    number: 8,
    prophet: "Ismail",
    amanahKey: "ṢĀDIQ AL-WAʿD",
    domainFocus: "Commitment",
    quranRef: "QS 19:54–55",
  },
  {
    number: 9,
    prophet: "Ishaq",
    amanahKey: "HUDĀ",
    domainFocus: "Guidance & Continuity",
    quranRef: "QS 21:72–73",
  },
  {
    number: 10,
    prophet: "Yaqub",
    amanahKey: "AHL",
    domainFocus: "Family & Cohesion",
    quranRef: "QS 12:83–100",
  },
  {
    number: 11,
    prophet: "Yusuf",
    amanahKey: "KHAZĀ'IN",
    domainFocus: "Resources & Reserves",
    quranRef: "QS 12:47–55",
  },
  {
    number: 12,
    prophet: "Ayyub",
    amanahKey: "KASHF AL-ḌURR",
    domainFocus: "Recovery",
    quranRef: "QS 21:83–84",
  },
  {
    number: 13,
    prophet: "Syuaib",
    amanahKey: "QISṬĀS",
    domainFocus: "Fair Exchange",
    quranRef: "QS 26:181–183",
  },
  {
    number: 14,
    prophet: "Musa",
    amanahKey: "AL-MUSTAḌʿAFĪN",
    domainFocus: "Protection & Liberation",
    quranRef: "QS 4:75",
  },
  {
    number: 15,
    prophet: "Harun",
    amanahKey: "WAZĪR",
    domainFocus: "Coordination & Support",
    quranRef: "QS 20:29–32",
  },
  {
    number: 16,
    prophet: "Zulkifli",
    amanahKey: "AL-ṢĀBIRĪN",
    domainFocus: "Reliability & Endurance",
    quranRef: "QS 21:85–86",
  },
  {
    number: 17,
    prophet: "Dawud",
    amanahKey: "ḤUKM BIL-ḤAQQ",
    domainFocus: "Justice",
    quranRef: "QS 38:26",
  },
  {
    number: 18,
    prophet: "Sulaiman",
    amanahKey: "MULK",
    domainFocus: "Governance & Orchestration",
    quranRef: "QS 27:15–44",
  },
  {
    number: 19,
    prophet: "Ilyas",
    amanahKey: "ṬĀGHŪT",
    domainFocus: "Rejected — Authority Integrity",
    quranRef: "Authority Integrity Anchor",
    rejectedFlag: true,
  },
  {
    number: 20,
    prophet: "Ilyasa",
    amanahKey: "AL-AKHYĀR",
    domainFocus: "Excellence & Continuity",
    quranRef: "QS 38:48",
  },
  {
    number: 21,
    prophet: "Yunus",
    amanahKey: "IṢLĀḤ",
    domainFocus: "Reform & Renewal",
    quranRef: "QS 10:98",
  },
  {
    number: 22,
    prophet: "Zakaria",
    amanahKey: "DHURRIYYAH ṬAYYIBAH",
    domainFocus: "Future Generations",
    quranRef: "QS 3:37–38",
  },
  {
    number: 23,
    prophet: "Yahya",
    amanahKey: "ZAKĀH",
    domainFocus: "Purity & Development",
    quranRef: "QS 19:12–15",
  },
  {
    number: 24,
    prophet: "Isa",
    amanahKey: "SHIFĀ'",
    domainFocus: "Healing & Restoration",
    quranRef: "QS 3:49–51 / 10:57",
  },
  {
    number: 25,
    prophet: "Muhammad ﷺ",
    amanahKey: "RAḤMAH LIL-ʿĀLAMĪN",
    domainFocus: "Universal Welfare",
    quranRef: "QS 21:107",
  },
] as const;
