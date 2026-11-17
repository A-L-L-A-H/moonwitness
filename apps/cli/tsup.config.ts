import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    noExternal: ["@moonwitness/core"],
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    clean: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist",
    noExternal: ["@moonwitness/core"],
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
