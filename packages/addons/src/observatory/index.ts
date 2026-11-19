import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
  isBlockedRuntimeHost,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type AddonDataRecord,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const observatoryManifest = manifestData as AddonManifestInput;

export const sgOperationSchema = z.object({
  operation_key: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  classification: z.string().max(80).default("corroboration"),
  scripture_refs_json: z.string().default("[]"),
  corroboration_score: z.number().min(0).max(100).default(0),
  operation_status: z.enum(["active", "sealed", "archived"]).default("active"),
});

export const sgOperationModel = defineModel({
  name: "sg.operation",
  table: "sg_operations",
  schema: sgOperationSchema,
  extensible: true,
  restEnabled: true,
  searchFields: ["operation_key", "title", "classification"],
  publicFields: [
    "operation_key",
    "title",
    "classification",
    "corroboration_score",
    "operation_status",
  ],
  indexes: [
    { fields: ["tenant_id", "operation_key"], unique: true },
    { fields: ["operation_status"] },
  ],
});

export const observatoryFeedSchema = z.object({
  feed_key: z.string().min(1).max(80),
  category: z.enum(["seismic", "space_weather", "astronomy", "orbital", "weather"]),
  title: z.string().min(1).max(160),
  source_url: z.string().url().max(600),
  ttl_sec: z.number().int().min(10).default(300),
  last_payload_json: z.string().nullable().default(null),
  last_fetched_at: z.string().nullable().default(null),
});

export const observatoryFeedModel = defineModel({
  name: "observatory.feed",
  table: "observatory_feeds",
  schema: observatoryFeedSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["feed_key", "category", "title"],
  publicFields: ["feed_key", "category", "title", "source_url", "ttl_sec", "last_fetched_at"],
  indexes: [{ fields: ["tenant_id", "feed_key"], unique: true }, { fields: ["category"] }],
});

export const observatoryData: AddonDataRecord[] = [
  {
    id: "feed_usgs_eq",
    model: "observatory.feed",
    key: { feed_key: "usgs_earthquakes" },
    noupdate: true,
    values: {
      feed_key: "usgs_earthquakes",
      category: "seismic",
      title: "USGS M2.5+ Earthquakes (24h)",
      source_url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
      ttl_sec: 300,
    },
  },
  {
    id: "feed_noaa_kp",
    model: "observatory.feed",
    key: { feed_key: "noaa_kp_index" },
    noupdate: true,
    values: {
      feed_key: "noaa_kp_index",
      category: "space_weather",
      title: "NOAA Planetary K-Index",
      source_url: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
      ttl_sec: 600,
    },
  },
  {
    id: "feed_nasa_apod",
    model: "observatory.feed",
    key: { feed_key: "nasa_apod" },
    noupdate: true,
    values: {
      feed_key: "nasa_apod",
      category: "astronomy",
      title: "NASA Astronomy Picture of the Day",
      source_url: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
      ttl_sec: 3600,
    },
  },
  {
    id: "feed_iss_pos",
    model: "observatory.feed",
    key: { feed_key: "iss_position" },
    noupdate: true,
    values: {
      feed_key: "iss_position",
      category: "orbital",
      title: "ISS Orbital Telemetry (NORAD 25544)",
      source_url: "https://api.wheretheiss.at/v1/satellites/25544",
      ttl_sec: 30,
    },
  },
  {
    id: "feed_open_meteo",
    model: "observatory.feed",
    key: { feed_key: "open_meteo" },
    noupdate: true,
    values: {
      feed_key: "open_meteo",
      category: "weather",
      title: "Open-Meteo Jakarta Surface Telemetry",
      source_url: "https://api.open-meteo.com/v1/forecast?latitude=-6.21&longitude=106.85&current_weather=true",
      ttl_sec: 600,
    },
  },
];

export const observatoryRules: IrRuleInput[] = [
  { model_name: "observatory.feed", role: "public", can_read: true },
  { model_name: "observatory.feed", role: "viewer", can_read: true },
  {
    model_name: "observatory.feed",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "observatory.feed",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "sg.operation", role: "viewer", can_read: true },
  {
    model_name: "sg.operation",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "sg.operation",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const observatoryViews: IrViewInput[] = [
  {
    model_name: "observatory.feed",
    view_type: "list",
    spec: {
      title: "Planetary Observatory Feeds",
      description: "TTL-cached USGS, NOAA, NASA, ISS, and Open-Meteo telemetry feeds.",
      domainIcon: "snmp",
      columns: ["feed_key", "category", "title", "ttl_sec", "last_fetched_at"],
    },
  },
  {
    model_name: "sg.operation",
    view_type: "list",
    spec: {
      title: "Cross-Scripture Operations",
      description: "Corroboration operations with scripture reference bundles.",
      domainIcon: "scripture",
      columns: ["operation_key", "title", "classification", "corroboration_score", "operation_status"],
    },
  },
];

export const observatoryMenus: IrMenuInput[] = [
  {
    menu_key: "observatory.feeds",
    label: "Observatory Feeds",
    href: "/models/observatory.feed",
    icon: "snmp",
    plane: "operations",
    sort_order: 88,
    min_role: "viewer",
  },
];

export function createObservatoryAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge; fetchFn?: typeof fetch } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const fetchFn = options.fetchFn ?? globalThis.fetch;

  return {
    manifest: observatoryManifest,
    models: [observatoryFeedModel, sgOperationModel],
    rules: observatoryRules,
    views: observatoryViews,
    menus: observatoryMenus,
    data: observatoryData,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/observatory/summary`, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [feeds, operations, byCategory] = await Promise.all([
          observatoryFeedModel.repository.count({}, { tenantId }),
          sgOperationModel.repository.count({}, { tenantId }),
          observatoryFeedModel.repository.readGroup({ groupBy: ["category"], tenantId }),
        ]);
        return { feeds, operations, byCategory };
      });

      scope.post<{ Params: { feedKey: string } }>(
        `${prefix}/observatory/refresh/:feedKey`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const actor = resolveActorContextFromBridge(auth, request);
          const feed = (
            await observatoryFeedModel.repository.find(
              { feed_key: request.params.feedKey },
              { tenantId: actor.tenantId ?? "default", limit: 1 },
            )
          )[0];
          if (!feed) {
            return reply.code(404).send({ error: `Feed '${request.params.feedKey}' not found` });
          }
          const url = new URL(feed.source_url);
          if (isBlockedRuntimeHost(url.hostname)) {
            return reply.code(400).send({ error: "Blocked observatory feed origin" });
          }

          const nowMs = Date.now();
          if (feed.last_fetched_at && feed.last_payload_json) {
            const ageSec = (nowMs - Date.parse(feed.last_fetched_at)) / 1000;
            if (ageSec < feed.ttl_sec) {
              return { feed, cached: true, payload: JSON.parse(feed.last_payload_json) };
            }
          }

          const res = await fetchFn(feed.source_url, {
            method: "GET",
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) {
            return reply.code(502).send({ error: `Upstream feed returned HTTP ${res.status}` });
          }
          const payload = (await res.json()) as unknown;
          const updated = await observatoryFeedModel.repository.update(
            feed.id,
            {
              last_payload_json: JSON.stringify(payload).slice(0, 65000),
              last_fetched_at: new Date(nowMs).toISOString(),
            },
            actor,
          );
          return { feed: updated, cached: false, payload };
        },
      );
    },
  };
}

export const observatoryAddon = createObservatoryAddon();
