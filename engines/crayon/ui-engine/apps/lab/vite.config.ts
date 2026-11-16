import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const releaseSha = process.env.CRAYON_RELEASE_SHA?.trim() || "dev";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  plugins: [
    react(),
    {
      name: "crayon-release-evidence",
      transformIndexHtml(html) {
        return html.replace(
          "</head>",
          `    <meta name="crayon-release-sha" content="${releaseSha}" />\n  </head>`,
        );
      },
    },
  ],
  server: {
    fs: { allow: [fileURLToPath(new URL("../../", import.meta.url))] },
  },
  build: {
    outDir: fileURLToPath(new URL("../../dist-lab", import.meta.url)),
    emptyOutDir: true,
  },
});
