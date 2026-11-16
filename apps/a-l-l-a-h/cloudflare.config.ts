import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  accountId: "5e743e388c349ee7a340be8ba91665fa",
  worker: defineWorker({
    name: "allah-sanctuary",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-16",
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
