import {
  defaultFailClosedAuthBridge,
  type AddonDefinition,
  type AddonHostContext,
  type BaseAddonAuthBridge,
} from "@moonwitness/addon-runtime";
import { timelineManifest } from "./manifest.js";
import { timelineEventModel, timelineEraModel } from "./model.js";
import { TimelineRepository, type ITimelineRepository } from "./repository.js";
import { registerTimelineRoutes } from "./routes.js";
import { seedTimeline } from "./seed.js";
import { timelineRules, timelineViews, timelineMenus } from "./views.js";

export { timelineManifest } from "./manifest.js";
export { TimelineRepository } from "./repository.js";
export type {
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
  TimelineFilters,
  TimelineStats,
  ITimelineRepository,
} from "./repository.js";
export { timelineDdl, timelineEventModel, timelineEraModel } from "./model.js";
export type { TimelineEventRecord, TimelineEraRecord } from "./model.js";
export { timelineRules, timelineViews, timelineMenus } from "./views.js";
export { seedTimeline, eras, events } from "./seed.js";
export * from "./schemas.js";
export { registerTimelineRoutes, type TimelineRouteOptions } from "./routes.js";

export function createTimelineAddon(
  options: Partial<AddonHostContext> & {
    auth?: BaseAddonAuthBridge;
    repository?: ITimelineRepository;
  } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;
  const repository = options.repository ?? new TimelineRepository();

  return {
    manifest: timelineManifest,
    models: [timelineEventModel, timelineEraModel],
    rules: timelineRules,
    views: timelineViews,
    menus: timelineMenus,
    seed: async () => {
      if (options.seedDemo) {
        await seedTimeline();
      }
    },
    registerRoutes: async (scope) => {
      await scope.register(
        async (tlScope) => {
          await registerTimelineRoutes(tlScope, { auth, repository });
        },
        { prefix: `${prefix}/timeline` },
      );
    },
  };
}

export const timelineAddon: AddonDefinition = createTimelineAddon();
