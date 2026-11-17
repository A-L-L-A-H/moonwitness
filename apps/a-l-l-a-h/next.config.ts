import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@moonwitness/canon",
    "@moonwitness/core",
    "@moonwitness/ui",
    "@moonwitness/types",
  ],
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
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
