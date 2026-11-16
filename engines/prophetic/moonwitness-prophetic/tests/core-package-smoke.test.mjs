import assert from "node:assert/strict";
import test from "node:test";
import { repositoryIdentity } from "@arsybelovedlabs/moonwitness-core";

test("consumer resolves the published Core package through its public export", () => {
  assert.equal(repositoryIdentity, "moonwitness-core");
});
