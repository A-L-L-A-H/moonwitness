import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveMissionSource } from "../dist/index.js";

test("mission source resolution preserves the versioned legacy fixture", async () => {
  const fixture = JSON.parse(await readFile(new URL("../fixtures/prophetic-mission-source-resolution-v1.json", import.meta.url)));

  assert.equal(fixture.capabilityId, "prophetic-domain");
  assert.equal(fixture.classification, "PRESERVE");
  assert.equal(fixture.parity, "EXACT");

  for (const fixtureCase of fixture.cases) {
    assert.deepEqual(
      resolveMissionSource(fixtureCase.profile, fixtureCase.slot),
      fixtureCase.expected,
      fixtureCase.id,
    );
  }
});
