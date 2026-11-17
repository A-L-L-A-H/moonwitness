export type WorldIdentifier =
  | "moonwitness"
  | "arsy"
  | "human-pen"
  | "sidra"
  | "rocksoul-dx"
  | "crayon"
  | "sin-can"
  | "mythos"
  | "angel-with-shotgun";

export type EntryDoorId =
  "story-universe" | "epistemic-corpus" | "empire-organization" | "sovereign-runtimes";

export type SyafaatStateId =
  "UNEXPLORED" | "DISCOVERED" | "PRACTICING" | "REFLECTED" | "SUSTAINING" | "REVISIT";

export type WorldPatchStatus =
  | "registered_in_chat"
  | "recovered_draft"
  | "number_conflict"
  | "editorial_proposal"
  | "user_submitted_in_chat"
  | "unnumbered_extra";

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

export interface WorldPatchEntry {
  readonly id: string;
  readonly patchNumber: string;
  readonly title: string;
  readonly status: WorldPatchStatus;
  readonly category: string;
  readonly divineApprovals: 0;
  readonly notes: string;
}

export interface CanonCharacterEntry {
  readonly id: string;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly note: string;
}

export interface AetherionLevelEntry {
  readonly levelNumber: number;
  readonly code: string;
  readonly realmCode: string;
  readonly realmName: string;
  readonly title: string;
  readonly accessState: "OPEN" | "SEALED";
}

export interface AetherionRealmEntry {
  readonly realmIndex: number;
  readonly realmCode: string;
  readonly name: string;
  readonly levelRange: string;
  readonly openingLandmark: string;
  readonly closingLandmark: string;
  readonly accessSummary: string;
}

export interface ParadiseGuildEntry {
  readonly code: string;
  readonly name: string;
  readonly domainFocus: string;
  readonly provenance: string;
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

export interface KeyWitnessFamily {
  readonly family: string;
  readonly keys: readonly [string, string, string, string];
}

export interface CorpusAuthorityEntry {
  readonly code: "SRC-QUR" | "SRC-TOR" | "SRC-ZAB" | "SRC-INJ";
  readonly name: string;
  readonly prophetAnchor: string;
  readonly classicalLanguage: string;
  readonly ethicalCore: string;
  readonly epistemicRole: string;
  readonly neutralSummary: string;
  readonly invariant: string;
}

export interface FourCorpusConcordanceTheme {
  readonly id: string;
  readonly title: string;
  readonly arabicRoot: string;
  readonly tauratWitness: string;
  readonly zaburWitness: string;
  readonly injilWitness: string;
  readonly quranWitness: string;
  readonly livedPractice: string;
}

export interface EcosystemEdgeNode {
  readonly id: "sanctuary" | "web" | "api" | "codex-edge" | "community" | "radio" | "igate";
  readonly hostname: string;
  readonly url: string;
  readonly workerName: string;
  readonly healthPath: string;
  readonly layer: string;
  readonly role: string;
}

export interface StandardEdgeHealthPayload {
  readonly contractVersion: "moonwitness.health/v1";
  readonly service: string;
  readonly status: "online" | "degraded" | "offline";
  readonly checkedAt: string;
  readonly latencyMs: number | null;
}

export interface EcosystemWorkspaceNode {
  readonly workspacePath: string;
  readonly name: string;
  readonly stack: string;
  readonly dnaWorld: string;
  readonly responsibility: string;
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

export interface God99PersonaEntry {
  readonly slotId: string;
  readonly codename: string;
  readonly attributeReflection: string;
  readonly departmentCode: string;
  readonly departmentName: string;
  readonly pillar: "PATHFINDING" | "TRUTH_GUIDANCE" | "RENEWAL" | "PROTECTION";
  readonly status: "UNASSIGNED";
  readonly powers: "NONE";
  readonly relationship: "ETHICAL_ANALOGY_NOT_IDENTITY";
}

export interface AmanahFieldEntry {
  readonly number: number;
  readonly prophet: string;
  readonly amanahKey: string;
  readonly domainFocus: string;
  readonly quranRef: string;
  readonly rejectedFlag?: boolean;
}

export interface OxDxZoneEntry {
  readonly zoneIndex: number;
  readonly zoneName: string;
  readonly levelRange: string;
  readonly levels: readonly [string, string, string, string, string, string, string];
}

export interface DhgsAssuranceStep {
  readonly stepNumber: number;
  readonly code: string;
  readonly action: string;
  readonly purpose: string;
}

export interface QuarantinedAmbiguityEntry {
  readonly id: string;
  readonly title: string;
  readonly classification: "UNKNOWN" | "CONFLICTED" | "QUARANTINED" | "PENDING_OWNER_REVIEW";
  readonly detail: string;
  readonly rule: string;
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

export type CanonicalDnaWorldId =
  | "01-imperium-lumen"
  | "02-lunar-chronicles"
  | "03-rocksoul"
  | "04-nexus-paradox"
  | "05-riot-anarchy"
  | "06-mycelium"
  | "09-simpul-nusantara";

export interface MasterDnaMeta {
  readonly id: CanonicalDnaWorldId;
  readonly docCode: string;
  readonly title: string;
  readonly metaphor: string;
  readonly ecosystemIdentity: string;
  readonly rootAssignment: string;
}
