import { env } from "./shared/env";
import { createD1DatabaseFromOrm, getDb } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  registerBaseAddon,
  type AddonDefinition,
  type BaseAddonAuthBridge,
  type RegisteredModel,
} from "@moonwitness/addon-base";
import { createI18nAddon, seedI18n } from "@moonwitness/addon-i18n";
import { createAuditAddon } from "@moonwitness/addon-audit";
import {
  createAuthAddon,
  createAuthMidIdentityStore,
  seedBootstrapAdmin,
} from "@moonwitness/addon-auth";
import { seedTimeline, timelineAddon } from "@moonwitness/addon-timeline";
import { createControlAddon } from "@moonwitness/addon-control";
import { createCommandCenterAddon } from "@moonwitness/addon-command-center";
import { createProbesAddon } from "@moonwitness/addon-probes";
import { createAiAddon } from "@moonwitness/addon-ai";
import { createStorageAddon } from "@moonwitness/addon-storage";
import { createSnmpAddon } from "@moonwitness/addon-snmp";
import { createSyslogAddon } from "@moonwitness/addon-syslog";
import { createRadiusAddon } from "@moonwitness/addon-radius";
import { createCanonLoreAddon } from "@moonwitness/addon-canon-lore";
import { createWitnessResearchAddon } from "@moonwitness/addon-witness-research";
import { createEpistemicAddon } from "@moonwitness/addon-epistemic";
import { midFastifyPlugin } from "@moonwitness/mid";
import type { FastifyInstance } from "fastify";
import { assertDemoSeedAllowed } from "./shared/seed-safety";
import { authRoutes } from "./interface/routes/auth.routes";
import { commandCenterRoutes } from "./interface/routes/command-center.routes";
import { controlRoutes } from "./interface/routes/control.routes";
import { memoryRoutes } from "./interface/routes/memory.routes";
import { probesRoutes } from "./interface/routes/probes.routes";
import { radiusRoutes } from "./interface/routes/radius.routes";
import { riotAiRoutes } from "./interface/routes/riot-ai.routes";
import { snmpPollerRoutes } from "./interface/routes/snmp-poller.routes";
import { storageRoutes } from "./interface/routes/storage.routes";
import { syslogRoutes } from "./interface/routes/syslog.routes";
import { timelineRoutes } from "./interface/routes/timeline.routes";
import {
  requireAuth,
  requireRole,
  resolveRequestTenant,
  type AuthenticatedRequest,
} from "./middleware/auth";

export interface CoreAppOptions {
  prefix?: string;
  /** Load the demo/story-world fixture rows. Off unless explicitly requested. */
  seed?: boolean;
  /** Skip Swagger UI registration. */
  disableDocs?: boolean;
}

