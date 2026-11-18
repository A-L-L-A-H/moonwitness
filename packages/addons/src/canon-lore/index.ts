import type { FastifyInstance } from "fastify";
import type {
  AddonDefinition,
  AddonManifestInput,
  IrMenuInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import {
  canonCodexModel,
  canonEntityModel,
  canonEpisodeModel,
  timelineEventCanonExtension,
} from "./models.js";

export const canonLoreManifest = manifestData as AddonManifestInput;
export * from "./models.js";

export const canonLoreRules: IrRuleInput[] = [
  { model_name: "canon.codex", role: "public", can_read: true },
  { model_name: "canon.codex", role: "viewer", can_read: true },
  { model_name: "canon.codex", role: "editor", can_read: true, can_create: true, can_update: true },
  {
    model_name: "canon.codex",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "canon.entity", role: "public", can_read: true },
  { model_name: "canon.entity", role: "viewer", can_read: true },
  {
    model_name: "canon.entity",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "canon.entity",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "canon.episode", role: "public", can_read: true },
  { model_name: "canon.episode", role: "viewer", can_read: true },
  {
    model_name: "canon.episode",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "canon.episode",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const canonLoreViews: IrViewInput[] = [
  {
    model_name: "canon.codex",
    view_type: "list",
    spec: {
      title: "Canon Codex",
      description: "Authoritative worldbuilding codex & canon tier classifications.",
      domainIcon: "scripture",
      columns: ["slug", "title", "era_key", "canon_tier"],
    },
  },
  {
    model_name: "canon.entity",
    view_type: "list",
    spec: {
      title: "World Entities",
      description: "Characters, factions, places, and artifacts across MoonWitness.",
      domainIcon: "scripture",
      columns: ["slug", "name", "entity_kind", "faction"],
    },
  },
  {
    model_name: "canon.episode",
    view_type: "list",
    spec: {
      title: "Canon Episodes",
      description: "Chronological chapter index for Story Studio.",
      domainIcon: "scripture",
      columns: ["code", "title", "arc", "release_order"],
    },
  },
];

export const canonLoreMenus: IrMenuInput[] = [
  {
    menu_key: "canon.codex",
    label: "Canon Codex",
    href: "/models/canon.codex",
    icon: "scripture",
    plane: "creator",
    sort_order: 45,
    min_role: "viewer",
  },
];

export function createCanonLoreAddon(options: { prefix?: string } = {}): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");

  return {
    manifest: canonLoreManifest,
    models: [canonCodexModel, canonEntityModel, canonEpisodeModel],
    extensions: [
      {
        target: "timeline.event",
        fields: timelineEventCanonExtension,
      },
    ],
    rules: canonLoreRules,
    views: canonLoreViews,
    menus: canonLoreMenus,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/canon/overview`, async () => {
        const [codexCount, entityCount, episodeCount] = await Promise.all([
          canonCodexModel.repository.count(),
          canonEntityModel.repository.count(),
          canonEpisodeModel.repository.count(),
        ]);
        return { codexCount, entityCount, episodeCount };
      });
    },
  };
}

export const canonLoreAddon = createCanonLoreAddon();
