import test from "node:test";
import assert from "node:assert/strict";
import {
  assertProvenance,
  assertStoryTransition,
  validateStoryBlocks
} from "../src/editorial.js";

const block = (overrides = {}) => ({
  id: "block-1",
  type: "paragraph",
  provenance: "FIRSTHAND",
  text: "I observed this event.",
  sourceIds: [],
  ...overrides
});

test("story blocks preserve all seven provenance classifications", () => {
  for (const provenance of [
    "FIRSTHAND",
    "RECOLLECTION",
    "DREAM",
    "SOURCED",
    "INTERPRETATION",
    "REFLECTION",
    "FICTION"
  ]) {
    assert.equal(assertProvenance(provenance), provenance);
  }
});

test("sourced blocks require references and duplicate block ids are rejected", () => {
  assert.throws(
    () => validateStoryBlocks([block({ provenance: "SOURCED" })]),
    (error) => error.code === "SOURCED_BLOCK_REQUIRES_REFERENCE"
  );

  assert.throws(
    () => validateStoryBlocks([block(), block({ text: "second paragraph" })]),
    (error) => error.code === "DUPLICATE_BLOCK_ID"
  );
});

test("image and text blocks require their appropriate payload fields", () => {
  assert.throws(
    () => validateStoryBlocks([block({ type: "image", text: undefined })]),
    (error) => error.code === "IMAGE_BLOCK_REQUIRES_ASSET"
  );

  assert.throws(
    () => validateStoryBlocks([block({ text: "   " })]),
    (error) => error.code === "TEXT_BLOCK_REQUIRES_TEXT"
  );
});

test("editorial state machine allows only declared transitions", () => {
  assert.equal(assertStoryTransition("draft", "in_review"), true);
  assert.throws(
    () => assertStoryTransition("draft", "published"),
    (error) => error.code === "INVALID_STORY_TRANSITION"
  );
  assert.throws(
    () => assertStoryTransition("published", "draft"),
    (error) => error.code === "INVALID_STORY_TRANSITION"
  );
});

test("editorial state machine covers the full allowed transition matrix", () => {
  const allowed = [
    ["draft", "in_review"], ["draft", "archived"],
    ["in_review", "changes_requested"], ["in_review", "scheduled"],
    ["in_review", "published"], ["in_review", "archived"],
    ["changes_requested", "draft"], ["changes_requested", "in_review"],
    ["changes_requested", "archived"], ["scheduled", "published"],
    ["scheduled", "draft"], ["scheduled", "archived"],
    ["published", "archived"]
  ];
  for (const [from, to] of allowed) assert.equal(assertStoryTransition(from, to), true);
});
