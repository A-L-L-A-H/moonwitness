import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { defineModel } from "@moonwitness/orm";
import {
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };

export const celestialManifest = manifestData as AddonManifestInput;

const MS_PER_DAY = 86_400_000;
export const AEQ4_EPOCH_UTC_MS = Date.UTC(2027, 5, 16, 0, 0, 0, 0);
export const KAABA_LATITUDE = 21.422487;
export const KAABA_LONGITUDE = 39.826206;
export const EARTH_MEAN_RADIUS_KM = 6371.0088;

export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
}

const HIJRI_MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
] as const;

function utcToJdn(utcMs: number): number {
  const date = new Date(utcMs);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  );
}

export function utcToHijri(utcMs: number = Date.now()): HijriDate {
  const jdn = utcToJdn(utcMs);
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return {
    year,
    month,
    day,
    monthName: HIJRI_MONTH_NAMES[month - 1] ?? "Unknown",
  };
}

export interface LunarPosition {
  phase: number;
  illumination: number;
  phaseName: string;
  isNewMoon: boolean;
  elongationDeg: number;
}

export function getLunarPosition(utcMs: number = Date.now()): LunarPosition {
  const jd = utcMs / MS_PER_DAY + 2440587.5;
  const T = (jd - 2451545.0) / 36525.0;
  const L0 =
    218.3164477 +
    481267.88123421 * T -
    0.0015786 * T * T +
    (T * T * T) / 538841 -
    (T * T * T * T) / 65194000;
  const Msun =
    357.5291092 +
    35999.0502909 * T -
    0.0001536 * T * T +
    (T * T * T) / 24490000;
  const Mmoon =
    134.9633964 +
    477198.8675055 * T +
    0.0087414 * T * T +
    (T * T * T) / 69699 -
    (T * T * T * T) / 14712000;
  const F =
    93.272095 +
    483202.0175233 * T -
    0.0036539 * T * T -
    (T * T * T) / 3526000 +
    (T * T * T * T) / 863310000;
  const D =
    297.8501921 +
    445267.1114034 * T -
    0.0018819 * T * T +
    (T * T * T) / 545868 -
    (T * T * T * T) / 113065000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const sunLon = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const moonLon =
    L0 +
    6.289 * Math.sin(toRad(Mmoon)) +
    1.274 * Math.sin(toRad(2 * D - Mmoon)) +
    0.658 * Math.sin(toRad(2 * D)) +
    0.214 * Math.sin(toRad(2 * Mmoon)) -
    0.186 * Math.sin(toRad(Msun)) -
    0.114 * Math.sin(toRad(2 * F));
  const elongation = (((moonLon - sunLon) % 360) + 360) % 360;
  const phase = elongation / 360;
  const illumination = Math.round(((1 - Math.cos(toRad(elongation))) / 2) * 100);
  let phaseName: string;
  if (phase < 0.03 || phase > 0.97) phaseName = "New Moon";
  else if (phase < 0.22) phaseName = "Waxing Crescent";
  else if (phase < 0.28) phaseName = "First Quarter";
  else if (phase < 0.47) phaseName = "Waxing Gibbous";
  else if (phase < 0.53) phaseName = "Full Moon";
  else if (phase < 0.72) phaseName = "Waning Gibbous";
  else if (phase < 0.78) phaseName = "Last Quarter";
  else phaseName = "Waning Crescent";

  return {
    phase: Number(phase.toFixed(4)),
    illumination,
    phaseName,
    isNewMoon: phase < 0.05 || phase > 0.95,
    elongationDeg: Math.round(elongation * 10) / 10,
  };
}

export interface AEQ4Timestamp {
  mode: "PRE_ERA" | "ACTIVE";
  formatted: string;
  utcBridge: string;
  hijriBridge: string;
  era?: number;
  cycle?: number;
  position?: number;
  moment?: string;
}

