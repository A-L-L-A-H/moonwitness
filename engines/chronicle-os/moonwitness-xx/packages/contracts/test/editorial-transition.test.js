import test from "node:test";
import assert from "node:assert/strict";
import { Value } from "@sinclair/typebox/value";
import {
  STORY_TRANSITIONS,
  StoryTransitionRequestSchema
} from "../src/editorial.js";

test("transition request accepts target and optional reason without trusting client from-state", () => {
  assert.equal(Value.Check(StoryTransitionRequestSchema, { to: "published" }), true);
  assert.equal(Value.Check(StoryTransitionRequestSchema, { to: "published", reason: "Reviewed" }), true);
  assert.equal(Value.Check(StoryTransitionRequestSchema, { from: "draft", to: "published" }), false);
  assert.equal(Value.Check(StoryTransitionRequestSchema, { to: "unknown" }), false);
});

test("every editorial state has a defined transition list", () => {
  assert.deepEqual(Object.keys(STORY_TRANSITIONS), [
    "draft", "in_review", "changes_requested", "scheduled", "published", "archived"
  ]);
});
