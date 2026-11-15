import archiveSceneUrl from "./archive-scene.jpg";
import awakeningSceneUrl from "./awakening-scene.jpg";
import riotdeckSceneUrl from "./riotdeck-scene.jpg";
import signalSceneUrl from "./signal-scene.jpg";
import studioSceneUrl from "./studio-scene.jpg";
import thresholdSceneUrl from "./threshold-scene.jpg";
import thumbArchiveUrl from "./thumb-archive.png";
import thumbRiotUrl from "./thumb-riot.png";
import thumbSignalUrl from "./thumb-signal.png";
import thumbStudioUrl from "./thumb-studio.png";

export {
  archiveSceneUrl,
  awakeningSceneUrl,
  riotdeckSceneUrl,
  signalSceneUrl,
  studioSceneUrl,
  thresholdSceneUrl,
  thumbArchiveUrl,
  thumbRiotUrl,
  thumbSignalUrl,
  thumbStudioUrl,
};

export type ArtworkDistrictId = "archive" | "studio" | "riot-deck" | "signal-room";

/** Small modular card thumbnails keyed by world district identifier. */
export const DISTRICT_THUMBNAILS: Record<ArtworkDistrictId, string> = {
  archive: thumbArchiveUrl,
  studio: thumbStudioUrl,
  "riot-deck": thumbRiotUrl,
  "signal-room": thumbSignalUrl,
};

/** Full-scene illustrated chamber backdrops keyed by room identifier. */
export const ROOM_SCENE_ART: Record<ArtworkDistrictId, string> = {
  archive: archiveSceneUrl,
  studio: studioSceneUrl,
  "riot-deck": riotdeckSceneUrl,
  "signal-room": signalSceneUrl,
};
