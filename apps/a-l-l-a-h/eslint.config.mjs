import { next } from "@moonwitness/eslint-config/next";

export default [
  ...next,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];