export function getAEQ4Timestamp(
  utcMs: number = Date.now(),
  epochMs: number = AEQ4_EPOCH_UTC_MS,
): AEQ4Timestamp {
  const hijri = utcToHijri(utcMs);
  const utcDate = new Date(utcMs);
  const utcBridge = `UTC:${utcDate.toISOString().slice(0, 19)}Z`;
  const hijriBridge = `HIJ:${hijri.year}-${String(hijri.month).padStart(2, "0")}-${String(hijri.day).padStart(2, "0")}`;

  if (utcMs < epochMs) {
    return {
      mode: "PRE_ERA",
      formatted: "∞·AEQ4  AWAITING EPOCH",
      utcBridge,
      hijriBridge,
    };
  }
  const elapsedDays = Math.floor((utcMs - epochMs) / MS_PER_DAY);
  const era = Math.floor(elapsedDays / (354 * 12)) + 1;
  const cycle = Math.floor((elapsedDays % (354 * 12)) / 354) + 1;
  const position = (elapsedDays % 354) + 1;
  const moment = utcDate.toISOString().slice(11, 19);
  return {
    mode: "ACTIVE",
    era,
    cycle,
    position,
    moment,
    formatted: `∞·AEQ4 ${era}.${cycle}.${position}.${moment}`,
    utcBridge,
    hijriBridge,
  };
}

const COMPASS_POINTS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

export function calculateQiblaBearing(latitude: number, longitude: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;
  const toDeg = (rad: number) => (rad * 180.0) / Math.PI;
  const phi1 = toRad(latitude);
  const phi2 = toRad(KAABA_LATITUDE);
  const deltaLambda = toRad(KAABA_LONGITUDE - longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearingDeg = (toDeg(Math.atan2(y, x)) + 360.0) % 360.0;

  const deltaPhi = phi2 - phi1;
  const a =
    Math.sin(deltaPhi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0.0, 1.0 - a)));
  const distanceKm = EARTH_MEAN_RADIUS_KM * c;

  const roundedBearing = Number(bearingDeg.toFixed(2));
  const roundedDist = Number(distanceKm.toFixed(1));
  const compassIndex = Math.floor((((roundedBearing % 360) + 360) % 360 + 11.25) / 22.5) % 16;
  const compass = COMPASS_POINTS[compassIndex] ?? "N";

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    qibla_bearing_deg: roundedBearing,
    cardinal_direction: compass,
    distance_to_kabah_km: roundedDist,
    target: "Ka'bah, Makkah al-Mukarramah",
  };
}

export const celestialSnapshotSchema = z.object({
  snapshot_key: z.string().min(1).max(120),
  utc_iso: z.string(),
  hijri_date: z.string().max(60),
  aeq4_formatted: z.string().max(120),
  aeq4_mode: z.enum(["PRE_ERA", "ACTIVE"]).default("PRE_ERA"),
  lunar_phase: z.number().min(0).max(1),
  lunar_illumination: z.number().int().min(0).max(100),
  lunar_phase_name: z.string().max(60),
  elongation_deg: z.number(),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  qibla_bearing_deg: z.number().nullable().default(null),
  qibla_compass: z.string().max(16).nullable().default(null),
  distance_to_kabah_km: z.number().nullable().default(null),
});