const domainMetadataModels: RegisteredModel[] = [
  {
    name: "identity.user_profile",
    description: "Crew user identity profile (public-safe fields only).",
    publicFields: [
      { name: "id", type: "string" },
      { name: "username", type: "string" },
      { name: "role", type: "string" },
      { name: "display_name", type: "string" },
      { name: "is_active", type: "boolean" },
    ],
  },
  {
    name: "ops.audit_log",
    description: "Platform mutation & access audit record.",
    publicFields: [
      { name: "id", type: "string" },
      { name: "domain", type: "string" },
      { name: "entity", type: "string" },
      { name: "entity_id", type: "string" },
      { name: "action", type: "string" },
      { name: "outcome", type: "string" },
      { name: "occurred_at", type: "string" },
    ],
  },
  {
    name: "command.workflow",
    description: "Command Center workflow execution state.",
    publicFields: [
      { name: "workflow_key", type: "string" },
      { name: "name", type: "string" },
      { name: "detail", type: "string" },
      { name: "workflow_status", type: "string" },
    ],
  },
  {
    name: "command.alert",
    description: "Command Center operational alert.",
    publicFields: [
      { name: "alert_key", type: "string" },
      { name: "text", type: "string" },
      { name: "level", type: "string" },
      { name: "dismissed", type: "boolean" },
    ],
  },
  {
    name: "probe.target",
    description: "Registered telemetry probe target.",
    publicFields: [
      { name: "target_key", type: "string" },
      { name: "name", type: "string" },
      { name: "url", type: "string" },
      { name: "kind", type: "string" },
      { name: "enabled", type: "boolean" },
    ],
  },
  {
    name: "storage.bucket",
    description: "Indexed S3-compatible bucket metadata.",
    publicFields: [
      { name: "name", type: "string" },
      { name: "region", type: "string" },
      { name: "is_public", type: "boolean" },
    ],
  },
  {
    name: "storage.object",
    description: "Indexed S3-compatible object metadata.",
    publicFields: [
      { name: "bucket", type: "string" },
      { name: "object_key", type: "string" },
      { name: "content_type", type: "string" },
      { name: "size_bytes", type: "number" },
    ],
  },
  {
    name: "memory.record",
    description: "Mirrored archive memory knowledge entry.",
    publicFields: [
      { name: "record_key", type: "string" },
      { name: "kind", type: "string" },
      { name: "title", type: "string" },
      { name: "scope", type: "string" },
    ],
  },
  {
    name: "syslog.entry",
    description: "Structured syslog event metadata.",
    publicFields: [
      { name: "source_host", type: "string" },
      { name: "app_name", type: "string" },
      { name: "severity", type: "string" },
      { name: "received_at", type: "string" },
    ],
  },
  {
    name: "snmp.device",
    description: "Monitored SNMP network device.",
    publicFields: [
      { name: "device_key", type: "string" },
      { name: "name", type: "string" },
      { name: "host", type: "string" },
      { name: "enabled", type: "boolean" },
    ],
  },
  {
    name: "snmp.target",
    description: "SNMP OID polling target.",
    publicFields: [
      { name: "target_key", type: "string" },
      { name: "device_key", type: "string" },
      { name: "oid", type: "string" },
      { name: "enabled", type: "boolean" },
    ],
  },
  {
    name: "radius.client",
    description: "RADIUS NAS client configuration.",
    publicFields: [
      { name: "client_key", type: "string" },
      { name: "name", type: "string" },
      { name: "enabled", type: "boolean" },
    ],
  },
  {
    name: "radius.session",
    description: "RADIUS accounting session record.",
    publicFields: [
      { name: "session_key", type: "string" },
      { name: "username", type: "string" },
      { name: "acct_status", type: "string" },
      { name: "started_at", type: "string" },
    ],
  },
];

const authBridge: BaseAddonAuthBridge = {
  authenticate: requireAuth(),
  requireRole,
  getActorRole: (request) => {
    const role = (request as AuthenticatedRequest).user?.role;
    return role === "admin" || role === "editor" || role === "viewer" ? role : "public";
  },
  getActorId: (request) => {
    const id = (request as AuthenticatedRequest).user?.id;
    return id !== undefined && id !== null ? String(id) : null;
  },
  getActorTenant: resolveRequestTenant,
};

