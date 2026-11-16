import { P18_KEY_WITNESS_SPEC, SWING_SWING_KEY_ROTATIONS } from "./epistemic";
import { DHGS_13_STEPS, OX_DX_SEVEN_ZONES } from "./sovereign";

/* -------------------------------------------------------------------------- */
/* 1. WSI Semantic & 7-Swing Framing Engine (engines/witness-semantic)        */
/* -------------------------------------------------------------------------- */

export interface SemanticFrameInput {
  readonly statement: string;
  readonly sourceRef: string;
  readonly agent?: string;
  readonly recipient?: string;
  readonly domain?: string;
  readonly scope?: string;
  readonly genre?: string;
  readonly swingDepth?: number;
}

export interface SwingRotationCandidate {
  readonly hop: number;
  readonly operator: string;
  readonly status: "UNVERIFIED_CANDIDATE";
  readonly prompt: string;
}

export interface WsiSemanticAuditResult {
  readonly frameStatus: "ONSIDE" | "OFFSIDE";
  readonly missingDimensions: readonly string[];
  readonly maxDepthApplied: number;
  readonly rotations: readonly SwingRotationCandidate[];
  readonly invariant: string;
}

/**
 * Evaluates P18 mandatory 5-dimension frame coverage (`agent`, `recipient`, `domain`, `scope`, `genre`)
 * and executes bounded Swing rotation probes (max 3 hops, strictly tagged UNVERIFIED_CANDIDATE).
 */
export function evaluateWsiSemanticFrame(input: SemanticFrameInput): WsiSemanticAuditResult {
  const dimensions: Record<string, string | undefined> = {
    agent: input.agent,
    recipient: input.recipient,
    domain: input.domain,
    scope: input.scope,
    genre: input.genre,
  };
  const missingDimensions = P18_KEY_WITNESS_SPEC.mandatoryFrameDimensions5.filter(
    (dim) => !dimensions[dim]?.trim(),
  );
  const hasSource = Boolean(input.sourceRef.trim()) && Boolean(input.statement.trim());
  const frameStatus = hasSource && missingDimensions.length === 0 ? "ONSIDE" : "OFFSIDE";

  const requestedDepth = input.swingDepth ?? 2;
  const maxDepthApplied = Math.max(0, Math.min(3, Math.round(requestedDepth)));
  const rotations: SwingRotationCandidate[] = SWING_SWING_KEY_ROTATIONS.slice(
    0,
    maxDepthApplied,
  ).map((operator, idx) => ({
    hop: idx + 1,
    operator,
    status: "UNVERIFIED_CANDIDATE",
    prompt: `Apply ${operator} to "${input.statement.slice(0, 72)}" without altering primary witness.`,
  }));

  return {
    frameStatus,
    missingDimensions,
    maxDepthApplied,
    rotations,
    invariant: P18_KEY_WITNESS_SPEC.rotationRule,
  };
}

/* -------------------------------------------------------------------------- */
/* 2. RGBL & SRGBL v8 Formal Evaluator (engines/crayon + corpus-srgbl)        */
/* -------------------------------------------------------------------------- */

export interface SrgblCriterionWeight {
  readonly weight: number;
  readonly confidence: number;
  readonly intensity: number;
  readonly direction: number;
}

export interface SrgblEvaluationInput {
  readonly question: string;
  readonly observations: readonly string[];
  readonly governanceRules: readonly string[];
  readonly actorsAndMeanings: readonly string[];
  readonly responsibleActions: readonly string[];
  readonly weightedCriteria?: readonly SrgblCriterionWeight[];
}

export interface SrgblEvaluationResult {
  readonly stages: {
    readonly R1_Reality: readonly string[];
    readonly G2_GoverningOrder: readonly string[];
    readonly B3_Being: readonly string[];
    readonly L4_Light: readonly string[];
  };
  readonly completeness: {
    readonly filledLevels: number;
    readonly totalLevels: 4;
    readonly ratio: number;
    readonly missingLevels: readonly ("R1" | "G2" | "B3" | "L4")[];
  };
  readonly weightedScore: number | "UNKNOWN";
  readonly neutralityInvariant: string;
}

/**
 * Evaluates cumulative RGBL (R1→G2→B3→L4) and SRGBL v8 weighted score `Σ(w·c·i·d)/Σ(w·c·i)`.
 * Zero denominator strictly returns categorical `"UNKNOWN"` and enforces zero religion ranking.
 */