export const celestialSnapshotModel = defineModel({
  name: "celestial.snapshot",
  table: "celestial_snapshots",
  schema: celestialSnapshotSchema,
  softDelete: false,
  restEnabled: true,
  searchFields: ["snapshot_key", "hijri_date", "lunar_phase_name", "qibla_compass"],
  publicFields: [
    "snapshot_key",
    "utc_iso",
    "hijri_date",
    "aeq4_formatted",
    "lunar_phase_name",
    "lunar_illumination",
    "qibla_bearing_deg",
  ],
  actions: {
    capture_now: {
      scope: "model",
      roles: ["viewer", "editor", "admin"],
      label: "Capture Celestial Snapshot",
      input: z
        .object({
          lat: z.number().min(-90).max(90).optional(),
          lng: z.number().min(-180).max(180).optional(),
        })
        .optional(),
      handler: async ({ input, repository, actor }) => {
        const coords = (input as { lat?: number; lng?: number } | undefined) ?? {};
        const nowMs = Date.now();
        const hijri = utcToHijri(nowMs);
        const lunar = getLunarPosition(nowMs);
        const aeq4 = getAEQ4Timestamp(nowMs);
        const qibla =
          coords.lat !== undefined && coords.lng !== undefined
            ? calculateQiblaBearing(coords.lat, coords.lng)
            : null;
        return repository.create(
          {
            snapshot_key: `cel-${nowMs}`,
            utc_iso: new Date(nowMs).toISOString(),
            hijri_date: `${hijri.day} ${hijri.monthName} ${hijri.year}H`,
            aeq4_formatted: aeq4.formatted,
            aeq4_mode: aeq4.mode,
            lunar_phase: lunar.phase,
            lunar_illumination: lunar.illumination,
            lunar_phase_name: lunar.phaseName,
            elongation_deg: lunar.elongationDeg,
            latitude: qibla?.latitude ?? null,
            longitude: qibla?.longitude ?? null,
            qibla_bearing_deg: qibla?.qibla_bearing_deg ?? null,
            qibla_compass: qibla?.cardinal_direction ?? null,
            distance_to_kabah_km: qibla?.distance_to_kabah_km ?? null,
          },
          actor,
        );
      },
    },
  },
  indexes: [{ fields: ["tenant_id", "snapshot_key"], unique: true }, { fields: ["utc_iso"] }],
});

export const celestialRules: IrRuleInput[] = [
  { model_name: "celestial.snapshot", role: "public", can_read: true },
  { model_name: "celestial.snapshot", role: "viewer", can_read: true },
  {
    model_name: "celestial.snapshot",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "celestial.snapshot",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
];

export const celestialViews: IrViewInput[] = [
  {
    model_name: "celestial.snapshot",
    view_type: "list",
    spec: {
      title: "Celestial & AEQ4 Ephemeris",
      description: "Pure-math Hijri calendar, Jean Meeus lunar phase, AEQ4 clock, and Qibla bearing.",
      domainIcon: "mtime",
      columns: [
        "snapshot_key",
        "hijri_date",
        "aeq4_formatted",
        "lunar_phase_name",
        "lunar_illumination",
        "qibla_bearing_deg",
      ],
    },
  },
];

export const celestialMenus: IrMenuInput[] = [
  {
    menu_key: "celestial.ephemeris",
    label: "Celestial & AEQ4",
    href: "/models/celestial.snapshot",
    icon: "mtime",
    plane: "creator",
    sort_order: 68,
    min_role: "viewer",
  },
];

export function createCelestialAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");

  return {
    manifest: celestialManifest,
    models: [celestialSnapshotModel],
    rules: celestialRules,
    views: celestialViews,
    menus: celestialMenus,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get<{ Querystring: { lat?: string; lng?: string; utcMs?: string } }>(
        `${prefix}/celestial/now`,
        async (request) => {
          const utcMs = request.query.utcMs ? Number(request.query.utcMs) : Date.now();
          const hijri = utcToHijri(utcMs);
          const lunar = getLunarPosition(utcMs);
          const aeq4 = getAEQ4Timestamp(utcMs);
          const lat = request.query.lat !== undefined ? Number(request.query.lat) : undefined;
          const lng = request.query.lng !== undefined ? Number(request.query.lng) : undefined;
          const qibla =
            lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)
              ? calculateQiblaBearing(lat, lng)
              : null;
          return { hijri, lunar, aeq4, qibla };
        },
      );

      scope.get<{ Querystring: { lat?: string; lng?: string } }>(
        `${prefix}/celestial/qibla`,
        async (request, reply) => {
          const lat = Number(request.query.lat ?? -6.2088);
          const lng = Number(request.query.lng ?? 106.8456);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return reply.code(400).send({ error: "Valid lat and lng query parameters required" });
          }
          return calculateQiblaBearing(lat, lng);
        },
      );
    },
  };
}

export const celestialAddon = createCelestialAddon();
