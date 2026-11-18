import type { FastifyInstance } from "fastify";
import { getDb, SYSTEM_ACTOR } from "@moonwitness/orm";
import type {
  AddonDefinition,
  AddonManifestInput,
  IrRuleInput,
  IrViewInput,
} from "@moonwitness/addon-base";
import manifestData from "../manifest.json" with { type: "json" };
import { opsEventModel, probeEventModel, probeNodeModel } from "./models.js";

export const probesManifest = manifestData as AddonManifestInput;
export {
  probeNodeModel,
  probeNodeSchema,
  probeEventModel,
  probeEventSchema,
  opsEventModel,
  opsEventSchema,
} from "./models.js";

export async function importLegacyProbes(): Promise<{ importedNodes: number }> {
  const db = getDb();
  let importedNodes = 0;
  try {
    const legacy = await db.get<{ name?: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'igate_nodes'",
    );
    if (!legacy?.name) return { importedNodes: 0 };

    const rows = await db.all<Record<string, unknown>>(
      "SELECT id, name, target_url, category, enabled FROM igate_nodes",
    );
    for (const row of rows) {
      const nodeKey = String(row.id);
      const existing = await probeNodeModel.repository.find({ node_key: nodeKey });
      if (existing.length > 0) continue;
      await probeNodeModel.repository.upsert(
        { node_key: nodeKey },
        {
          node_key: nodeKey,
          name: String(row.name),
          target_url: String(row.target_url),
          category: String(row.category),
          enabled: Boolean(row.enabled),
          metadata_json: null,
        },
        SYSTEM_ACTOR,
      );
      importedNodes += 1;
    }
  } catch {
    // Legacy table absent or Postgres without sqlite_master.
  }
  return { importedNodes };
}

export const probesRules: IrRuleInput[] = [
  { model_name: "probe.node", role: "viewer", can_read: true },
  { model_name: "probe.node", role: "editor", can_read: true, can_create: true, can_update: true },
  {
    model_name: "probe.node",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "probe.event", role: "viewer", can_read: true },
  { model_name: "probe.event", role: "admin", can_read: true },
  { model_name: "ops.event", role: "viewer", can_read: true },
  { model_name: "ops.event", role: "editor", can_read: true, can_create: true, can_update: true },
  {
    model_name: "ops.event",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const probesViews: IrViewInput[] = [
  {
    model_name: "probe.node",
    view_type: "list",
    actionBindings: {
      listUrl: "/api/v1/probes/targets",
      createUrl: "/api/v1/probes/targets",
      customActions: [
        {
          id: "run_probe",
          label: "Run Probe",
          method: "POST",
          urlTemplate: "/api/v1/probes/run/{id}",
          roles: ["editor", "admin"],
        },
      ],
    },
    spec: {
      title: "Telemetry Probe Targets",
      description: "SSRF-guarded endpoint checks and edge uptime monitors.",
      domainIcon: "snmp",
      columns: ["node_key", "name", "target_url", "category", "enabled"],
    },
  },
];

export function createProbesAddon(
  options: { registerRoutes?: (scope: FastifyInstance) => Promise<void> | void } = {},
): AddonDefinition {
  return {
    manifest: probesManifest,
    models: [probeNodeModel, probeEventModel, opsEventModel],
    rules: probesRules,
    views: probesViews,
    register: async () => {
      await importLegacyProbes();
    },
    registerRoutes: options.registerRoutes,
  };
}

export const probesAddon = createProbesAddon();
