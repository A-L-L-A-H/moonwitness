export async function healthRoutes(app) {
  app.get("/live", async () => ({
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString()
  }));

  app.get("/ready", async (_request, reply) => {
    const checks = {
      database: false,
      redis: false
    };

    try {
      checks.database = Boolean(await app.dependencies.orm?.isConnected());
    } catch {
      checks.database = false;
    }

    try {
      checks.redis = (await app.dependencies.redis?.ping()) === "PONG";
    } catch {
      checks.redis = false;
    }

    const ready = Object.values(checks).every(Boolean);
    if (!ready) reply.code(503);

    return {
      status: ready ? "ok" : "not_ready",
      service: "api",
      timestamp: new Date().toISOString(),
      dependencies: checks
    };
  });
}
