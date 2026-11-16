import { next } from "@moonwitness/eslint-config/next";

export default [
  ...next,
  {
    ignores: [".next/**", ".vinext/**", ".cloudflare/**", "dist/**", "next-env.d.ts"],
  },
];
