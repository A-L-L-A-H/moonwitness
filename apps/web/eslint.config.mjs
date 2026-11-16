import { next } from "@moonwitness/eslint-config/next";

export default [
  ...next,
  {
    ignores: [
      ".next/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      "pacts/**",
      "next-env.d.ts",
      "postcss.config.mjs",
    ],
  },
];
