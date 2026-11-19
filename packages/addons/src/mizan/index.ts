import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const mizanManifest = manifestData as AddonManifestInput;

export type AssessmentMethod = "general" | "general_limited" | "prophetic";

export interface MethodInput {
  generalSufficient: boolean;
  balanceSatisfied: boolean;
  internalReferenceVerified: boolean;
}

export interface MethodDecision {
  method: AssessmentMethod;
  limitation?: string;
}

export interface AssessmentInput extends MethodInput {
  primaryFilterPassed: boolean;
  secondaryFilterPassed: boolean;
  powerRightScore: number;
  powerLeftScore: number;
  propheticReferenceRelevant: boolean;
  propheticReferenceWeight: number;
  rating: number;
}

export interface AssessmentDecision extends MethodDecision {
  generalWeight: number;
  propheticReferenceWeight: number;
  totalWeight: number;
}

export const PRIMARY_FILTERS = [
  "No Prejudice",
  "No Coercion",
  "No Gender Discrimination",
  "No Degradation",
] as const;

export const SECONDARY_FILTERS = [
  "Underage Exclusion",
  "Female-Specific Consideration",
  "Maximum Rating: 4.5/5",
  "No Absolute Perfection",
] as const;

export function chooseMizanMethod(input: MethodInput): MethodDecision {
  if (input.generalSufficient) return { method: "general" };
  if (input.balanceSatisfied && input.internalReferenceVerified) {
    return { method: "prophetic" };
  }
  return {
    method: "general_limited",
    limitation: input.balanceSatisfied
      ? "Internal reference is not verified."
      : "A material balance condition is not established.",
  };
}

function assertBoundedScore(name: string, value: number, maximum: number): void {
  if (!Number.isFinite(value) || value < 0 || value > maximum) {
    throw new Error(`${name} must be between 0 and ${maximum}.`);
  }
}

export function validateMizanAssessment(input: AssessmentInput): AssessmentDecision {
  if (!input.primaryFilterPassed) {
    throw new Error("Primary Filter must pass before an assessment can be finalized.");
  }
  if (!input.secondaryFilterPassed) {
    throw new Error("Secondary Filter must pass before an assessment can be finalized.");
  }

  assertBoundedScore("Power Right score", input.powerRightScore, 10);
  assertBoundedScore("Power Left score", input.powerLeftScore, 7);
  assertBoundedScore("Prophetic reference weight", input.propheticReferenceWeight, 4);
  assertBoundedScore("Rating", input.rating, 4.5);

  const generalWeight = input.powerRightScore + input.powerLeftScore;
  const referenceCanContribute =
    input.balanceSatisfied && input.internalReferenceVerified && input.propheticReferenceRelevant;

  if (input.generalSufficient && input.propheticReferenceWeight > 0) {
    throw new Error("Prophetic weight cannot be added when the General Method is sufficient.");
  }
  if (input.propheticReferenceWeight > 0 && !referenceCanContribute) {
    throw new Error(
      "Prophetic weight requires a material balance condition and a verified, relevant reference.",
    );
  }

  if (input.generalSufficient) {
    return {
      method: "general",
      generalWeight,
      propheticReferenceWeight: 0,
      totalWeight: generalWeight,
    };
  }
  if (input.propheticReferenceWeight > 0) {
    return {
      method: "prophetic",
      generalWeight,
      propheticReferenceWeight: input.propheticReferenceWeight,
      totalWeight: generalWeight + input.propheticReferenceWeight,
    };
  }
  return {
    method: "general_limited",
    generalWeight,
    propheticReferenceWeight: 0,
    totalWeight: generalWeight,
    limitation: input.balanceSatisfied
      ? input.internalReferenceVerified
        ? "A verified reference does not provide sufficient assessment value."
        : "Internal reference is not verified."
      : "A material balance condition is not established.",
  };
}

export const mizanCaseSchema = z.object({
  case_key: z.string().min(1).max(120),
  title: z.string().min(1).max(180),
  case_text: z.string().min(1).max(8000),
  subject_alias: z.string().max(80).nullable().default(null),
  subject_age: z.number().int().min(0).max(130).nullable().default(null),
  case_status: z.enum(["draft", "assessed", "needs_reference", "archived"]).default("draft"),
});

