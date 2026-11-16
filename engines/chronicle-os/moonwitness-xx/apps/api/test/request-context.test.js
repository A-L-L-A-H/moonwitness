import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";

test("each API request receives an isolated MikroORM EntityManager fork", async () => {
  const forks = [];
  const orm = {
    em: {
      fork(options) {
        const fork = { requestNumber: forks.length + 1, options };
        forks.push(fork);
        return fork;
      }
    }
  };
  const app = await buildApp({ orm });

  try {
    const first = await app.inject({ method: "GET", url: "/api/v1/meta" });
    const second = await app.inject({ method: "GET", url: "/api/v1/meta" });

    assert.equal(first.statusCode, 200);
    assert.equal(second.statusCode, 200);
    assert.equal(forks.length, 2);
    assert.notEqual(forks[0], forks[1]);
    assert.deepEqual(forks.map((fork) => fork.options), [{ clear: true }, { clear: true }]);
  } finally {
    await app.close();
  }
});
