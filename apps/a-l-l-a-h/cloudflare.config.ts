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
      CORPUS_BUCKET: bindings.r2({
        name: "moonwitness",
      }),
      CACHE_KV: bindings.kv({
        id: "997db1a68d914df6a3a2531ca4c7b314",
      }),
      WEB_INTERNAL_URL: bindings.text("https://moonwitness.biz.id"),
      API_INTERNAL_URL: bindings.text("https://api.moonwitness.biz.id"),
      ARSY_URL: bindings.text("https://arsy-edge.moonwitness.biz.id"),
      MEMORY_API_URL: bindings.text("https://memory-edge.moonwitness.biz.id"),
    },
  }),
});
