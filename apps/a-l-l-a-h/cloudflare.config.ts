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
      DB: bindings.d1({
        id: "3dc374d8-ae42-4086-9879-eb1730c89f11",
        name: "sovereign-codex-db",
      }),
    },
  }),
});
