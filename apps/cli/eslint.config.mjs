import { base } from "@moonwitness/eslint-config/base";

export default [
  ...base,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "no-console": "error",
    },
  },
];
