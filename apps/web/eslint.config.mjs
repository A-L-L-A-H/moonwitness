import { next } from "@moonwitness/eslint-config/next";

export default [
  ...next,
  {
    ignores: [
      ".next/**",
      ".vinext/**",
      ".cloudflare/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      "pacts/**",
      "next-env.d.ts",
      "postcss.config.mjs",
    ],
  },
];