export const mizanCaseModel = defineModel({
  name: "mizan.case",
  table: "mz_cases",
  schema: mizanCaseSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["case_key", "title", "case_text", "subject_alias"],
  publicFields: ["case_key", "title", "subject_alias", "case_status"],
  relations: {
    assessments: {
      model: "mizan.assessment",
      type: "one2many",
      targetField: "case_key",
      inverseField: "case_key",
    },
  },
  indexes: [{ fields: ["tenant_id", "case_key"], unique: true }, { fields: ["case_status"] }],
});

export const mizanEvaluateInputSchema = z.object({
  case_key: z.string().min(1).max(120),
  general_sufficient: z.boolean().default(false),
  balance_satisfied: z.boolean().default(false),
  internal_reference_verified: z.boolean().default(false),
  prophetic_reference_relevant: z.boolean().default(false),
  primary_filter_passed: z.boolean().default(true),
  secondary_filter_passed: z.boolean().default(true),
  power_right_score: z.number().int().min(0).max(10).default(0),
  power_left_score: z.number().int().min(0).max(7).default(0),
  prophetic_reference_weight: z.number().int().min(0).max(4).default(0),
  rating: z.number().min(0).max(4.5).default(0),
  confidence: z.enum(["low", "moderate", "high"]).default("moderate"),
});

export const mizanAssessmentSchema = z.object({
  case_key: z.string().min(1).max(120),
  method: z.enum(["general", "general_limited", "prophetic"]).default("general"),
  general_sufficient: z.boolean().default(false),
  balance_satisfied: z.boolean().default(false),
  internal_reference_verified: z.boolean().default(false),
  prophetic_reference_relevant: z.boolean().default(false),
  primary_filter_passed: z.boolean().default(false),
  secondary_filter_passed: z.boolean().default(false),
  power_right_score: z.number().int().min(0).max(10).default(0),
  power_left_score: z.number().int().min(0).max(7).default(0),
  prophetic_reference_weight: z.number().int().min(0).max(4).default(0),
  general_weight: z.number().int().min(0).max(17).default(0),
  total_weight: z.number().int().min(0).max(21).default(0),
  rating: z.number().min(0).max(4.5).default(0),
  is_finalized: z.boolean().default(false),
  limitation: z.string().max(1000).nullable().default(null),
  confidence: z.enum(["low", "moderate", "high"]).default("low"),
  completed_at: z.string().nullable().default(null),
});

export const mizanAssessmentModel = defineModel({
  name: "mizan.assessment",
  table: "mz_assessments",
  schema: mizanAssessmentSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["case_key", "method", "confidence"],
  publicFields: [
    "case_key",
    "method",
    "general_weight",
    "total_weight",
    "rating",
    "is_finalized",
    "confidence",
  ],
  hooks: {
    beforeSave: ({ values, before }) => {
      const merged = { ...(before ?? {}), ...values };
      if (!merged.is_finalized) return;
      const decision = validateMizanAssessment({
        generalSufficient: Boolean(merged.general_sufficient),
        balanceSatisfied: Boolean(merged.balance_satisfied),
        internalReferenceVerified: Boolean(merged.internal_reference_verified),
        propheticReferenceRelevant: Boolean(merged.prophetic_reference_relevant),
        primaryFilterPassed: Boolean(merged.primary_filter_passed),
        secondaryFilterPassed: Boolean(merged.secondary_filter_passed),
        powerRightScore: Number(merged.power_right_score ?? 0),
        powerLeftScore: Number(merged.power_left_score ?? 0),
        propheticReferenceWeight: Number(merged.prophetic_reference_weight ?? 0),
        rating: Number(merged.rating ?? 0),
      });
      values.method = decision.method;
      values.general_weight = decision.generalWeight;
      values.prophetic_reference_weight = decision.propheticReferenceWeight;
      values.total_weight = decision.totalWeight;
      values.limitation = decision.limitation ?? null;
      if (!merged.completed_at) {
        values.completed_at = new Date().toISOString();
      }
    },
  },
  actions: {
    evaluate: {
      scope: "model",
      roles: ["editor", "admin"],
      label: "Evaluate & Finalize Mizan Assessment",
      input: mizanEvaluateInputSchema,
      handler: async ({ input, repository, actor }) => {
        const parsed = input as z.infer<typeof mizanEvaluateInputSchema>;
        const record = await repository.create(
          {
            ...parsed,
            is_finalized: true,
          },
          actor,
        );
        return record;
      },
    },
  },
  indexes: [{ fields: ["case_key"] }, { fields: ["method"] }, { fields: ["is_finalized"] }],
});

