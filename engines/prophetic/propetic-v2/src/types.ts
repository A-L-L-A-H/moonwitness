export type Evidence = "Q5"|"Q4"|"Q3"|"Q2"|"Q1"|"S3"|"S2"|"S1"|"T1"|"E0";
export type Confidence = "low"|"medium"|"high";
export interface EvidenceSpec { score:number; label:string; definition?:string }
export interface NameRoot { root:string; script:string; name_root_source_language:string; meaning:string; confidence:Confidence; status?:string; people_context?:string; guardrail:string }
export interface Rid { root:string; script:string; language:string; meaning:string; polarity:"positive"; source_type:string; quran_refs:string[]; confidence:string }
export interface QuranicStatus { classification:string; refs:string[]; evidence:Evidence }
export interface MissionSlot { summary:string; refs:string[]; evidence:Evidence }
export interface SupplementalWitness { source_book:"TAURAT"|"ZABUR"|"INJIL"; working_corpus:string; ref:string; claim:string; relation_to_quran:string; binding:string; binding_confidence:Confidence; evidence:Evidence; note?:string; mission_slots?:string[] }
export interface ProphetProfile { id:string; display_name:string; quranic_name:string; signature:string; name_root:NameRoot; rid:Rid; quranic_status:QuranicStatus; identity_layers:Record<string, unknown>; mission:Record<string, MissionSlot>; supplemental_witnesses:SupplementalWitness[]; world_traits?:WorldTraitMapping[]; context?:ProphetContext }
export interface DivineForm { name:string; arabic:string; refs:string[] }
export interface DivineAttributeFamily { id:string; root:string; kind:"divine_name"|"divine_name_family"|"divine_attribute"|"divine_predicate"; forms:DivineForm[]; concepts:string[]; lexemes:string[] }
export interface GraphEdge { id:string; from:string; to:string; type:string; evidence:Evidence; relation_mode?:RelationMode; score?:number; guardrail?:string; prophet_refs?:string[]; divine_refs?:string[]; note?:string; quality?:string; relation_type?:string; relation_to_quran?:string; binding?:string; binding_confidence?:Confidence; canonical_divine_root?:string }
export interface MatcherConfig { algorithm:string; max_candidates:number; minimum_score:number; auto_evidence_ceiling:Evidence; rules:string[]; guardrail:string }
export interface Dataset { schema_version:string; model:string; source_policy:Record<string,unknown>; evidence_scale:Record<Evidence,EvidenceSpec>; principles:Record<string,boolean>; prophet_order:string[]; prophets:Record<string,ProphetProfile>; divine_attributes:Record<string,DivineAttributeFamily>; edges:GraphEdge[]; matcher_config?:MatcherConfig; scoring_config?:ScoringConfig; runtime?:Record<string,unknown>; release?:{version:string;schema_version:string;api_major:string;status:string;change_scope:string[];research_semantics_changed:boolean} }

export interface MatchCandidate {
  prophet_id:string;
  prophet_name:string;
  divine_root:string;
  divine_name:string;
  divine_kind:DivineAttributeFamily["kind"];
  score:number;
  evidence:Evidence;
  reasons:string[];
  root_match:boolean;
  lexeme_match:boolean;
  concept_overlap:string[];
  method:"automatic_candidate";
}

export interface ProfileAuditFinding { severity:"info"|"review"|"error"; code:string; message:string }
export interface ProfileAuditResult {
  prophet_id:string;
  prophet_name:string;
  result:"PASS"|"PASS_WITH_REVIEW"|"FAIL";
  findings:ProfileAuditFinding[];
  curated_asma_roots:string[];
  auto_top_match:MatchCandidate|null;
  auto_agrees_with_curated:boolean;
}

export interface ScoringConfig {
  name:string;
  semantic:string;
  aggregation:string;
  evidence_aggregation:string;
  probability_guardrail:string;
  components:string[];
  default_component_weights:Record<string,number>;
}

export type RelationMode =
  | "SHARED_LEXEME_TRAIT"
  | "SHARED_ROOT_TRAIT"
  | "SEMANTIC_TRAIT_REFLECTION"
  | "SHARED_ROOT_ACTION"
  | "BESTOWED_CAPABILITY"
  | "MISSION_ALIGNMENT"
  | "DIVINE_INTERACTION"
  | "UNCLASSIFIED";

