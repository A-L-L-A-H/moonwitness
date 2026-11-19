import { createHash } from "node:crypto";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import {
  computeMtimeDelta,
  epistemicComputationModel,
  normalizeDivineText,
  rgbToCrayonRgbl,
  scorePropheticWitness,
} from "./engines.js";

export const epistemicManifest = manifestData as AddonManifestInput;
export * from "./engines.js";

export const epistemicRules: IrRuleInput[] = [
  { model_name: "epistemic.computation", role: "viewer", can_read: true },
  {
    model_name: "epistemic.computation",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "epistemic.computation",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const epistemicViews: IrViewInput[] = [
  {
    model_name: "epistemic.computation",
    view_type: "list",
    spec: {
      title: "Epistemic Engine Ledger",
      description: "Reproducible divine-text, mtime, crayon RGBL, and prophetic evaluations.",
      domainIcon: "mtime",
      columns: ["engine", "digest", "output_json"],
    },
  },
];

export const epistemicMenus: IrMenuInput[] = [
  {
    menu_key: "epistemic.ledger",
    label: "Epistemic Engines",
    href: "/models/epistemic.computation",
    icon: "mtime",
    plane: "creator",
    sort_order: 70,
    min_role: "viewer",
  },
];

const evaluateBodySchema = z.discriminatedUnion("engine", [
  z.object({ engine: z.literal("divine-text"), text: z.string().min(1) }),
  z.object({ engine: z.literal("mtime"), fromIso: z.string().min(4), toIso: z.string().min(4) }),
  z.object({
    engine: z.literal("crayon"),
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255),
  }),
  z.object({ engine: z.literal("prophetic"), signals: z.array(z.number()).min(1) }),
]);

export function createEpistemicAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: epistemicManifest,
    models: [epistemicComputationModel],
    rules: epistemicRules,
    views: epistemicViews,
    menus: epistemicMenus,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.post<{ Body: unknown }>(
        `${prefix}/epistemic/evaluate`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = evaluateBodySchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid engine payload" });
          }

          let output: object;
          switch (parsed.data.engine) {
            case "divine-text":
              output = normalizeDivineText(parsed.data.text);
              break;
            case "mtime":
              output = computeMtimeDelta(parsed.data.fromIso, parsed.data.toIso);
              break;
            case "crayon":
              output = rgbToCrayonRgbl(parsed.data.r, parsed.data.g, parsed.data.b);
              break;
            case "prophetic":
              output = scorePropheticWitness(parsed.data.signals);
              break;
          }

          const inputJson = JSON.stringify(parsed.data);
          const outputJson = JSON.stringify(output);
          const digest = createHash("sha256").update(inputJson).digest("hex");
          const actor = resolveActorContextFromBridge(auth, request);
          const saved = await epistemicComputationModel.repository.create(
            {
              engine: parsed.data.engine,
              input_json: inputJson,
              output_json: outputJson,
              digest,
            },
            actor,
          );
          return reply.code(201).send({ record: saved, output });
        },
      );
    },
  };
}

export const epistemicAddon = createEpistemicAddon();