export function evaluateSrgblModel(input: SrgblEvaluationInput): SrgblEvaluationResult {
  const clean = (items: readonly string[]) => items.map((s) => s.trim()).filter(Boolean);
  const obs = clean(input.observations);
  const gov = clean(input.governanceRules);
  const being = clean(input.actorsAndMeanings);
  const light = clean(input.responsibleActions);

  const missingLevels: Array<"R1" | "G2" | "B3" | "L4"> = [];
  if (obs.length === 0) missingLevels.push("R1");
  if (gov.length === 0) missingLevels.push("G2");
  if (being.length === 0) missingLevels.push("B3");
  if (light.length === 0) missingLevels.push("L4");

  const filledLevels = 4 - missingLevels.length;

  let weightedScore: number | "UNKNOWN" = "UNKNOWN";
  if (input.weightedCriteria && input.weightedCriteria.length > 0) {
    let numerator = 0;
    let denominator = 0;
    for (const row of input.weightedCriteria) {
      const wci =
        Math.max(0, row.weight) * Math.max(0, row.confidence) * Math.max(0, row.intensity);
      denominator += wci;
      numerator += wci * Math.max(-2, Math.min(2, row.direction));
    }
    weightedScore = denominator > 0 ? Number((numerator / denominator).toFixed(4)) : "UNKNOWN";
  }

  return {
    stages: {
      R1_Reality: obs.length ? obs : ["UNKNOWN — provide primary observable facts or sources"],
      G2_GoverningOrder: gov.length ? gov : ["UNKNOWN — specify governing rule or invariance"],
      B3_Being: being.length ? being : ["UNKNOWN — identify human agents & lived impact"],
      L4_Light: light.length ? light : ["UNKNOWN — state accountable action or caution"],
    },
    completeness: {
      filledLevels,
      totalLevels: 4,
      ratio: Number((filledLevels / 4).toFixed(2)),
      missingLevels,
    },
    weightedScore,
    neutralityInvariant: "Σ(w·c·i·d)/Σ(w·c·i) · 0/0 -> UNKNOWN · Zero religion ranking",
  };
}

/* -------------------------------------------------------------------------- */
/* 3. Prophetic Source Policy & DHGS 13-Step Assurance (prophetic + dhgs)     */
/* -------------------------------------------------------------------------- */

export const PROPHETIC_SOURCE_PRIORITY = ["AL-QURAN", "TAURAT", "ZABUR", "INJIL"] as const;
export type PropheticSourceBook = (typeof PROPHETIC_SOURCE_PRIORITY)[number] | "UNKNOWN";

export interface PropheticMissionSlot {
  readonly summary: string;
  readonly refs: readonly string[];
  readonly evidence: string;
}

export interface PropheticSupplementalWitness {
  readonly sourceBook: Exclude<PropheticSourceBook, "AL-QURAN" | "UNKNOWN">;
  readonly evidence: string;
  readonly ref: string;
  readonly claim: string;
  readonly missionSlots?: readonly string[];
}

export function resolvePropheticMissionSource(
  slots: Readonly<Record<string, PropheticMissionSlot>>,
  supplemental: readonly PropheticSupplementalWitness[],
  slotId: string,
): {
  readonly source: PropheticSourceBook;
  readonly evidence: string;
  readonly refs: readonly string[];
  readonly claim: string;
} {
  const qSlot = slots[slotId];
  if (qSlot && qSlot.evidence.startsWith("Q")) {
    return { source: "AL-QURAN", evidence: qSlot.evidence, refs: qSlot.refs, claim: qSlot.summary };
  }
  for (const book of PROPHETIC_SOURCE_PRIORITY.slice(1)) {
    const found = supplemental.find(
      (item) => item.sourceBook === book && item.missionSlots?.includes(slotId),
    );
    if (found) {
      return { source: book, evidence: found.evidence, refs: [found.ref], claim: found.claim };
    }
  }
  return {
    source: "UNKNOWN",
    evidence: "E0",
    refs: qSlot?.refs ?? [],
    claim: qSlot?.summary ?? "UNKNOWN / NOT EXPLICIT",
  };
}

