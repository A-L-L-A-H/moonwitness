import type { Migration } from "@moonwitness/orm";
import { timelineDdl } from "./model.js";

export { timelineManifest } from "./manifest.js";
export { TimelineRepository } from "./repository.js";
export { timelineDdl, timelineEventModel, timelineEraModel } from "./model.js";
export { seedTimeline, eras, events } from "./seed.js";

export const timelineMigrations: Migration[] = [
  {
    id: "timeline_001_initial",
    owner: "timeline",
    up: timelineDdl,
  },
];
