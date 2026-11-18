import type { AddonDefinition } from "@moonwitness/addon-base";
import { timelineManifest } from "./manifest.js";
import { timelineEventModel, timelineEraModel } from "./model.js";
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

export const timelineAddon: AddonDefinition = {
  manifest: timelineManifest,
  models: [timelineEventModel, timelineEraModel],
  rules: timelineRules,
  views: timelineViews,
  menus: timelineMenus,
};
