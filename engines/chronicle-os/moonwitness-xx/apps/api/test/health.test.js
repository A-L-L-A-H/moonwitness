import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";

test("GET /health/live returns a liveness response", async () => {
  const app = await buildApp();

  try {
    const response = await app.inject({ method: "GET", url: "/health/live" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().status, "ok");
    assert.equal(response.json().service, "api");
  } finally {
    await app.close();
  }
});

test("GET /health/ready returns 503 when dependencies are missing", async () => {
  const app = await buildApp();

  try {
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().status, "not_ready");
  } finally {
    await app.close();
  }
});

test("GET /api/v1/meta exposes API and contract versions", async () => {
  const app = await buildApp();

  try {
    const response = await app.inject({ method: "GET", url: "/api/v1/meta" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.apiVersion, "v1");
    assert.equal(response.json().data.contractVersion, "1.0.0");
  } finally {
    await app.close();
  }
});