export function evaluateDhgsAssuranceLoop(completedStepCodes: readonly string[]): {
  readonly totalSteps: 13;
  readonly completedCount: number;
  readonly status: "VERIFIED_LOOP" | "IN_PROGRESS";
  readonly nextRequiredStep: string | null;
} {
  const doneSet = new Set(completedStepCodes.map((c) => c.trim().toUpperCase()));
  const completedCount = DHGS_13_STEPS.filter((s) => doneSet.has(s.code)).length;
  const nextStep = DHGS_13_STEPS.find((s) => !doneSet.has(s.code)) ?? null;
  return {
    totalSteps: 13,
    completedCount,
    status: completedCount === DHGS_13_STEPS.length ? "VERIFIED_LOOP" : "IN_PROGRESS",
    nextRequiredStep: nextStep
      ? `${String(nextStep.stepNumber).padStart(2, "0")} ${nextStep.code}`
      : null,
  };
}

/* -------------------------------------------------------------------------- */
/* 4. OX-DX 49-Level Query & AQEL v0.1 Arabic Lexer/Parser (ontology + aqel)  */
/* -------------------------------------------------------------------------- */

export function queryOxDxHierarchy(query: string): readonly {
  readonly zoneIndex: number;
  readonly zoneName: string;
  readonly level: string;
  readonly distinctionRule: string;
}[] {
  const clean = query.trim().toLowerCase();
  const hits: Array<{
    readonly zoneIndex: number;
    readonly zoneName: string;
    readonly level: string;
    readonly distinctionRule: string;
  }> = [];

  for (const zone of OX_DX_SEVEN_ZONES) {
    for (const level of zone.levels) {
      if (
        !clean ||
        zone.zoneName.toLowerCase().includes(clean) ||
        level.toLowerCase().includes(clean)
      ) {
        hits.push({
          zoneIndex: zone.zoneIndex,
          zoneName: zone.zoneName,
          level,
          distinctionRule: "CONTAINMENT !== PROJECTION !== REPRESENTATION",
        });
      }
    }
  }
  return hits;
}

export interface AqelToken {
  readonly line: number;
  readonly kind: "KEYWORD" | "IDENTIFIER" | "STRING" | "NUMBER" | "OPERATOR" | "COMMENT";
  readonly value: string;
}

export interface AqelAstStatement {
  readonly line: number;
  readonly keyword: string;
  readonly target: string;
}

const AQEL_KEYWORDS = new Set(["عرّف", "عرف", "حقيقة", "قاعدة", "اسأل", "استنتج", "تحقق", "اشرح"]);

/**
 * Normalizes and lexes AQEL Arabic-first v0.1 statements into tokens and AST statements
 * without LLM ambiguity (`#` comments, string literals, Arabic keywords).
 */
export function tokenizeAndParseAqel(source: string): {
  readonly tokens: readonly AqelToken[];
  readonly statements: readonly AqelAstStatement[];
  readonly diagnostics: readonly string[];
} {
  const tokens: AqelToken[] = [];
  const statements: AqelAstStatement[] = [];
  const diagnostics: string[] = [];

  const lines = source.split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("#")) {
      tokens.push({ line: lineNo, kind: "COMMENT", value: trimmed });
      return;
    }

    const parts =
      trimmed.match(/"[^"]*"|==|!=|<=|>=|[=()+\-*/]|[\u0600-\u06FFa-zA-Z0-9_.-]+/gu) ?? [];
    for (const tok of parts) {
      if (AQEL_KEYWORDS.has(tok)) {
        tokens.push({ line: lineNo, kind: "KEYWORD", value: tok });
      } else if (tok.startsWith('"') && tok.endsWith('"')) {
        tokens.push({ line: lineNo, kind: "STRING", value: tok.slice(1, -1) });
      } else if (/^\d+(?:\.\d+)?$/.test(tok)) {
        tokens.push({ line: lineNo, kind: "NUMBER", value: tok });
      } else if (/^[=!<>/+\-*()]+$/.test(tok)) {
        tokens.push({ line: lineNo, kind: "OPERATOR", value: tok });
      } else {
        tokens.push({ line: lineNo, kind: "IDENTIFIER", value: tok });
      }
    }

    const head = parts[0];
    if (head && AQEL_KEYWORDS.has(head)) {
      const rest = trimmed.slice(head.length).trim();
      if (!rest) {
        diagnostics.push(`Line ${lineNo}: AQEL keyword "${head}" expects an operand expression.`);
      } else {
        statements.push({ line: lineNo, keyword: head, target: rest });
      }
    } else if (head) {
      diagnostics.push(
        `Line ${lineNo}: Unexpected leading token "${head}" outside AQEL statement.`,
      );
    }
  });

  return { tokens, statements, diagnostics };
}
