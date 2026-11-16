import { Value } from "@sinclair/typebox/value";
import {
  PROVENANCE_TYPES,
  STORY_STATUSES,
  STORY_TRANSITIONS,
  StoryBlocksSchema
} from "@moonwitness/contracts";

export class EditorialDomainError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "EditorialDomainError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function validateStoryBlocks(blocks) {
  if (!Value.Check(StoryBlocksSchema, blocks)) {
    const issues = [...Value.Errors(StoryBlocksSchema, blocks)].slice(0, 20).map((error) => ({
      path: error.path || "/",
      message: error.message
    }));
    throw new EditorialDomainError("INVALID_STORY_BLOCKS", "Story content blocks are invalid.", 422);
  }

  const ids = new Set();
  for (const block of blocks) {
    if (ids.has(block.id)) {
      throw new EditorialDomainError("DUPLICATE_BLOCK_ID", "Story block IDs must be unique.", 422);
    }
    ids.add(block.id);

    if (block.provenance === "SOURCED" && block.sourceIds.length === 0) {
      throw new EditorialDomainError(
        "SOURCED_BLOCK_REQUIRES_REFERENCE",
        "A sourced block must reference at least one source.",
        422
      );
    }

    if (block.type === "image" && !block.mediaAssetId) {
      throw new EditorialDomainError(
        "IMAGE_BLOCK_REQUIRES_ASSET",
        "An image block must reference a media asset.",
        422
      );
    }

    if (["paragraph", "heading", "quote"].includes(block.type) && !block.text?.trim()) {
      throw new EditorialDomainError(
        "TEXT_BLOCK_REQUIRES_TEXT",
        "Text-based story blocks require text.",
        422
      );
    }
  }

  return blocks;
}

export function assertStoryTransition(from, to) {
  if (!STORY_STATUSES.includes(from) || !STORY_STATUSES.includes(to)) {
    throw new EditorialDomainError("UNKNOWN_STORY_STATUS", "The requested story status is unknown.");
  }

  if (!STORY_TRANSITIONS[from].includes(to)) {
    throw new EditorialDomainError(
      "INVALID_STORY_TRANSITION",
      `A story cannot transition from ${from} to ${to}.`,
      409
    );
  }

  return true;
}

export function assertProvenance(value) {
  if (!PROVENANCE_TYPES.includes(value)) {
    throw new EditorialDomainError("UNKNOWN_PROVENANCE", "The provenance classification is unknown.");
  }

  return value;
}