export const mizanRules: IrRuleInput[] = [
  { model_name: "mizan.case", role: "viewer", can_read: true },
  {
    model_name: "mizan.case",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "mizan.case",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "mizan.assessment", role: "viewer", can_read: true },
  {
    model_name: "mizan.assessment",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "mizan.assessment",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const mizanViews: IrViewInput[] = [
  {
    model_name: "mizan.case",
    view_type: "list",
    spec: {
      title: "Mizan Learning Cases",
      description: "Ethical balance and weighted reference cases.",
      domainIcon: "simpul",
      columns: ["case_key", "title", "subject_alias", "case_status"],
    },
  },
  {
    model_name: "mizan.assessment",
    view_type: "list",
    spec: {
      title: "Mizan Assessments",
      description: "Finalized Mizan balance assessments (0..21 total weight, max 4.5 rating).",
      domainIcon: "simpul",
      columns: ["case_key", "method", "general_weight", "total_weight", "rating", "confidence"],
    },
  },
];

export const mizanMenus: IrMenuInput[] = [
  {
    menu_key: "mizan.cases",
    label: "Mizan Balance",
    href: "/models/mizan.case",
    icon: "simpul",
    plane: "creator",
    sort_order: 58,
    min_role: "viewer",
  },
];

export function createMizanAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: mizanManifest,
    models: [mizanCaseModel, mizanAssessmentModel],
    rules: mizanRules,
    views: mizanViews,
    menus: mizanMenus,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get<{
        Querystring: {
          generalSufficient?: string;
          balanceSatisfied?: string;
          internalReferenceVerified?: string;
        };
      }>(`${prefix}/mizan/decision`, { preHandler: auth.authenticate }, async (request) => {
        const q = request.query ?? {};
        const decision = chooseMizanMethod({
          generalSufficient: q.generalSufficient === "true",
          balanceSatisfied: q.balanceSatisfied === "true",
          internalReferenceVerified: q.internalReferenceVerified === "true",
        });
        return {
          decision,
          primaryFilters: PRIMARY_FILTERS,
          secondaryFilters: SECONDARY_FILTERS,
        };
      });

      scope.get(`${prefix}/mizan/summary`, { preHandler: auth.authenticate }, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [total, groups, assessments] = await Promise.all([
          mizanCaseModel.repository.count({}, { tenantId }),
          mizanCaseModel.repository.readGroup({
            groupBy: ["case_status"],
            tenantId,
          }),
          mizanAssessmentModel.repository.count({ is_finalized: true }, { tenantId }),
        ]);
        const byStatus: Record<string, number> = {};
        for (const row of groups) {
          byStatus[String(row.case_status)] = Number(row.count ?? 0);
        }
        return {
          total,
          assessed: byStatus.assessed ?? 0,
          needsReference: byStatus.needs_reference ?? 0,
          finalizedAssessments: assessments,
        };
      });

      scope.post<{ Body: unknown }>(
        `${prefix}/mizan/evaluate`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = mizanEvaluateInputSchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid Mizan payload" });
          }
          try {
            const actor = resolveActorContextFromBridge(auth, request);
            const saved = await mizanAssessmentModel.repository.create(
              {
                ...parsed.data,
                is_finalized: true,
              },
              actor,
            );
            return reply.code(201).send({ assessment: saved });
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return reply.code(400).send({ error: msg });
          }
        },
      );
    },
  };
}

export const mizanAddon = createMizanAddon();
