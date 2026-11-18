import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { SYSTEM_ACTOR } from "@moonwitness/orm";
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
import { i18nLocaleModel, i18nTermModel } from "./models.js";

export const i18nManifest = manifestData as AddonManifestInput;
export { i18nLocaleModel, i18nTermModel } from "./models.js";

export const i18nRules: IrRuleInput[] = [
  { model_name: "i18n.locale", role: "public", can_read: true },
  { model_name: "i18n.locale", role: "viewer", can_read: true },
  { model_name: "i18n.locale", role: "editor", can_read: true },
  { model_name: "i18n.locale", role: "admin", can_read: true, can_create: true, can_update: true },
  { model_name: "i18n.term", role: "public", can_read: true },
  { model_name: "i18n.term", role: "viewer", can_read: true },
  { model_name: "i18n.term", role: "editor", can_read: true, can_create: true, can_update: true },
  {
    model_name: "i18n.term",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const i18nViews: IrViewInput[] = [
  {
    model_name: "i18n.locale",
    view_type: "list",
    spec: { title: "Locales", description: "Enabled UI languages and reading directions" },
  },
  {
    model_name: "i18n.term",
    view_type: "list",
    spec: { title: "Translation Terms", description: "Dynamic UI translation strings" },
  },
];

export const i18nMenus: IrMenuInput[] = [
  {
    menu_key: "i18n.locales",
    label: "I18n Locales",
    href: "/models/i18n.locale",
    icon: "i18n",
    plane: "creator",
    sort_order: 62,
    min_role: "viewer",
  },
];

export async function seedI18n(): Promise<void> {
  await i18nLocaleModel.repository.upsert(
    { code: "en" },
    { code: "en", name: "English", native_name: "English", rtl: false, enabled: true },
    SYSTEM_ACTOR,
  );
  await i18nLocaleModel.repository.upsert(
    { code: "id" },
    {
      code: "id",
      name: "Indonesian",
      native_name: "Bahasa Indonesia",
      rtl: false,
      enabled: true,
    },
    SYSTEM_ACTOR,
  );
}

const upsertTermSchema = z.object({
  locale_code: z.string().min(2).max(16),
  term_key: z.string().min(1).max(160),
  value: z.string().max(4000),
  module: z.string().max(80).default("common"),
});

export function createI18nAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: i18nManifest,
    models: [i18nLocaleModel, i18nTermModel],
    rules: i18nRules,
    views: i18nViews,
    menus: i18nMenus,
    seed: seedI18n,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/i18n/locales`, async () => {
        const locales = await i18nLocaleModel.repository.find(
          { enabled: true },
          { orderBy: "code ASC" },
        );
        return { locales };
      });

      scope.get<{ Params: { locale: string } }>(
        `${prefix}/i18n/bundle/:locale`,
        async (request) => {
          const tenantId = resolveActorTenantFromBridge(auth, request);
          const rows = await i18nTermModel.repository.find(
            { locale_code: request.params.locale },
            { orderBy: "term_key ASC", tenantId },
          );
          const terms: Record<string, string> = {};
          for (const row of rows) terms[row.term_key] = row.value;
          return { locale: request.params.locale, terms };
        },
      );

      scope.post<{ Body: unknown }>(
        `${prefix}/i18n/terms`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = upsertTermSchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid term payload" });
          }
          const actor = resolveActorContextFromBridge(auth, request);
          const saved = await i18nTermModel.repository.upsert(
            { locale_code: parsed.data.locale_code, term_key: parsed.data.term_key },
            parsed.data,
            actor,
          );
          return reply.code(201).send({ term: saved });
        },
      );
    },
  };
}

export const i18nAddon = createI18nAddon();
