import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  evaluateWsiSemanticFrame,
  queryOxDxHierarchy,
  validateOntologyHierarchyContract,
  validateWitnessDerivationContract,
} from "@moonwitness/canon";
import {
  defaultFailClosedAuthBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import {
  knowledgeSourceModel,
  researchRunModel,
  sidraEdgeModel,
  witnessClaimModel,
} from "./models.js";

export const witnessResearchManifest = manifestData as AddonManifestInput;
export * from "./models.js";

export const witnessResearchRules: IrRuleInput[] = [
  { model_name: "knowledge.source", role: "viewer", can_read: true },
  {
    model_name: "knowledge.source",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "knowledge.source",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "witness.claim", role: "viewer", can_read: true },
  {
    model_name: "witness.claim",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "witness.claim",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "research.run", role: "viewer", can_read: true },
  {
    model_name: "research.run",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "research.run",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "sidra.edge", role: "viewer", can_read: true },
  { model_name: "sidra.edge", role: "editor", can_read: true, can_create: true, can_update: true },
];

export const witnessResearchViews: IrViewInput[] = [
  {
    model_name: "witness.claim",
    view_type: "list",
    spec: {
      title: "Witness Claims",
      description: "Verified empirical claims anchored by source tier and SIDRA edges.",
      domainIcon: "simpul",
      columns: ["claim_key", "statement", "tier", "confidence", "verdict"],
    },
  },
  {
    model_name: "knowledge.source",
    view_type: "list",
    spec: {
      title: "Knowledge Sources",
      description: "Primary & secondary references indexed for witness research.",
      domainIcon: "scripture",
      columns: ["source_key", "title", "tier", "verified"],
    },
  },
];

export const witnessResearchMenus: IrMenuInput[] = [
  {
    menu_key: "witness.claims",
    label: "Witness Claims",
    href: "/models/witness.claim",
    icon: "simpul",
    plane: "creator",
    sort_order: 55,
    min_role: "viewer",
  },
];

export function createWitnessResearchAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: witnessResearchManifest,
    models: [knowledgeSourceModel, witnessClaimModel, researchRunModel, sidraEdgeModel],
    rules: witnessResearchRules,
    views: witnessResearchViews,
    menus: witnessResearchMenus,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/witness/summary`, { preHandler: auth.authenticate }, async () => {
        const [sources, claims, runs, edges] = await Promise.all([
          knowledgeSourceModel.repository.count(),
          witnessClaimModel.repository.count(),
          researchRunModel.repository.count(),
          sidraEdgeModel.repository.count(),
        ]);
        return { sources, claims, runs, edges };
      });

      scope.get<{ Querystring: { q?: string } }>(
        `${prefix}/witness/ontology/zones`,
        { preHandler: auth.authenticate },
        async (request) => {
          const levels = queryOxDxHierarchy(request.query.q ?? "");
          const contract = validateOntologyHierarchyContract();
          return { contract, levels };
        },
      );

      const evaluateFrameSchema = z.object({
        statement: z.string().min(1),
        sourceRef: z.string().min(1),
        agent: z.string().optional(),
        recipient: z.string().optional(),
        domain: z.string().optional(),
        scope: z.string().optional(),
        genre: z.string().optional(),
        swingDepth: z.number().int().min(0).max(3).optional(),
      });

      scope.post<{ Body: unknown }>(
        `${prefix}/witness/evaluate-frame`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = evaluateFrameSchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid semantic frame input" });
          }
          const frame = evaluateWsiSemanticFrame(parsed.data);
          const contract = validateWitnessDerivationContract({
            mode: "RESEARCH",
            semanticRecordId: parsed.data.sourceRef,
            sourceSemanticRecordId: parsed.data.sourceRef,
            derivationMode: "RESEARCH",
            frames: [
              {
                id: "frame-1",
                reviewStatus: "RESEARCHED",
                conceptIds: frame.frameStatus === "ONSIDE" ? ["c_grounded"] : [],
              },
            ],
            patterns: [{ id: "wsi-p18", triggerConcepts: ["c_grounded"] }],
            derivedTargets: ["c_verified"],
            witnesses: [
              {
                id: "w-candidate-1",
                patternId: "wsi-p18",
                reviewStatus: "CANDIDATE",
                observedFrameIds: ["frame-1"],
                responseStatus: frame.frameStatus === "ONSIDE" ? "RESOLVED" : "UNRESOLVED",
                positiveDirectionStatus: frame.frameStatus === "ONSIDE" ? "RESOLVED" : "UNRESOLVED",
                ...(frame.frameStatus === "ONSIDE"
                  ? { positiveTargetConceptId: "c_verified" }
                  : {}),
              },
            ],
          });
          return { frame, contract };
        },
      );
    },
  };
}

export const witnessResearchAddon = createWitnessResearchAddon();
