import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel } from "@moonwitness/orm";
import {
  defaultFailClosedAuthBridge,
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

export const geoManifest = manifestData as AddonManifestInput;

export const geoProvinceSchema = z.object({
  kemendagri_code: z.string().min(1).max(16),
  bps_code: z.string().max(16).default(""),
  iso_code: z.string().max(16).default(""),
  name: z.string().min(1).max(120),
  island_group: z
    .enum([
      "sumatera",
      "jawa",
      "kalimantan",
      "sulawesi",
      "bali_nusa_tenggara",
      "maluku",
      "papua",
    ])
    .default("jawa"),
  timezone: z.enum(["WIB", "WITA", "WIT"]).default("WIB"),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
  active: z.boolean().default(true),
});

export const geoProvinceModel = defineModel({
  name: "geo.province",
  table: "geo_provinces",
  schema: geoProvinceSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["kemendagri_code", "iso_code", "name", "island_group"],
  publicFields: ["kemendagri_code", "iso_code", "name", "island_group", "timezone", "lat", "lng"],
  relations: {
    cities: {
      model: "geo.city",
      type: "one2many",
      targetField: "kemendagri_code",
      inverseField: "province_code",
    },
  },
  indexes: [
    { fields: ["kemendagri_code"], unique: true },
    { fields: ["island_group"] },
    { fields: ["timezone"] },
  ],
});

export const geoCitySchema = z.object({
  kemendagri_code: z.string().min(1).max(20),
  province_code: z.string().min(1).max(16),
  name: z.string().min(1).max(120),
  city_type: z.enum(["kabupaten", "kota"]).default("kota"),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
  active: z.boolean().default(true),
});

export const geoCityModel = defineModel({
  name: "geo.city",
  table: "geo_cities",
  schema: geoCitySchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["kemendagri_code", "province_code", "name", "city_type"],
  publicFields: ["kemendagri_code", "province_code", "name", "city_type", "lat", "lng"],
  relations: {
    province_code: { model: "geo.province", targetField: "kemendagri_code" },
  },
  indexes: [
    { fields: ["kemendagri_code"], unique: true },
    { fields: ["province_code"] },
    { fields: ["city_type"] },
  ],
});

export const geoData: AddonDataRecord[] = [
  {
    id: "prov_31_dki_jakarta",
    model: "geo.province",
    key: { kemendagri_code: "31" },
    noupdate: true,
    values: {
      kemendagri_code: "31",
      bps_code: "31",
      iso_code: "ID-JK",
      name: "DKI Jakarta",
      island_group: "jawa",
      timezone: "WIB",
      lat: -6.2088,
      lng: 106.8456,
      active: true,
    },
  },
  {
    id: "prov_32_jawa_barat",
    model: "geo.province",
    key: { kemendagri_code: "32" },
    noupdate: true,
    values: {
      kemendagri_code: "32",
      bps_code: "32",
      iso_code: "ID-JB",
      name: "Jawa Barat",
      island_group: "jawa",
      timezone: "WIB",
      lat: -6.9175,
      lng: 107.6191,
      active: true,
    },
  },
  {
    id: "prov_34_di_yogyakarta",
    model: "geo.province",
    key: { kemendagri_code: "34" },
    noupdate: true,
    values: {
      kemendagri_code: "34",
      bps_code: "34",
      iso_code: "ID-YO",
      name: "DI Yogyakarta",
      island_group: "jawa",
      timezone: "WIB",
      lat: -7.7956,
      lng: 110.3695,
      active: true,
    },
  },
  {
    id: "prov_35_jawa_timur",
    model: "geo.province",
    key: { kemendagri_code: "35" },
    noupdate: true,
    values: {
      kemendagri_code: "35",
      bps_code: "35",
      iso_code: "ID-JI",
      name: "Jawa Timur",
      island_group: "jawa",
      timezone: "WIB",
      lat: -7.2575,
      lng: 112.7521,
      active: true,
    },
  },
  {
    id: "prov_51_bali",
    model: "geo.province",
    key: { kemendagri_code: "51" },
    noupdate: true,
    values: {
      kemendagri_code: "51",
      bps_code: "51",
      iso_code: "ID-BA",
      name: "Bali",
      island_group: "bali_nusa_tenggara",
      timezone: "WITA",
      lat: -8.6705,
      lng: 115.2126,
      active: true,
    },
  },
  {
    id: "prov_64_kalimantan_timur",
    model: "geo.province",
    key: { kemendagri_code: "64" },
    noupdate: true,
    values: {
      kemendagri_code: "64",
      bps_code: "64",
      iso_code: "ID-KI",
      name: "Kalimantan Timur",
      island_group: "kalimantan",
      timezone: "WITA",
      lat: -0.9718,
      lng: 116.7082,
      active: true,
    },
  },
  {
    id: "city_31_71_jakarta_pusat",
    model: "geo.city",
    key: { kemendagri_code: "31.71" },
    noupdate: true,
    values: {
      kemendagri_code: "31.71",
      province_code: "31",
      name: "Kota Administrasi Jakarta Pusat",
      city_type: "kota",
      lat: -6.1805,
      lng: 106.8284,
      active: true,
    },
  },
  {
    id: "city_32_73_kota_bandung",
    model: "geo.city",
    key: { kemendagri_code: "32.73" },
    noupdate: true,
    values: {
      kemendagri_code: "32.73",
      province_code: "32",
      name: "Kota Bandung",
      city_type: "kota",
      lat: -6.9175,
      lng: 107.6191,
      active: true,
    },
  },
  {
    id: "city_34_71_kota_yogyakarta",
    model: "geo.city",
    key: { kemendagri_code: "34.71" },
    noupdate: true,
    values: {
      kemendagri_code: "34.71",
      province_code: "34",
      name: "Kota Yogyakarta",
      city_type: "kota",
      lat: -7.7956,
      lng: 110.3695,
      active: true,
    },
  },
  {
    id: "city_35_78_kota_surabaya",
    model: "geo.city",
    key: { kemendagri_code: "35.78" },
    noupdate: true,
    values: {
      kemendagri_code: "35.78",
      province_code: "35",
      name: "Kota Surabaya",
      city_type: "kota",
      lat: -7.2575,
      lng: 112.7521,
      active: true,
    },
  },
];

export const geoRules: IrRuleInput[] = [
  { model_name: "geo.province", role: "public", can_read: true },
  { model_name: "geo.province", role: "viewer", can_read: true },
  {
    model_name: "geo.province",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "geo.province",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "geo.city", role: "public", can_read: true },
  { model_name: "geo.city", role: "viewer", can_read: true },
  {
    model_name: "geo.city",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "geo.city",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const geoViews: IrViewInput[] = [
  {
    model_name: "geo.province",
    view_type: "list",
    spec: {
      title: "Indonesian Provinces (Kemendagri / BPS)",
      description: "Administrative geo-graph provinces, island groups, and timezones.",
      domainIcon: "i18n",
      columns: ["kemendagri_code", "iso_code", "name", "island_group", "timezone"],
    },
  },
  {
    model_name: "geo.city",
    view_type: "list",
    spec: {
      title: "Regencies & Cities (Kabupaten / Kota)",
      description: "Administrative cities and regencies linked by Kemendagri code.",
      domainIcon: "i18n",
      columns: ["kemendagri_code", "province_code", "name", "city_type"],
    },
  },
];

export const geoMenus: IrMenuInput[] = [
  {
    menu_key: "geo.provinces",
    label: "Geo Graph (ID)",
    href: "/models/geo.province",
    icon: "i18n",
    plane: "creator",
    sort_order: 64,
    min_role: "viewer",
  },
];

export function createGeoAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: geoManifest,
    models: [geoProvinceModel, geoCityModel],
    rules: geoRules,
    views: geoViews,
    menus: geoMenus,
    data: geoData,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/geo/summary`, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [provinces, cities, byTimezone] = await Promise.all([
          geoProvinceModel.repository.count({}, { tenantId }),
          geoCityModel.repository.count({}, { tenantId }),
          geoProvinceModel.repository.readGroup({ groupBy: ["timezone"], tenantId }),
        ]);
        return { provinces, cities, byTimezone };
      });
    },
  };
}

export const geoAddon = createGeoAddon();
