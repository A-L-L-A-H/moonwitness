import { next } from "@moonwitness/eslint-config/next";

export default [
  ...next,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Use @moonwitness/contracts/sdk (moonwitnessSdk / requestApiJson / requestApiResponse) instead of direct fetch().",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "Use NativeSelect or Select from @moonwitness/ui instead of raw <select>.",
        },
        {
          selector: "Literal[value=/^\\/art\\/.*\\.(png|webp)$/]",
          message:
            "Use @moonwitness/assets (artSrc, artPlateSrc, ZineImage, SkinArtworkFrame) instead of raw /art/ file literals.",
        },
      ],
    },
  },
  {
    files: ["src/app/api/**/*.ts", "src/lib/ecosystem-probe.ts"],
    rules: {
      "no-restricted-globals": "off",
    },
  },
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