async function registerAddonTree(
  target: FastifyInstance,
  prefix: string,
  seed: boolean,
): Promise<void> {
  const runtime = new AddonRuntimeController();
  const midKeyEncryptionSecret =
    process.env.MID_KEY_ENCRYPTION_SECRET?.trim() || env.MID_KEY_ENCRYPTION_SECRET;

  const addons: AddonDefinition[] = [
    {
      manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true },
      menus: [
        {
          menu_key: "base.addons",
          label: "Addon Studio",
          href: "/addons",
          icon: "dot",
          plane: "operations",
          sort_order: 95,
          min_role: "admin",
        },
      ],
      register: async () => {
        await registerBaseAddon(target, {
          extraModels: domainMetadataModels,
          runtime,
          auth: authBridge,
          apiPrefix: prefix,
        });
      },
    },
    createI18nAddon({ prefix, auth: authBridge }),
    createAuditAddon({ prefix, auth: authBridge }),
    createAuthAddon({
      runBootstrapSeed: false,
      registerRoutes: async (scope) => {
        if (midKeyEncryptionSecret) {
          await scope.register(midFastifyPlugin, {
            db: createD1DatabaseFromOrm(getDb()),
            identityStore: createAuthMidIdentityStore(),
            keyEncryptionSecret: midKeyEncryptionSecret,
            issuerUrl:
              process.env.MID_ISSUER_URL?.trim() ||
              env.MID_ISSUER_URL ||
              "https://id.moonwitness.biz.id",
            cookieDomain: process.env.MID_COOKIE_DOMAIN?.trim() || env.MID_COOKIE_DOMAIN,
            corsOrigins: process.env.CORS_ORIGINS ?? env.CORS_ORIGINS,
          });
          if (!target.hasDecorator("midMounted")) {
            target.decorate("midMounted", true);
          }
        }
        if (prefix) {
          await scope.register(authRoutes, { prefix, mountAuditRoute: false });
        } else {
          await scope.register(authRoutes, { mountAuditRoute: false });
        }
      },
    }),
    {
      ...timelineAddon,
      registerRoutes: async (scope) => {
        await scope.register(timelineRoutes, { prefix: prefix + "/timeline" });
      },
    },
    createControlAddon({
      registerRoutes: async (scope) => {
        await scope.register(controlRoutes, prefix ? { prefix } : {});
      },
    }),
    createCommandCenterAddon({
      registerRoutes: async (scope) => {
        await scope.register(commandCenterRoutes, prefix ? { prefix } : {});
      },
    }),
    createProbesAddon({
      registerRoutes: async (scope) => {
        await scope.register(probesRoutes, prefix ? { prefix } : {});
      },
    }),
    createAiAddon({
      registerRoutes: async (scope) => {
        await scope.register(riotAiRoutes, prefix ? { prefix } : {});
        await scope.register(memoryRoutes, prefix ? { prefix } : {});
      },
    }),
    createStorageAddon({
      registerRoutes: async (scope) => {
        await scope.register(storageRoutes, prefix ? { prefix } : {});
      },
    }),
    createSnmpAddon({
      registerRoutes: async (scope) => {
        await scope.register(snmpPollerRoutes, prefix ? { prefix } : {});
      },
    }),
    createSyslogAddon({
      registerRoutes: async (scope) => {
        await scope.register(syslogRoutes, prefix ? { prefix } : {});
      },
    }),
    createRadiusAddon({
      registerRoutes: async (scope) => {
        await scope.register(radiusRoutes, prefix ? { prefix } : {});
      },
    }),
    createCanonLoreAddon({ prefix }),
    createWitnessResearchAddon({ prefix, auth: authBridge }),
    createEpistemicAddon({ prefix, auth: authBridge }),
  ];

  await runtime.syncAll(addons, target, { runSeeds: false });
  await seedI18n();
  await seedBootstrapAdmin();
  if (seed) {
    await seedTimeline();
  }
}

/**
 * Builds the Node.js Fastify application using whichever `@moonwitness/orm` driver is already initialized.
 */
export async function buildCoreApp(options: CoreAppOptions = {}): Promise<FastifyInstance> {
  const prefix = options.prefix ?? env.API_PREFIX ?? "/api/v1";
  const seed = options.seed ?? process.env.SEED === "1";
  if (seed) {
    assertDemoSeedAllowed({
      nodeEnv: env.NODE_ENV,
      allowDemoSeed: process.env.ALLOW_DEMO_SEED ?? "0",
    });
  }

  const { buildFastify } = await import("./infrastructure/adapters/fastify.adapter");
  const fastify = await buildFastify({
    prefix,
    disableDocs: options.disableDocs,
    authExternallyMounted: true,
    externallyMountedAddons: true,
  });

  await registerAddonTree(fastify, prefix, seed);
  return fastify;
}
