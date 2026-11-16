import test from "node:test";
import assert from "node:assert/strict";
import { depth, distance, gravity, trace } from "../dist/packages/physics/src/index.js";

test("semantic gravity grows with relevance and consequence", () => {
  const quiet = gravity({ relevance: 0.2, impact: 0.1, uncertainty: 0.05 });
  const significant = gravity({ relevance: 1, impact: 0.9, urgency: 0.8, uncertainty: 0.3 });
  assert.ok(significant.score > quiet.score);
  assert.ok(significant.explanation.length > 1);
});

test("strong semantic relation produces lower distance", () => {
  const near = distance({ relationStrength: 0.95, sharedContext: 0.8 });
  const far = distance({ relationStrength: 0.1, sharedContext: 0.1 });
  assert.ok(near.score < far.score);
});

test("uncertainty and evidence demand increase semantic depth", () => {
  const shallow = depth({ abstraction: 0.2, evidenceDemand: 0.1, uncertainty: 0 });
  const deep = depth({ abstraction: 0.5, evidenceDemand: 0.9, uncertainty: 0.8 });
  assert.ok(deep.score > shallow.score);
});

test("irreversible high-impact external change requires stronger trace", () => {
  const reversible = trace({ impact: 0.2, irreversibility: 0.05, uncertainty: 0.05, externalDependency: 0 });
  const irreversible = trace({ impact: 0.9, irreversibility: 1, uncertainty: 0.4, externalDependency: 0.8 });
  assert.ok(irreversible.score > reversible.score);
  assert.match(irreversible.explanation.join(" "), /trace/i);
});
