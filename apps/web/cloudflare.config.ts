import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  accountId: "5e743e388c349ee7a340be8ba91665fa",
  worker: defineWorker({
    name: "moonwitness-web",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-16",
    triggers: [triggers.fetch({ pattern: "moonwitness.biz.id/*", zone: "moonwitness.biz.id" })],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