export interface WorldTraitMapping {
  trait:string;
  ref:string;
  evidence:Evidence;
  textual_strength:number;
  via_alpha:number|null;
  mapping_confidence:number;
  moral_top5:boolean;
  prevalence_top5:boolean;
  note:string;
}

export interface LeaderboardRow {
  rank:number;
  prophet_id:string;
  prophet_name:string;
  score:number;
  band:string;
  metric:string;
  note:string;
}

export interface ContextEvidenceField { summary:string; evidence:Evidence; refs:string[] }
export interface PeopleRegionContext {
  people:string; people_evidence:Evidence; people_refs:string[];
  historical_region:string; region_evidence:Evidence; region_refs:string[];
  modern_geography_crosswalk:string; modern_crosswalk_confidence:Confidence;
}
export interface LanguageContext { summary:string; evidence:Evidence; refs:string[]; scripture_language_context:string; scripture_evidence:Evidence; scripture_refs:string[] }
export interface ProphetContext { religion:ContextEvidenceField; people_region:PeopleRegionContext; language:LanguageContext; guardrails:string[] }
export interface ContextScoreRow { rank:number; prophet_id:string; prophet_name:string; context_score:number; religion_score:number; region_score:number; language_score:number; modern_crosswalk_confidence:number; band:string; note:string }

export type CorpusId = "quran"|"taurat"|"zabur"|"injil";
export interface CorpusSource { id:CorpusId; book:string; priority:number; role:string; working_witness?:string; reference_scheme:string; text_policy:string; claim_guardrail:string }
export interface CorpusRegistry { version:string; policy:string; sources:CorpusSource[]; allowed_source_ids:CorpusId[] }
export interface ProvenanceRef { source_id:CorpusId; ref:string; evidence:Evidence; relation?:string; note?:string }
export interface ProvenanceClaim { id:string; prophet_id?:string; category:string; statement:string; refs:ProvenanceRef[]; confidence:number; uncertainty_reasons:string[] }
export interface ProvenanceIndex { version:string; claims:ProvenanceClaim[]; by_prophet:Record<string,string[]>; by_source:Record<CorpusId,string[]> }
export type KinshipKind="PARENT_CHILD"|"SIBLINGS"|"KIN_ASSOCIATION";
export interface GenealogyRelation { id:string; from:string; to:string; kind:KinshipKind; direction:string; source:string; refs:string[]; confidence:Confidence; note?:string }
export interface GenealogyGraph { version:string; relations:GenealogyRelation[]; guardrail:string }
export interface TimelineEra { era:string; confidence:number; note:string }
export interface TimelineDataset { version:string; scale:string; eras:Record<string,TimelineEra> }
export interface EventNode { id:string; prophet_id:string; slot:string; summary:string; refs:string[]; evidence:Evidence; era:string; era_confidence:number }
export interface ConflictCase { id:string; subject:string; quran:{refs:string[];claim:string}; supplement:{book:string;ref:string;claim:string}; type:string; severity:number; scope:string; rule:string }
export interface ConflictDataset { version:string; cases:ConflictCase[] }
export interface UncertaintyResult { subject_id:string; uncertainty:number; confidence:number; reasons:string[]; conflicts:string[] }
export interface PreferenceObservation { trait_a:string; trait_b:string; winner:string; respondent_id?:string; country?:string; language?:string }
export interface PreferenceDataset { version:string; status:string; method:string; minimum_observations_for_public_score:number; minimum_unique_respondents:number; observations:PreferenceObservation[]; traits:string[]; guardrails:string[] }
export interface PreferenceEstimate { trait:string; ability:number; normalized_score:number; comparisons:number }
export interface PreferenceReport { status:"UNCALIBRATED"|"CALIBRATED"; n:number; unique_respondents:number; estimates:PreferenceEstimate[]; note:string }
export interface ApiResponse<T=unknown> { status:number; body:T }

export interface DocumentationEntry { id:string; title:string; path:string; category:string; status:"complete"|"review"|"planned" }
export interface DocumentationRegistry { version:string; schema_version?:string; status:string; documents:DocumentationEntry[]; governance?:{todo_path:string;roadmap_path:string;changelog_path:string;rule:string} }
export interface SourceEdition { edition_id:string; source_id:CorpusId; work:string; language:string; status:string; raw_text_ingested:boolean; note:string }
export interface SourceEditionRegistry { version:string; status:string; rule:string; editions:SourceEdition[] }
