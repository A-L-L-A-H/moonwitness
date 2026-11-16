/**
 * Deterministically selects one source for a mission slot without combining
 * claims from separate corpora. This is a bounded prophetic-domain rule;
 * evidence and provenance wire contracts remain owned by moonwitness-core.
 */
export const SOURCE_PRIORITY = ["AL-QURAN", "TAURAT", "ZABUR", "INJIL"] as const;

export type MissionSource = (typeof SOURCE_PRIORITY)[number] | "UNKNOWN";

export interface MissionSlot {
  summary: string;
  refs: readonly string[];
  evidence: string;
}

export interface SupplementalWitness {
  sourceBook: Exclude<MissionSource, "AL-QURAN" | "UNKNOWN">;
  evidence: string;
  ref: string;
  claim: string;
  missionSlots?: readonly string[];
}

export interface PropheticProfile {
  mission: Readonly<Record<string, MissionSlot>>;
  supplementalWitnesses: readonly SupplementalWitness[];
}

export interface SourceResolution {
  source: MissionSource;
  evidence: string;
  refs: readonly string[];
  claim: string;
}

export function resolveMissionSource(profile: PropheticProfile, slot: string): SourceResolution {
  const quranicSlot = profile.mission[slot];
  if (quranicSlot?.evidence.startsWith("Q")) {
    return {
      source: "AL-QURAN",
      evidence: quranicSlot.evidence,
      refs: quranicSlot.refs,
      claim: quranicSlot.summary,
    };
  }

  for (const sourceBook of SOURCE_PRIORITY.slice(1)) {
    const witness = profile.supplementalWitnesses.find(
      (candidate) => candidate.sourceBook === sourceBook && candidate.missionSlots?.includes(slot),
    );
    if (witness) {
      return { source: sourceBook, evidence: witness.evidence, refs: [witness.ref], claim: witness.claim };
    }
  }

  return {
    source: "UNKNOWN",
    evidence: "E0",
    refs: quranicSlot?.refs ?? [],
    claim: quranicSlot?.summary ?? "UNKNOWN / NOT EXPLICIT",
  };
}
