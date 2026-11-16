import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";

test("not-found errors use the central envelope and preserve request ID", async () => {
  const app = await buildApp();
  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/not-a-route",
      headers: { "x-request-id": "mw-not-found-test" }
    });
    const body = response.json();

    assert.equal(response.statusCode, 404);
    assert.deepEqual(Object.keys(body).sort(), ["error", "requestId"]);
    assert.equal(body.error.code, "ROUTE_NOT_FOUND");
    assert.equal(body.requestId, "mw-not-found-test");
  } finally {
    await app.close();
  }
});

test("Fastify validation errors use the central envelope and preserve request ID", async () => {
  const app = await buildApp();
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { "x-request-id": "mw-validation-test" },
      payload: {}
    });
    const body = response.json();

    assert.equal(response.statusCode, 400);
    assert.equal(typeof body.error.code, "string");
    assert.equal(typeof body.error.message, "string");
    assert.equal(body.requestId, "mw-validation-test");
    assert.equal(body.stack, undefined);
  } finally {
    await app.close();
  }
});
