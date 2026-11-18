import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Share the monorepo root `.env` without overriding apps/web/.env* or process env.
const rootEnvPath = resolve(process.cwd(), "../../.env");
if (existsSync(rootEnvPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(rootEnvPath);
}

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  transpilePackages: [
    "@moonwitness/canon",
    "@moonwitness/ui",
    "@moonwitness/core",
    "@moonwitness/types",
    "@moonwitness/assets",
    "@moonwitness/avatars",
    "@tanstack/react-query",
  ],
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [480, 960, 1440, 1920],
    imageSizes: [240, 480],
    minimumCacheTTL: 31_536_000,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://id.moonwitness.biz.id https://moonwitness.biz.id https://api.moonwitness.biz.id https://codex.a-l-l-a-h.com https://community.moonwitness.biz.id https://moonwitness-radio.bjo163.workers.dev https://igate.moonwitness.biz.id https://cloudflareinsights.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://id.moonwitness.biz.id",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.API_INTERNAL_URL?.trim();
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: apiUrl.replace(/\/+$/, "") + "/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
