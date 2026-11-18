import type { FastifyInstance } from "fastify";
import {
  defaultFailClosedAuthBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-base";
import manifestData from "../manifest.json" with { type: "json" };
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
    },
  };
}

export const witnessResearchAddon = createWitnessResearchAddon();
