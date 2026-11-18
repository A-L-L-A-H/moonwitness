import { z } from "zod";

/** Chronological era contract (MW-0407). */
export const ChronicleEraSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    order: z.number().int().nonnegative(),
  })
  .strict();
export type ChronicleEra = z.infer<typeof ChronicleEraSchema>;

/** Chronological event contract (MW-0407). */
export const ChronicleEventSchema = z
  .object({
    id: z.string().min(1),
    eraId: z.string().min(1).optional(),
    title: z.string().min(1),
    summary: z.string().optional(),
    occurredAt: z.string().datetime(),
    precision: z.enum(["exact", "day", "month", "year", "approximate"]).default("exact"),
    entityIds: z.array(z.string().min(1)).default([]),
    witnessIds: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type ChronicleEvent = z.infer<typeof ChronicleEventSchema>;

/** Narrative episode within a story (MW-0407). */
export const ChronicleEpisodeSchema = z
  .object({
    id: z.string().min(1),
    storyId: z.string().min(1),
    order: z.number().int().nonnegative(),
    title: z.string().min(1),
    summary: z.string().optional(),
    eventIds: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type ChronicleEpisode = z.infer<typeof ChronicleEpisodeSchema>;

/** Unified story contract grouping episodes and events (MW-0407). */
export const ChronicleStorySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    synopsis: z.string().optional(),
    eraIds: z.array(z.string().min(1)).default([]),
    episodeIds: z.array(z.string().min(1)).default([]),
    status: z.enum(["draft", "active", "archived"]).default("draft"),
  })
  .strict();
export type ChronicleStory = z.infer<typeof ChronicleStorySchema>;
